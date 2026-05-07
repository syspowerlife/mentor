import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, addDoc, Timestamp, updateDoc, doc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, handleFirestoreError, OperationType } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import { useSearchParams, Link, useParams } from 'react-router-dom';
import { useDisc } from '@/hooks/useDisc';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ExportPdfButton } from '@/components/ExportPdfButton';
import { AISuggestionCard } from '@/components/AISuggestionCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';
import { toast } from 'sonner';
import { DiscReport } from '@/components/tools/DiscReport';
import { ToolSkeleton } from '@/components/skeletons/FeedbackSkeletons';
import { CheckCircle2, History, ExternalLink, Download, AlertCircle } from 'lucide-react';

const PERGUNTAS = [
  { id: 1, texto: "Tomo decisões rápidas, mesmo sob pressão.", perfil: "D" },
  { id: 2, texto: "Gosto de interagir e influenciar pessoas.", perfil: "I" },
  { id: 3, texto: "Prefiro ambientes organizados e estáveis.", perfil: "S" },
  { id: 4, texto: "Analiso todos os dados antes de agir.", perfil: "C" },
  { id: 5, texto: "Sou direto e objetivo nas conversas.", perfil: "D" },
  { id: 6, texto: "Entusiasmo-me facilmente com novas ideias.", perfil: "I" },
  { id: 7, texto: "Tenho paciência para treinar e ensinar outros.", perfil: "S" },
  { id: 8, texto: "Sigo regras e procedimentos à risca.", perfil: "C" },
  { id: 9, texto: "Assumo riscos calculados para obter resultados.", perfil: "D" },
  { id: 10, texto: "Gosto de ser o centro das atenções.", perfil: "I" },
  { id: 11, texto: "Evito conflitos interpessoais.", perfil: "S" },
  { id: 12, texto: "Busco precisão e perfeição no trabalho.", perfil: "C" },
  { id: 13, texto: "Gosto de liderar e dar ordens.", perfil: "D" },
  { id: 14, texto: "Sou otimista e vejo o lado positivo.", perfil: "I" },
  { id: 15, texto: "Sou consistente e previsível nas minhas ações.", perfil: "S" },
  { id: 16, texto: "Questiono métodos que parecem ineficientes.", perfil: "C" },
  { id: 17, texto: "Sou competitivo e gosto de vencer.", perfil: "D" },
  { id: 18, texto: "Comunico-me de forma persuasiva.", perfil: "I" },
  { id: 19, texto: "Valorizo a lealdade e o trabalho em equipe.", perfil: "S" },
  { id: 20, texto: "Sou detalhista e meticuloso.", perfil: "C" },
  { id: 21, texto: "Prefiro resultados rápidos à perfeição técnica.", perfil: "D" },
  { id: 22, texto: "Faço amizades com facilidade.", perfil: "I" },
  { id: 23, texto: "Gosto de rotina e previsibilidade.", perfil: "S" },
  { id: 24, texto: "Sou autocrítico e analítico.", perfil: "C" },
  { id: 25, texto: "Desafio a autoridade se achar necessário.", perfil: "D" },
  { id: 26, texto: "Gosto de vender ideias e projetos.", perfil: "I" },
  { id: 27, texto: "Sou um bom ouvinte.", perfil: "S" },
  { id: 28, texto: "Preocupo-me com a qualidade final.", perfil: "C" },
  { id: 29, texto: "Sou impaciente com lentidão.", perfil: "D" },
  { id: 30, texto: "Sou sociável e expressivo.", perfil: "I" },
  { id: 31, texto: "Sou calmo e contido emocionalmente.", perfil: "S" },
  { id: 32, texto: "Prefiro trabalhar sozinho para garantir a qualidade.", perfil: "C" },
  { id: 33, texto: "Tomo a iniciativa em situações difíceis.", perfil: "D" },
  { id: 34, texto: "Motivo pessoas através da comunicação.", perfil: "I" },
  { id: 35, texto: "Prefiro ambientes de trabalho harmoniosos.", perfil: "S" },
  { id: 36, texto: "Sigo métodos formais para organizar meu tempo.", perfil: "C" },
  { id: 37, texto: "Sou focado em metas e objetivos.", perfil: "D" },
  { id: 38, texto: "Gosto de inovar e trazer novidades.", perfil: "I" },
  { id: 39, texto: "Sou leal à empresa e aos meus colegas.", perfil: "S" },
  { id: 40, texto: "Baseio minhas decisões em fatos e dados.", perfil: "C" },
  { id: 41, texto: "Não me importo em assumir o controle.", perfil: "D" },
  { id: 42, texto: "Sou bastante comunicativo.", perfil: "I" },
  { id: 43, texto: "Prefiro seguir métodos testados e aprovados.", perfil: "S" },
  { id: 44, texto: "Analiso os riscos antes de qualquer ação.", perfil: "C" },
  { id: 45, texto: "Sou direto, mesmo que pareça insensível.", perfil: "D" },
  { id: 46, texto: "Gosto de me expressar e contar histórias.", perfil: "I" },
  { id: 47, texto: "Sou uma pessoa calma e paciente.", perfil: "S" },
  { id: 48, texto: "Busco a perfeição em tudo que faço.", perfil: "C" },
  { id: 49, texto: "Gosto de desafios difíceis.", perfil: "D" },
  { id: 50, texto: "Sou uma pessoa criativa.", perfil: "I" }
];

const CORES_DISC = {
  D: '#dc2626', // Vermelho
  I: '#eab308', // Amarelo
  S: '#16a34a', // Verde
  C: '#2563eb', // Azul
};

export function PerfilDisc() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const clienteId = searchParams.get('clienteId');
  const clienteUid = searchParams.get('clienteUid');
  
  const [loading, setLoading] = useState(!!(clienteId || id));
  const [titulo, setTitulo] = useState('');
  const [respostas, setRespostas] = useState<Record<number, number>>(
    PERGUNTAS.reduce((acc, p) => ({ ...acc, [p.id]: 5 }), {})
  );
  const [resultado, setResultado] = useState<any>(null);
  const [showProfessionalReport, setShowProfessionalReport] = useState(false);
  const [isSyncingPdf, setIsSyncingPdf] = useState(false);

  const { latestDisc, discs, isLoading: isLoadingDisc } = useDisc(id ? null : clienteId);

  const mutation = useMutation({
    mutationFn: async (novoDisc: any) => {
      const path = 'perfis_disc';
      try {
        const docRef = await addDoc(collection(db, path), {
          ...novoDisc,
          created_by: user?.uid,
          profissional_id: user?.uid,
          created_at: Timestamp.now(),
          cliente_id: clienteId || null,
          cliente_uid: clienteUid || null
        });
        return { id: docRef.id, ...novoDisc };
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, path);
      }
    },
    onSuccess: (data) => {
      setResultado(data);
      toast.success(t('disc.success.saved'));
    },
    onError: (error: any) => {
      console.error(error);
      toast.error(error.message || t('disc.errors.fill_title')); // Fallback error
    }
  });

  // Load existing DISC if id is provided
  useEffect(() => {
    async function loadData() {
      if (!id) return;
      
      try {
        const docRef = doc(db, 'perfis_disc', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setResultado({ id: docSnap.id, ...docSnap.data() });
        } else {
          toast.error(t('disc.errors.not_found'));
        }
      } catch (error: any) {
        toast.error(t('common.error_loading_data') + ': ' + error.message);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [id, t]);

  // Load latest DISC if clienteId is provided (only if not viewing a specific ID)
  useEffect(() => {
    if (!id && latestDisc) {
      setResultado(latestDisc);
    }
    if (!id) setLoading(isLoadingDisc);
  }, [latestDisc, isLoadingDisc, id]);

  if (loading) return <ToolSkeleton />;

  const calcularResultado = () => {
    if (!titulo) return toast.error('Preencha o título da avaliação.');
    
    let D = 0, I = 0, S = 0, C = 0;
    
    PERGUNTAS.forEach(p => {
      const val = respostas[p.id];
      if (p.perfil === 'D') D += val;
      if (p.perfil === 'I') I += val;
      if (p.perfil === 'S') S += val;
      if (p.perfil === 'C') C += val;
    });

    const total = D + I + S + C || 1;
    const dominancia = Math.round((D / total) * 100);
    const influencia = Math.round((I / total) * 100);
    const estabilidade = Math.round((S / total) * 100);
    const conformidade = Math.round((C / total) * 100);

    const perfis = [
      { p: 'D', v: dominancia },
      { p: 'I', v: influencia },
      { p: 'S', v: estabilidade },
      { p: 'C', v: conformidade }
    ];
    perfis.sort((a, b) => b.v - a.v);
    const perfil_dominante = perfis[0].p;

    mutation.mutate({
      titulo,
      respostas: PERGUNTAS.map(p => ({ id: p.id, valor: respostas[p.id], perfil: p.perfil })),
      dominancia,
      influencia,
      estabilidade,
      conformidade,
      perfil_dominante,
      descricao_perfil: `Seu perfil dominante é ${perfil_dominante}.`
    });
  };

  const handleSavePdfToStorage = async (blob: Blob) => {
    if (!resultado?.id) return;
    
    setIsSyncingPdf(true);
    const toastId = toast.loading('Salvando PDF permanente no sistema...');
    
    try {
      const storageRef = ref(storage, `perfis_disc/${user?.uid}/${resultado.id}.pdf`);
      await uploadBytes(storageRef, blob);
      const downloadUrl = await getDownloadURL(storageRef);
      
      const discRef = doc(db, 'perfis_disc', resultado.id);
      await updateDoc(discRef, {
        pdf_url: downloadUrl,
        results_saved: true
      });
      
      setResultado((prev: any) => ({ ...prev, pdf_url: downloadUrl, results_saved: true }));
      toast.success('Relatório PDF salvo permanentemente!', { id: toastId });
    } catch (error) {
      console.error('Error uploading PDF:', error);
      toast.error('Erro ao salvar PDF no servidor.', { id: toastId });
    } finally {
      setIsSyncingPdf(false);
    }
  };

  const chartData = resultado ? [
    { name: 'Dominância', value: resultado.dominancia, color: CORES_DISC.D },
    { name: 'Influência', value: resultado.influencia, color: CORES_DISC.I },
    { name: 'Estabilidade', value: resultado.estabilidade, color: CORES_DISC.S },
    { name: 'Conformidade', value: resultado.conformidade, color: CORES_DISC.C },
  ] : [];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-slate-800">{t('disc.title')}</h1>
        <div className="flex gap-2">
          {resultado && (
            <>
              {resultado.pdf_url && (
                  <a 
                    href={resultado.pdf_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={buttonVariants({ variant: "outline" })}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {t('disc.pdf.download')}
                  </a>
              )}
              {!resultado.pdf_url && (
                <ExportPdfButton 
                  targetId={showProfessionalReport ? "professional-report" : "print-disc"} 
                  filename="perfil-disc" 
                  title={`Relatório: ${t('disc.title')}`} 
                  onBlobGenerated={handleSavePdfToStorage}
                  buttonText={t('disc.pdf.generate_save')}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                />
              )}
              <Button 
                variant={showProfessionalReport ? "default" : "outline"} 
                onClick={() => setShowProfessionalReport(!showProfessionalReport)}
              >
                {showProfessionalReport ? t('disc.view_summary') : t('disc.report_ia')}
              </Button>
            </>
          )}
        </div>
      </div>

      {discs.length > 0 && !resultado && (
        <Card className="bg-blue-50 border-blue-100 mb-8">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="w-5 h-5 text-blue-600" />
              {t('disc.history')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {discs.slice(0, 3).map((d) => (
                <div key={d.id} className="p-4 bg-white rounded-lg border border-slate-200 flex justify-between items-center group hover:border-blue-300 transition-colors">
                  <div>
                    <div className="font-medium text-slate-900">{d.titulo}</div>
                    <div className="text-xs text-slate-500">{t('disc.results.performed_at')} {d.created_at?.toDate().toLocaleDateString()}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setResultado(d)}>
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                    {d.pdf_url && (
                      <a 
                        href={d.pdf_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={buttonVariants({ variant: "ghost", size: "sm" })}
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {discs.length > 3 && (
              <div className="mt-4 text-center">
                <Button variant="link" className="text-blue-600">{t('disc.view_all_assessments') || 'Ver todas'}</Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!resultado ? (
        <Card className="bg-white/60 backdrop-blur-sm shadow-sm max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>{t('disc.form.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-2">
              <Label>{t('disc.form.title_label')}</Label>
              <Input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder={t('disc.form.title_placeholder')} />
            </div>

            <div className="space-y-6">
              <p className="text-sm text-slate-500">{t('disc.form.description')}</p>
              {PERGUNTAS.map(p => (
                <div key={p.id} className="space-y-2 p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex justify-between">
                    <Label className="text-base">{p.texto}</Label>
                    <span className="font-bold text-blue-600">{respostas[p.id]}</span>
                  </div>
                  <Slider 
                    value={[respostas[p.id]]} 
                    max={10} 
                    step={1} 
                    onValueChange={(val) => setRespostas(prev => ({ ...prev, [p.id]: val[0] }))} 
                  />
                </div>
              ))}
            </div>

            <Button onClick={calcularResultado} className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? t('disc.form.calculating') : t('disc.form.calculate')}
            </Button>
          </CardContent>
        </Card>
      ) : showProfessionalReport ? (
        <DiscReport 
          userData={{ 
            nome: user?.displayName || user?.email || t('disc.unknown_user') || 'Usuário', 
            data: resultado.created_at instanceof Timestamp ? resultado.created_at.toDate().toLocaleDateString() : new Date().toLocaleDateString() 
          }}
          respostas={resultado.respostas || []}
          perguntasBase={PERGUNTAS}
        />
      ) : (
        <div id="print-disc" className="space-y-6">
          <Card className="bg-white/60 backdrop-blur-sm shadow-sm">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">{resultado.titulo}</CardTitle>
              <p className="text-slate-500">{t('disc.results.performed_at')} {resultado.created_at instanceof Timestamp ? resultado.created_at.toDate().toLocaleDateString() : new Date().toLocaleDateString()}</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 100]} />
                      <RechartsTooltip />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-4">
                  <h3 className="text-xl font-bold">{t('disc.results.dominant')}: <span style={{color: CORES_DISC[resultado.perfil_dominante as keyof typeof CORES_DISC]}}>{resultado.perfil_dominante}</span></h3>
                  <p className="text-slate-700 leading-relaxed">
                    {resultado.descricao_perfil}
                  </p>
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                      <div className="font-bold text-red-700">{t('disc.labels.d')}</div>
                      <div className="text-2xl font-bold">{resultado.dominancia}%</div>
                    </div>
                    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                      <div className="font-bold text-yellow-700">{t('disc.labels.i')}</div>
                      <div className="text-2xl font-bold">{resultado.influencia}%</div>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                      <div className="font-bold text-green-700">{t('disc.labels.s')}</div>
                      <div className="text-2xl font-bold">{resultado.estabilidade}%</div>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="font-bold text-blue-700">{t('disc.labels.c')}</div>
                      <div className="text-2xl font-bold">{resultado.conformidade}%</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {resultado.pdf_url && (
                <div className="mt-8 p-4 bg-green-50 border border-green-100 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                    <div>
                      <div className="font-bold text-green-900">{t('disc.pdf.persisted_title')}</div>
                      <div className="text-sm text-green-700">{t('disc.pdf.persisted_desc')}</div>
                    </div>
                  </div>
                  <a 
                    href={resultado.pdf_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={buttonVariants({ variant: "outline", className: "border-green-200 text-green-700 hover:bg-green-100" })}
                  >
                    {t('disc.pdf.open')}
                  </a>
                </div>
              )}

              {!resultado.pdf_url && (
                <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-6 h-6 text-blue-600" />
                    <div>
                      <div className="font-bold text-blue-900">{t('disc.pdf.generate_save')}</div>
                      <div className="text-sm text-blue-700">{t('disc.pdf.save_desc')}</div>
                    </div>
                  </div>
                  <ExportPdfButton 
                    targetId={showProfessionalReport ? "professional-report" : "print-disc"} 
                    filename="perfil-disc" 
                    title={`Relatório: ${t('disc.title')}`} 
                    onBlobGenerated={handleSavePdfToStorage}
                    buttonText={t('disc.pdf.save_now')}
                  />
                </div>
              )}

              <div className="mt-8 text-center no-print flex justify-center gap-4">
                <Button variant="outline" onClick={() => setResultado(null)}>{t('disc.new_assessment')}</Button>
                <Button onClick={() => setShowProfessionalReport(true)}>{t('disc.full_report')}</Button>
              </div>
            </CardContent>
          </Card>

          {/* AI Insight Section */}
          <div className="mt-8 no-print">
            <AISuggestionCard 
              discData={resultado}
              clienteId={clienteId}
            />
          </div>
        </div>
      )}
    </div>
  );
}
