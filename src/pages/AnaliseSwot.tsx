import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, X, Target } from 'lucide-react';
import { collection, addDoc, Timestamp, doc, getDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import { useSearchParams, useParams } from 'react-router-dom';
import { useSwot } from '@/hooks/useSwot';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ExportPdfButton } from '@/components/ExportPdfButton';
import { AISuggestionCard } from '@/components/AISuggestionCard';
import { toast } from 'sonner';

export function AnaliseSwot() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const clienteId = searchParams.get('clienteId');
  const clienteUid = searchParams.get('clienteUid');
  
  const [titulo, setTitulo] = useState('');
  const [forcas, setForcas] = useState<string[]>([]);
  const [fraquezas, setFraquezas] = useState<string[]>([]);
  const [oportunidades, setOportunidades] = useState<string[]>([]);
  const [ameacas, setAmeacas] = useState<string[]>([]);
  const [planoAcao, setPlanoAcao] = useState('');
  const [isReadOnly, setIsReadOnly] = useState(false);

  const [inputForca, setInputForca] = useState('');
  const [inputFraqueza, setInputFraqueza] = useState('');
  const [inputOportunidade, setInputOportunidade] = useState('');
  const [inputAmeaca, setInputAmeaca] = useState('');

  const { latestSwot } = useSwot(id ? null : clienteId);

  // Load existing SWOT if id is provided
  useEffect(() => {
    async function loadData() {
      if (!id) return;
      
      try {
        const docRef = doc(db, 'analises_swot', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setTitulo(data.titulo || '');
          setForcas(data.forcas || []);
          setFraquezas(data.fraquezas || []);
          setOportunidades(data.oportunidades || []);
          setAmeacas(data.ameacas || []);
          setPlanoAcao(data.plano_acao || '');
          setIsReadOnly(true);
        } else {
          toast.error(t('swot.errors.not_found'));
        }
      } catch (error: any) {
        toast.error(t('common.error_loading_data') + ': ' + error.message);
      }
    }
    
    loadData();
  }, [id]);

  // Load latest SWOT if clienteId is provided (only if not viewing a specific ID)
  useEffect(() => {
    if (!id && latestSwot) {
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
          profissional_id: user?.uid,
          created_at: Timestamp.now(),
          cliente_id: clienteId || null,
          cliente_uid: clienteUid || null
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, path);
      }
    },
    onSuccess: () => {
      toast.success(t('swot.success.saved'));
    },
    onError: (error: any) => {
      console.error(error);
      toast.error(error.message || t('swot.errors.fill_title')); // Fallback error
    }
  });

  const handleSave = () => {
    if (!titulo) return toast.error(t('swot.errors.fill_title'));
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
        <h1 className="text-3xl font-bold text-slate-800">{t('swot.title')}</h1>
        <div className="flex gap-2">
          <ExportPdfButton targetId="print-swot" filename="analise-swot" title={`Relatório: ${t('swot.title')}`} />
          {!isReadOnly && (
            <Button onClick={handleSave} disabled={mutation.isPending}>
              {mutation.isPending ? t('swot.saving') : t('swot.save_btn')}
            </Button>
          )}
        </div>
      </div>

      <div id="print-swot" className="space-y-6">
        <Card className="bg-white/60 backdrop-blur-sm shadow-sm">
          <CardContent className="p-6">
            <div className="space-y-2">
              <Label>{t('swot.title_label')}</Label>
              <Input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder={t('swot.title_placeholder')} disabled={isReadOnly} />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Forças */}
          <Card className="border-t-4 border-t-green-500 bg-green-50/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-green-700 flex justify-between">
                {t('swot.sections.strengths')}
                <span className="text-sm bg-green-100 px-2 py-1 rounded-full">{forcas.length}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!isReadOnly && (
                <div className="flex gap-2 mb-4 no-print">
                  <Input value={inputForca} onChange={e => setInputForca(e.target.value)} onKeyDown={e => e.key === 'Enter' && addItem(setForcas, forcas, inputForca, setInputForca)} placeholder={t('swot.placeholders.add_strength')} className="bg-white" />
                  <Button size="icon" variant="outline" onClick={() => addItem(setForcas, forcas, inputForca, setInputForca)}><Plus className="w-4 h-4" /></Button>
                </div>
              )}
              <ul className="space-y-2">
                {forcas.map((item, i) => (
                  <li key={i} className="flex justify-between items-center p-2 bg-white rounded border border-green-100 text-sm">
                    {item}
                    {!isReadOnly && (
                      <button onClick={() => removeItem(setForcas, forcas, i)} className="text-slate-400 hover:text-red-500 no-print"><X className="w-4 h-4" /></button>
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Fraquezas */}
          <Card className="border-t-4 border-t-red-500 bg-red-50/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-red-700 flex justify-between">
                {t('swot.sections.weaknesses')}
                <span className="text-sm bg-red-100 px-2 py-1 rounded-full">{fraquezas.length}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!isReadOnly && (
                <div className="flex gap-2 mb-4 no-print">
                  <Input value={inputFraqueza} onChange={e => setInputFraqueza(e.target.value)} onKeyDown={e => e.key === 'Enter' && addItem(setFraquezas, fraquezas, inputFraqueza, setInputFraqueza)} placeholder={t('swot.placeholders.add_weakness')} className="bg-white" />
                  <Button size="icon" variant="outline" onClick={() => addItem(setFraquezas, fraquezas, inputFraqueza, setInputFraqueza)}><Plus className="w-4 h-4" /></Button>
                </div>
              )}
              <ul className="space-y-2">
                {fraquezas.map((item, i) => (
                  <li key={i} className="flex justify-between items-center p-2 bg-white rounded border border-red-100 text-sm">
                    {item}
                    {!isReadOnly && (
                      <button onClick={() => removeItem(setFraquezas, fraquezas, i)} className="text-slate-400 hover:text-red-500 no-print"><X className="w-4 h-4" /></button>
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Oportunidades */}
          <Card className="border-t-4 border-t-blue-500 bg-blue-50/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-blue-700 flex justify-between">
                {t('swot.sections.opportunities')}
                <span className="text-sm bg-blue-100 px-2 py-1 rounded-full">{oportunidades.length}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!isReadOnly && (
                <div className="flex gap-2 mb-4 no-print">
                  <Input value={inputOportunidade} onChange={e => setInputOportunidade(e.target.value)} onKeyDown={e => e.key === 'Enter' && addItem(setOportunidades, oportunidades, inputOportunidade, setInputOportunidade)} placeholder={t('swot.placeholders.add_opportunity')} className="bg-white" />
                  <Button size="icon" variant="outline" onClick={() => addItem(setOportunidades, oportunidades, inputOportunidade, setInputOportunidade)}><Plus className="w-4 h-4" /></Button>
                </div>
              )}
              <ul className="space-y-2">
                {oportunidades.map((item, i) => (
                  <li key={i} className="flex justify-between items-center p-2 bg-white rounded border border-blue-100 text-sm">
                    {item}
                    {!isReadOnly && (
                      <button onClick={() => removeItem(setOportunidades, oportunidades, i)} className="text-slate-400 hover:text-red-500 no-print"><X className="w-4 h-4" /></button>
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Ameaças */}
          <Card className="border-t-4 border-t-orange-500 bg-orange-50/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-orange-700 flex justify-between">
                {t('swot.sections.threats')}
                <span className="text-sm bg-orange-100 px-2 py-1 rounded-full">{ameacas.length}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!isReadOnly && (
                <div className="flex gap-2 mb-4 no-print">
                  <Input value={inputAmeaca} onChange={e => setInputAmeaca(e.target.value)} onKeyDown={e => e.key === 'Enter' && addItem(setAmeacas, ameacas, inputAmeaca, setInputAmeaca)} placeholder={t('swot.placeholders.add_threat')} className="bg-white" />
                  <Button size="icon" variant="outline" onClick={() => addItem(setAmeacas, ameacas, inputAmeaca, setInputAmeaca)}><Plus className="w-4 h-4" /></Button>
                </div>
              )}
              <ul className="space-y-2">
                {ameacas.map((item, i) => (
                  <li key={i} className="flex justify-between items-center p-2 bg-white rounded border border-orange-100 text-sm">
                    {item}
                    {!isReadOnly && (
                      <button onClick={() => removeItem(setAmeacas, ameacas, i)} className="text-slate-400 hover:text-red-500 no-print"><X className="w-4 h-4" /></button>
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white/60 backdrop-blur-sm shadow-sm">
          <CardHeader><CardTitle>{t('swot.action_plan_title')}</CardTitle></CardHeader>
          <CardContent>
            <textarea 
              className="w-full min-h-[100px] p-3 rounded-md border border-input bg-background text-sm"
              placeholder={t('swot.action_plan_placeholder')}
              value={planoAcao}
              onChange={e => setPlanoAcao(e.target.value)}
              disabled={isReadOnly}
            />
          </CardContent>
        </Card>

        {/* AI Insight Section */}
        {forcas.length > 0 && fraquezas.length > 0 && (
          <div className="mt-8">
            <AISuggestionCard 
              swotData={{ forcas, fraquezas, oportunidades, ameacas }}
              clienteId={clienteId}
            />
          </div>
        )}
      </div>
    </div>
  );
}
