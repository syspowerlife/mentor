import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, addDoc, Timestamp, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ExportPdfButton } from '@/components/ExportPdfButton';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { toast } from 'sonner';

const LISTA_VALORES = [
  'Honestidade', 'Liberdade', 'Família', 'Saúde', 'Sucesso', 
  'Paz', 'Amor', 'Respeito', 'Segurança', 'Aventura',
  'Criatividade', 'Justiça', 'Sabedoria', 'Lealdade', 'Crescimento'
];

export function ValoresPessoais() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const clienteId = searchParams.get('clienteId');
  
  const [titulo, setTitulo] = useState('');
  const [valoresSelecionados, setValoresSelecionados] = useState<string[]>([]);
  const [avaliacoes, setAvaliacoes] = useState<Record<string, { importancia: number, praticando: number }>>({});
  const [reflexoes, setReflexoes] = useState('');
  const [etapa, setEtapa] = useState(1);
  const [resultado, setResultado] = useState<any>(null);

  // Load latest Values if clienteId is provided
  useEffect(() => {
    if (!user || !clienteId) return;

    const path = 'valores_pessoais';
    const q = query(
      collection(db, path),
      where('cliente_id', '==', clienteId),
      where('created_by', '==', user.uid),
      orderBy('created_at', 'desc'),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const data = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
        setResultado(data);
      }
    }, (error) => {
      console.error("Error loading Values:", error);
    });

    return () => unsubscribe();
  }, [user, clienteId]);

  const mutation = useMutation({
    mutationFn: async (novaAvaliacao: any) => {
      const path = 'valores_pessoais';
      try {
        const docRef = await addDoc(collection(db, path), {
          ...novaAvaliacao,
          created_by: user?.uid,
          created_at: Timestamp.now(),
          cliente_id: clienteId || null
        });
        return { id: docRef.id, ...novaAvaliacao };
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, path);
      }
    },
    onSuccess: (data) => {
      setResultado(data);
      toast.success('Avaliação de Valores salva com sucesso!');
    },
    onError: (error: any) => {
      console.error(error);
      toast.error(error.message || 'Erro ao salvar avaliação de valores.');
    }
  });

  const toggleValor = (valor: string) => {
    if (valoresSelecionados.includes(valor)) {
      setValoresSelecionados(prev => prev.filter(v => v !== valor));
      const novasAvaliacoes = { ...avaliacoes };
      delete novasAvaliacoes[valor];
      setAvaliacoes(novasAvaliacoes);
    } else {
      if (valoresSelecionados.length >= 10) return toast.error('Selecione no máximo 10 valores.');
      setValoresSelecionados(prev => [...prev, valor]);
      setAvaliacoes(prev => ({ ...prev, [valor]: { importancia: 10, praticando: 5 } }));
    }
  };

  const handleSave = () => {
    if (!titulo) return toast.error('Preencha o título da avaliação.');
    
    const valores_formatados = valoresSelecionados.map(v => ({
      valor: v,
      importancia: avaliacoes[v].importancia,
      praticando: avaliacoes[v].praticando
    }));

    mutation.mutate({
      titulo,
      valores_selecionados: valores_formatados,
      reflexoes
    });
  };

  const chartData = resultado ? resultado.valores_selecionados.map((v: any) => ({
    name: v.valor,
    Importância: v.importancia,
    Praticando: v.praticando
  })) : [];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-slate-800">Valores Pessoais</h1>
        {resultado && <ExportPdfButton targetId="print-valores" filename="valores-pessoais" title="Relatório: Valores Pessoais" />}
      </div>

      {!resultado ? (
        <Card className="bg-white/60 backdrop-blur-sm shadow-sm max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Identificação de Valores</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {etapa === 1 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Título da Avaliação</Label>
                  <Input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex: Meus Valores 2026" />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <Label className="text-base">Selecione até 10 valores mais importantes para você:</Label>
                    <Badge variant="secondary">{valoresSelecionados.length}/10</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {LISTA_VALORES.map(valor => (
                      <button
                        key={valor}
                        onClick={() => toggleValor(valor)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                          valoresSelecionados.includes(valor)
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300'
                        }`}
                      >
                        {valor}
                      </button>
                    ))}
                  </div>
                </div>
                
                <Button 
                  onClick={() => setEtapa(2)} 
                  disabled={valoresSelecionados.length === 0 || !titulo}
                  className="w-full"
                >
                  Próxima Etapa
                </Button>
              </div>
            )}

            {etapa === 2 && (
              <div className="space-y-8">
                <p className="text-sm text-slate-500">Para cada valor selecionado, avalie de 1 a 10 a importância dele na sua vida e o quanto você sente que o está praticando atualmente.</p>
                
                <div className="space-y-6">
                  {valoresSelecionados.map(valor => (
                    <div key={valor} className="p-4 bg-slate-50 rounded-lg border border-slate-100 space-y-4">
                      <h3 className="font-bold text-lg text-slate-800">{valor}</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label className="text-blue-600">Importância</Label>
                            <span className="font-bold text-blue-600">{avaliacoes[valor].importancia}</span>
                          </div>
                          <Slider 
                            value={[avaliacoes[valor].importancia]} 
                            max={10} min={1} step={1} 
                            onValueChange={(val) => setAvaliacoes(prev => ({ ...prev, [valor]: { ...prev[valor], importancia: val[0] } }))} 
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label className="text-green-600">Quanto estou praticando</Label>
                            <span className="font-bold text-green-600">{avaliacoes[valor].praticando}</span>
                          </div>
                          <Slider 
                            value={[avaliacoes[valor].praticando]} 
                            max={10} min={1} step={1} 
                            onValueChange={(val) => setAvaliacoes(prev => ({ ...prev, [valor]: { ...prev[valor], praticando: val[0] } }))} 
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label>Reflexões</Label>
                  <textarea 
                    className="w-full min-h-[100px] p-3 rounded-md border border-input bg-background text-sm"
                    placeholder="O que você percebe ao comparar a importância dos seus valores com a prática deles?"
                    value={reflexoes}
                    onChange={e => setReflexoes(e.target.value)}
                  />
                </div>

                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => setEtapa(1)} className="flex-1">Voltar</Button>
                  <Button onClick={handleSave} disabled={mutation.isPending} className="flex-1">
                    {mutation.isPending ? 'Salvando...' : 'Salvar Avaliação'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div id="print-valores" className="space-y-6">
          <Card className="bg-white/60 backdrop-blur-sm shadow-sm">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">{resultado.titulo}</CardTitle>
              <p className="text-slate-500">Realizado em {new Date(resultado.data_avaliacao).toLocaleDateString()}</p>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                    <YAxis domain={[0, 10]} />
                    <RechartsTooltip />
                    <Legend verticalAlign="top" height={36}/>
                    <Bar dataKey="Importância" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Praticando" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {resultado.reflexoes && (
                <div className="p-6 bg-slate-50 rounded-lg border border-slate-100">
                  <h3 className="font-bold text-lg mb-2">Reflexões</h3>
                  <p className="text-slate-700 whitespace-pre-wrap">{resultado.reflexoes}</p>
                </div>
              )}

              <div className="text-center no-print mt-8">
                <Button variant="outline" onClick={() => { setResultado(null); setEtapa(1); setValoresSelecionados([]); setTitulo(''); }}>Nova Avaliação</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
