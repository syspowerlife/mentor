import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, DollarSign, UserCheck, TrendingUp, Loader2, PieChart as PieIcon, BarChart3 } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PlanDistributionChart } from './analytics/PlanDistributionChart';
import { RevenueLineChart } from './analytics/RevenueLineChart';

export function AdminMetricsGrid() {
  const { data: metricsData, isLoading } = useQuery({
    queryKey: ['admin-global-metrics-v3'],
    queryFn: async () => {
      const usersRef = collection(db, 'users');
      const revenueRef = collection(db, 'revenue_history');
      const plansRef = collection(db, 'planos');
      
      const [usersSnap, revenueSnap, plansSnap] = await Promise.all([
        getDocs(query(usersRef)),
        getDocs(query(revenueRef, orderBy('timestamp', 'asc'))),
        getDocs(query(plansRef))
      ]);

      const users = usersSnap.docs.map(d => d.data());
      const revenue = revenueSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const plans = plansSnap.docs.reduce((acc: any, d) => {
        const data = d.data();
        acc[d.id] = data.price || 0;
        return acc;
      }, {});

      return { users, revenue, plans };
    }
  });

  const processedMetrics = useMemo(() => {
    if (!metricsData) return null;

    const { users, revenue, plans } = metricsData;

    let totalClients = 0;
    let totalMentors = 0;
    let mrr = 0;
    
    // Plan Distribution
    const planCounts: Record<string, number> = { Free: 0, Pro: 0, Master: 0 };
    const growthMap: Record<string, number> = {};

    users.forEach((user: any) => {
      if (user.role === 'client') totalClients++;
      if (user.role === 'user' || !user.role || user.role === 'admin') totalMentors++;

      // Distribution
      const planName = user.plan ? (user.plan.charAt(0).toUpperCase() + user.plan.slice(1)) : 'Free';
      planCounts[planName] = (planCounts[planName] || 0) + 1;

      // Estimate MRR using dynamic price from plans map
      if (user.plan && plans[user.plan]) {
        mrr += plans[user.plan];
      } else if (user.plan === 'pro') {
        mrr += 97; // fallback legacy
      } else if (user.plan === 'master') {
        mrr += 197; // fallback legacy
      }

      // User Growth
      const dateStr = user.created_at || user.updated_at || new Date().toISOString();
      try {
        const monthKey = format(parseISO(dateStr), 'MMM yyyy', { locale: ptBR });
        growthMap[monthKey] = (growthMap[monthKey] || 0) + 1;
      } catch (e) {}
    });

    const planDistribution = Object.entries(planCounts).map(([name, value]) => ({ name, value }));

    const growthData = Object.entries(growthMap)
      .map(([month, count]) => ({ month, novosUsuarios: count }))
      .sort((a, b) => {
        // Simple sort by month/year is tricky with 'MMM yyyy', but good enough for UI
        return new Date(a.month).getTime() - new Date(b.month).getTime();
      })
      .slice(-6);

    // Revenue Evolution
    const revenueMap: Record<string, { revenue: number, count: number }> = {};
    revenue.forEach((rev: any) => {
      const date = rev.timestamp?.toDate ? rev.timestamp.toDate() : new Date();
      const monthKey = format(date, 'MMM yyyy', { locale: ptBR });
      
      if (!revenueMap[monthKey]) {
        revenueMap[monthKey] = { revenue: 0, count: 0 };
      }
      revenueMap[monthKey].revenue += (rev.amount || 0);
      revenueMap[monthKey].count += 1;
    });

    const revenueData = Object.entries(revenueMap).map(([month, data]) => ({
      month,
      ...data
    })).slice(-6);

    return { totalClients, totalMentors, mrr, growthData, planDistribution, revenueData };
  }, [metricsData]);

  if (isLoading || !processedMetrics) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const { totalClients, totalMentors, mrr, growthData, planDistribution, revenueData } = processedMetrics;

  return (
    <div className="space-y-8">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white/60 backdrop-blur-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total de Mentores</CardTitle>
            <UserCheck className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{totalMentors}</div>
            <p className="text-xs text-slate-500 mt-1">Profissionais ativos</p>
          </CardContent>
        </Card>

        <Card className="bg-white/60 backdrop-blur-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total de Clientes</CardTitle>
            <Users className="w-4 h-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{totalClients}</div>
            <p className="text-xs text-slate-500 mt-1">Mentorados inscritos</p>
          </CardContent>
        </Card>

        <Card className="bg-white/60 backdrop-blur-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">MRR Estimado</CardTitle>
            <DollarSign className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(mrr)}
            </div>
            <p className="text-xs text-slate-500 mt-1">Receita recorrente mensal</p>
          </CardContent>
        </Card>

        <Card className="bg-white/60 backdrop-blur-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total de Usuários</CardTitle>
            <TrendingUp className="w-4 h-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{totalMentors + totalClients}</div>
            <p className="text-xs text-slate-500 mt-1">Na plataforma</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Chart */}
        <Card className="bg-white/60 backdrop-blur-sm border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
              Evolução Mensal da Receita
            </CardTitle>
            <CardDescription>Receita bruta processada por mês</CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueLineChart data={revenueData} />
          </CardContent>
        </Card>

        {/* Plan Distribution */}
        <Card className="bg-white/60 backdrop-blur-sm border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieIcon className="w-5 h-5 text-blue-600" />
              Distribuição de Planos
            </CardTitle>
            <CardDescription>Volume de usuários por tier de assinatura</CardDescription>
          </CardHeader>
          <CardContent>
            <PlanDistributionChart data={planDistribution} />
          </CardContent>
        </Card>
      </div>

      {/* Growth Chart */}
      <Card className="bg-white/60 backdrop-blur-sm border-slate-200">
        <CardHeader>
          <CardTitle>Crescimento de Usuários (Últimos Meses)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full mt-4">
            {growthData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growthData}>
                  <defs>
                    <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="novosUsuarios" 
                    stroke="#2563eb" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorGrowth)" 
                    name="Novos Usuários"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">
                Dados insuficientes para o gráfico.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
