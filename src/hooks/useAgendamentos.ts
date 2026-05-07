import { useState, useEffect } from 'react';
import { collection, query, where, or, and, orderBy, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';

export function useAgendamentos(clienteId?: string | null) {
  const { user } = useAuth();
  const [agendamentos, setAgendamentos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) {
      setAgendamentos([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const path = 'agendamentos';
    let q = query(
      collection(db, path),
      or(
        where('created_by', '==', user.uid),
        where('profissional_id', '==', user.uid),
        where('cliente_uid', '==', user.uid),
        where('cliente_id', '==', user.uid),
        where('user_id', '==', user.uid)
      ),
      orderBy('data_inicio', 'asc')
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
        orderBy('data_inicio', 'asc')
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAgendamentos(data);
      setIsLoading(false);
      setError(null);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, path);
      setError(err instanceof Error ? err : new Error(String(err)));
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, clienteId]);

  return { agendamentos, isLoading, error };
}
