import React, { useState, useEffect, useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  deleteDoc, 
  doc,
  Timestamp,
  or
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PieChart, Activity, Users, Star, Trash2, MessageSquareHeart, TrendingUp, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { safeFormat } from '@/lib/utils';

export function MinhasAvaliacoes() {
  const { user } = useAuth();
  const [abaAtiva, setAbaAtiva] = useState('roda');
  const [deletingItem, setDeletingItem] = useState<{ id: string, collection: string } | null>(null);

  const [rodas, setRodas] = useState<any[]>([]);
  const [swots, setSwots] = useState<any[]>([]);
  const [discs, setDiscs] = useState<any[]>([]);
  const [valores, setValores] = useState<any[]>([]);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const unsubscribes: (() => void)[] = [];

    const setupListener = (colName: string, setter: (data: any[]) => void, filterField = 'created_by') => {
      const q = query(
        collection(db, colName),
        or(
          where('created_by', '==', user.uid),
          where('profissional_id', '==', user.uid),
          where('cliente_uid', '==', user.uid),
          where('mentor_id', '==', user.uid)
        ),
        orderBy(colName === 'avaliacoes_sessoes' ? 'data' : (colName === 'rodas_da_vida' ? 'created_date' : 'created_at'), 'desc')
      );
      return onSnapshot(q, (snap) => {
        setter(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }, (error) => {
        console.error(`Error loading ${colName}:`, error);
        handleFirestoreError(error, OperationType.LIST, colName);
      });
    };

    unsubscribes.push(setupListener('rodas_da_vida', setRodas));
    unsubscribes.push(setupListener('analises_swot', setSwots));
    unsubscribes.push(setupListener('perfis_disc', setDiscs));
    unsubscribes.push(setupListener('valores_pessoais', setValores));
    unsubscribes.push(setupListener('avaliacoes_sessoes', setFeedbacks, 'mentor_id'));

    setLoading(false);
    return () => unsubscribes.forEach(unsub => unsub());
  }, [user]);

  const deleteMutation = useMutation({
    mutationFn: async ({ id, collection }: { id: string, collection: string }) => {
      try {
        await deleteDoc(doc(db, collection, id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, collection);
      }
    },
    onSuccess: () => {
      setDeletingItem(null);
      toast.success('Avaliação excluída!');
    },
    onError: (error: any) => toast.error(error.message || 'Erro ao excluir avaliação.')
  });

  const npsData = useMemo(() => {
    if (feedbacks.length === 0) return { nps: 0, promoters: 0, passives: 0, detractors: 0 };
    
    const promoters = feedbacks.filter(f => f.nota === 5).length;
    const passives = feedbacks.filter(f => f.nota === 4).length;
    const detractors = feedbacks.filter(f => f.nota <= 3).length;
    const total = feedbacks.length;

    const nps = Math.round(((promoters - detractors) / total) * 100);
    
    return {
      nps,
      promoters: Math.round((promoters / total) * 100),
      passives: Math.round((passives / total) * 100),
      detractors: Math.round((detractors / total) * 100)
    };
  }, [feedbacks]);

  const abas = [
    { id: 'roda', label: 'Roda da Vida', icon: <PieChart className="w-4 h-4" />, data: rodas, collection: 'rodas_da_vida' },
    { id: 'swot', label: 'Análise SWOT', icon: <Activity className="w-4 h-4" />, data: swots, collection: 'analises_swot' },
    { id: 'disc', label: 'Perfil DISC', icon: <Users className="w-4 h-4" />, data: discs, collection: 'perfis_disc' },
    { id: 'valores', label: 'Valores Pessoais', icon: <Star className="w-4 h-4" />, data: valores, collection: 'valores_pessoais' },
    { id: 'feedbacks', label: 'Feedbacks', icon: <MessageSquareHeart className="w-4 h-4" />, data: feedbacks, collection: 'avaliacoes_sessoes' },
  ];

  const renderCardContent = (item: any, tipo: string) => {
    switch(tipo) {
      case 'roda':
        const areas = [
          'saude_fisica', 'desenvolvimento_mental', 'inteligencia_emocional', 'familia',
          'romance', 'vida_social', 'carreira', 'financas', 'contribuicao_social',
          'divertimento_lazer', 'saude_ambiente'
        ];
        const avg = areas.reduce((acc, area) => acc + (item[area] || 0), 0) / areas.length;
        return (
          <div className="mt-4">
            <Badge variant="secondary" className="mb-2 capitalize">{item.tipo_avaliacao || 'Atual'}</Badge>
            <p className="text-sm text-slate-500 font-medium">Média Geral: <span className="text-blue-600">{avg.toFixed(1)}</span></p>
          </div>
        );
      case 'swot':
        return (
          <div className="mt-4 flex gap-2 flex-wrap">
            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">{item.forcas?.length || 0} Forças</Badge>
            <Badge className="bg-red-100 text-red-700 hover:bg-red-100">{item.fraquezas?.length || 0} Fraquezas</Badge>
            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">{item.oportunidades?.length || 0} Oport.</Badge>
            <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">{item.ameacas?.length || 0} Ameaças</Badge>
          </div>
        );
      case 'disc':
        return (
          <div className="mt-4">
            <Badge className="bg-blue-600 text-white text-lg px-3 py-1">Perfil {item.perfil_dominante}</Badge>
          </div>
        );
      case 'valores':
        return (
          <div className="mt-4 flex flex-wrap gap-1">
            {item.valores_selecionados?.slice(0, 3).map((v: any) => (
              <Badge key={v.valor} variant="outline">{v.valor}</Badge>
            ))}
            {item.valores_selecionados?.length > 3 && <Badge variant="outline">+{item.valores_selecionados.length - 3}</Badge>}
          </div>
        );
      case 'feedbacks':
        return (
          <div className="mt-4 space-y-3">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className={`w-4 h-4 ${star <= item.nota ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'}`} />
              ))}
            </div>
            <p className="text-sm text-slate-600 line-clamp-2 italic">"{item.pontosPositivos || 'Sem comentários'}"</p>
          </div>
        );
      default: return null;
    }
  };

  const abaAtual = abas.find(a => a.id === abaAtiva);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Minhas Avaliações</h1>
          <p className="text-slate-500 mt-1">Gerencie e visualize todas as avaliações e feedbacks realizados.</p>
        </div>
        {abaAtiva === 'feedbacks' && feedbacks.length > 0 && (
          <div className="flex items-center gap-4 bg-white p-3 rounded-xl shadow-sm border border-slate-100">
            <div className="text-center px-4 border-r border-slate-100">
              <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">NPS Geral</p>
              <p className={`text-2xl font-black ${npsData.nps > 70 ? 'text-green-600' : npsData.nps > 30 ? 'text-blue-600' : 'text-orange-600'}`}>
                {npsData.nps}
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-[10px] font-bold text-slate-500">{npsData.promoters}% Promotores</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-[10px] font-bold text-slate-500">{npsData.passives}% Passivos</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-[10px] font-bold text-slate-500">{npsData.detractors}% Detratores</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 bg-slate-200/50 p-1 rounded-lg w-fit">
        {abas.map(aba => (
          <button
            key={aba.id}
            onClick={() => setAbaAtiva(aba.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${abaAtiva === aba.id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            {aba.icon}
            {aba.label}
            <span className="ml-1 px-2 py-0.5 rounded-full bg-slate-100 text-xs text-slate-500">{aba.data.length}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {abaAtual?.data.length === 0 ? (
          <div className="col-span-full p-12 text-center text-slate-500 bg-white/60 backdrop-blur-sm rounded-xl border border-slate-200/50 border-dashed">
            <div className="flex flex-col items-center gap-3">
              <Filter className="w-8 h-8 text-slate-300" />
              <p>Nenhuma avaliação encontrada para esta categoria.</p>
            </div>
          </div>
        ) : (
          abaAtual?.data.map((item: any) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="bg-white/60 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow group relative h-full flex flex-col">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg line-clamp-1">{item.titulo || (abaAtiva === 'feedbacks' ? `Feedback de Sessão` : 'Sem Título')}</CardTitle>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => setDeletingItem({ id: item.id, collection: abaAtual.collection })}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500">
                    {(() => {
                      const dateObj = item.data || item.created_date || item.created_at || item.data_avaliacao || item.data_analise;
                      return safeFormat(dateObj, "dd 'de' MMMM 'de' yyyy", 'Data não disponível');
                    })()}
                  </p>
                </CardHeader>
                <CardContent className="flex-1">
                  {renderCardContent(item, abaAtiva)}
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      <DeleteConfirmDialog 
        isOpen={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        onConfirm={() => deletingItem && deleteMutation.mutate(deletingItem)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
