import { useQuery } from '@tanstack/react-query';
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc, or, and } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import { UserRole } from '@/types/enums';

export function useClientDossier(userId: string) {
  const { user: currentUser, userData: currentUserProfile } = useAuth();

  // Helper for security-compliant queries
  const getSecurityFilter = () => {
    if (!currentUser) return null;
    if (currentUserProfile?.role === UserRole.ADMIN) return null;
    
    return or(
      where('profissional_id', '==', currentUser.uid),
      where('mentor_id', '==', currentUser.uid),
      where('created_by', '==', currentUser.uid),
      where('cliente_uid', '==', currentUser.uid),
      where('user_id', '==', currentUser.uid)
    );
  };

  return useQuery({
    queryKey: ['client-dossier-full', userId, currentUser?.uid],
    queryFn: async () => {
      if (!userId || !currentUser) return null;

      const filter = getSecurityFilter();

      // 1. Get the Client document first to get the user_id (UID)
      const clientDoc = await getDoc(doc(db, 'clientes', userId));
      if (!clientDoc.exists()) return null;
      
      const clientData = clientDoc.data();
      const clientUid = clientData.user_id || clientData.userId || clientData.uid;

      // 2. User Profile (Auth Profile)
      let profile = null;
      if (clientUid) {
        try {
          const userDoc = await getDoc(doc(db, 'users', clientUid));
          profile = userDoc.exists() ? { id: userDoc.id, ...userDoc.data() } : null;
        } catch (err) {
          console.warn("Could not fetch user profile for client:", clientUid, err);
          // Don't fail the whole dossier if profile is missing/protected
        }
      }

      // 3. Roda da Vida (Latest)
      let qRoda = query(
        collection(db, 'rodas_da_vida'),
        where('cliente_id', '==', userId),
        orderBy('created_date', 'desc'),
        limit(1)
      );
      if (filter) {
        qRoda = query(collection(db, 'rodas_da_vida'), and(where('cliente_id', '==', userId), filter), orderBy('created_date', 'desc'), limit(1));
      }
      const rodaSnap = await getDocs(qRoda);
      const rodaData = rodaSnap.docs[0]?.data();

      // 3. DISC (Latest)
      let qDisc = query(
        collection(db, 'perfis_disc'),
        where('cliente_id', '==', userId),
        orderBy('created_at', 'desc'),
        limit(1)
      );
      if (filter) {
        qDisc = query(collection(db, 'perfis_disc'), and(where('cliente_id', '==', userId), filter), orderBy('created_at', 'desc'), limit(1));
      }
      const discSnap = await getDocs(qDisc);
      const discData = discSnap.docs[0]?.data();

      // 4. Metas SMART
      let qMetas = query(collection(db, 'metas_smart'), where('cliente_id', '==', userId));
      if (filter) {
        qMetas = query(collection(db, 'metas_smart'), and(where('cliente_id', '==', userId), filter));
      }
      const metasSnap = await getDocs(qMetas);
      const metas = metasSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // 5. Sessões History
      let qSessoes = query(
        collection(db, 'sessoes_mentoring'),
        where('cliente_id', '==', userId),
        orderBy('data', 'desc')
      );
      if (filter) {
        qSessoes = query(collection(db, 'sessoes_mentoring'), and(where('cliente_id', '==', userId), filter), orderBy('data', 'desc'));
      }
      const sessoesSnap = await getDocs(qSessoes);
      const sessoes = sessoesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // 6. Avaliações
      let qAval = query(collection(db, 'avaliacoes_sessoes'), where('cliente_id', '==', userId));
      if (filter) {
        qAval = query(collection(db, 'avaliacoes_sessoes'), and(where('cliente_id', '==', userId), filter));
      }
      const avalSnap = await getDocs(qAval);
      const avaliacoes = avalSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // 7. PDI Ações
      let qPdi = query(collection(db, 'pdi_acoes'), where('cliente_uid', '==', userId));
      if (filter) {
        qPdi = query(collection(db, 'pdi_acoes'), and(where('cliente_uid', '==', userId), filter));
      }
      const pdiSnap = await getDocs(qPdi);
      const pdiAcoes = pdiSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // 8. Analysis SWOT (Latest)
      let qSwot = query(
        collection(db, 'analises_swot'),
        where('cliente_id', '==', userId),
        orderBy('created_at', 'desc'),
        limit(1)
      );
      if (filter) {
        qSwot = query(collection(db, 'analises_swot'), and(where('cliente_id', '==', userId), filter), orderBy('created_at', 'desc'), limit(1));
      }
      const swotSnap = await getDocs(qSwot);
      const swotData = swotSnap.docs[0]?.data();

      // 9. Valores Pessoais (Latest)
      let qValores = query(
        collection(db, 'valores_pessoais'),
        where('cliente_id', '==', userId),
        orderBy('created_at', 'desc'),
        limit(1)
      );
      if (filter) {
        qValores = query(collection(db, 'valores_pessoais'), and(where('cliente_id', '==', userId), filter), orderBy('created_at', 'desc'), limit(1));
      }
      const valoresSnap = await getDocs(qValores);
      const valoresData = valoresSnap.docs[0]?.data();

      // 10. Notas (Privadas do Mentor)
      let qNotas = query(collection(db, 'pdi_notas'), where('cliente_id', '==', userId), orderBy('created_at', 'desc'));
      if (filter) {
        qNotas = query(collection(db, 'pdi_notas'), and(where('cliente_id', '==', userId), filter), orderBy('created_at', 'desc'));
      }
      const notasSnap = await getDocs(qNotas);
      const notas = notasSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      return {
        profile: profile as any,
        rodaData: rodaData as any,
        discData: discData as any,
        swotData: swotData as any,
        valoresData: valoresData as any,
        metas: metas as any[],
        sessoes: sessoes as any[],
        avaliacoes: avaliacoes as any[],
        pdiAcoes: pdiAcoes as any[],
        notas: notas as any[]
      };
    },
    enabled: !!userId && !!currentUser
  });
}
