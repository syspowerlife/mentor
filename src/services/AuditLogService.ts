import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';

export type LogAction = 
  | 'USER_CREATED' 
  | 'USER_DELETED' 
  | 'USER_UPDATED' 
  | 'USER_STATUS_TOGGLE' 
  | 'PLAN_CREATED' 
  | 'PLAN_UPDATED' 
  | 'PLAN_DELETED' 
  | 'LOGIN' 
  | 'SETTINGS_UPDATED'
  | 'CALENDAR_CONNECTED'
  | 'CALENDAR_DISCONNECTED';

export interface AuditLogData {
  action: LogAction;
  details: string;
  metadata?: any;
}

export class AuditLogService {
  static async logAction(data: AuditLogData) {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const logsRef = collection(db, 'system_logs');
      await addDoc(logsRef, {
        userId: user.uid,
        userName: user.displayName || 'Admin',
        userEmail: user.email,
        action: data.action,
        details: data.details,
        metadata: data.metadata || {},
        timestamp: Timestamp.now()
      });
    } catch (error) {
      console.error('Failed to write audit log:', error);
    }
  }
}
