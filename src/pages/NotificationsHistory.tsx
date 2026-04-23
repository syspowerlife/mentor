import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, limit, getDocs, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Info, AlertTriangle, CheckCircle2, Trash2, Check, Filter } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { markNotificationAsRead, markAllNotificationsAsRead } from '@/lib/notifications';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  link?: string;
  createdAt: any;
}

export function NotificationsHistory() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'info' | 'success' | 'warning' | 'error'>('all');

  useEffect(() => {
    if (!user) return;

    const path = 'notifications';
    let q = query(
      collection(db, path),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
      
      setNotifications(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.read;
    return n.type === filter;
  });

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    try {
      await markAllNotificationsAsRead(user.uid);
      toast.success('Todas as notificações foram marcadas como lidas.');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao marcar notificações como lidas.');
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar notificação.');
    }
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'info': return <Info className="w-5 h-5 text-blue-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'success': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'error': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default: return <Bell className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <Bell className="w-8 h-8 text-blue-600" />
            Histórico de Notificações
          </h1>
          <p className="text-slate-500 mt-1">Acompanhe todos os alertas e atualizações do seu sistema.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleMarkAllAsRead}
            disabled={!notifications.some(n => !n.read)}
            className="text-slate-600 border-slate-200 hover:bg-slate-50"
          >
            <Check className="w-4 h-4 mr-2" />
            Marcar todas como lidas
          </Button>
        </div>
      </div>

      <Card className="bg-white/60 backdrop-blur-sm shadow-sm border-slate-200 overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <Tabs value={filter} onValueChange={(v: any) => setFilter(v)} className="w-full sm:w-auto">
              <TabsList className="bg-slate-200/50">
                <TabsTrigger value="all" className="text-xs">Todas</TabsTrigger>
                <TabsTrigger value="unread" className="text-xs">Não lidas</TabsTrigger>
                <TabsTrigger value="info" className="text-xs">Info</TabsTrigger>
                <TabsTrigger value="success" className="text-xs">Sucesso</TabsTrigger>
                <TabsTrigger value="warning" className="text-xs">Alertas</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="text-xs text-slate-400 font-medium flex items-center gap-2">
              <Filter className="w-3 h-3" />
              Exibindo {filteredNotifications.length} notificações
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-slate-500 text-sm">Carregando notificações...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800">Nenhuma notificação encontrada</h3>
              <p className="text-slate-500 mt-1 max-w-xs mx-auto">
                {filter === 'all' 
                  ? "Você ainda não recebeu nenhuma notificação do sistema." 
                  : "Não há notificações que correspondam ao filtro selecionado."}
              </p>
              {filter !== 'all' && (
                <Button variant="link" onClick={() => setFilter('all')} className="mt-2 text-blue-600">
                  Ver todas as notificações
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              <AnimatePresence mode="popLayout">
                {filteredNotifications.map((n) => (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={cn(
                      "group p-5 flex items-start gap-4 transition-all hover:bg-slate-50/80 relative",
                      !n.read && "bg-blue-50/40 border-l-4 border-l-blue-500"
                    )}
                  >
                    <div className={cn(
                      "mt-1 p-2 rounded-lg",
                      n.type === 'info' && "bg-blue-100/50",
                      n.type === 'success' && "bg-green-100/50",
                      n.type === 'warning' && "bg-amber-100/50",
                      n.type === 'error' && "bg-red-100/50"
                    )}>
                      {getIcon(n.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className={cn(
                          "text-sm font-bold truncate",
                          !n.read ? "text-blue-900" : "text-slate-800"
                        )}>
                          {n.title}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                          {n.createdAt?.toDate ? formatDistanceToNow(n.createdAt.toDate(), { addSuffix: true, locale: ptBR }) : 'Agora'}
                        </span>
                      </div>
                      <p className={cn(
                        "text-sm leading-relaxed",
                        !n.read ? "text-slate-700 font-medium" : "text-slate-500"
                      )}>
                        {n.message}
                      </p>
                      
                      <div className="mt-3 flex items-center gap-3">
                        {!n.read && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleMarkAsRead(n.id)}
                            className="h-7 px-2 text-[10px] font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 uppercase tracking-wider"
                          >
                            Marcar como lida
                          </Button>
                        )}
                        {n.link && (
                          <Button 
                            variant="link" 
                            size="sm" 
                            className="h-7 p-0 text-[10px] font-bold text-slate-400 hover:text-blue-600 uppercase tracking-wider"
                            onClick={() => window.location.href = n.link!}
                          >
                            Ver detalhes
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {!n.read && (
                      <div className="absolute top-5 right-5 w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="text-center">
        <p className="text-xs text-slate-400">
          As notificações são removidas automaticamente após 30 dias de inatividade.
        </p>
      </div>
    </div>
  );
}
