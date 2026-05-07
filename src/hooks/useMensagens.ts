import { useState, useEffect } from 'react';
import { collection, query, where, or, and, orderBy, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';

export function useMensagens(clienteId?: string | null) {
  const { user } = useAuth();
  const [mensagens, setMensagens] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) {
      setMensagens([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const path = 'mensagens';
    
    // Default query for the current user
    let q = query(
      collection(db, path),
      or(
        where('mentor_id', '==', user.uid),
        where('cliente_uid', '==', user.uid),
        where('sender_id', '==', user.uid)
      ),
      orderBy('created_at', 'asc')
    );

    // If a specific client is targeted (for professionals)
    if (clienteId) {
      q = query(
        collection(db, path),
        and(
          or(where('cliente_id', '==', clienteId), where('cliente_uid', '==', clienteId)),
          or(
            where('mentor_id', '==', user.uid),
            where('cliente_uid', '==', user.uid),
            where('sender_id', '==', user.uid)
          )
        ),
        orderBy('created_at', 'asc')
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMensagens(data);
      setIsLoading(false);
      setError(null);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, path);
      setError(err instanceof Error ? err : new Error(String(err)));
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, clienteId]);

  return { mensagens, isLoading, error };
}
