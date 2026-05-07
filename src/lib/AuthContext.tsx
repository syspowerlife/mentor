import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const loggedRef = useRef<string | null>(null);

  useEffect(() => {
    let unsubscribeDoc: (() => void) | null = null;
    let unsubscribeAdmin: (() => void) | null = null;
    let notificationInterval: any = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setLoading(true);
        
        notificationInterval = NotificationTriggerService.startBackgroundCheck(currentUser.uid);
        
        if (unsubscribeDoc) unsubscribeDoc();
        if (unsubscribeAdmin) unsubscribeAdmin();

        // Check if user is admin in 'admins' collection
        let adminExists = false;
        let roleIsAdmin = false;

        const updateIsAdmin = (ae: boolean, ria: boolean) => {
          setIsAdmin(ae || ria || currentUser.email === 'sys.powerlife@gmail.com');
        };

        unsubscribeAdmin = onSnapshot(doc(db, 'admins', currentUser.uid), (adminSnap) => {
          adminExists = adminSnap.exists();
          updateIsAdmin(adminExists, roleIsAdmin);
        }, (error) => {
          console.error("Error listening to admin doc:", error);
          // If we can't read the admin doc, we assume they're not in the 'admins' collection
          adminExists = false;
          updateIsAdmin(adminExists, roleIsAdmin);
        });

        unsubscribeDoc = onSnapshot(doc(db, 'users', currentUser.uid), (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserData(data);
            roleIsAdmin = data.role === 'admin';
            updateIsAdmin(adminExists, roleIsAdmin);
            
            // Log admin login once per session UID
            if (roleIsAdmin && loggedRef.current !== currentUser.uid) {
              loggedRef.current = currentUser.uid;
              AuditLogService.logAction({
                action: 'LOGIN',
                details: `Administrador ${data.name || currentUser.email} acessou o sistema.`,
                metadata: { email: currentUser.email }
              });
            }
          } else {
            setUserData(null);
            roleIsAdmin = false;
            updateIsAdmin(adminExists, roleIsAdmin);
          }
          setLoading(false);
        }, (error) => {
          console.error("Error listening to user doc:", error);
          // Don't swallow the error, but allow the app to proceed with null userData
          setUserData(null);
          roleIsAdmin = false;
          updateIsAdmin(adminExists, roleIsAdmin);
          setLoading(false);
        });
      } else {
        setUser(null);
        setUserData(null);
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
      if (unsubscribeAdmin) unsubscribeAdmin();
      if (notificationInterval) clearInterval(notificationInterval);
    };
  }, []);

  // Alternative: Derive isAdmin from multiple state pieces if needed, 
  // but the listeners above should handle it by setting the state.
  // One small issue is that if one sets true and the other sets false, order matters.
  // Better to have one state "sourceOfTruth" or just derived.

  return (
    <AuthContext.Provider value={{ user, userData, loading, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
