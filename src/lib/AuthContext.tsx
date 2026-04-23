import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './firebase';
import { NotificationTriggerService } from '@/services/NotificationTriggerService';
import { AuditLogService } from '@/services/AuditLogService';

interface AuthContextType {
  user: User | null;
  userData: any | null;
  loading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  isAdmin: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const loggedRef = React.useRef<string | null>(null);

  useEffect(() => {
    let unsubscribeDoc: (() => void) | null = null;
    let notificationInterval: any = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      // Priorizar a manutenção do estado de carregamento enquanto buscamos dados do Firestore
      if (currentUser) {
        setUser(currentUser);
        setLoading(true);
        
        // Iniciar verificação periódica de gatilhos de notificações
        notificationInterval = NotificationTriggerService.startBackgroundCheck(currentUser.uid);
        
        if (unsubscribeDoc) {
          unsubscribeDoc();
        }

        unsubscribeDoc = onSnapshot(doc(db, 'users', currentUser.uid), (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserData(data);
            
            // Log admin login once per session UID
            if (data.role === 'admin' && loggedRef.current !== currentUser.uid) {
              loggedRef.current = currentUser.uid;
              AuditLogService.logAction({
                action: 'LOGIN',
                details: `Administrador ${data.name || currentUser.email} acessou o sistema.`,
                metadata: { email: currentUser.email }
              });
            }
          } else {
            console.warn("User document not found in Firestore for UID:", currentUser.uid);
            setUserData(null);
          }
          setLoading(false);
        }, (error) => {
          console.error("Error listening to user doc:", error);
          // Try to get more info if it's a Firestore error
          if (error.code === 'permission-denied') {
            console.error("Permission denied details:", {
              uid: currentUser.uid,
              email: currentUser.email,
              path: `users/${currentUser.uid}`
            });
          }
          setLoading(false);
        });
      } else {
        setUser(null);
        setUserData(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
      if (notificationInterval) clearInterval(notificationInterval);
    };
  }, []);

  const isAdmin = userData?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, userData, loading, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
