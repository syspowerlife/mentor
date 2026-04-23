import { useEffect } from 'react';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import { sendNotification } from '@/lib/notifications';
import { differenceInHours, parseISO, isAfter, startOfToday } from 'date-fns';

export function useDeadlineChecker() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // 1. Monitor Agendamentos (24h before)
    const unsubAgendamentos = onSnapshot(
      query(
        collection(db, 'agendamentos'),
        where('created_by', '==', user.uid),
        where('status', 'in', ['pendente', 'em_andamento'])
      ),
      (snapshot) => {
        const now = new Date();
        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          const dataInicio = data.data_inicio instanceof Timestamp ? data.data_inicio.toDate() : parseISO(data.data_inicio);
          
          const hoursDiff = differenceInHours(dataInicio, now);
          
          // Trigger if between 0 and 24 hours from now
          if (hoursDiff > 0 && hoursDiff <= 24 && data.tipo === 'sessao') {
            sendNotification({
              userId: user.uid,
              title: 'Lembrete de Sessão',
              message: `Você tem uma sessão "${data.titulo}" agendada para amanhã às ${dataInicio.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
              type: 'warning',
              triggerId: `apt_24h_${doc.id}`
            });
          }
        });
      }
    );

    // 2. Monitor Metas SMART (48h before deadline)
    const unsubMetas = onSnapshot(
      query(
        collection(db, 'metas_smart'),
        where('created_by', '==', user.uid)
      ),
      (snapshot) => {
        const now = new Date();
        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          if (data.status === 'concluida') return;

          const prazo = data.prazo instanceof Timestamp ? data.prazo.toDate() : parseISO(data.prazo);
          const hoursDiff = differenceInHours(prazo, now);

          // Trigger if between 0 and 48 hours from now
          if (hoursDiff > 0 && hoursDiff <= 48) {
            sendNotification({
              userId: user.uid,
              title: 'Prazo de Meta Próximo',
              message: `A meta "${data.titulo}" vence em menos de 48 horas. Como está o progresso?`,
              type: 'warning',
              triggerId: `goal_48h_${doc.id}`
            });
          }
        });
      }
    );

    // 3. Monitor Ações de PDI (24h before deadline)
    const unsubAcoes = onSnapshot(
      query(
        collection(db, 'pdi_acoes'),
        where('status', 'in', ['pendente', 'em_andamento'])
      ),
      (snapshot) => {
        const now = new Date();
        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          // Note: pdi_acoes might not have created_by directly, but we can check if it belongs to a PDI the user has access to.
          // For simplicity in this client-side trigger, we assume the query returns what the user can see.
          // In a real app, we'd filter by user ID if available.
          
          const prazo = data.prazo instanceof Timestamp ? data.prazo.toDate() : parseISO(data.prazo);
          const hoursDiff = differenceInHours(prazo, now);

          if (hoursDiff > 0 && hoursDiff <= 24) {
            sendNotification({
              userId: user.uid,
              title: 'Ação de PDI Pendente',
              message: `A ação "${data.descricao}" do seu PDI vence amanhã.`,
              type: 'warning',
              triggerId: `pdi_24h_${doc.id}`
            });
          }
        });
      }
    );

    return () => {
      unsubAgendamentos();
      unsubMetas();
      unsubAcoes();
    };
  }, [user]);
}
