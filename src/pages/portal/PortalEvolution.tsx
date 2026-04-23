import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  TrendingUp, 
  Loader2,
  BarChart3,
  PieChart,
  Activity,
  LineChart as LineChartIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line
} from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function PortalEvolution() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cliente, setCliente] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [rodaData, setRodaData] = useState<any[]>([]);
  const [rodaHistory, setRodaHistory] = useState<any[]>([]);
  const [discData, setDiscData] = useState<any[]>([]);
  const [metasStats, setMetasStats] = useState({ total: 0, concluidas: 0 });

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        // 1. Get Cliente
        const qCliente = query(collection(db, 'clientes'), where('user_id', '==', user.uid));
        const clientSnap = await getDocs(qCliente);
        if (clientSnap.empty) {
          setIsLoading(false);
          return;
        }
        const clienteDoc = clientSnap.docs[0];
        const clienteId = clienteDoc.id;
        setCliente({ id: clienteId, ...clienteDoc.data() });

        // 2. Get Latest Roda da Vida
        const qRoda = query(
          collection(db, 'rodas_da_vida'),
          where('cliente_id', '==', clienteId),
          orderBy('created_date', 'desc')
        );
        const rodaSnap = await getDocs(qRoda);
        
        if (!rodaSnap.empty) {
          const latestData = rodaSnap.docs[0].data();
          setRodaData([
            { subject: 'Saúde', A: latestData.saude_fisica || 0, fullMark: 10 },
            { subject: 'Mental', A: latestData.desenvolvimento_mental || 0, fullMark: 10 },
            { subject: 'Emocional', A: latestData.inteligencia_emocional || 0, fullMark: 10 },
            { subject: 'Família', A: latestData.familia || 0, fullMark: 10 },
            { subject: 'Romance', A: latestData.romance || 0, fullMark: 10 },
            { subject: 'Social', A: latestData.vida_social || 0, fullMark: 10 },
            { subject: 'Carreira', A: latestData.carreira || 0, fullMark: 10 },
            { subject: 'Finanças', A: latestData.financas || 0, fullMark: 10 },
            { subject: 'Contribuição', A: latestData.contribuicao_social || 0, fullMark: 10 },
            { subject: 'Lazer', A: latestData.divertimento_lazer || 0, fullMark: 10 },
            { subject: 'Ambiente', A: latestData.saude_ambiente || 0, fullMark: 10 },
          ]);

          // Build Historical Average Data
          const hist = rodaSnap.docs.reverse().map(doc => {
            const d = doc.data();
            const sum = (d.saude_fisica || 0) + (d.desenvolvimento_mental || 0) + (d.inteligencia_emocional || 0) +
                        (d.familia || 0) + (d.romance || 0) + (d.vida_social || 0) + (d.carreira || 0) +
                        (d.financas || 0) + (d.contribuicao_social || 0) + (d.divertimento_lazer || 0) + (d.saude_ambiente || 0);
            
            const media = Number((sum / 11).toFixed(1));
            
            // Handle timestamp variations
            let dateObj = new Date();
            if (d.created_date) {
               dateObj = d.created_date?.toDate ? d.created_date.toDate() : new Date(d.created_date);
            }
            
            return {
               dataAvaliacao: format(dateObj, "MMM yy", { locale: ptBR }),
               mediaGeral: media
            };
          });
          setRodaHistory(hist);
        }

        // 3. Get Latest DISC
        const qDisc = query(
          collection(db, 'perfis_disc'),
          where('cliente_id', '==', clienteId),
          orderBy('created_at', 'desc'),
          limit(1)
        );
        const discSnap = await getDocs(qDisc);
        if (!discSnap.empty) {
          const data = discSnap.docs[0].data();
          setDiscData([
            { name: 'Dominância', value: data.dominancia || 0 },
            { name: 'Influência', value: data.influencia || 0 },
            { name: 'Estabilidade', value: data.estabilidade || 0 },
            { name: 'Conformidade', value: data.conformidade || 0 },
          ]);
        }

        // 4. Get Metas Stats
        const qMetas = query(collection(db, 'metas_smart'), where('cliente_id', '==', clienteId));
        const metasSnap = await getDocs(qMetas);
        const metas = metasSnap.docs.map(d => d.data());
        setMetasStats({
          total: metas.length,
          concluidas: metas.filter((m: any) => m.status === 'concluido').length
        });

        setIsLoading(false);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'portal_evolution');
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/portal/dashboard')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <span className="font-bold text-xl text-slate-800">Sua Evolução</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-blue-100 text-sm">Metas Concluídas</p>
                  <p className="text-2xl font-bold">{metasStats.concluidas} de {metasStats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-emerald-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-emerald-100 text-sm">Média Atual (Roda da Vida)</p>
                  <p className="text-2xl font-bold">
                    {rodaHistory.length > 0 ? rodaHistory[rodaHistory.length - 1].mediaGeral : '0.0'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Evolução Histórica (Linha) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <LineChartIcon className="w-5 h-5 text-indigo-600" />
              Evolução do Equilíbrio (Histórico)
            </CardTitle>
            <CardDescription>Acompanhe o crescimento da sua média geral da Roda da Vida ao longo das avaliações.</CardDescription>
          </CardHeader>
          <CardContent>
            {rodaHistory.length > 1 ? (
              <div className="h-[300px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={rodaHistory} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="dataAvaliacao" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 12 }} 
                      dy={10}
                    />
                    <YAxis 
                      domain={[0, 10]} 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 12 }} 
                      dx={-10}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: number) => [`${value} pts`, 'Média Global']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="mediaGeral" 
                      stroke="#4f46e5" 
                      strokeWidth={3} 
                      dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} 
                      activeDot={{ r: 6, strokeWidth: 0, fill: '#4f46e5' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : rodaHistory.length === 1 ? (
              <div className="h-[200px] flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
                <TrendingUp className="w-8 h-8 text-slate-300 mb-2" />
                <p>O gráfico de evolução aparecerá após sua segunda Roda da Vida.</p>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-slate-400 italic bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
                Nenhuma Roda da Vida realizada ainda.
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Roda da Vida Chart (Radar) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-blue-600" />
                Equilíbrio de Vida
              </CardTitle>
              <CardDescription>Último resultado detalhado da sua Roda da Vida</CardDescription>
            </CardHeader>
            <CardContent>
              {rodaData.length > 0 ? (
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={rodaData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 10]} />
                      <Radar
                        name="Você"
                        dataKey="A"
                        stroke="#2563eb"
                        fill="#3b82f6"
                        fillOpacity={0.6}
                      />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[350px] flex items-center justify-center text-slate-400 italic">
                  Nenhuma Roda da Vida realizada ainda.
                </div>
              )}
            </CardContent>
          </Card>

          {/* DISC Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-teal-600" />
                Perfil Comportamental
              </CardTitle>
              <CardDescription>Seu perfil predominante (DISC)</CardDescription>
            </CardHeader>
            <CardContent>
              {discData.length > 0 ? (
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={discData} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{ fill: '#f8fafc' }} />
                      <Bar dataKey="value" fill="#0d9488" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[350px] flex items-center justify-center text-slate-400 italic">
                  Perfil DISC ainda não avaliado.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
