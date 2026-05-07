import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs,
  orderBy, 
  onSnapshot, 
  Timestamp,
  doc,
  getDoc
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Smile, Meh, Frown, BookOpen, Calendar as CalendarIcon, Lock, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { formatDateOrTimestamp, safeFormat } from '@/lib/utils';
import { SentimentoType } from '@/types/enums';
import { useTranslation } from 'react-i18next';

export function DiarioReflexao() {
  const { user, userData } = useAuth();
  const { t } = useTranslation();
  const { id } = useParams();

  const sentimentos = [
    { id: SentimentoType.FELIZ, icon: <Smile className="w-6 h-6" />, label: t('diary.sentiments.happy'), color: 'text-green-500 bg-green-50 hover:bg-green-100 border-green-200' },
    { id: SentimentoType.NEUTRO, icon: <Meh className="w-6 h-6" />, label: t('diary.sentiments.neutral'), color: 'text-yellow-500 bg-yellow-50 hover:bg-yellow-100 border-yellow-200' },
    { id: SentimentoType.TRISTE, icon: <Frown className="w-6 h-6" />, label: t('diary.sentiments.sad'), color: 'text-red-500 bg-red-50 hover:bg-red-100 border-red-200' },
  ];
  const [conteudo, setConteudo] = useState('');
  const [sentimento, setSentimento] = useState<string>(SentimentoType.FELIZ);
  const [isPrivate, setIsPrivate] = useState(true);
  const [reflexoes, setReflexoes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [clienteData, setClienteData] = useState<any>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);

  // Load existing diary entry if id is provided
  useEffect(() => {
    async function loadData() {
      if (!id) return;
      
      try {
        const docRef = doc(db, 'diarios_reflexao', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setConteudo(data.conteudo || '');
          setSentimento(data.sentimento || SentimentoType.FELIZ);
          setIsPrivate(data.is_private ?? true);
          setIsReadOnly(true);
        } else {
          toast.error(t('diary.errors.not_found'));
        }
      } catch (error: any) {
        toast.error(t('common.error_loading_data') + ': ' + error.message);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, [id]);

  // Fetch client data if the user is a client (only if not viewing specific ID)
  useEffect(() => {
    if (!user || userData?.role !== 'client' || id) return;

    const fetchCliente = async () => {
      try {
        const q = query(collection(db, 'clientes'), where('user_id', '==', user.uid));
        const snap = await getDocs(q);
        if (!snap.empty) {
          setClienteData({ id: snap.docs[0].id, ...snap.docs[0].data() });
        }
      } catch (error) {
        console.error("Error fetching client data:", error);
      }
    };

    fetchCliente();
  }, [user, userData]);

  // Load entries in real-time (only if not viewing specific ID)
  useEffect(() => {
    if (!user || id) return;

    const path = 'diarios_reflexao';
    // If mentor/admin, they might be viewing the list which can be mixed.
    // However, usually this page is personal. 
    // If it's a mentor viewing a client, they'd use AcompanhamentoProgresso.
    // For this page, we show documents created by the user.
    const q = query(
      collection(db, path),
      where('created_by', '==', user.uid),
      orderBy('data', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setReflexoes(data);
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const mutation = useMutation({
    mutationFn: async (novaReflexao: any) => {
      const path = 'diarios_reflexao';
      try {
        await addDoc(collection(db, path), {
          ...novaReflexao,
          created_by: user?.uid,
          cliente_id: clienteData?.id || null,
          profissional_id: clienteData?.profissional_id || (userData?.role === 'user' ? user?.uid : null),
          created_at: Timestamp.now()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, path);
      }
    },
    onSuccess: () => {
      setConteudo('');
      setSentimento(SentimentoType.FELIZ);
      setIsPrivate(true);
      toast.success(t('diary.success.toast'));
    },
    onError: (error: any) => toast.error(error.message || t('diary.errors.save_error'))
  });

  const handleSave = () => {
    if (!conteudo.trim()) return toast.error(t('diary.errors.empty_content'));
    mutation.mutate({
      conteudo,
      sentimento,
      is_private: isPrivate,
      data: new Date().toISOString()
    });
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-blue-600" />
          {t('diary.title')}
        </h1>
        <p className="text-slate-500 mt-1">{t('diary.description')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('diary.new_entry.title')}</CardTitle>
          <CardDescription>{t('diary.new_entry.question')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-4">
            {sentimentos.map((s) => (
              <button
                key={s.id}
                onClick={() => setSentimento(s.id)}
                disabled={isReadOnly}
                className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${
                  sentimento === s.id ? s.color + ' border-current scale-105 shadow-sm' : 'border-slate-100 text-slate-400 hover:bg-slate-50'
                } ${isReadOnly ? 'cursor-default' : ''}`}
              >
                {s.icon}
                <span className="mt-2 text-sm font-medium">{s.label}</span>
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <Label>{t('diary.new_entry.mind_label')}</Label>
            <Textarea 
              className="min-h-[150px] resize-y" 
              placeholder={t('diary.new_entry.mind_placeholder')}
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
              disabled={isReadOnly}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
            <div className="space-y-0.5">
              <Label className="text-sm font-semibold flex items-center gap-2">
                {isPrivate ? <Lock className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                {t('diary.new_entry.privacy.label')}
              </Label>
              <p className="text-xs text-slate-500">
                {isPrivate ? t('diary.new_entry.privacy.private_desc') : t('diary.new_entry.privacy.shared_desc')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-600">{isPrivate ? t('diary.new_entry.privacy.private') : t('diary.new_entry.privacy.shared')}</span>
              <Switch checked={!isPrivate} onCheckedChange={(val) => setIsPrivate(!val)} disabled={isReadOnly} />
            </div>
          </div>

          {!isReadOnly && (
            <Button 
              onClick={handleSave} 
              className="w-full md:w-auto bg-blue-600 hover:bg-blue-700"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? t('diary.new_entry.saving') : t('diary.new_entry.save_btn')}
            </Button>
          )}
        </CardContent>
      </Card>

      {!isReadOnly && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-800">{t('diary.history.title')}</h2>
          
          {isLoading ? (
            <div className="text-center py-8 text-slate-500">{t('diary.history.loading')}</div>
          ) : reflexoes.length > 0 ? (
            <div className="space-y-4">
              {/* Ordenando do mais recente para o mais antigo */}
              {[...reflexoes].reverse().map((ref: any) => {
                const sent = sentimentos.find(s => s.id === ref.sentimento) || sentimentos[0];
                return (
                  <Card key={ref.id} className="overflow-hidden">
                    <div className="flex flex-col md:flex-row">
                      <div className={`p-4 md:w-24 flex md:flex-col items-center justify-center gap-2 border-b md:border-b-0 md:border-r border-slate-100 ${sent.color.split(' ')[1]}`}>
                        {sent.icon}
                        <span className="text-xs font-medium uppercase tracking-wider">{sent.label}</span>
                      </div>
                      <div className="p-4 flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center text-xs text-slate-400">
                            <CalendarIcon className="w-3 h-3 mr-1" />
                            {safeFormat(ref.data, 'dd/MM/yyyy HH:mm')}
                          </div>
                          <div className="flex items-center gap-1 text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                            {ref.is_private ? (
                              <><Lock className="w-3 h-3" /> {t('diary.new_entry.privacy.private')}</>
                            ) : (
                              <><Globe className="w-3 h-3 text-blue-400" /> {t('diary.new_entry.privacy.shared')}</>
                            )}
                          </div>
                        </div>
                        <p className="text-slate-700 whitespace-pre-wrap">{ref.conteudo}</p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
              <p className="text-slate-500">{t('diary.history.empty')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
