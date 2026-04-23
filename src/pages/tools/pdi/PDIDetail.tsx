import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  doc, 
  query, 
  where, 
  onSnapshot, 
  Timestamp 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { calculateProgress } from '@/lib/metrics';
import { useAuth } from '@/lib/AuthContext';
import { sendNotification } from '@/lib/notifications';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ExportPdfButton } from '@/components/ExportPdfButton';
import { CompetencyGapChart } from '@/components/CompetencyGapChart';
import { FeedbackTimeline } from '@/components/FeedbackTimeline';
import { EngagementIndicator } from '@/components/EngagementIndicator';
import { ArrowLeft, Target, BookOpen, MessageSquare, Activity, Plus, CheckCircle2, Circle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatDateOrTimestamp } from '@/lib/utils';
import { useLinkedUsers } from '@/hooks/useLinkedUsers';

export function PDIDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, userData: currentUserProfile } = useAuth();
  const { getUserName } = useLinkedUsers();
  const [activeTab, setActiveTab] = useState('visao_geral');

  const [isNewMetaOpen, setIsNewMetaOpen] = useState(false);
  const [newMeta, setNewMeta] = useState({ titulo: '', descricao: '', prazo: '' });

  const [isNewAcaoOpen, setIsNewAcaoOpen] = useState(false);
  const [selectedMetaId, setSelectedMetaId] = useState('');
  const [newAcao, setNewAcao] = useState({ descricao: '', prazo: '' });

  const [isNewFeedbackOpen, setIsNewFeedbackOpen] = useState(false);
  const [newFeedback, setNewFeedback] = useState({ descricao: '' });

  const [isEditPDIOpen, setIsEditPDIOpen] = useState(false);
  const [editPDI, setEditPDI] = useState({ data_inicio: '', data_fim: '' });

  const [pdi, setPdi] = useState<any>(null);
  const [metas, setMetas] = useState<any[]>([]);
  const [acoes, setAcoes] = useState<any[]>([]);
  const [competencias, setCompetencias] = useState<any[]>([]);
  const [pdiCompetencias, setPdiCompetencias] = useState<any[]>([]);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);

  const [isNewCompetenciaOpen, setIsNewCompetenciaOpen] = useState(false);
  const [newPdiCompetencia, setNewPdiCompetencia] = useState({ competencia_id: '', nivel_atual: '1', nivel_meta: '5' });

  // Load PDI Data and Related info
  useEffect(() => {
    if (!id) return;
    const unsubscribes: (() => void)[] = [];

    // PDI
    unsubscribes.push(onSnapshot(doc(db, 'pdis', id), (doc) => {
      if (doc.exists()) {
        setPdi({ id: doc.id, ...doc.data() });
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'pdis')));

    // Metas
    unsubscribes.push(onSnapshot(query(collection(db, 'pdi_metas'), where('pdi_id', '==', id)), (snapshot) => {
      setMetas(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'pdi_metas')));

    // Acoes
    unsubscribes.push(onSnapshot(query(collection(db, 'pdi_acoes'), where('pdi_id', '==', id)), (snapshot) => {
      setAcoes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'pdi_acoes')));

    // PDI Competencias
    unsubscribes.push(onSnapshot(query(collection(db, 'pdi_competencias'), where('pdi_id', '==', id)), (snapshot) => {
      setPdiCompetencias(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'pdi_competencias')));

    // Feedbacks
    unsubscribes.push(onSnapshot(query(collection(db, 'pdi_feedbacks'), where('pdi_id', '==', id)), (snapshot) => {
      setFeedbacks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'pdi_feedbacks')));

    return () => unsubscribes.forEach(unsub => unsub());
  }, [id]);

  // Load General Competencias
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'competencias'), (snapshot) => {
      setCompetencias(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'competencias');
    });
    return () => unsub();
  }, []);

  const userName = pdi ? getUserName(pdi.usuario_id) : t('pdi.detail.unknown');
  const gestorName = pdi ? getUserName(pdi.gestor_id) : '-';

  const updatePDIMutation = useMutation({
    mutationFn: async (data: any) => {
      const path = 'pdis';
      try {
        await updateDoc(doc(db, path, id!), {
          ...data,
          updated_at: Timestamp.now()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      }
    },
    onSuccess: () => {
      setIsEditPDIOpen(false);
      toast.success(t('pdi.form.success.updated'));
    },
    onError: (error: any) => {
      toast.error(error.message || t('pdi.form.errors.update_error'));
    }
  });

  const createPdiCompetenciaMutation = useMutation({
    mutationFn: async (data: any) => {
      const path = 'pdi_competencias';
      try {
        await addDoc(collection(db, path), { ...data, pdi_id: id });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, path);
      }
    },
    onSuccess: () => {
      setIsNewCompetenciaOpen(false);
      setNewPdiCompetencia({ competencia_id: '', nivel_atual: '1', nivel_meta: '5' });
      toast.success(t('pdi.competencies_tab.add_success') || 'Competência adicionada!');
    },
    onError: (error: any) => {
      toast.error(error.message || t('pdi.form.errors.create_error'));
    }
  });

  const createMetaMutation = useMutation({
    mutationFn: async (data: any) => {
      const path = 'pdi_metas';
      try {
        await addDoc(collection(db, path), { ...data, pdi_id: id, status: 'não iniciado', progresso: 0 });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, path);
      }
    },
    onSuccess: () => {
      setIsNewMetaOpen(false);
      setNewMeta({ titulo: '', descricao: '', prazo: '' });
      toast.success(t('pdi.goals_tab.meta_success') || 'Meta criada!');
    },
    onError: (error: any) => {
      toast.error(error.message || t('pdi.form.errors.create_error'));
    }
  });

  const createAcaoMutation = useMutation({
    mutationFn: async (data: any) => {
      const path = 'pdi_acoes';
      try {
        await addDoc(collection(db, path), { 
          ...data, 
          meta_id: selectedMetaId, 
          pdi_id: id, // Adicionado para validação de segurança
          status: 'pendente' 
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, path);
      }
    },
    onSuccess: () => {
      setIsNewAcaoOpen(false);
      setNewAcao({ descricao: '', prazo: '' });
      toast.success(t('pdi.goals_tab.action_success') || 'Ação adicionada!');
    },
    onError: (error: any) => {
      toast.error(error.message || t('pdi.form.errors.create_error'));
    }
  });

  const createFeedbackMutation = useMutation({
    mutationFn: async (data: any) => {
      const path = 'pdi_feedbacks';
      try {
        await addDoc(collection(db, path), { 
          ...data, 
          pdi_id: id, 
          autor_id: currentUser?.uid, // Adicionado para validação de segurança
          data: new Date().toISOString() 
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, path);
      }
    },
    onSuccess: () => {
      setIsNewFeedbackOpen(false);
      setNewFeedback({ descricao: '' });
      toast.success(t('pdi.feedbacks_tab.success') || 'Feedback registrado!');
    },
    onError: (error: any) => {
      toast.error(error.message || t('pdi.form.errors.create_error'));
    }
  });

  const deletePdiMutation = useMutation({
    mutationFn: async () => {
      if (!id) return;
      
      // Integridade Referencial: Verificar se existem metas, ações ou feedbacks
      if (metas.length > 0) {
        throw new Error(t('pdi.form.errors.meta_linked'));
      }
      if (pdiAcoes.length > 0) {
        throw new Error(t('pdi.form.errors.acao_linked') || 'Não é possível excluir um PDI com ações vinculadas.');
      }
      if (feedbacks.length > 0) {
        throw new Error(t('pdi.form.errors.feedback_linked'));
      }

      const path = 'pdis';
      try {
        await deleteDoc(doc(db, path, id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
      }
    },
    onSuccess: () => {
      toast.success(t('pdi.form.success.deleted'));
      navigate('/ferramentas/pdi');
    },
    onError: (error: any) => {
      toast.error(error.message || t('pdi.form.errors.delete_error'));
    }
  });

  const toggleAcaoStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const path = 'pdi_acoes';
      try {
        await updateDoc(doc(db, path, id), { status });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
      }
    },
    onError: (error: any) => {
      toast.error(error.message || t('pdi.form.errors.update_error'));
    }
  });

  const sugerirCompetenciasMutation = useMutation({
    mutationFn: async () => {
      const suggested = competencias.slice(0, 3);
      for (const comp of suggested) {
        if (!pdiCompetencias.some((pc: any) => pc.competencia_id === comp.id)) {
          await addDoc(collection(db, 'pdi_competencias'), {
            pdi_id: id,
            competencia_id: comp.id,
            nivel_atual: '1',
            nivel_meta: '5'
          });
        }
      }
    },
    onSuccess: () => {
      toast.success(t('pdi.form.success.suggested') || 'Competências sugeridas adicionadas!');
    },
    onError: (error: any) => {
      toast.error(error.message || t('pdi.form.errors.create_error'));
    }
  });

  const pdiAcoes = acoes.filter((a: any) => metas.some((m: any) => m.id === a.meta_id));
  const completedAcoes = pdiAcoes.filter((a: any) => a.status === 'concluído').length;
  const totalAcoes = pdiAcoes.length;
  const progressoGeral = calculateProgress(completedAcoes, totalAcoes);

  if (!pdi) return <div className="p-8 text-center">{t('pdi.detail.loading')}</div>;

  const tabs = [
    { id: 'visao_geral', label: t('pdi.detail.tabs.overview'), icon: <Activity className="w-4 h-4" /> },
    { id: 'metas', label: t('pdi.detail.tabs.goals'), icon: <Target className="w-4 h-4" /> },
    { id: 'competencias', label: t('pdi.detail.tabs.competencies'), icon: <BookOpen className="w-4 h-4" /> },
    { id: 'feedbacks', label: t('pdi.detail.tabs.feedbacks'), icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'relatorios', label: t('pdi.detail.tabs.reports'), icon: <Activity className="w-4 h-4" /> },
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/ferramentas/pdi')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-slate-800">{t('pdi.detail.title')}</h1>
          <p className="text-slate-500">{t('pdi.detail.collaborator')}: {userName}</p>
        </div>
          <div className="ml-auto flex items-center gap-2">
            {(pdi.status === 'rascunho' || pdi.status === 'ajuste_solicitado') && (currentUser?.uid === pdi.usuario_id || currentUser?.uid === pdi.gestor_id || currentUserProfile?.role === 'admin') && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setEditPDI({ data_inicio: pdi.data_inicio, data_fim: pdi.data_fim });
                  setIsEditPDIOpen(true);
                }}
              >
                {t('pdi.detail.edit_dates')}
              </Button>
            )}
          {(pdi.status === 'rascunho' || pdi.status === 'ajuste_solicitado') && currentUser?.uid === pdi.usuario_id && (
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={async () => {
                try {
                  await updateDoc(doc(db, 'pdis', id!), { status: 'pendente_aprovacao' });
                  
                  // Notify Manager
                  if (pdi.gestor_id) {
                    await sendNotification({
                      userId: pdi.gestor_id,
                      title: 'Novo PDI para Aprovação',
                      message: `${currentUser?.displayName || 'Um colaborador'} enviou um PDI para sua revisão.`,
                      type: 'info',
                      link: `/ferramentas/pdi/aprovacao`,
                      triggerId: `pdi_submit_${id}`
                    });
                  }
                  
                  toast.success(t('pdi.form.success.submitted'));
                } catch (error) {
                  handleFirestoreError(error, OperationType.UPDATE, 'pdis');
                }
              }}
            >
              {t('pdi.detail.submit_approval')}
            </Button>
          )}
          <Badge variant={pdi.status === 'ativo' ? 'default' : pdi.status === 'pendente_aprovacao' ? 'warning' : pdi.status === 'ajuste_solicitado' ? 'destructive' : 'secondary'} className="text-sm px-3 py-1">
            {t(`pdi.status.${pdi.status === 'pendente_aprovacao' ? 'pending_approval' : pdi.status === 'ajuste_solicitado' ? 'adjustment_requested' : pdi.status === 'concluído' ? 'completed' : pdi.status === 'rascunho' ? 'draft' : pdi.status === 'cancelado' ? 'cancelled' : 'active'}`).toUpperCase()}
          </Badge>
          {(currentUser?.uid === pdi.gestor_id || currentUserProfile?.role === 'admin') && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={() => {
                if (window.confirm(t('pdi.detail.delete_confirm'))) {
                  deletePdiMutation.mutate();
                }
              }}
            >
              <Trash2 className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 bg-slate-200/50 p-1 rounded-lg w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'visao_geral' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-white/60 backdrop-blur-sm shadow-sm">
              <CardHeader>
                <CardTitle>{t('pdi.detail.info.title')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500">{t('pdi.detail.info.start_date')}</p>
                    <p className="font-medium">{formatDateOrTimestamp(pdi.data_inicio)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">{t('pdi.detail.info.end_date')}</p>
                    <p className="font-medium">{formatDateOrTimestamp(pdi.data_fim)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">{t('pdi.detail.info.manager')}</p>
                    <p className="font-medium">{gestorName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">{t('pdi.detail.info.role')}</p>
                    <p className="font-medium">{t('pdi.detail.unknown')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">{t('pdi.detail.info.sector')}</p>
                    <p className="font-medium">{t('pdi.detail.unknown')}</p>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-100">
                  <p className="text-sm text-slate-500 mb-2">{t('pdi.detail.info.engagement')}</p>
                  <EngagementIndicator userId={pdi.usuario_id} />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/60 backdrop-blur-sm shadow-sm">
              <CardHeader>
                <CardTitle>{t('pdi.detail.progress.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <span className="text-4xl font-bold text-blue-600">{progressoGeral}%</span>
                    <p className="text-slate-500 mt-2">{t('pdi.detail.progress.completed_actions')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/60 backdrop-blur-sm shadow-sm md:col-span-2">
              <CardHeader>
                <CardTitle>{t('pdi.detail.gamification.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-around p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                  <div className="text-center">
                    <p className="text-sm text-blue-600 font-semibold uppercase tracking-wider">{t('pdi.detail.gamification.current_level')}</p>
                    <div className="mt-2 w-16 h-16 mx-auto bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold shadow-md">
                      {Math.floor(completedAcoes / 5) + 1}
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-indigo-600 font-semibold uppercase tracking-wider">{t('pdi.detail.gamification.xp_points')}</p>
                    <div className="mt-2 text-4xl font-bold text-indigo-700">
                      {completedAcoes * 50}
                    </div>
                    <p className="text-xs text-indigo-500 mt-1">{t('pdi.detail.gamification.xp_bonus')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'metas' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">{t('pdi.detail.goals_tab.title')}</h2>
              <Button onClick={() => setIsNewMetaOpen(true)} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                {t('pdi.detail.goals_tab.new_goal')}
              </Button>
            </div>

            {metas.length === 0 ? (
              <Card className="bg-white/60 backdrop-blur-sm shadow-sm">
                <CardContent className="p-8 text-center text-slate-500">
                  {t('pdi.detail.goals_tab.no_goals')}
                </CardContent>
              </Card>
            ) : (
              metas.map((meta: any) => {
                const metaAcoes = acoes.filter((a: any) => a.meta_id === meta.id);
                return (
                  <Card key={meta.id} className="bg-white/60 backdrop-blur-sm shadow-sm border-l-4 border-l-blue-500">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{meta.titulo}</CardTitle>
                          <p className="text-sm text-slate-500 mt-1">{meta.descricao}</p>
                        </div>
                        <Badge variant="outline">{meta.status}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="mt-4 space-y-3">
                        <div className="flex justify-between items-center text-sm font-medium text-slate-700">
                          <span>{t('pdi.detail.goals_tab.action_plan')}</span>
                          <Button variant="ghost" size="sm" onClick={() => { setSelectedMetaId(meta.id); setIsNewAcaoOpen(true); }} className="h-8">
                            <Plus className="w-3 h-3 mr-1" /> {t('pdi.detail.goals_tab.add_action')}
                          </Button>
                        </div>
                        {metaAcoes.length === 0 ? (
                          <p className="text-sm text-slate-400 italic">{t('pdi.detail.goals_tab.no_actions')}</p>
                        ) : (
                          <ul className="space-y-2">
                            {metaAcoes.map((acao: any) => (
                              <li key={acao.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-slate-50 border border-transparent hover:border-slate-100">
                                <button 
                                  onClick={() => toggleAcaoStatus.mutate({ id: acao.id, status: acao.status === 'concluído' ? 'pendente' : 'concluído' })}
                                  className="text-slate-400 hover:text-blue-600 transition-colors"
                                >
                                  {acao.status === 'concluído' ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Circle className="w-5 h-5" />}
                                </button>
                                <span className={`flex-1 text-sm ${acao.status === 'concluído' ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                                  {acao.descricao}
                                </span>
                                <span className="text-xs text-slate-400">{t('pdi.detail.goals_tab.deadline')}: {formatDateOrTimestamp(acao.prazo)}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'competencias' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">{t('pdi.detail.competencies_tab.title')}</h2>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => sugerirCompetenciasMutation.mutate()} disabled={sugerirCompetenciasMutation.isPending}>
                  {t('pdi.detail.competencies_tab.suggest')}
                </Button>
                <Button onClick={() => setIsNewCompetenciaOpen(true)} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  {t('pdi.detail.competencies_tab.add')}
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 bg-white/60 backdrop-blur-sm shadow-sm">
                <CardHeader>
                  <CardTitle>{t('pdi.detail.competencies_tab.gap_analysis')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CompetencyGapChart data={pdiCompetencias} competencias={competencias} />
                </CardContent>
              </Card>

              <div className="space-y-4">
                {pdiCompetencias.length === 0 ? (
                  <Card className="bg-white/60 backdrop-blur-sm shadow-sm">
                    <CardContent className="p-8 text-center text-slate-500">
                      {t('pdi.detail.competencies_tab.no_competencies')}
                    </CardContent>
                  </Card>
                ) : (
                  pdiCompetencias.map((pc: any) => {
                  const comp = competencias.find((c: any) => c.id === pc.competencia_id);
                  return (
                    <Card key={pc.id} className="bg-white/60 backdrop-blur-sm shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-bold text-slate-800">{comp?.nome || t('pdi.detail.unknown')}</h3>
                            <Badge variant="outline" className="mt-1">{comp?.tipo === 'soft' ? t('pdi.detail.competencies_tab.soft_skill') : t('pdi.detail.competencies_tab.hard_skill')}</Badge>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-xs text-slate-500 mb-1">
                              <span>{t('pdi.detail.competencies_tab.current_level')}: {pc.nivel_atual}</span>
                              <span>{t('pdi.detail.competencies_tab.target_level')}: {pc.nivel_meta}</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full" 
                                style={{ width: `${(Number(pc.nivel_atual) / 5) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'feedbacks' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">{t('pdi.detail.feedbacks_tab.title')}</h2>
              <Button onClick={() => setIsNewFeedbackOpen(true)} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                {t('pdi.detail.feedbacks_tab.new')}
              </Button>
            </div>
            
            <div className="max-w-4xl mx-auto">
              <FeedbackTimeline feedbacks={feedbacks} />
            </div>
          </div>
        )}

        {activeTab === 'relatorios' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">{t('pdi.detail.reports_tab.title')}</h2>
              <ExportPdfButton targetId="pdi-report" filename={`pdi-${id}`} title={`Relatório: ${t('pdi.dashboard.title')}`} />
            </div>
            <div id="pdi-report" className="space-y-6">
              <Card className="bg-white/60 backdrop-blur-sm shadow-sm">
              <CardHeader>
                <CardTitle>{t('pdi.detail.reports_tab.performance_summary')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="text-sm text-slate-500">{t('pdi.detail.reports_tab.total_goals')}</p>
                    <p className="text-2xl font-bold text-slate-800">{metas.length}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="text-sm text-slate-500">{t('pdi.detail.reports_tab.completed_actions')}</p>
                    <p className="text-2xl font-bold text-slate-800">{completedAcoes} de {totalAcoes}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="text-sm text-slate-500">{t('pdi.detail.reports_tab.focus_competencies')}</p>
                    <p className="text-2xl font-bold text-slate-800">{pdiCompetencias.length}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="text-sm text-slate-500">{t('pdi.detail.reports_tab.received_feedbacks')}</p>
                    <p className="text-2xl font-bold text-slate-800">{feedbacks.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
      </div>

      {/* Modals */}
      <Dialog open={isEditPDIOpen} onOpenChange={setIsEditPDIOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('pdi.detail.modals.edit_dates')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('pdi.detail.modals.deadline_label')}</Label>
                <Input type="date" value={editPDI.data_inicio} onChange={e => setEditPDI({ ...editPDI, data_inicio: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{t('pdi.detail.modals.deadline_label')}</Label>
                <Input type="date" value={editPDI.data_fim} onChange={e => setEditPDI({ ...editPDI, data_fim: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditPDIOpen(false)} disabled={updatePDIMutation.isPending}>{t('common.cancel')}</Button>
            <Button onClick={() => updatePDIMutation.mutate(editPDI)} disabled={updatePDIMutation.isPending}>{t('pdi.detail.modals.save_changes')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isNewMetaOpen} onOpenChange={setIsNewMetaOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('pdi.detail.modals.new_goal')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('pdi.detail.modals.title_label')}</Label>
              <Input value={newMeta.titulo} onChange={e => setNewMeta({ ...newMeta, titulo: e.target.value })} placeholder="Ex: Melhorar comunicação da equipe" />
            </div>
            <div className="space-y-2">
              <Label>{t('pdi.detail.modals.desc_label')}</Label>
              <Input value={newMeta.descricao} onChange={e => setNewMeta({ ...newMeta, descricao: e.target.value })} placeholder="Detalhes da meta..." />
            </div>
            <div className="space-y-2">
              <Label>{t('pdi.detail.modals.deadline_label')}</Label>
              <Input type="date" value={newMeta.prazo} onChange={e => setNewMeta({ ...newMeta, prazo: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewMetaOpen(false)} disabled={createMetaMutation.isPending}>{t('common.cancel')}</Button>
            <Button onClick={() => createMetaMutation.mutate(newMeta)} disabled={createMetaMutation.isPending}>{t('pdi.detail.modals.save_goal')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isNewAcaoOpen} onOpenChange={setIsNewAcaoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('pdi.detail.modals.new_action')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('pdi.detail.modals.action_desc_label')}</Label>
              <Input value={newAcao.descricao} onChange={e => setNewAcao({ ...newAcao, descricao: e.target.value })} placeholder="Ex: Fazer curso de oratória" />
            </div>
            <div className="space-y-2">
              <Label>{t('pdi.detail.modals.deadline_label')}</Label>
              <Input type="date" value={newAcao.prazo} onChange={e => setNewAcao({ ...newAcao, prazo: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewAcaoOpen(false)} disabled={createAcaoMutation.isPending}>{t('common.cancel')}</Button>
            <Button onClick={() => createAcaoMutation.mutate(newAcao)} disabled={createAcaoMutation.isPending}>{t('pdi.detail.modals.save_action')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isNewFeedbackOpen} onOpenChange={setIsNewFeedbackOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('pdi.detail.modals.new_feedback')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('pdi.detail.modals.feedback_label')}</Label>
              <textarea 
                className="w-full min-h-[100px] p-3 rounded-md border border-input bg-background text-sm"
                value={newFeedback.descricao} 
                onChange={e => setNewFeedback({ ...newFeedback, descricao: e.target.value })} 
                placeholder={t('pdi.detail.modals.feedback_placeholder')} 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewFeedbackOpen(false)} disabled={createFeedbackMutation.isPending}>{t('common.cancel')}</Button>
            <Button onClick={() => createFeedbackMutation.mutate(newFeedback)} disabled={createFeedbackMutation.isPending}>{t('pdi.detail.modals.save_feedback')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isNewCompetenciaOpen} onOpenChange={setIsNewCompetenciaOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('pdi.detail.modals.add_competency')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('pdi.detail.modals.competency_label')}</Label>
              <Select value={newPdiCompetencia.competencia_id} onValueChange={v => setNewPdiCompetencia({ ...newPdiCompetencia, competencia_id: v })}>
                <SelectTrigger><SelectValue placeholder={t('pdi.detail.modals.select_competency')} /></SelectTrigger>
                <SelectContent>
                  {competencias.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.nome} ({c.tipo})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('pdi.detail.modals.current_level_label')}</Label>
                <Input type="number" min="1" max="5" value={newPdiCompetencia.nivel_atual} onChange={e => setNewPdiCompetencia({ ...newPdiCompetencia, nivel_atual: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{t('pdi.detail.modals.target_level_label')}</Label>
                <Input type="number" min="1" max="5" value={newPdiCompetencia.nivel_meta} onChange={e => setNewPdiCompetencia({ ...newPdiCompetencia, nivel_meta: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewCompetenciaOpen(false)} disabled={createPdiCompetenciaMutation.isPending}>{t('common.cancel')}</Button>
            <Button onClick={() => createPdiCompetenciaMutation.mutate(newPdiCompetencia)} disabled={createPdiCompetenciaMutation.isPending}>{t('pdi.detail.modals.save_competency')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
