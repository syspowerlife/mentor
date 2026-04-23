import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';

export function useClients() {
  const { user } = useAuth();
  const [clientes, setClientes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) {
      setClientes([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const path = 'clientes';
    const q = query(
      collection(db, path),
      where('profissional_id', '==', user.uid),
      orderBy('data_inicio', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const clientsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        data_inicio: doc.data().data_inicio instanceof Timestamp 
          ? doc.data().data_inicio.toDate().toISOString() 
          : doc.data().data_inicio
      }));
      setClientes(clientsList);
      setIsLoading(false);
      setError(null);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, path);
      setError(err instanceof Error ? err : new Error(String(err)));
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return { clientes, isLoading, error };
}
