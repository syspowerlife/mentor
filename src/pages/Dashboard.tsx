import React, { useState } from 'react';
import { Timestamp } from 'firebase/firestore';
import { useAuth } from '@/lib/AuthContext';
import { Activity, Target, Calendar, CheckCircle2, TrendingUp, AlertCircle, Users, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, AreaChart, Area, LineChart, Line, Legend } from 'recharts';
import { DashboardSkeleton, ChartSkeleton, CardSkeleton } from '@/components/skeletons/FeedbackSkeletons';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useClients } from '@/hooks/useClients';
import { useAgendamentos } from '@/hooks/useAgendamentos';
import { useMetas } from '@/hooks/useMetas';
import { useSwot } from '@/hooks/useSwot';
import { useDisc } from '@/hooks/useDisc';
import { useRodasDaVida } from '@/hooks/useRodasDaVida';
import { parseSafeDate, safeFormat, formatDateOrTimestamp } from '@/lib/utils';

const COLORS = ['#2563eb', '#16a34a', '#9333ea', '#ea580c', '#4f46e5'];

export function Dashboard() {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('geral');
  const [timeFilter, setTimeFilter] = useState('30');

  const { clientes, isLoading: isLoadingClientes } = useClients();
  const { agendamentos, isLoading: isLoadingAgendamentos } = useAgendamentos();
  const { metas, isLoading: isLoadingMetas } = useMetas();
  const { swots, isLoading: isLoadingSwots } = useSwot();
  const { discs, isLoading: isLoadingDiscs } = useDisc();
  const { rodas, isLoading: isLoadingRodas } = useRodasDaVida();

  const loading = isLoadingClientes || isLoadingAgendamentos || isLoadingMetas || isLoadingSwots || isLoadingDiscs || isLoadingRodas;

  if (loading) return <DashboardSkeleton />;

  const filterByDate = (data: any[], dateField: string, days: number) => {
    if (days === 0) return data;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return data.filter(item => {
      const date = parseSafeDate(item[dateField]) || new Date(0);
      return date >= cutoff;
    });
  };

  const days = parseInt(timeFilter);
  const filteredRodas = filterByDate(rodas, 'created_date', days);
  const filteredMetas = filterByDate(metas, 'created_at', days);
  const filteredSwots = filterByDate(swots, 'created_at', days);
  const filteredDiscs = filterByDate(discs, 'created_at', days);
  const filteredAgendamentos = filterByDate(agendamentos, 'data_inicio', days);

  const totalAvaliacoes = filteredRodas.length + filteredSwots.length + filteredDiscs.length;
  const metasConcluidas = filteredMetas.filter(m => m.status === 'concluido').length;
  const taxaConclusao = filteredMetas.length ? Math.round((metasConcluidas / filteredMetas.length) * 100) : 0;
  const metasAtivas = filteredMetas.filter(m => m.status === 'em_andamento').length;
  
  const proximosAgendamentos = agendamentos.filter(a => {
    const data = parseSafeDate(a.data_inicio) || new Date(0);
    const hoje = new Date();
    const seteDias = new Date();
    seteDias.setDate(hoje.getDate() + 7);
    return data >= hoje && data <= seteDias;
  }).length;

  const pieData = [
    { name: 'Roda da Vida', value: filteredRodas.length },
    { name: 'Análise SWOT', value: filteredSwots.length },
    { name: 'Perfil DISC', value: filteredDiscs.length },
  ].filter(d => d.value > 0);

  const metasData = [
    { name: 'A Fazer', value: filteredMetas.filter(m => m.status === 'a_fazer').length },
    { name: 'Em Andamento', value: metasAtivas },
    { name: 'Concluídas', value: metasConcluidas },
    { name: 'Pausadas', value: filteredMetas.filter(m => m.status === 'pausada').length },
  ];

  const ultimaRoda = rodas.length > 0 ? rodas[0] : null;
  const radarData = ultimaRoda ? [
    { subject: 'Saúde Fís.', A: ultimaRoda.saude_fisica },
    { subject: 'Desenv. Men.', A: ultimaRoda.desenvolvimento_mental },
    { subject: 'Int. Emoc.', A: ultimaRoda.inteligencia_emocional },
    { subject: 'Família', A: ultimaRoda.familia },
    { subject: 'Romance', A: ultimaRoda.romance },
    { subject: 'Social', A: ultimaRoda.vida_social },
    { subject: 'Carreira', A: ultimaRoda.carreira },
    { subject: 'Finanças', A: ultimaRoda.financas },
    { subject: 'Contr. Soc.', A: ultimaRoda.contribuicao_social },
    { subject: 'Lazer', A: ultimaRoda.divertimento_lazer },
    { subject: 'Ambiente', A: ultimaRoda.saude_ambiente },
  ] : [];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 id="dashboard-title" className="text-3xl font-bold text-slate-800">{t('menu.dashboard')}</h1>
        
        <div id="dashboard-filters" className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
          <Filter className="w-4 h-4 text-slate-400 ml-2" />
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-[180px] border-0 focus:ring-0">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="0">Todo o período</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Metrics Cards */}
      <div id="dashboard-metrics" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          <>
            <MetricCard title="Total de Avaliações" value={totalAvaliacoes} icon={<Activity />} color="from-blue-500 to-blue-600" />
            <MetricCard title="Taxa de Conclusão" value={`${taxaConclusao}%`} subtext={`${metasConcluidas} de ${metas.length} metas`} icon={<CheckCircle2 />} color="from-green-500 to-green-600" />
            <MetricCard title="Metas Ativas" value={metasAtivas} icon={<Target />} color="from-purple-500 to-purple-600" />
            <MetricCard title="Próximos Agendamentos" value={proximosAgendamentos} subtext="Próximos 7 dias" icon={<Calendar />} color="from-orange-500 to-orange-600" />
          </>
        )}
      </div>

      {/* Tabs */}
      <div id="dashboard-tabs" className="flex space-x-1 bg-slate-200/50 p-1 rounded-lg w-fit">
        {['geral', 'evolucao', 'detalhes'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-colors ${activeTab === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            {tab === 'geral' ? 'Visão Geral' : tab === 'evolucao' ? 'Evolução' : 'Detalhes'}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'geral' && (
        <div id="dashboard-charts" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {loading ? (
            <>
              <ChartSkeleton />
              <ChartSkeleton />
              <ChartSkeleton />
            </>
          ) : (
            <>
              <Card className="col-span-1 bg-white/60 backdrop-blur-sm border-slate-200/60 shadow-sm">
                <CardHeader><CardTitle className="text-lg font-semibold text-slate-700">Uso de Ferramentas</CardTitle></CardHeader>
                <CardContent className="h-64">
                  {pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                          {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400">Sem dados suficientes</div>
                  )}
                </CardContent>
              </Card>

              <Card className="col-span-1 bg-white/60 backdrop-blur-sm border-slate-200/60 shadow-sm">
                <CardHeader><CardTitle className="text-lg font-semibold text-slate-700">Status das Metas</CardTitle></CardHeader>
                <CardContent className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metasData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                      <RechartsTooltip />
                      <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="col-span-1 bg-white/60 backdrop-blur-sm border-slate-200/60 shadow-sm">
                <CardHeader><CardTitle className="text-lg font-semibold text-slate-700">Última Roda da Vida</CardTitle></CardHeader>
                <CardContent className="h-64">
                  {radarData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis dataKey="subject" tick={{fontSize: 10, fill: '#64748b'}} />
                        <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{fontSize: 8}} />
                        <Radar name="Atual" dataKey="A" stroke="#2563eb" fill="#3b82f6" fillOpacity={0.5} />
                        <RechartsTooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400">Nenhuma avaliação encontrada</div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {activeTab === 'evolucao' && (
        <div className="grid grid-cols-1 gap-6">
          <Card className="bg-white/60 backdrop-blur-sm border-slate-200/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-700">Comparativo - Últimas 5 Rodas da Vida</CardTitle>
            </CardHeader>
            <CardContent className="h-[450px]">
              {rodas.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={rodas.slice(0, 5).reverse().map(r => {
                    return {
                      name: formatDateOrTimestamp(r.created_date),
                      'Saúde Física': r.saude_fisica,
                      'Mental': r.desenvolvimento_mental,
                      'Emocional': r.inteligencia_emocional,
                      'Família': r.familia,
                      'Romance': r.romance,
                      'Social': r.vida_social,
                      'Carreira': r.carreira,
                      'Finanças': r.financas,
                      'Contribuição': r.contribuicao_social,
                      'Lazer': r.divertimento_lazer,
                      'Ambiente': r.saude_ambiente
                    };
                  })}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 10]} tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                    <RechartsTooltip />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '20px' }} />
                    <Line type="monotone" dataKey="Saúde Física" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="Mental" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="Emocional" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="Família" stroke="#ec4899" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="Romance" stroke="#f43f5e" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="Social" stroke="#06b6d4" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="Carreira" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="Finanças" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="Contribuição" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="Lazer" stroke="#fbbf24" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="Ambiente" stroke="#14b8a6" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400">Nenhuma avaliação encontrada</div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/60 backdrop-blur-sm border-slate-200/60 shadow-sm">
            <CardHeader><CardTitle className="text-lg font-semibold text-slate-700">Evolução da Média Geral</CardTitle></CardHeader>
            <CardContent className="h-64">
              {rodas.length > 1 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={rodas.slice().reverse().map(r => {
                    const sum = r.saude_fisica + r.desenvolvimento_mental + r.inteligencia_emocional + r.familia + r.romance + r.vida_social + r.carreira + r.financas + r.contribuicao_social + r.divertimento_lazer + r.saude_ambiente;
                    return { data: formatDateOrTimestamp(r.created_date), media: (sum / 11).toFixed(1) };
                  })}>
                    <defs>
                      <linearGradient id="colorMedia" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="data" tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 10]} tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                    <RechartsTooltip />
                    <Area type="monotone" dataKey="media" stroke="#2563eb" fillOpacity={1} fill="url(#colorMedia)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400">Necessário pelo menos 2 avaliações para ver evolução histórica</div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'detalhes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-white/60 backdrop-blur-sm border-slate-200/60 shadow-sm">
            <CardHeader><CardTitle className="text-lg font-semibold text-slate-700 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-blue-500" /> Insights e Recomendações</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {ultimaRoda && (ultimaRoda.saude_fisica < 5 || ultimaRoda.financas < 5) && (
                  <li className="p-4 bg-blue-50/50 border border-blue-100 text-blue-800 rounded-xl text-sm flex gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <div>
                      <strong>Atenção Prioritária:</strong> Algumas áreas da sua Roda da Vida estão com pontuação crítica. Considere criar uma Meta SMART focada em Saúde ou Finanças.
                    </div>
                  </li>
                )}
                {metasAtivas === 0 && (
                  <li className="p-4 bg-orange-50/50 border border-orange-100 text-orange-800 rounded-xl text-sm flex gap-3">
                    <Target className="w-5 h-5 shrink-0" />
                    <div>
                      <strong>Foco em Objetivos:</strong> Você não possui metas em andamento. Definir objetivos claros é o primeiro passo para a evolução contínua.
                    </div>
                  </li>
                )}
                {totalAvaliacoes === 0 && (
                  <li className="p-4 bg-green-50/50 border border-green-100 text-green-800 rounded-xl text-sm flex gap-3">
                    <Activity className="w-5 h-5 shrink-0" />
                    <div>
                      <strong>Primeiros Passos:</strong> Comece realizando sua primeira avaliação da Roda da Vida para mapear seu estado atual.
                    </div>
                  </li>
                )}
                {clientes.length > 0 && (
                  <li className="p-4 bg-purple-50/50 border border-purple-100 text-purple-800 rounded-xl text-sm flex gap-3">
                    <Users className="w-5 h-5 shrink-0" />
                    <div>
                      <strong>Gestão de Clientes:</strong> Você tem {clientes.length} clientes ativos. Lembre-se de revisar os PDIs e agendamentos regularmente.
                    </div>
                  </li>
                )}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function MetricCard({ title, value, subtext, icon, color }: { title: string, value: string | number, subtext?: string, icon: React.ReactNode, color: string }) {
  return (
    <Card className={`bg-gradient-to-br ${color} text-white border-0 shadow-lg overflow-hidden relative group`}>
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform scale-150">
        {icon}
      </div>
      <CardHeader className="pb-2 relative z-10">
        <CardTitle className="text-sm font-medium text-white/80 flex items-center justify-between">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="text-4xl font-bold mb-1 tracking-tight">{value}</div>
        {subtext && <p className="text-xs text-white/70 font-medium">{subtext}</p>}
      </CardContent>
    </Card>
  );
}
