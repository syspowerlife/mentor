import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { ExportPdfButton } from '@/components/ExportPdfButton';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { collection, addDoc, query, where, orderBy, getDocs } from 'firebase/firestore';
import { useAuth } from '@/lib/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

const AREAS = [
  { id: 'saude_fisica', label: 'Saúde Física' },
  { id: 'desenvolvimento_mental', label: 'Desenvolvimento Mental' },
  { id: 'inteligencia_emocional', label: 'Inteligência Emocional' },
  { id: 'familia', label: 'Família' },
  { id: 'romance', label: 'Romance' },
  { id: 'vida_social', label: 'Vida Social' },
  { id: 'carreira', label: 'Carreira' },
  { id: 'financas', label: 'Finanças' },
  { id: 'contribuicao_social', label: 'Contribuição Social' },
  { id: 'divertimento_lazer', label: 'Diversão/Lazer' },
  { id: 'saude_ambiente', label: 'Saúde do Ambiente' },
];

export function RodaDaVida() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const clienteId = searchParams.get('clienteId');
  
  const [titulo, setTitulo] = useState('');
  const [tipo, setTipo] = useState('atual');
  const [valores, setValores] = useState<Record<string, number>>(
    AREAS.reduce((acc, area) => ({ ...acc, [area.id]: 5 }), {})
  );

  const { data: historico = [] } = useQuery({ 
    queryKey: ['rodas', user?.uid], 
    queryFn: async () => {
      if (!user) return [];
      const path = 'rodas_da_vida';
      try {
        const q = query(
          collection(db, path),
          where(clienteId ? 'cliente_id' : 'created_by', '==', clienteId || user.uid),
          orderBy('created_date', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, path);
        return [];
      }
    },
    enabled: !!user
  });

  const mutation = useMutation({
    mutationFn: async (novaRoda: any) => {
      const path = 'rodas_da_vida';
      try {
        return await addDoc(collection(db, path), {
          ...novaRoda,
          created_by: user?.uid,
          cliente_id: clienteId || null,
          created_date: new Date().toISOString()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, path);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rodas'] });
      setTitulo('');
      setValores(AREAS.reduce((acc, area) => ({ ...acc, [area.id]: 5 }), {}));
      toast.success('Avaliação salva com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao salvar avaliação: ' + error.message);
    }
  });

  const handleSave = () => {
    if (!titulo) return toast.error('Preencha o título.');
    mutation.mutate({
      titulo,
      data_avaliacao: new Date().toISOString(),
      tipo_avaliacao: tipo,
      ...valores
    });
  };

  const radarData = AREAS.map(area => ({
    subject: area.label,
    A: valores[area.id]
  }));

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-slate-800">Roda da Vida</h1>
        <ExportPdfButton targetId="print-roda" filename="roda-da-vida" title="Relatório: Roda da Vida" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8" id="print-roda">
        {/* Form */}
        <Card className="bg-white/60 backdrop-blur-sm shadow-sm">
          <CardHeader>
            <CardTitle>Nova Avaliação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex: Avaliação Inicial" />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={tipo} onValueChange={setTipo}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="atual">Estado Atual</SelectItem>
                    <SelectItem value="desejado">Estado Desejado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              {AREAS.map(area => (
                <div key={area.id} className="space-y-2">
                  <div className="flex justify-between">
                    <Label>{area.label}</Label>
                    <span className="text-sm font-bold text-blue-600">{valores[area.id]}</span>
                  </div>
                  <Slider 
                    value={[valores[area.id]]} 
                    max={10} 
                    step={1} 
                    onValueChange={(val) => setValores(prev => ({ ...prev, [area.id]: val[0] }))} 
                  />
                </div>
              ))}
            </div>

            <Button onClick={handleSave} className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? 'Salvando...' : 'Salvar Avaliação'}
            </Button>
          </CardContent>
        </Card>

        {/* Chart & History */}
        <div className="space-y-8">
          <Card className="bg-white/60 backdrop-blur-sm shadow-sm">
            <CardHeader><CardTitle>Visualização</CardTitle></CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" tick={{fontSize: 10}} />
                  <PolarRadiusAxis angle={30} domain={[0, 10]} />
                  <Radar name="Valor" dataKey="A" stroke="#2563eb" fill="#3b82f6" fillOpacity={0.5} />
                  <RechartsTooltip />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-white/60 backdrop-blur-sm shadow-sm no-print">
            <CardHeader><CardTitle>Histórico Recente</CardTitle></CardHeader>
            <CardContent>
              {historico.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">Nenhuma avaliação encontrada.</p>
              ) : (
                <div className="space-y-3">
                  {historico.slice(0, 3).map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <div>
                        <p className="font-medium text-sm">{item.titulo}</p>
                        <p className="text-xs text-slate-500">{new Date(item.data_avaliacao).toLocaleDateString()}</p>
                      </div>
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full capitalize">{item.tipo_avaliacao}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
