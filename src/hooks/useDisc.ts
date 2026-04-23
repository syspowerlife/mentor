import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';

export function useDisc(clienteId?: string | null) {
  const { user } = useAuth();
  const [discs, setDiscs] = useState<any[]>([]);
  const [latestDisc, setLatestDisc] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) {
      setDiscs([]);
      setLatestDisc(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const path = 'perfis_disc';
    let q = query(
      collection(db, path),
      where('created_by', '==', user.uid),
      orderBy('created_at', 'desc')
    );

    if (clienteId) {
      q = query(
        collection(db, path),
        where('created_by', '==', user.uid),
        where('cliente_id', '==', clienteId),
        orderBy('created_at', 'desc')
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDiscs(data);
      setLatestDisc(data.length > 0 ? data[0] : null);
      setIsLoading(false);
      setError(null);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, path);
      setError(err instanceof Error ? err : new Error(String(err)));
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, clienteId]);

  return { discs, latestDisc, isLoading, error };
}
