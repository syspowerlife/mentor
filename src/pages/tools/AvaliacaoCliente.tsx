import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import { useSearchParams, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star, MessageSquareHeart, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { sendNotification } from '@/lib/notifications';
import { doc, getDoc } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';

export function AvaliacaoCliente() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const mentorId = searchParams.get('mentorId');
  const sessaoId = searchParams.get('sessaoId');

  const [nota, setNota] = useState(0);
  const [hoverNota, setHoverNota] = useState(0);
  const [pontosPositivos, setPontosPositivos] = useState('');
  const [pontosMelhoria, setPontosMelhoria] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);

  // Load existing evaluation if id is provided
  useEffect(() => {
    async function loadData() {
      if (!id) return;
      
      try {
        const docRef = doc(db, 'avaliacoes_sessoes', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setNota(data.nota || 0);
          setPontosPositivos(data.pontosPositivos || '');
          setPontosMelhoria(data.pontosMelhoria || '');
          setIsReadOnly(true);
        } else {
          toast.error(t('evaluation.errors.not_found'));
        }
      } catch (error: any) {
        toast.error(t('common.error_loading_data') + ': ' + error.message);
      }
    }
    
    loadData();
  }, [id]);

  const mutation = useMutation({
    mutationFn: async (avaliacao: any) => {
      if (!user) throw new Error(t('evaluation.errors.login_required'));
      if (!mentorId) throw new Error(t('evaluation.errors.missing_mentor'));

      const path = 'avaliacoes_sessoes';
      try {
        await addDoc(collection(db, path), {
          ...avaliacao,
          mentor_id: mentorId,
          profissional_id: mentorId, // Added for security rules
          cliente_id: user.uid,
          cliente_uid: user.uid, // Added for security rules
          sessao_id: sessaoId || null,
          data: Timestamp.now()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast.success(t('evaluation.success.toast'));

      if (mentorId && user) {
        sendNotification({
          userId: mentorId,
          title: t('evaluation.notifications.new_title'),
          message: t('evaluation.notifications.new_msg', { name: user.displayName || user.email }),
          type: 'success',
          link: `/Admin/Resultados?userId=${user.uid}`
        });
      }
    },
    onError: (error: any) => {
      toast.error(error.message || t('evaluation.errors.submit_error'));
    }
  });

  const handleSave = () => {
    if (nota === 0) {
      toast.error(t('evaluation.errors.select_rating'));
      return;
    }
    if (!mentorId) {
      toast.error(t('evaluation.errors.invalid_link'));
      return;
    }
    mutation.mutate({
      nota,
      pontosPositivos,
      pontosMelhoria
    });
  };

  if (!mentorId && !id) {
    return (
      <div className="p-6 md:p-8 max-w-2xl mx-auto text-center space-y-6 mt-12">
        <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-bold text-slate-800">{t('evaluation.invalid_link.title')}</h2>
        <p className="text-slate-600 text-lg">{t('evaluation.invalid_link.message')}</p>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="p-6 md:p-8 max-w-2xl mx-auto text-center space-y-6 mt-12">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
          <MessageSquareHeart className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-bold text-slate-800">{t('evaluation.success.title')}</h2>
        <p className="text-slate-600 text-lg">{t('evaluation.success.message')}</p>
        <Button onClick={() => {
          setIsSubmitted(false);
          setNota(0);
          setPontosPositivos('');
          setPontosMelhoria('');
        }} variant="outline" className="mt-4">
          {t('evaluation.form.new_btn')}
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          <MessageSquareHeart className="w-8 h-8 text-blue-600" />
          {t('evaluation.title')}
        </h1>
        <p className="text-slate-500 mt-1">{t('evaluation.description')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('evaluation.form.title')}</CardTitle>
          <CardDescription>{t('evaluation.form.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          
          <div className="space-y-4 text-center py-4">
            <Label className="text-lg font-medium">{t('evaluation.form.question_rating')}</Label>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setNota(star)}
                  onMouseEnter={() => setHoverNota(star)}
                  onMouseLeave={() => setHoverNota(0)}
                  className="p-2 transition-transform hover:scale-110 focus:outline-none"
                >
                  <Star 
                    className={`w-10 h-10 ${
                      star <= (hoverNota || nota) 
                        ? 'fill-yellow-400 text-yellow-400' 
                        : 'text-slate-300'
                    } transition-colors`} 
                  />
                </button>
              ))}
            </div>
            <div className="text-sm font-medium text-slate-500 h-5">
              {nota > 0 && t(`evaluation.form.rating_labels.${nota}`)}
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-base">{t('evaluation.form.valuable_label')}</Label>
            <Textarea 
              className="min-h-[100px]" 
              placeholder={t('evaluation.form.valuable_placeholder')}
              value={pontosPositivos}
              onChange={(e) => setPontosPositivos(e.target.value)}
              disabled={isReadOnly}
            />
          </div>

          <div className="space-y-3">
            <Label className="text-base">{t('evaluation.form.improvement_label')}</Label>
            <Textarea 
              className="min-h-[100px]" 
              placeholder={t('evaluation.form.improvement_placeholder')}
              value={pontosMelhoria}
              onChange={(e) => setPontosMelhoria(e.target.value)}
              disabled={isReadOnly}
            />
          </div>

          {!isReadOnly && (
            <Button 
              onClick={handleSave} 
              className="w-full bg-blue-600 hover:bg-blue-700 text-lg h-12"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? t('evaluation.form.submitting') : t('evaluation.form.submit_btn')}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
