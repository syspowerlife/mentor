import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';

export function useLinkedUsers() {
  const { user, userData } = useAuth();
  const [linkedUsers, setLinkedUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLinkedUsers([]);
      setIsLoading(false);
      return;
    }

    const isGestor = userData?.role === 'admin' || userData?.tipo_usuario === 'Gestor';
    
    // If Admin, they could potentially see everyone, but for dropdowns, we just fetch all clientes
    // Actually, to keep it secure, we fetch `clientes` where current user is related
    const q = isGestor 
      ? query(collection(db, 'clientes'), where('profissional_id', '==', user.uid))
      : query(collection(db, 'clientes'), where('user_id', '==', user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersList = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: isGestor ? (data.user_id || doc.id) : data.profissional_id, // If gestor, map client's user_id
          name: data.nome || 'Usuário',
          email: data.email,
          ...data
        };
      });
      setLinkedUsers(usersList);
      setIsLoading(false);
    }, (error) => {
      console.error('Error fetching linked users:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, userData]);

  const getUserName = (userId: string) => {
    if (userId === user?.uid) return userData?.name || 'Você';
    const found = linkedUsers.find(u => u.id === userId || u.user_id === userId || u.profissional_id === userId);
    return found ? found.name : 'Usuário';
  };

  return { linkedUsers, getUserName, isLoading };
}
