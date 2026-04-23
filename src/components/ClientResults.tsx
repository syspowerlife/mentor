import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { collection, query, where, getDocs, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line
} from 'recharts';
import { Target, TrendingUp, CheckCircle2, Clock, Star, User } from 'lucide-react';
import { ExportPdfButton } from '@/components/ExportPdfButton';
import { TableSkeleton } from '@/components/skeletons/FeedbackSkeletons';

interface ClientResultsProps {
  userId: string;
}

export function ClientResults({ userId }: ClientResultsProps) {
  // Fetch User Info
  const { data: userData, isLoading: isLoadingUser } = useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      const userDoc = await getDoc(doc(db, 'users', userId));
      return userDoc.exists() ? { id: userDoc.id, ...userDoc.data() } : null;
    },
    enabled: !!userId
  });

  // Fetch Roda da Vida (Latest)
  const { data: rodaData } = useQuery({
    queryKey: ['roda', userId],
    queryFn: async () => {
      const q = query(
        collection(db, 'rodas_da_vida'),
        where('created_by', '==', userId),
        orderBy('created_date', 'desc'),
        limit(1)
      );
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      const data = snapshot.docs[0].data();
      return [
        { subject: 'Saúde', A: data.saude_fisica || 0, fullMark: 10 },
        { subject: 'Mental', A: data.desenvolvimento_mental || 0, fullMark: 10 },
        { subject: 'Emocional', A: data.inteligencia_emocional || 0, fullMark: 10 },
        { subject: 'Família', A: data.familia || 0, fullMark: 10 },
        { subject: 'Romance', A: data.romance || 0, fullMark: 10 },
        { subject: 'Social', A: data.vida_social || 0, fullMark: 10 },
        { subject: 'Carreira', A: data.carreira || 0, fullMark: 10 },
        { subject: 'Finanças', A: data.financas || 0, fullMark: 10 },
        { subject: 'Contribuição', A: data.contribuicao_social || 0, fullMark: 10 },
        { subject: 'Lazer', A: data.divertimento_lazer || 0, fullMark: 10 },
        { subject: 'Ambiente', A: data.saude_ambiente || 0, fullMark: 10 },
      ];
    },
    enabled: !!userId
  });

  // Fetch DISC (Latest)
  const { data: discData } = useQuery({
    queryKey: ['disc', userId],
    queryFn: async () => {
      const q = query(
        collection(db, 'perfis_disc'),
        where('cliente_id', '==', userId),
        orderBy('created_at', 'desc'),
        limit(1)
      );
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      const data = snapshot.docs[0].data();
      return [
        { name: 'Dominância', value: data.dominancia || 0 },
        { name: 'Influência', value: data.influencia || 0 },
        { name: 'Estabilidade', value: data.estabilidade || 0 },
        { name: 'Conformidade', value: data.conformidade || 0 },
      ];
    },
    enabled: !!userId
  });

  // Fetch Metas SMART
  const { data: metasData } = useQuery({
    queryKey: ['metas', userId],
    queryFn: async () => {
      const q = query(collection(db, 'metas_smart'), where('cliente_id', '==', userId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    },
    enabled: !!userId
  });

  // Fetch Sessões
  const { data: sessoesData } = useQuery({
    queryKey: ['sessoes', userId],
    queryFn: async () => {
      const q = query(
        collection(db, 'sessoes_mentoring'),
        where('cliente_id', '==', userId),
        orderBy('data', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    },
    enabled: !!userId
  });

  // Fetch Avaliações
  const { data: avaliacoesData } = useQuery({
    queryKey: ['avaliacoes', userId],
    queryFn: async () => {
      const q = query(collection(db, 'avaliacoes_sessoes'), where('cliente_id', '==', userId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    },
    enabled: !!userId
  });

  if (isLoadingUser) return <TableSkeleton />;
  if (!userData) return <div className="p-8 text-center text-slate-500">Usuário não encontrado.</div>;

  const totalSessoes = sessoesData?.length || 0;
  const avgSatisfaction = avaliacoesData && avaliacoesData.length > 0 
    ? (avaliacoesData.reduce((acc: number, curr: any) => acc + curr.nota, 0) / avaliacoesData.length).toFixed(1)
    : '0.0';
  const metasConcluidas = metasData?.filter((m: any) => m.status === 'concluido').length || 0;
  const totalMetas = metasData?.length || 0;
  const metaCompletionRate = totalMetas > 0 ? Math.round((metasConcluidas / totalMetas) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xl">
            {(userData as any).name?.charAt(0) || 'U'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">{(userData as any).name}</h2>
            <p className="text-sm text-slate-500">{(userData as any).email}</p>
          </div>
        </div>
        <ExportPdfButton 
          targetId="client-dossie" 
          filename={`dossie-${(userData as any).name?.replace(/\s+/g, '-').toLowerCase()}`} 
          title="Dossiê Consolidado do Cliente"
          userName={(userData as any).name}
        />
      </div>

      <div id="client-dossie" className="space-y-8 p-4 bg-white rounded-xl border border-slate-100">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-slate-50/50 border-none shadow-none">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Clock className="w-5 h-5" /></div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Total de Sessões</p>
                <h3 className="text-xl font-bold text-slate-800">{totalSessoes}</h3>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-50/50 border-none shadow-none">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg"><Star className="w-5 h-5" /></div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Satisfação Média</p>
                <h3 className="text-xl font-bold text-slate-800">{avgSatisfaction} / 5.0</h3>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-50/50 border-none shadow-none">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2 bg-green-100 text-green-600 rounded-lg"><CheckCircle2 className="w-5 h-5" /></div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Metas Concluídas</p>
                <h3 className="text-xl font-bold text-slate-800">{metasConcluidas} / {totalMetas}</h3>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-50/50 border-none shadow-none">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><TrendingUp className="w-5 h-5" /></div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Taxa de Sucesso</p>
                <h3 className="text-xl font-bold text-slate-800">{metaCompletionRate}%</h3>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Roda da Vida Chart */}
          <Card className="border-slate-100 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                Equilíbrio de Vida (Última Avaliação)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {rodaData ? (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={rodaData}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fill: '#94a3b8', fontSize: 8 }} />
                      <Radar
                        name="Nível"
                        dataKey="A"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.5}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-slate-400 text-sm italic">
                  Nenhuma Roda da Vida registrada.
                </div>
              )}
            </CardContent>
          </Card>

          {/* DISC Chart */}
          <Card className="border-slate-100 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <User className="w-4 h-4 text-purple-500" />
                Perfil Comportamental DISC
              </CardTitle>
            </CardHeader>
            <CardContent>
              {discData ? (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={discData} layout="vertical" margin={{ left: 20, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" domain={[0, 100]} hide />
                      <YAxis dataKey="name" type="category" tick={{ fill: '#64748b', fontSize: 11 }} width={100} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        cursor={{ fill: '#f8fafc' }}
                      />
                      <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-slate-400 text-sm italic">
                  Nenhum Perfil DISC registrado.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Metas SMART */}
          <Card className="border-slate-100 shadow-sm md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Target className="w-4 h-4 text-green-500" />
                Metas SMART e Evolução
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!metasData || metasData.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-sm italic">
                  Nenhuma meta SMART cadastrada.
                </div>
              ) : (
                <div className="space-y-3">
                  {metasData.map((meta: any) => (
                    <div key={meta.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">{meta.titulo}</h4>
                        <p className="text-xs text-slate-500 mt-1">Prazo: {new Date(meta.prazo).toLocaleDateString()}</p>
                      </div>
                      <Badge variant={
                        meta.status === 'concluido' ? 'success' : 
                        meta.status === 'em_andamento' ? 'default' : 'secondary'
                      }>
                        {meta.status?.replace('_', ' ')}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
