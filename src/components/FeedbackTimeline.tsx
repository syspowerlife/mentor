import React from 'react';
import { motion } from 'motion/react';
import { MessageSquare, User, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface FeedbackTimelineProps {
  feedbacks: any[];
}

export function FeedbackTimeline({ feedbacks }: FeedbackTimelineProps) {
  const sortedFeedbacks = [...feedbacks].sort((a, b) => 
    new Date(b.data).getTime() - new Date(a.data).getTime()
  );

  if (feedbacks.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400 italic">
        Nenhum feedback registrado ainda.
      </div>
    );
  }

  return (
    <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
      {sortedFeedbacks.map((fb, index) => (
        <motion.div
          key={fb.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
        >
          {/* Icon */}
          <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-100 group-[.is-active]:bg-blue-600 text-slate-500 group-[.is-active]:text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
            <MessageSquare className="w-5 h-5" />
          </div>
          
          {/* Content */}
          <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between space-x-2 mb-1">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <User className="w-4 h-4 text-blue-500" />
                <span>Gestor</span>
              </div>
              <time className="flex items-center gap-1 text-xs font-medium text-slate-400">
                <Calendar className="w-3 h-3" />
                {format(new Date(fb.data), "dd 'de' MMMM", { locale: ptBR })}
              </time>
            </div>
            <div className="text-slate-600 text-sm leading-relaxed">
              {fb.descricao}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
