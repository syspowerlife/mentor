import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  Calendar, 
  Loader2,
  Clock,
  MapPin,
  Video
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR, enUS, es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';

export function PortalAgendamentos() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [agendamentos, setAgendamentos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const dateLocale = i18n.language === 'pt' ? ptBR : i18n.language === 'es' ? es : enUS;

  useEffect(() => {
    if (!user) return;

    const fetchAgendamentos = async () => {
      try {
        // 1. Get Cliente ID
        const qCliente = query(collection(db, 'clientes'), where('user_id', '==', user.uid));
        const clientSnap = await getDocs(qCliente);
        if (clientSnap.empty) {
          setIsLoading(false);
          return;
        }
        const clienteId = clientSnap.docs[0].id;

        // 2. Get Agendamentos
        const qAgendamentos = query(
          collection(db, 'agendamentos'),
          where('cliente_id', '==', clienteId),
          where('cliente_uid', '==', user.uid),
          orderBy('data_inicio', 'desc')
        );
        const snapshot = await getDocs(qAgendamentos);
        setAgendamentos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setIsLoading(false);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'portal_agendamentos');
        setIsLoading(false);
      }
    };

    fetchAgendamentos();
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  const proximas = agendamentos.filter(a => new Date(a.data_inicio) >= new Date()).reverse();
  const passadas = agendamentos.filter(a => new Date(a.data_inicio) < new Date());

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/portal/dashboard')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <span className="font-bold text-xl text-slate-800">{t('portal.sessions.title')}</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Próximas Sessões */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            {t('portal.sessions.next_sessions')}
          </h2>
          {proximas.length === 0 ? (
            <Card className="bg-white/50 border-dashed">
              <CardContent className="p-8 text-center text-slate-500">
                {t('portal.sessions.no_sessions_future')}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {proximas.map((agendamento) => (
                <AgendamentoCard key={agendamento.id} agendamento={agendamento} isFuture dateLocale={dateLocale} />
              ))}
            </div>
          )}
        </section>

        {/* Sessões Passadas */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-500" />
            {t('portal.sessions.history')}
          </h2>
          {passadas.length === 0 ? (
            <p className="text-center py-8 text-slate-400 italic">{t('portal.sessions.no_sessions_history')}</p>
          ) : (
            <div className="grid gap-4">
              {passadas.map((agendamento) => (
                <AgendamentoCard key={agendamento.id} agendamento={agendamento} dateLocale={dateLocale} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function AgendamentoCard({ agendamento, isFuture, dateLocale }: { agendamento: any, isFuture?: boolean, dateLocale: any }) {
  const data = new Date(agendamento.data_inicio);
  const { t } = useTranslation();
  
  return (
    <Card className={`${isFuture ? 'border-blue-200 bg-blue-50/30' : 'bg-white'}`}>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl ${isFuture ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-slate-900">
                  {format(data, t('common.date_format_long'), { locale: dateLocale })}
                </span>
                {isFuture && <Badge className="bg-blue-600">{t('portal.sessions.confirmed')}</Badge>}
              </div>
              <p className="text-sm text-slate-600 font-medium">{agendamento.titulo}</p>
              <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {format(data, "HH:mm")} - {format(new Date(agendamento.data_fim), "HH:mm")}
                </span>
                {agendamento.local && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {agendamento.local}
                  </span>
                )}
                {agendamento.link_reuniao && (
                  <a 
                    href={agendamento.link_reuniao} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-600 hover:underline"
                  >
                    <Video className="w-3.5 h-3.5" />
                    {t('portal.sessions.meeting_link')}
                  </a>
                )}
              </div>
            </div>
          </div>
          {isFuture && agendamento.link_reuniao && (
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => window.open(agendamento.link_reuniao, '_blank')}>
              {t('portal.sessions.join_session')}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
