import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type ActivityType = 'feedback' | 'meta' | 'sessao' | 'anexo' | 'pdi';

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: Date;
  status?: string;
  metadata?: any;
}

export function useClientActivity(clientId: string | null) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clientId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Listeners state
    const collectionData: Record<string, Activity[]> = {
      metas: [],
      agendamentos: [],
      anexos: [],
      pdis: [],
      feedbacks: []
    };

    const updateAll = () => {
      const all = Object.values(collectionData).flat();
      all.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      setActivities(all.slice(0, 30)); // Limit to last 30 for performance
      setLoading(false);
    };

    // 1. Metas
    const metasQuery = query(
      collection(db, 'metas_smart'),
      where('cliente_id', '==', clientId),
      orderBy('created_at', 'desc'),
      limit(10)
    );

    const unsubMetas = onSnapshot(metasQuery, (snapshot) => {
      collectionData.metas = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          type: 'meta',
          title: data.titulo,
          description: `Meta SMART: ${data.status}`,
          timestamp: data.created_at?.toDate() || new Date(),
          status: data.status,
          metadata: data
        };
      });
      updateAll();
    });

    // 2. Agendamentos
    const sessionQuery = query(
      collection(db, 'agendamentos'),
      where('cliente_id', '==', clientId),
      orderBy('data_inicio', 'desc'),
      limit(10)
    );

    const unsubSessions = onSnapshot(sessionQuery, (snapshot) => {
      collectionData.agendamentos = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          type: 'sessao',
          title: data.titulo,
          description: `${data.tipo}: ${data.status}`,
          timestamp: data.created_at?.toDate() || (data.data_inicio ? new Date(data.data_inicio) : new Date()),
          status: data.status,
          metadata: data
        };
      });
      updateAll();
    });

    // 3. Anexos
    const anexosQuery = query(
      collection(db, `clientes/${clientId}/anexos`),
      orderBy('uploadedAt', 'desc'),
      limit(10)
    );

    const unsubAnexos = onSnapshot(anexosQuery, (snapshot) => {
      collectionData.anexos = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          type: 'anexo',
          title: data.name,
          description: `Documento enviado (${(data.size / 1024 / 1024).toFixed(2)} MB)`,
          timestamp: data.uploadedAt?.toDate() || new Date(),
          metadata: data
        };
      });
      updateAll();
    });

    // 4. PDIs
    const pdiQuery = query(
      collection(db, 'pdis'),
      where('cliente_id', '==', clientId),
      orderBy('created_at', 'desc'),
      limit(5)
    );

    const unsubPdis = onSnapshot(pdiQuery, (snapshot) => {
      collectionData.pdis = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          type: 'pdi',
          title: data.titulo || 'PDI',
          description: `Novo PDI: ${data.status}`,
          timestamp: data.created_at?.toDate() || new Date(),
          status: data.status,
          metadata: data
        };
      });
      updateAll();
    });

    return () => {
      unsubMetas();
      unsubSessions();
      unsubAnexos();
      unsubPdis();
    };
  }, [clientId]);

  return { activities, loading };
}
