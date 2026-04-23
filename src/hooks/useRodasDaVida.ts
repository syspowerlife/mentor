import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';

export function useRodasDaVida(clienteId?: string | null) {
  const { user } = useAuth();
  const [rodas, setRodas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) {
      setRodas([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const path = 'rodas_da_vida';
    let q = query(
      collection(db, path),
      where('created_by', '==', user.uid),
      orderBy('created_date', 'desc')
    );

    if (clienteId) {
      q = query(
        collection(db, path),
        where('created_by', '==', user.uid),
        where('cliente_id', '==', clienteId),
        orderBy('created_date', 'desc')
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRodas(data);
      setIsLoading(false);
      setError(null);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, path);
      setError(err instanceof Error ? err : new Error(String(err)));
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, clienteId]);

  return { rodas, isLoading, error };
}
