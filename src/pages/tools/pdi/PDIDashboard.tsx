import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  or,
  orderBy, 
  onSnapshot, 
  Timestamp 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { calculateProgress, getOverdueItemsCount } from '@/lib/metrics';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Target, TrendingUp, CheckCircle, AlertCircle, Plus, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { formatDateOrTimestamp } from '@/lib/utils';
import { useLinkedUsers } from '@/hooks/useLinkedUsers';
import { PDIStatus, PDIAcaoStatus, UserRole, TipoUsuario } from '@/types/enums';

export function PDIDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user: currentUser, userData: currentUserProfile } = useAuth();
  const { linkedUsers, getUserName } = useLinkedUsers();
  const [isNewPDIOpen, setIsNewPDIOpen] = useState(false);
  const [newPDI, setNewPDI] = useState({ usuario_id: '', gestor_id: '', data_inicio: '', data_fim: '' });

  const [pdis, setPdis] = useState<any[]>([]);
  const [acoes, setAcoes] = useState<any[]>([]);
  const [metas, setMetas] = useState<any[]>([]);

  // Load PDIs in real-time
  useEffect(() => {
    if (!currentUser || !currentUserProfile) return;

    const path = 'pdis';
    const isGestor = currentUserProfile?.role === UserRole.ADMIN || currentUserProfile?.tipo_usuario === TipoUsuario.GESTOR;
    
    // Admins can see all, Gestors see where they are gestor_id, Users see where they are usuario_id
    let q;
    if (currentUserProfile?.role === UserRole.ADMIN) {
      q = query(collection(db, path), orderBy('created_at', 'desc'));
    } else if (isGestor) {
      q = query(collection(db, path), where('gestor_id', '==', currentUser.uid), orderBy('created_at', 'desc'));
    } else {
      q = query(collection(db, path), where('usuario_id', '==', currentUser.uid), orderBy('created_at', 'desc'));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPdis(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, [currentUser, currentUserProfile]);

  // Load Acoes and Metas for stats
  useEffect(() => {
    if (!currentUser || !currentUserProfile) return;

    const isGestor = currentUserProfile?.role === UserRole.ADMIN || currentUserProfile?.tipo_usuario === TipoUsuario.GESTOR;
    
    let qAcoes;
    let qMetas;

    if (currentUserProfile?.role === UserRole.ADMIN) {
      qAcoes = query(collection(db, 'pdi_acoes'));
      qMetas = query(collection(db, 'pdi_metas'));
    } else {
      // For non-admins, we filter by usuario_id OR gestor_id
      // Note: This requires documents to have these fields. 
      // Existing docs might not have them, so we'll also try to handle that by filtering by pdi_id if needed,
      // but for now, let's use the standard owner/participant fields.
      qAcoes = query(
        collection(db, 'pdi_acoes'),
        or(
          where('usuario_id', '==', currentUser.uid),
          where('gestor_id', '==', currentUser.uid),
          where('cliente_uid', '==', currentUser.uid),
          where('profissional_id', '==', currentUser.uid),
          where('created_by', '==', currentUser.uid)
        )
      );
      qMetas = query(
        collection(db, 'pdi_metas'),
        or(
          where('usuario_id', '==', currentUser.uid),
          where('gestor_id', '==', currentUser.uid),
          where('cliente_uid', '==', currentUser.uid),
          where('profissional_id', '==', currentUser.uid),
          where('created_by', '==', currentUser.uid)
        )
      );
    }

    const unsubAcoes = onSnapshot(qAcoes, (snapshot) => {
      setAcoes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Error loading PDI actions:", error);
    });

    const unsubMetas = onSnapshot(qMetas, (snapshot) => {
      setMetas(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Error loading PDI metas:", error);
    });

    return () => {
      unsubAcoes();
      unsubMetas();
    };
  }, [currentUser, currentUserProfile]);

  const createPDIMutation = useMutation({
    mutationFn: async (data: any) => {
      const path = 'pdis';
      try {
        const isGestor = currentUserProfile?.role === UserRole.ADMIN || currentUserProfile?.tipo_usuario === TipoUsuario.GESTOR;
        await addDoc(collection(db, path), {
          ...data,
          status: isGestor ? PDIStatus.ATIVO : PDIStatus.RASCUNHO,
          gestor_id: isGestor ? currentUser?.uid : (data.gestor_id || ''),
          usuario_id: isGestor ? data.usuario_id : currentUser?.uid,
          cliente_uid: isGestor ? data.usuario_id : currentUser?.uid,
          profissional_id: isGestor ? currentUser?.uid : (data.gestor_id || ''),
          created_at: Timestamp.now()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, path);
      }
    },
    onSuccess: () => {
      setIsNewPDIOpen(false);
      setNewPDI({ usuario_id: '', gestor_id: '', data_inicio: '', data_fim: '' });
      toast.success(t('pdi.form.success.created'));
    },
    onError: (error: any) => toast.error(error.message || t('pdi.form.errors.create_error'))
  });

  const handleCreatePDI = () => {
    const isGestor = currentUserProfile?.role === UserRole.ADMIN || currentUserProfile?.tipo_usuario === TipoUsuario.GESTOR;
    if (isGestor && !newPDI.usuario_id) return toast.error(t('pdi.form.errors.select_collaborator'));
    if (!isGestor && !newPDI.gestor_id) return toast.error(t('pdi.form.errors.select_manager'));
    if (!newPDI.data_inicio || !newPDI.data_fim) return toast.error(t('pdi.form.errors.fill_dates'));
    createPDIMutation.mutate(newPDI);
  };

  // Calculate some stats
  const activePDIs = pdis.filter((p: any) => p.status === PDIStatus.ATIVO).length;
  const pendingPDIs = pdis.filter((p: any) => p.status === PDIStatus.PENDENTE_APROVACAO).length;
  const completedPDIs = pdis.filter((p: any) => p.status === PDIStatus.CONCLUIDO).length;

  const pdiAcoes = acoes.filter((a: any) => metas.some((m: any) => pdis.some((p: any) => p.id === m.pdi_id && m.id === a.meta_id)));
  const completedAcoes = pdiAcoes.filter((a: any) => a.status === PDIAcaoStatus.CONCLUIDO).length;
  const progressoMedio = calculateProgress(completedAcoes, pdiAcoes.length);
  const acoesAtrasadas = getOverdueItemsCount(pdiAcoes);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-slate-800">{t('pdi.dashboard.title')}</h1>
        <Button onClick={() => setIsNewPDIOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          {t('pdi.dashboard.new_pdi')}
        </Button>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white/60 backdrop-blur-sm shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">{t('pdi.dashboard.stats.active')}</p>
              <h3 className="text-2xl font-bold text-slate-800">{activePDIs}</h3>
            </div>
          </CardContent>
        </Card>
        <Card 
          className={`bg-white/60 backdrop-blur-sm shadow-sm ${currentUserProfile?.tipo_usuario === TipoUsuario.GESTOR || currentUserProfile?.role === UserRole.ADMIN ? 'cursor-pointer hover:bg-orange-50 transition-colors' : ''}`}
          onClick={() => {
            if (currentUserProfile?.tipo_usuario === TipoUsuario.GESTOR || currentUserProfile?.role === UserRole.ADMIN) {
              navigate('/ferramentas/pdi/aprovacao');
            }
          }}
        >
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-orange-100 text-orange-600 rounded-lg">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">{t('pdi.dashboard.stats.pending')}</p>
              <h3 className="text-2xl font-bold text-slate-800">{pendingPDIs}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/60 backdrop-blur-sm shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-green-100 text-green-600 rounded-lg">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">{t('pdi.dashboard.stats.completed')}</p>
              <h3 className="text-2xl font-bold text-slate-800">{completedPDIs}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/60 backdrop-blur-sm shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">{t('pdi.dashboard.stats.avg_progress')}</p>
              <h3 className="text-2xl font-bold text-slate-800">{progressoMedio}%</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/60 backdrop-blur-sm shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-orange-100 text-orange-600 rounded-lg">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">{t('pdi.dashboard.stats.overdue_actions')}</p>
              <h3 className="text-2xl font-bold text-slate-800">{acoesAtrasadas}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de PDIs */}
      <Card className="bg-white/60 backdrop-blur-sm shadow-sm">
        <CardHeader>
          <CardTitle>{t('pdi.dashboard.list_title')}</CardTitle>
        </CardHeader>
        <CardContent>
          {pdis.length === 0 ? (
            <div className="text-center py-8 text-slate-500">{t('pdi.dashboard.no_pdis')}</div>
          ) : (
            <div className="space-y-4">
              {pdis.map((pdi: any) => {
                const isGestor = currentUserProfile?.role === UserRole.ADMIN || currentUserProfile?.tipo_usuario === TipoUsuario.GESTOR;
                const displayUserId = isGestor ? pdi.usuario_id : pdi.gestor_id;
                const displayName = getUserName(displayUserId);
                
                return (
                  <div 
                    key={pdi.id} 
                    className="flex items-center justify-between p-4 border border-slate-100 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/ferramentas/pdi/${pdi.id}`)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold uppercase">
                        {displayName.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800">{displayName}</h4>
                        <p className="text-sm text-slate-500">
                          {formatDateOrTimestamp(pdi.data_inicio)} até {formatDateOrTimestamp(pdi.data_fim)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant={
                        pdi.status === PDIStatus.ATIVO ? 'default' : 
                        pdi.status === PDIStatus.CONCLUIDO ? 'success' : 
                        pdi.status === PDIStatus.PENDENTE_APROVACAO ? 'warning' : 
                        pdi.status === PDIStatus.AJUSTE_SOLICITADO ? 'destructive' : 
                        'secondary'
                      }>
                        {t(`pdi.status.${pdi.status === PDIStatus.PENDENTE_APROVACAO ? 'pending_approval' : pdi.status === PDIStatus.AJUSTE_SOLICITADO ? 'adjustment_requested' : pdi.status === PDIStatus.CONCLUIDO ? 'completed' : pdi.status === PDIStatus.RASCUNHO ? 'draft' : pdi.status === PDIStatus.CANCELADO ? 'cancelled' : 'active'}`)}
                      </Badge>
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Novo PDI */}
      <Dialog open={isNewPDIOpen} onOpenChange={setIsNewPDIOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('pdi.form.create_title')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {(currentUserProfile?.role === UserRole.ADMIN || currentUserProfile?.tipo_usuario === TipoUsuario.GESTOR) ? (
              <div className="space-y-2">
                <Label>{t('pdi.form.collaborator')}</Label>
                <Select value={newPDI.usuario_id} onValueChange={(v) => setNewPDI({ ...newPDI, usuario_id: v })}>
                  <SelectTrigger><SelectValue placeholder={t('pdi.form.select_collaborator')} /></SelectTrigger>
                  <SelectContent>
                    {linkedUsers.map((u: any) => (
                      <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>{t('pdi.form.manager')}</Label>
                <Select value={newPDI.gestor_id} onValueChange={(v) => setNewPDI({ ...newPDI, gestor_id: v })}>
                  <SelectTrigger><SelectValue placeholder={t('pdi.form.select_manager')} /></SelectTrigger>
                  <SelectContent>
                    {linkedUsers.map((u: any) => (
                      <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('pdi.form.start_date')}</Label>
                <Input type="date" value={newPDI.data_inicio} onChange={e => setNewPDI({ ...newPDI, data_inicio: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{t('pdi.form.end_date')}</Label>
                <Input type="date" value={newPDI.data_fim} onChange={e => setNewPDI({ ...newPDI, data_fim: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewPDIOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleCreatePDI} disabled={createPDIMutation.isPending}>
              {createPDIMutation.isPending ? t('pdi.form.creating') : t('pdi.form.create_btn')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
