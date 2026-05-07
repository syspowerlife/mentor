import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/AuthContext';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Target, 
  Calendar, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  FileText,
  User,
  LogOut,
  ChevronRight,
  Mail
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth } from '@/lib/firebase';
import { format } from 'date-fns';
import { ptBR, enUS, es } from 'date-fns/locale';
import { MetaStatus } from '@/types/enums';
import { useMetas } from '@/hooks/useMetas';
import { useAgendamentos } from '@/hooks/useAgendamentos';
import { useMensagens } from '@/hooks/useMensagens';

const dateLocales: Record<string, any> = {
  pt: ptBR,
  en: enUS,
  es: es
};

export function PortalDashboard() {
  const { t, i18n } = useTranslation();
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const [cliente, setCliente] = useState<any>(null);
  const [isClientLoading, setIsClientLoading] = useState(true);

  const currentLocale = dateLocales[i18n.language.split('-')[0]] || ptBR;

  // 1. Find the linked client document
  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'clientes'), where('user_id', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        setCliente({ id: doc.id, ...doc.data() });
      } else {
        setCliente(null);
      }
      setIsClientLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'clientes');
      setIsClientLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // 2. Use hooks for data linked to the client
  const { metas, isLoading: isLoadingMetas } = useMetas(cliente?.id);
  const { agendamentos, isLoading: isLoadingAgendamentos } = useAgendamentos(cliente?.id);
  const { mensagens, isLoading: isLoadingMensagens } = useMensagens(cliente?.id);

  const isLoading = isClientLoading || isLoadingMetas || isLoadingAgendamentos || isLoadingMensagens;

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/portal/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="max-w-md text-center">
          <CardHeader>
            <CardTitle>{t('portal.dashboard.unlinked.title')}</CardTitle>
            <CardDescription>
              {t('portal.dashboard.unlinked.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleLogout} variant="outline" className="w-full">
              {t('portal.dashboard.unlinked.logout')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const metasConcluidas = metas.filter(m => m.status === MetaStatus.CONCLUIDO).length;
  const progressoMetas = metas.length > 0 ? (metasConcluidas / metas.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-slate-800">PowerLife <span className="text-blue-600">Portal</span></span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-slate-900">{userData?.name || user?.displayName}</p>
              <p className="text-xs text-slate-500">{t('portal.dashboard.mentee')}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} title={t('common.logout') || 'Sair'}>
              <LogOut className="w-5 h-5 text-slate-500" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-lg">
          <h1 className="text-3xl font-bold mb-2">{t('portal.dashboard.welcome', { name: cliente.nome })}</h1>
          <p className="text-blue-100 max-w-2xl">
            {t('portal.dashboard.welcome_desc')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Metas SMART */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-600" />
                    {t('portal.dashboard.smart_goals.title')}
                  </CardTitle>
                  <CardDescription>{t('portal.dashboard.smart_goals.description')}</CardDescription>
                </div>
                <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                  {metasConcluidas}/{metas.length} {t('portal.dashboard.smart_goals.completed')}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span>{t('portal.dashboard.smart_goals.general_progress')}</span>
                    <span>{Math.round(progressoMetas)}%</span>
                  </div>
                  <Progress value={progressoMetas} className="h-2" />
                </div>

                <div className="space-y-4">
                  {metas.length === 0 ? (
                    <p className="text-center py-8 text-slate-500 italic">{t('portal.dashboard.smart_goals.no_metas')}</p>
                  ) : (
                    metas.map((meta) => (
                      <div key={meta.id} className="flex items-start gap-4 p-4 rounded-xl border bg-white hover:border-blue-200 transition-colors">
                        <div className={`mt-1 p-2 rounded-full ${
                          meta.status === MetaStatus.CONCLUIDO ? 'bg-green-100 text-green-600' : 
                          meta.status === MetaStatus.EM_ANDAMENTO ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {meta.status === MetaStatus.CONCLUIDO ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-900">{meta.titulo}</h4>
                          <p className="text-sm text-slate-500 line-clamp-1">{meta.especifica}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                              {meta.status.replace('_', ' ')}
                            </Badge>
                            {meta.prazo && (
                              <span className="text-xs text-slate-400 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {meta.prazo}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Outras Ferramentas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card 
                className="hover:border-blue-300 transition-all cursor-pointer group"
                onClick={() => navigate('/portal/avaliacoes')}
              >
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="p-3 bg-purple-100 rounded-xl text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{t('portal.dashboard.evaluations.title')}</h4>
                    <p className="text-sm text-slate-500">{t('portal.dashboard.evaluations.description')}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 ml-auto text-slate-300 group-hover:text-blue-600" />
                </CardContent>
              </Card>
              <Card 
                className="hover:border-blue-300 transition-all cursor-pointer group"
                onClick={() => navigate('/portal/evolucao')}
              >
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="p-3 bg-orange-100 rounded-xl text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{t('portal.dashboard.evolution.title')}</h4>
                    <p className="text-sm text-slate-500">{t('portal.dashboard.evolution.description')}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 ml-auto text-slate-300 group-hover:text-blue-600" />
                </CardContent>
              </Card>
              <Card 
                className="hover:border-blue-300 transition-all cursor-pointer group"
                onClick={() => navigate('/portal/mensagens')}
              >
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors relative">
                    <Mail className="w-6 h-6" />
                    {mensagens.filter(m => m.sender_id !== user?.uid && !m.read).length > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[8px] text-white font-bold">
                        {mensagens.filter(m => m.sender_id !== user?.uid && !m.read).length}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900">{t('portal.dashboard.messages.title')}</h4>
                    <p className="text-sm text-slate-500">{t('portal.dashboard.messages.description')}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 ml-auto text-slate-300 group-hover:text-blue-600" />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Próximas Sessões */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  {t('portal.dashboard.sessions.next_sessions')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {agendamentos.length === 0 ? (
                  <p className="text-center py-4 text-slate-500 text-sm">{t('portal.dashboard.sessions.no_sessions')}</p>
                ) : (
                  agendamentos.map((agendamento) => (
                    <div key={agendamento.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-600 uppercase">
                          {format(new Date(agendamento.data_inicio), t('common.date_format_long'), { locale: currentLocale })}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {format(new Date(agendamento.data_inicio), "HH:mm")}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium text-slate-800">{agendamento.titulo}</p>
                      <div className="h-px bg-slate-100 w-full mt-4" />
                    </div>
                  ))
                )}
                <Button variant="outline" className="w-full text-xs" onClick={() => navigate('/portal/agendamentos')}>
                  {t('portal.dashboard.sessions.view_all')}
                </Button>
              </CardContent>
            </Card>

            {/* Mentor Info */}
            <Card className="bg-slate-900 text-white border-none">
              <CardContent className="p-6 text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-2">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-lg">{t('portal.dashboard.mentor.title')}</h4>
                  <p className="text-slate-400 text-sm">{t('portal.dashboard.mentor.description')}</p>
                </div>
                <Button 
                  className="w-full bg-white text-slate-900 hover:bg-slate-100 gap-2 font-bold"
                  onClick={() => navigate('/portal/mensagens')}
                >
                  <Mail className="w-4 h-4" />
                  {t('portal.dashboard.mentor.go_to_messages')}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
