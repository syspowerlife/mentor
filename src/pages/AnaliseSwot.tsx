import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, X, Target } from 'lucide-react';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { useSwot } from '@/hooks/useSwot';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ExportPdfButton } from '@/components/ExportPdfButton';
import { toast } from 'sonner';

export function AnaliseSwot() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const clienteId = searchParams.get('clienteId');
  
  const [titulo, setTitulo] = useState('');
  const [forcas, setForcas] = useState<string[]>([]);
  const [fraquezas, setFraquezas] = useState<string[]>([]);
  const [oportunidades, setOportunidades] = useState<string[]>([]);
  const [ameacas, setAmeacas] = useState<string[]>([]);
  const [planoAcao, setPlanoAcao] = useState('');

  const [inputForca, setInputForca] = useState('');
  const [inputFraqueza, setInputFraqueza] = useState('');
  const [inputOportunidade, setInputOportunidade] = useState('');
  const [inputAmeaca, setInputAmeaca] = useState('');

  const { latestSwot } = useSwot(clienteId);

  // Load latest SWOT if clienteId is provided
  useEffect(() => {
    if (latestSwot) {
      setTitulo(latestSwot.titulo || '');
      setForcas(latestSwot.forcas || []);
      setFraquezas(latestSwot.fraquezas || []);
      setOportunidades(latestSwot.oportunidades || []);
      setAmeacas(latestSwot.ameacas || []);
      setPlanoAcao(latestSwot.plano_acao || '');
    }
  }, [latestSwot]);

  const mutation = useMutation({
    mutationFn: async (novaSwot: any) => {
      const path = 'analises_swot';
      try {
        await addDoc(collection(db, path), {
          ...novaSwot,
          created_by: user?.uid,
          created_at: Timestamp.now(),
          cliente_id: clienteId || null
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, path);
      }
    },
    onSuccess: () => {
      toast.success('Análise SWOT salva com sucesso!');
    },
    onError: (error: any) => {
      console.error(error);
      toast.error(error.message || 'Erro ao salvar análise SWOT.');
    }
  });

  const handleSave = () => {
    if (!titulo) return toast.error('Preencha o título da análise.');
    mutation.mutate({
      titulo,
      forcas,
      fraquezas,
      oportunidades,
      ameacas,
      plano_acao: planoAcao
    });
  };

  const addItem = (setter: any, list: string[], input: string, setInput: any) => {
    if (input.trim()) {
      setter([...list, input.trim()]);
      setInput('');
    }
  };

  const removeItem = (setter: any, list: string[], index: number) => {
    setter(list.filter((_, i) => i !== index));
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-slate-800">Análise SWOT</h1>
        <div className="flex gap-2">
          <ExportPdfButton targetId="print-swot" filename="analise-swot" title="Relatório: Análise SWOT" />
          <Button onClick={handleSave} disabled={mutation.isPending}>
            {mutation.isPending ? 'Salvando...' : 'Salvar Análise'}
          </Button>
        </div>
      </div>

      <div id="print-swot" className="space-y-6">
        <Card className="bg-white/60 backdrop-blur-sm shadow-sm">
          <CardContent className="p-6">
            <div className="space-y-2">
              <Label>Título da Análise</Label>
              <Input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex: Análise de Carreira 2026" />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Forças */}
          <Card className="border-t-4 border-t-green-500 bg-green-50/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-green-700 flex justify-between">
                Forças (Strengths)
                <span className="text-sm bg-green-100 px-2 py-1 rounded-full">{forcas.length}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4 no-print">
                <Input value={inputForca} onChange={e => setInputForca(e.target.value)} onKeyDown={e => e.key === 'Enter' && addItem(setForcas, forcas, inputForca, setInputForca)} placeholder="Adicionar força..." className="bg-white" />
                <Button size="icon" variant="outline" onClick={() => addItem(setForcas, forcas, inputForca, setInputForca)}><Plus className="w-4 h-4" /></Button>
              </div>
              <ul className="space-y-2">
                {forcas.map((item, i) => (
                  <li key={i} className="flex justify-between items-center p-2 bg-white rounded border border-green-100 text-sm">
                    {item}
                    <button onClick={() => removeItem(setForcas, forcas, i)} className="text-slate-400 hover:text-red-500 no-print"><X className="w-4 h-4" /></button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Fraquezas */}
          <Card className="border-t-4 border-t-red-500 bg-red-50/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-red-700 flex justify-between">
                Fraquezas (Weaknesses)
                <span className="text-sm bg-red-100 px-2 py-1 rounded-full">{fraquezas.length}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4 no-print">
                <Input value={inputFraqueza} onChange={e => setInputFraqueza(e.target.value)} onKeyDown={e => e.key === 'Enter' && addItem(setFraquezas, fraquezas, inputFraqueza, setInputFraqueza)} placeholder="Adicionar fraqueza..." className="bg-white" />
                <Button size="icon" variant="outline" onClick={() => addItem(setFraquezas, fraquezas, inputFraqueza, setInputFraqueza)}><Plus className="w-4 h-4" /></Button>
              </div>
              <ul className="space-y-2">
                {fraquezas.map((item, i) => (
                  <li key={i} className="flex justify-between items-center p-2 bg-white rounded border border-red-100 text-sm">
                    {item}
                    <button onClick={() => removeItem(setFraquezas, fraquezas, i)} className="text-slate-400 hover:text-red-500 no-print"><X className="w-4 h-4" /></button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Oportunidades */}
          <Card className="border-t-4 border-t-blue-500 bg-blue-50/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-blue-700 flex justify-between">
                Oportunidades (Opportunities)
                <span className="text-sm bg-blue-100 px-2 py-1 rounded-full">{oportunidades.length}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4 no-print">
                <Input value={inputOportunidade} onChange={e => setInputOportunidade(e.target.value)} onKeyDown={e => e.key === 'Enter' && addItem(setOportunidades, oportunidades, inputOportunidade, setInputOportunidade)} placeholder="Adicionar oportunidade..." className="bg-white" />
                <Button size="icon" variant="outline" onClick={() => addItem(setOportunidades, oportunidades, inputOportunidade, setInputOportunidade)}><Plus className="w-4 h-4" /></Button>
              </div>
              <ul className="space-y-2">
                {oportunidades.map((item, i) => (
                  <li key={i} className="flex justify-between items-center p-2 bg-white rounded border border-blue-100 text-sm">
                    {item}
                    <button onClick={() => removeItem(setOportunidades, oportunidades, i)} className="text-slate-400 hover:text-red-500 no-print"><X className="w-4 h-4" /></button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Ameaças */}
          <Card className="border-t-4 border-t-orange-500 bg-orange-50/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-orange-700 flex justify-between">
                Ameaças (Threats)
                <span className="text-sm bg-orange-100 px-2 py-1 rounded-full">{ameacas.length}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4 no-print">
                <Input value={inputAmeaca} onChange={e => setInputAmeaca(e.target.value)} onKeyDown={e => e.key === 'Enter' && addItem(setAmeacas, ameacas, inputAmeaca, setInputAmeaca)} placeholder="Adicionar ameaça..." className="bg-white" />
                <Button size="icon" variant="outline" onClick={() => addItem(setAmeacas, ameacas, inputAmeaca, setInputAmeaca)}><Plus className="w-4 h-4" /></Button>
              </div>
              <ul className="space-y-2">
                {ameacas.map((item, i) => (
                  <li key={i} className="flex justify-between items-center p-2 bg-white rounded border border-orange-100 text-sm">
                    {item}
                    <button onClick={() => removeItem(setAmeacas, ameacas, i)} className="text-slate-400 hover:text-red-500 no-print"><X className="w-4 h-4" /></button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white/60 backdrop-blur-sm shadow-sm">
          <CardHeader><CardTitle>Plano de Ação</CardTitle></CardHeader>
          <CardContent>
            <textarea 
              className="w-full min-h-[100px] p-3 rounded-md border border-input bg-background text-sm"
              placeholder="Descreva as ações a serem tomadas com base nesta análise..."
              value={planoAcao}
              onChange={e => setPlanoAcao(e.target.value)}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
