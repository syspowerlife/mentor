import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationTriggerService } from './NotificationTriggerService';
import { getDocs, collection, query, where } from 'firebase/firestore';
import { sendNotification } from '@/lib/notifications';

// Mock dependencies
vi.mock('@/lib/notifications', () => ({
  sendNotification: vi.fn(),
}));

describe('NotificationTriggerService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not do anything if userId is missing', async () => {
    await NotificationTriggerService.checkScheduledNotifications('');
    expect(getDocs).not.toHaveBeenCalled();
  });

  it('should check appointment reminders and send notification if within 24h', async () => {
    const userId = 'user123';
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 12 * 60 * 60 * 1000); // 12h from now

    const mockDocs = [
      {
        id: 'apt1',
        data: () => ({
          titulo: 'Sessão de Coaching',
          data_inicio: tomorrow.toISOString(),
          status: 'pendente',
          created_by: userId
        })
      }
    ];

    (getDocs as any).mockResolvedValueOnce({ docs: mockDocs }); // For appointments
    (getDocs as any).mockResolvedValueOnce({ docs: [] }); // For goals
    (getDocs as any).mockResolvedValue({ empty: true }); // For sendIfNew check

    await NotificationTriggerService.checkScheduledNotifications(userId);

    expect(sendNotification).toHaveBeenCalledWith(expect.objectContaining({
      userId,
      title: 'Lembrete de Sessão',
      type: 'warning'
    }));
  });

  it('should not send notification if it was already sent (triggerId exists)', async () => {
    const userId = 'user123';
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 12 * 60 * 60 * 1000);

    const mockDocs = [
      {
        id: 'apt1',
        data: () => ({
          titulo: 'Sessão de Coaching',
          data_inicio: tomorrow.toISOString(),
          status: 'pendente',
          created_by: userId
        })
      }
    ];

    (getDocs as any).mockResolvedValueOnce({ docs: mockDocs }); // For appointments
    (getDocs as any).mockResolvedValueOnce({ docs: [] }); // For goals
    (getDocs as any).mockResolvedValue({ empty: false }); // TriggerId already exists

    await NotificationTriggerService.checkScheduledNotifications(userId);

    expect(sendNotification).not.toHaveBeenCalled();
  });
});
