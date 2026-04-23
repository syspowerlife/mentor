import React, { useMemo, useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  Timestamp,
  deleteDoc
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Target, Activity, Calendar, Filter, Plus, Edit, Trash2, MessageSquare } from 'lucide-react';
import { HistoryLineChart } from '@/components/HistoryLineChart';
import { motion } from 'motion/react';
import { format, subMonths, parseISO, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { ToolSkeleton } from '@/components/skeletons/FeedbackSkeletons';
import { parseSafeDate, safeFormat, formatDateOrTimestamp } from '@/lib/utils';

const AREAS = [
  'saude_fisica', 'desenvolvimento_mental', 'inteligencia_emocional', 'familia',
  'romance', 'vida_social', 'carreira', 'financas', 'contribuicao_social',
  'divertimento_lazer', 'saude_ambiente'
];

export function AcompanhamentoProgresso() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const clienteId = searchParams.get('clienteId');

  const [loading, setLoading] = useState(true);
  const [rodas, setRodas] = useState<any[]>([]);
  const [metas, setMetas] = useState<any[]>([]);
  const [reflexoes, setReflexoes] = useState<any[]>([]);
  const [sessoes, setSessoes] = useState<any[]>([]);

  const [isSessaoDialogOpen, setIsSessaoDialogOpen] = useState(false);
  const [editingSessao, setEditingSessao] = useState<any>(null);
  const [sessaoForm, setSessaoForm] = useState<{
    titulo: string;
    notas: string;
    progresso: number;
    data: string;
    meta_ids: string[];
  }>({
    titulo: '',
    notas: '',
    progresso: 5,
    data: format(new Date(), 'yyyy-MM-dd'),
    meta_ids: []
  });

  // Load Data from Firestore
  useEffect(() => {
    if (!user) return;

    const unsubscribes: (() => void)[] = [];

    // Rodas da Vida
    const rodasQuery = query(
      collection(db, 'rodas_da_vida'),
      where('created_by', '==', user.uid),
      ...(clienteId ? [where('cliente_id', '==', clienteId)] : []),
      orderBy('created_date', 'asc')
    );
    unsubscribes.push(onSnapshot(rodasQuery, (snap) => {
      setRodas(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }));

    // Metas SMART
    const metasQuery = query(
      collection(db, 'metas_smart'),
      where('created_by', '==', user.uid),
      ...(clienteId ? [where('cliente_id', '==', clienteId)] : [])
    );
    unsubscribes.push(onSnapshot(metasQuery, (snap) => {
      setMetas(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }));

    // Diário de Reflexão
    const reflexoesQuery = query(
      collection(db, 'diarios_reflexao'),
      where('created_by', '==', user.uid)
    );
    unsubscribes.push(onSnapshot(reflexoesQuery, (snap) => {
      setReflexoes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }));

    // Sessões de Mentoring
    const sessoesQuery = query(
      collection(db, 'sessoes_mentoring'),
      where('created_by', '==', user.uid),
      ...(clienteId ? [where('cliente_id', '==', clienteId)] : []),
      orderBy('data', 'asc')
    );
    unsubscribes.push(onSnapshot(sessoesQuery, (snap) => {
      setSessoes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (error) => {
      console.error("Error loading sessions:", error);
      setLoading(false);
    }));

    return () => unsubscribes.forEach(unsub => unsub());
  }, [user, clienteId]);

  const mutationSessao = useMutation({
    mutationFn: async (data: any) => {
      const path = 'sessoes_mentoring';
      try {
        if (editingSessao) {
          await updateDoc(doc(db, path, editingSessao.id), {
            ...data,
            data: parseSafeDate(data.data)?.toISOString() || new Date().toISOString()
          });
        } else {
          await addDoc(collection(db, path), {
            ...data,
            cliente_id: clienteId || null,
            mentor_id: user?.uid,
            created_by: user?.uid,
            data: parseSafeDate(data.data)?.toISOString() || new Date().toISOString(),
            status: 'realizada'
          });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    },
    onSuccess: () => {
      setIsSessaoDialogOpen(false);
      setEditingSessao(null);
      setSessaoForm({ titulo: '', notas: '', progresso: 5, data: format(new Date(), 'yyyy-MM-dd'), meta_ids: [] });
      toast.success(editingSessao ? 'Sessão atualizada!' : 'Sessão registrada!');
    },
    onError: (error: any) => toast.error(error.message || 'Erro ao salvar sessão.')
  });

  const deleteSessaoMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteDoc(doc(db, 'sessoes_mentoring', id));
    },
    onSuccess: () => toast.success('Sessão excluída.'),
    onError: (error: any) => toast.error(error.message || 'Erro ao excluir sessão.')
  });

  const timelineData = useMemo(() => {
    const months = Array.from({ length: 6 }).map((_, i) => {
      const date = subMonths(new Date(), 5 - i);
      return {
        key: format(date, 'yyyy-MM'),
        label: format(date, 'MMM', { locale: ptBR }),
        roda: 0,
        rodaCount: 0,
        metas: 0,
        humor: 0,
        humorCount: 0,
        sessaoProg: 0,
        sessaoCount: 0,
      };
    });

    rodas.forEach((r: any) => {
      const date = parseSafeDate(r.data_avaliacao || r.created_date) || new Date(0);
      const key = format(date, 'yyyy-MM');
      const month = months.find(m => m.key === key);
      if (month) {
        const avg = AREAS.reduce((acc, area) => acc + (r[area] || 0), 0) / AREAS.length;
        month.roda += avg;
        month.rodaCount++;
      }
    });

    metas.forEach((m: any) => {
      if (m.status === 'concluida') {
        const date = parseSafeDate(m.data_conclusao || m.created_at) || new Date(0);
        const key = format(date, 'yyyy-MM');
        const month = months.find(m => m.key === key);
        if (month) month.metas++;
      }
    });

    reflexoes.forEach((ref: any) => {
      const date = parseSafeDate(ref.data || ref.created_date) || new Date(0);
      const key = format(date, 'yyyy-MM');
      const month = months.find(m => m.key === key);
      if (month) {
        const val = ref.sentimento === 'feliz' ? 10 : ref.sentimento === 'neutro' ? 6 : 2;
        month.humor += val;
        month.humorCount++;
      }
    });

    sessoes.forEach((s: any) => {
      const date = parseSafeDate(s.data) || new Date(0);
      const key = format(date, 'yyyy-MM');
      const month = months.find(m => m.key === key);
      if (month) {
        month.sessaoProg += (s.progresso || 0);
        month.sessaoCount++;
      }
    });

    return months.map(m => ({
      date: m.label,
      rodaDaVida: m.rodaCount > 0 ? Number((m.roda / m.rodaCount).toFixed(1)) : null,
      metasConcluidas: m.metas,
      humorMedio: m.humorCount > 0 ? Number((m.humor / m.humorCount).toFixed(1)) : null,
      progressoSessao: m.sessaoCount > 0 ? Number((m.sessaoProg / m.sessaoCount).toFixed(1)) : null,
    }));
  }, [rodas, metas, reflexoes, sessoes]);

  const stats = useMemo(() => {
    const latestRoda = rodas[rodas.length - 1];
    const prevRoda = rodas[rodas.length - 2];
    
    const currentAvg = latestRoda ? AREAS.reduce((acc, area) => acc + (latestRoda[area] || 0), 0) / AREAS.length : 0;
    const prevAvg = prevRoda ? AREAS.reduce((acc, area) => acc + (prevRoda[area] || 0), 0) / AREAS.length : 0;
    const diff = currentAvg - prevAvg;

    const completedMetas = metas.filter((m: any) => m.status === 'concluida').length;
    
    return {
      rodaAvg: currentAvg.toFixed(1),
      rodaDiff: diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1),
      metasTotal: completedMetas,
      crescimento: diff > 0 ? `${((diff / (prevAvg || 1)) * 100).toFixed(0)}%` : '0%'
    };
  }, [rodas, metas]);

  if (loading) return <ToolSkeleton />;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-blue-600" />
            Acompanhamento de Progresso
          </h1>
          <p className="text-slate-500 mt-1">Visualize a evolução dos indicadores e metas ao longo do tempo.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="text-slate-600">
            <Calendar className="w-4 h-4 mr-2" /> Últimos 6 meses
          </Button>
          <Button onClick={() => { setEditingSessao(null); setIsSessaoDialogOpen(true); }} size="sm" className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" /> Registrar Sessão
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Média Roda da Vida (Atual)" 
          value={stats.rodaAvg} 
          subValue={`${stats.rodaDiff} vs anterior`}
          icon={<Activity className="w-4 h-4 text-blue-500" />}
          trend={Number(stats.rodaDiff) >= 0 ? 'up' : 'down'}
        />
        <StatCard 
          title="Metas Concluídas (Total)" 
          value={stats.metasTotal.toString()} 
          subValue="acumulado no período"
          icon={<Target className="w-4 h-4 text-green-500" />}
        />
        <StatCard 
          title="Taxa de Crescimento" 
          value={stats.crescimento} 
          subValue="baseado na Roda da Vida"
          icon={<TrendingUp className="w-4 h-4 text-orange-500" />}
          trend="up"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-xl shadow-slate-200/50 overflow-hidden">
          <CardHeader className="bg-white border-b border-slate-50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Evolução Longitudinal</CardTitle>
                <CardDescription>Cruzamento de indicadores de bem-estar e produtividade</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <HistoryLineChart 
              data={timelineData} 
              series={[
                { key: 'rodaDaVida', name: 'Roda da Vida', color: '#3b82f6' },
                { key: 'humorMedio', name: 'Humor (Diário)', color: '#f59e0b' },
                { key: 'progressoSessao', name: 'Progresso Sessão', color: '#8b5cf6' },
              ]}
              yDomain={[0, 10]}
            />
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl shadow-slate-200/50 overflow-hidden">
          <CardHeader className="bg-white border-b border-slate-50">
            <CardTitle className="text-xl">Metas Concluídas</CardTitle>
            <CardDescription>Volume mensal de entregas</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="metasConcluidas" name="Metas" fill="#10b981" radius={[6, 6, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sessões Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-blue-600" />
          Histórico de Sessões e Notas
        </h2>
        
        {sessoes.length === 0 ? (
          <Card className="bg-white/60 backdrop-blur-sm border-dashed border-2 border-slate-200">
            <CardContent className="p-12 text-center text-slate-500">
              Nenhuma sessão registrada para este período.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sessoes.map((s) => (
              <Card key={s.id} className="bg-white hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{s.titulo}</CardTitle>
                      <p className="text-xs text-slate-400 mt-1">
                        {s.data instanceof Timestamp ? format(s.data.toDate(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : s.data}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                        setEditingSessao(s);
                        setSessaoForm({
                          titulo: s.titulo,
                          notas: s.notas || '',
                          progresso: s.progresso || 5,
                          data: s.data instanceof Timestamp ? format(s.data.toDate(), 'yyyy-MM-dd') : s.data,
                          meta_ids: s.meta_ids || []
                        });
                        setIsSessaoDialogOpen(true);
                      }}>
                        <Edit className="w-4 h-4 text-slate-400" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteSessaoMutation.mutate(s.id)}>
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-blue-500 h-full" style={{ width: `${(s.progresso || 0) * 10}%` }}></div>
                      </div>
                      <span className="text-xs font-bold text-blue-600">{s.progresso}/10</span>
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-3 italic">
                      {s.notas || 'Sem notas registradas.'}
                    </p>

                    {s.meta_ids && s.meta_ids.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-3 mt-3 border-t border-slate-50">
                        {s.meta_ids.map((mId: string) => {
                          const meta = metas.find(m => m.id === mId);
                          if (!meta) return null;
                          return (
                            <span 
                              key={mId} 
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-blue-100 text-[10px] font-semibold text-blue-700 shadow-sm transition-all hover:border-blue-300"
                              title={`Meta: ${meta.titulo}`}
                            >
                              <div className="w-1 h-1 rounded-full bg-blue-500" />
                              <span className="max-w-[120px] truncate">{meta.titulo}</span>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dialog Nova/Editar Sessão */}
      <Dialog open={isSessaoDialogOpen} onOpenChange={setIsSessaoDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingSessao ? 'Editar Sessão' : 'Registrar Nova Sessão'}</DialogTitle>
            <DialogDescription>
              Registre os principais pontos e o progresso percebido nesta sessão.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Título da Sessão</Label>
              <Input 
                value={sessaoForm.titulo} 
                onChange={e => setSessaoForm({ ...sessaoForm, titulo: e.target.value })} 
                placeholder="Ex: Sessão 05 - Foco em Carreira"
              />
            </div>
            <div className="space-y-2">
              <Label>Data</Label>
              <Input 
                type="date" 
                value={sessaoForm.data} 
                onChange={e => setSessaoForm({ ...sessaoForm, data: e.target.value })} 
              />
            </div>

            {metas.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Metas Relacionadas</Label>
                <div className="grid grid-cols-1 gap-2 border border-slate-100 rounded-lg p-2 max-h-48 overflow-y-auto bg-slate-50/30">
                  {metas.filter(m => m.status !== 'concluida' || (sessaoForm.meta_ids && sessaoForm.meta_ids.includes(m.id))).map(meta => (
                    <label 
                      key={meta.id} 
                      className={`flex items-center gap-3 p-2 rounded-md border transition-all cursor-pointer ${
                        sessaoForm.meta_ids.includes(meta.id) 
                          ? 'bg-blue-50 border-blue-200 text-blue-700' 
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-600'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                        sessaoForm.meta_ids.includes(meta.id) ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'
                      }`}>
                        {sessaoForm.meta_ids.includes(meta.id) && (
                          <div className="w-1.5 h-1.5 bg-white rounded-full" />
                        )}
                      </div>
                      <input 
                        type="checkbox"
                        className="hidden"
                        checked={sessaoForm.meta_ids.includes(meta.id)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setSessaoForm(prev => ({
                            ...prev,
                            meta_ids: checked 
                              ? [...prev.meta_ids, meta.id]
                              : prev.meta_ids.filter(id => id !== meta.id)
                          }));
                        }}
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium leading-none">{meta.titulo}</span>
                        {meta.prazo && (
                          <span className="text-[10px] opacity-70 mt-1">Prazo: {new Date(meta.prazo).toLocaleDateString('pt-BR')}</span>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Progresso Percebido (0-10)</Label>
                <span className="text-sm font-bold text-blue-600">{sessaoForm.progresso}</span>
              </div>
              <Slider 
                value={[sessaoForm.progresso]} 
                max={10} 
                step={1} 
                onValueChange={(val) => setSessaoForm({ ...sessaoForm, progresso: val[0] })} 
              />
            </div>
            <div className="space-y-2">
              <Label>Notas e Observações</Label>
              <Textarea 
                value={sessaoForm.notas} 
                onChange={e => setSessaoForm({ ...sessaoForm, notas: e.target.value })} 
                placeholder="O que foi discutido? Quais os próximos passos?"
                className="min-h-[120px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSessaoDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => mutationSessao.mutate(sessaoForm)} disabled={mutationSessao.isPending}>
              {mutationSessao.isPending ? 'Salvando...' : 'Salvar Sessão'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ title, value, subValue, icon, trend }: { title: string, value: string, subValue: string, icon: React.ReactNode, trend?: 'up' | 'down' }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-none shadow-lg shadow-slate-200/40 hover:shadow-xl transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center">
            {icon}
            <span className="ml-2">{title}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-bold text-slate-800">{value}</div>
            {trend && (
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${trend === 'up' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                {trend === 'up' ? '↑' : '↓'}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1 font-medium">{subValue}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
