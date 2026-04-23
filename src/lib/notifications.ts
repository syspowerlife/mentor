import { collection, addDoc, Timestamp, doc, updateDoc, writeBatch, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface NotificationData {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
  triggerId?: string;
}

export async function sendNotification(data: NotificationData) {
  try {
    // Prevent duplicates if triggerId is provided
    if (data.triggerId) {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', data.userId),
        where('triggerId', '==', data.triggerId)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        return; // Notification already exists
      }
    }

    const notificationsRef = collection(db, 'notifications');
    await addDoc(notificationsRef, {
      ...data,
      read: false,
      createdAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}

export async function markNotificationAsRead(notificationId: string) {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      read: true
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
}

export async function markAllNotificationsAsRead(userId: string) {
  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(notificationsRef, where('userId', '==', userId), where('read', '==', false));
    const querySnapshot = await getDocs(q);
    
    const batch = writeBatch(db);
    querySnapshot.forEach((doc) => {
      batch.update(doc.ref, { read: true });
    });
    
    await batch.commit();
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
  }
}
