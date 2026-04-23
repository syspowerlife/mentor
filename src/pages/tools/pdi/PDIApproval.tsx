import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc, 
  addDoc,
  Timestamp 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import { sendNotification } from '@/lib/notifications';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { CheckCircle, AlertCircle, MessageSquare, User, Calendar, ChevronRight, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { formatDateOrTimestamp } from '@/lib/utils';
import { useLinkedUsers } from '@/hooks/useLinkedUsers';

export function PDIApproval() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { linkedUsers, getUserName } = useLinkedUsers();
  const [pdis, setPdis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedPdi, setSelectedPdi] = useState<any>(null);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [actionType, setActionType] = useState<'approve' | 'request_adjustment' | null>(null);

  // Load PDIs pending approval where current user is gestor
  useEffect(() => {
    if (!currentUser) return;

    const path = 'pdis';
    const q = query(
      collection(db, path),
      where('gestor_id', '==', currentUser.uid),
      where('status', '==', 'pendente_aprovacao')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPdis(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleAction = async () => {
    if (!selectedPdi || !actionType) return;

    const newStatus = actionType === 'approve' ? 'ativo' : 'ajuste_solicitado';
    const feedbackMsg = actionType === 'approve' 
      ? t('pdi.approval.notifications.approve_feedback', { comment }) 
      : t('pdi.approval.notifications.adjust_feedback', { comment });

    try {
      // Update PDI status
      await updateDoc(doc(db, 'pdis', selectedPdi.id), {
        status: newStatus,
        updated_at: Timestamp.now()
      });

      // Add Feedback entry
      await addDoc(collection(db, 'pdi_feedbacks'), {
        pdi_id: selectedPdi.id,
        autor_id: currentUser?.uid,
        descricao: feedbackMsg,
        data: new Date().toISOString()
      });

      // Notify Collaborator
      await sendNotification({
        userId: selectedPdi.usuario_id,
        title: actionType === 'approve' ? t('pdi.approval.notifications.approve_title') : t('pdi.approval.notifications.adjust_title'),
        message: actionType === 'approve' 
          ? t('pdi.approval.notifications.approve_msg') 
          : t('pdi.approval.notifications.adjust_msg'),
        type: actionType === 'approve' ? 'success' : 'warning',
        link: `/ferramentas/pdi/${selectedPdi.id}`,
        triggerId: `pdi_decision_${selectedPdi.id}_${newStatus}`
      });

      toast.success(actionType === 'approve' ? t('pdi.approval.success.approved') : t('pdi.approval.success.adjustment_sent'));
      setIsApprovalModalOpen(false);
      setSelectedPdi(null);
      setComment('');
    } catch (error: any) {
      handleFirestoreError(error, OperationType.UPDATE, 'pdis');
      toast.error(error.message || t('pdi.approval.error'));
    }
  };

  if (loading) return <div className="p-8 text-center">{t('pdi.approval.loading')}</div>;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/ferramentas/pdi')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-slate-800">{t('pdi.approval.title')}</h1>
          <p className="text-slate-500">{t('pdi.approval.subtitle')}</p>
        </div>
      </div>

      {pdis.length === 0 ? (
        <Card className="bg-white/60 backdrop-blur-sm shadow-sm border-dashed border-2">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700">{t('pdi.approval.empty.title')}</h3>
            <p className="text-slate-500">{t('pdi.approval.empty.desc')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {pdis.map((pdi) => {
            const displayName = getUserName(pdi.usuario_id);
            return (
              <Card key={pdi.id} className="bg-white/60 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg uppercase">
                        {displayName.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-lg">{displayName}</h4>
                        <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                          <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {formatDateOrTimestamp(pdi.data_inicio)} - {formatDateOrTimestamp(pdi.data_fim)}</span>
                          <Badge variant="warning">{t('pdi.approval.card.pending')}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                      <Button variant="outline" size="sm" onClick={() => navigate(`/ferramentas/pdi/${pdi.id}`)}>
                        {t('pdi.approval.card.view_details')}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-orange-600 border-orange-200 hover:bg-orange-50"
                        onClick={() => {
                          setSelectedPdi(pdi);
                          setActionType('request_adjustment');
                          setIsApprovalModalOpen(true);
                        }}
                      >
                        {t('pdi.approval.card.request_adjustment')}
                      </Button>
                      <Button 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => {
                          setSelectedPdi(pdi);
                          setActionType('approve');
                          setIsApprovalModalOpen(true);
                        }}
                      >
                        {t('pdi.approval.card.approve')}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Approval/Adjustment Modal */}
      <Dialog open={isApprovalModalOpen} onOpenChange={setIsApprovalModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? t('pdi.approval.modal.approve_title') : t('pdi.approval.modal.adjust_title')}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve' 
                ? t('pdi.approval.modal.approve_desc') 
                : t('pdi.approval.modal.adjust_desc')}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea 
              placeholder={t('pdi.approval.modal.comment_placeholder')} 
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[120px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApprovalModalOpen(false)}>{t('common.cancel')}</Button>
            <Button 
              className={actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'}
              onClick={handleAction}
            >
              {actionType === 'approve' ? t('pdi.approval.modal.confirm_approve') : t('pdi.approval.modal.confirm_adjust')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
