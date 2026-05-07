import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { ExportPdfButton } from '@/components/ExportPdfButton';
import { AISuggestionCard } from '@/components/AISuggestionCard';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { collection, addDoc, query, where, orderBy, getDocs, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '@/lib/AuthContext';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const AREA_IDS = [
  'saude_fisica',
  'desenvolvimento_mental',
  'inteligencia_emocional',
  'familia',
  'romance',
  'vida_social',
  'carreira',
  'financas',
  'contribuicao_social',
  'divertimento_lazer',
  'saude_ambiente',
];

export function RodaDaVida() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const clienteId = searchParams.get('clienteId');
  const clienteUid = searchParams.get('clienteUid');
  
  const [titulo, setTitulo] = useState('');
  const [tipo, setTipo] = useState('atual');
  const [valores, setValores] = useState<Record<string, number>>(
    AREA_IDS.reduce((acc, areaId) => ({ ...acc, [areaId]: 5 }), {})
  );
  const [isReadOnly, setIsReadOnly] = useState(false);

  // Dynamic labels from i18n
  const AREAS = AREA_IDS.map(id => ({
    id,
    label: t(`roda.labels.${id}`)
  }));

  // Load existing assessment if id is present
  useEffect(() => {
    async function loadData() {
      if (!id) return;
      
      try {
        const docRef = doc(db, 'rodas_da_vida', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setTitulo(data.titulo || '');
          setTipo(data.tipo_avaliacao || 'atual');
          
          const newValues: Record<string, number> = {};
          AREA_IDS.forEach(areaId => {
            newValues[areaId] = data[areaId] ?? 5;
          });
          setValores(newValues);
          setIsReadOnly(true);
        } else {
          toast.error(t('roda.errors.not_found'));
        }
      } catch (error: any) {
        toast.error('Erro ao carregar dados: ' + error.message);
      }
    }
    
    loadData();
  }, [id, t]);

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
    enabled: !!user && !id
  });

  const mutation = useMutation({
    mutationFn: async (novaRoda: any) => {
      const path = 'rodas_da_vida';
      try {
        return await addDoc(collection(db, path), {
          ...novaRoda,
          created_by: user?.uid,
          profissional_id: user?.uid,
          cliente_id: clienteId || null,
          cliente_uid: clienteUid || null,
          created_date: serverTimestamp(),
          created_at: serverTimestamp()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, path);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rodas'] });
      setTitulo('');
      setValores(AREA_IDS.reduce((acc, areaId) => ({ ...acc, [areaId]: 5 }), {}));
      toast.success(t('roda.success.saved'));
    },
    onError: (error: any) => {
      toast.error('Erro ao salvar avaliação: ' + error.message);
    }
  });

  const handleSave = () => {
    if (!titulo) return toast.error(t('roda.errors.fill_title'));
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
        <h1 className="text-3xl font-bold text-slate-800">{t('roda.title')}</h1>
        <ExportPdfButton targetId="print-roda" filename="roda-da-vida" title={`Relatório: ${t('roda.title')}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8" id="print-roda">
        {/* Form */}
        <Card className="bg-white/60 backdrop-blur-sm shadow-sm">
          <CardHeader>
            <CardTitle>{t('roda.new_assessment')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex: Avaliação Inicial" disabled={isReadOnly} />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={tipo} onValueChange={setTipo} disabled={isReadOnly}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="atual">{t('roda.types.atual')}</SelectItem>
                    <SelectItem value="desejado">{t('roda.types.desejado')}</SelectItem>
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
                    disabled={isReadOnly}
                  />
                </div>
              ))}
            </div>

            {!isReadOnly && (
              <Button onClick={handleSave} className="w-full" disabled={mutation.isPending}>
                {mutation.isPending ? t('roda.saving') : t('roda.save_btn')}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Chart & History */}
        <div className="space-y-8">
          <Card className="bg-white/60 backdrop-blur-sm shadow-sm">
            <CardHeader><CardTitle>{t('roda.visualization')}</CardTitle></CardHeader>
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

          {!isReadOnly && (
            <Card className="bg-white/60 backdrop-blur-sm shadow-sm no-print">
              <CardHeader><CardTitle>{t('roda.history')}</CardTitle></CardHeader>
              <CardContent>
                {historico.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">Nenhuma avaliação encontrada.</p>
                ) : (
                  <div className="space-y-3">
                    {historico.slice(0, 3).map((item: any) => (
                      <div key={item.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => navigate(`/RodaDaVida/${item.id}`)}>
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
          )}
        </div>
      </div>

      {/* AI Insight Section */}
      <div className="mt-8 no-print">
        <AISuggestionCard 
          rodaData={valores}
          clienteId={clienteId}
        />
      </div>
    </div>
  );
}

