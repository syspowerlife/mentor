import React from 'react';
import { motion } from 'motion/react';
import { 
  MessageSquare, 
  Target, 
  Calendar, 
  FileText, 
  TrendingUp, 
  ChevronRight,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useClientActivity, Activity } from '@/hooks/useClientActivity';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface ActivityTimelineProps {
  clientId: string | null;
}

const getActivityIcon = (type: Activity['type']) => {
  switch (type) {
    case 'feedback': return <MessageSquare className="w-4 h-4" />;
    case 'meta': return <Target className="w-4 h-4" />;
    case 'sessao': return <Calendar className="w-4 h-4" />;
    case 'anexo': return <FileText className="w-4 h-4" />;
    case 'pdi': return <TrendingUp className="w-4 h-4" />;
    default: return <ChevronRight className="w-4 h-4" />;
  }
};

const getActivityColor = (type: Activity['type']) => {
  switch (type) {
    case 'feedback': return 'bg-purple-100 text-purple-600 border-purple-200';
    case 'meta': return 'bg-blue-100 text-blue-600 border-blue-200';
    case 'sessao': return 'bg-green-100 text-green-600 border-green-200';
    case 'anexo': return 'bg-orange-100 text-orange-600 border-orange-200';
    case 'pdi': return 'bg-indigo-100 text-indigo-600 border-indigo-200';
    default: return 'bg-slate-100 text-slate-600 border-slate-200';
  }
};

export function ActivityTimeline({ clientId }: ActivityTimelineProps) {
  const { activities, loading } = useClientActivity(clientId);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="w-10 h-10 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <Card className="p-8 text-center border-dashed bg-slate-50/50">
        <div className="flex flex-col items-center gap-2 text-slate-400">
          <Clock className="w-8 h-8 opacity-20" />
          <p className="text-sm font-medium">Nenhuma atividade recente registrada.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="relative space-y-6 before:absolute before:inset-0 before:left-[19px] before:h-full before:w-0.5 before:bg-slate-100">
      {activities.map((activity, index) => (
        <motion.div
          key={activity.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          className="relative pl-12 group"
        >
          {/* Icon node */}
          <div className={`absolute left-0 top-0 w-10 h-10 rounded-full border-2 border-white shadow-sm flex items-center justify-center transition-transform group-hover:scale-110 z-10 ${getActivityColor(activity.type)}`}>
            {getActivityIcon(activity.type)}
          </div>
          
          {/* Content */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {activity.type === 'sessao' ? 'Sessão' : (activity.type === 'meta' ? 'Meta' : activity.type)}
                </span>
                {activity.status && (
                  <Badge variant="outline" className="text-[10px] uppercase h-4 px-1 leading-none border-blue-100 text-blue-600 bg-blue-50/50">
                    {activity.status}
                  </Badge>
                )}
              </div>
              <time className="text-[11px] font-medium text-slate-400">
                {format(activity.timestamp, "dd 'de' MMM, HH:mm", { locale: ptBR })}
              </time>
            </div>
            
            <h4 className="text-sm font-bold text-slate-800 mb-1 group-hover:text-blue-600 transition-colors">
              {activity.title}
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              {activity.description}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
