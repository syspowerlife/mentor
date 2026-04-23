import { collection, query, where, getDocs, Timestamp, addDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { sendNotification } from '@/lib/notifications';

export class NotificationTriggerService {
  /**
   * Verifica e gera notificações para agendamentos próximos (24h) e metas próximas (48h)
   */
  static async checkScheduledNotifications(userId: string) {
    if (!userId) return;

    try {
      // Fetch user preferences
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      const preferences = userSnap.exists() ? userSnap.data()?.notification_preferences : null;

      const tasks = [];
      
      // Default to true if preferences don't exist yet
      if (!preferences || preferences.sessions !== false) {
        tasks.push(this.checkAppointmentReminders(userId));
      }

      if (!preferences || preferences.goals !== false) {
        tasks.push(this.checkGoalDeadlines(userId));
      }

      if (tasks.length > 0) {
        await Promise.all(tasks);
      }
    } catch (error) {
      console.error('Error checking notifications:', error);
    }
  }

  /**
   * Inicia a verificação periódica (a cada 1 hora)
   */
  static startBackgroundCheck(userId: string) {
    if (!userId) return;
    
    // Executa imediatamente
    this.checkScheduledNotifications(userId);
    
    // Agenda para cada 1 hora
    return setInterval(() => {
      this.checkScheduledNotifications(userId);
    }, 60 * 60 * 1000);
  }

  private static async checkAppointmentReminders(userId: string) {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const agendamentosRef = collection(db, 'agendamentos');
    const q = query(
      agendamentosRef,
      where('created_by', '==', userId),
      where('status', '==', 'pendente')
    );

    const snapshot = await getDocs(q);
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const dataInicio = new Date(data.data_inicio);

      // Se o agendamento for nas próximas 24h e ainda não passou
      if (dataInicio > now && dataInicio <= tomorrow) {
        const triggerId = `reminder_24h_${doc.id}`;
        await this.sendIfNew(userId, triggerId, {
          title: 'Lembrete de Sessão',
          message: `Você tem uma sessão "${data.titulo}" agendada para amanhã às ${dataInicio.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
          type: 'warning',
          link: '/Agendamentos'
        });
      }
    }
  }

  private static async checkGoalDeadlines(userId: string) {
    const now = new Date();
    const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    const metasRef = collection(db, 'metas_smart');
    const q = query(
      metasRef,
      where('created_by', '==', userId)
    );

    const snapshot = await getDocs(q);
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      if (data.status === 'concluido' || !data.prazo) continue;

      const prazo = new Date(data.prazo);

      // Se o prazo for nas próximas 48h e ainda não passou
      if (prazo > now && prazo <= in48h) {
        const triggerId = `deadline_48h_${doc.id}`;
        await this.sendIfNew(userId, triggerId, {
          title: 'Prazo de Meta Próximo',
          message: `A meta "${data.titulo}" vence em menos de 48 horas (${prazo.toLocaleDateString()}).`,
          type: 'warning',
          link: '/MetaSmart'
        });
      }
    }
  }

  private static async sendIfNew(userId: string, triggerId: string, notification: any) {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      where('triggerId', '==', triggerId)
    );

    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      await sendNotification({
        userId,
        triggerId,
        ...notification
      });
    }
  }
}
