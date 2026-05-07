import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, addDoc, Timestamp, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import { useSearchParams, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ExportPdfButton } from '@/components/ExportPdfButton';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { toast } from 'sonner';
import { doc, getDoc } from 'firebase/firestore';

const LISTA_VALORES = [
  { id: 'honesty', key: 'values.list.honesty' },
  { id: 'freedom', key: 'values.list.freedom' },
  { id: 'family', key: 'values.list.family' },
  { id: 'health', key: 'values.list.health' },
  { id: 'success', key: 'values.list.success' },
  { id: 'peace', key: 'values.list.peace' },
  { id: 'love', key: 'values.list.love' },
  { id: 'respect', key: 'values.list.respect' },
  { id: 'security', key: 'values.list.security' },
  { id: 'adventure', key: 'values.list.adventure' },
  { id: 'creativity', key: 'values.list.creativity' },
  { id: 'justice', key: 'values.list.justice' },
  { id: 'wisdom', key: 'values.list.wisdom' },
  { id: 'loyalty', key: 'values.list.loyalty' },
  { id: 'growth', key: 'values.list.growth' }
];

export function ValoresPessoais() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const clienteId = searchParams.get('clienteId');
  const clienteUid = searchParams.get('clienteUid');
  
  const [titulo, setTitulo] = useState('');
  const [valoresSelecionados, setValoresSelecionados] = useState<any[]>([]);
  const [avaliacoes, setAvaliacoes] = useState<Record<string, { importancia: number, praticando: number }>>({});
  const [reflexoes, setReflexoes] = useState('');
  const [etapa, setEtapa] = useState(1);
  const [resultado, setResultado] = useState<any>(null);

  // Load existing values if id is provided
  useEffect(() => {
    async function loadData() {
      if (!id) return;
      
      try {
        const docRef = doc(db, 'valores_pessoais', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setResultado({ id: docSnap.id, ...docSnap.data() });
        } else {
          toast.error('Avaliação de Valores não encontrada.');
        }
      } catch (error: any) {
        toast.error('Erro ao carregar dados: ' + error.message);
      }
    }
    
    loadData();
  }, [id]);

  // Load latest Values if clienteId is provided (only if not viewing a specific ID)
  useEffect(() => {
    if (!user || !clienteId || id) return;

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
          profissional_id: user?.uid,
          created_at: Timestamp.now(),
          cliente_id: clienteId || null,
          cliente_uid: clienteUid || null,
          data_avaliacao: new Date().toISOString()
        });
        return { id: docRef.id, ...novaAvaliacao };
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, path);
      }
    },
    onSuccess: (data) => {
      setResultado(data);
      toast.success(t('values.success.saved'));
    },
    onError: (error: any) => {
      console.error(error);
      toast.error(error.message || t('common.error_saving_data'));
    }
  });

  const toggleValor = (valorObj: any) => {
    const isSelected = valoresSelecionados.find(v => v.id === valorObj.id);
    if (isSelected) {
      setValoresSelecionados(prev => prev.filter(v => v.id !== valorObj.id));
      const novasAvaliacoes = { ...avaliacoes };
      delete novasAvaliacoes[valorObj.id];
      setAvaliacoes(novasAvaliacoes);
    } else {
      if (valoresSelecionados.length >= 10) return toast.error(t('values.errors.max_reached'));
      setValoresSelecionados(prev => [...prev, valorObj]);
      setAvaliacoes(prev => ({ ...prev, [valorObj.id]: { importancia: 10, praticando: 5 } }));
    }
  };

  const handleSave = () => {
    if (!titulo) return toast.error(t('values.errors.fill_title'));
    
    const valores_formatados = valoresSelecionados.map(v => ({
      valor: v.id,
      label: t(v.key),
      importancia: avaliacoes[v.id].importancia,
      praticando: avaliacoes[v.id].praticando
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
        <h1 className="text-3xl font-bold text-slate-800">{t('values.title')}</h1>
        {resultado && <ExportPdfButton targetId="print-valores" filename="valores-pessoais" title={`Relatório: ${t('values.title')}`} />}
      </div>

      {!resultado ? (
        <Card className="bg-white/60 backdrop-blur-sm shadow-sm max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>{t('values.form.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {etapa === 1 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>{t('values.form.title_label')}</Label>
                  <Input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder={t('values.form.title_placeholder')} />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <Label className="text-base">{t('values.form.step1_desc')}</Label>
                    <Badge variant="secondary">{valoresSelecionados.length}/10</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {LISTA_VALORES.map(valor => (
                      <button
                        key={valor.id}
                        onClick={() => toggleValor(valor)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                          valoresSelecionados.find(v => v.id === valor.id)
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300'
                        }`}
                      >
                        {t(valor.key)}
                      </button>
                    ))}
                  </div>
                </div>
                
                <Button 
                  onClick={() => setEtapa(2)} 
                  disabled={valoresSelecionados.length === 0 || !titulo}
                  className="w-full"
                >
                  {t('values.form.next')}
                </Button>
              </div>
            )}

            {etapa === 2 && (
              <div className="space-y-8">
                <p className="text-sm text-slate-500">{t('values.form.step2_desc')}</p>
                
                <div className="space-y-6">
                  {valoresSelecionados.map(valor => (
                    <div key={valor.id} className="p-4 bg-slate-50 rounded-lg border border-slate-100 space-y-4">
                      <h3 className="font-bold text-lg text-slate-800">{t(valor.key)}</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label className="text-blue-600">{t('values.form.importance_label')}</Label>
                            <span className="font-bold text-blue-600">{avaliacoes[valor.id].importancia}</span>
                          </div>
                          <Slider 
                            value={[avaliacoes[valor.id].importancia]} 
                            max={10} min={1} step={1} 
                            onValueChange={(val) => setAvaliacoes(prev => ({ ...prev, [valor.id]: { ...prev[valor.id], importancia: val[0] } }))} 
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label className="text-green-600">{t('values.form.practice_label')}</Label>
                            <span className="font-bold text-green-600">{avaliacoes[valor.id].praticando}</span>
                          </div>
                          <Slider 
                            value={[avaliacoes[valor.id].praticando]} 
                            max={10} min={1} step={1} 
                            onValueChange={(val) => setAvaliacoes(prev => ({ ...prev, [valor.id]: { ...prev[valor.id], praticando: val[0] } }))} 
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label>{t('values.form.reflections')}</Label>
                  <textarea 
                    className="w-full min-h-[100px] p-3 rounded-md border border-input bg-background text-sm"
                    placeholder={t('values.form.reflections_placeholder')}
                    value={reflexoes}
                    onChange={e => setReflexoes(e.target.value)}
                  />
                </div>

                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => setEtapa(1)} className="flex-1">{t('values.form.back')}</Button>
                  <Button onClick={handleSave} disabled={mutation.isPending} className="flex-1">
                    {mutation.isPending ? t('values.form.saving') : t('values.form.save')}
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
              <p className="text-slate-500">{t('disc.results.performed_at')} {new Date(resultado.data_avaliacao).toLocaleDateString()}</p>
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
                    <Bar dataKey={t('values.form.importance_label')} fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey={t('values.form.practice_label')} fill="#22c55e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {resultado.reflexoes && (
                <div className="p-6 bg-slate-50 rounded-lg border border-slate-100">
                  <h3 className="font-bold text-lg mb-2">{t('values.form.reflections')}</h3>
                  <p className="text-slate-700 whitespace-pre-wrap">{resultado.reflexoes}</p>
                </div>
              )}

              <div className="text-center no-print mt-8">
                <Button variant="outline" onClick={() => { setResultado(null); setEtapa(1); setValoresSelecionados([]); setTitulo(''); }}>{t('values.form.new_assessment')}</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
