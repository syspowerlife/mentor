import { useState, useEffect } from 'react';
import { collection, query, where, or, and, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';

export function useSwot(clienteId?: string | null) {
  const { user } = useAuth();
  const [swots, setSwots] = useState<any[]>([]);
  const [latestSwot, setLatestSwot] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) {
      setSwots([]);
      setLatestSwot(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const path = 'analises_swot';
    let q = query(
      collection(db, path),
      or(
        where('created_by', '==', user.uid),
        where('profissional_id', '==', user.uid),
        where('cliente_uid', '==', user.uid),
        where('cliente_id', '==', user.uid),
        where('user_id', '==', user.uid)
      ),
      orderBy('created_at', 'desc')
    );

    if (clienteId) {
      q = query(
        collection(db, path),
        and(
          or(where('cliente_id', '==', clienteId), where('cliente_uid', '==', clienteId)),
          or(
            where('created_by', '==', user.uid),
            where('profissional_id', '==', user.uid),
            where('cliente_uid', '==', user.uid),
            where('cliente_id', '==', user.uid),
            where('user_id', '==', user.uid)
          )
        ),
        orderBy('created_at', 'desc')
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSwots(data);
      setLatestSwot(data.length > 0 ? data[0] : null);
      setIsLoading(false);
      setError(null);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, path);
      setError(err instanceof Error ? err : new Error(String(err)));
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, clienteId]);

  return { swots, latestSwot, isLoading, error };
}
