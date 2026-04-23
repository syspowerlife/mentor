import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Target, 
  Activity, 
  Calendar, 
  FileText, 
  CheckCircle2, 
  Clock,
  User
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ConsolidatedReportTemplateProps {
  cliente: any;
  metas: any[];
  agendamentos: any[];
  notas: any[];
  mentorName?: string;
}

export function ConsolidatedReportTemplate({ 
  cliente, 
  metas, 
  agendamentos, 
  notas,
  mentorName 
}: ConsolidatedReportTemplateProps) {
  if (!cliente) return null;

  const activeMetas = metas.filter(m => m.status !== 'concluido');
  const completedMetas = metas.filter(m => m.status === 'concluido');
  const pastAgendamentos = agendamentos.filter(a => a.status === 'concluido');
  const upcomingAgendamentos = agendamentos.filter(a => a.status === 'pendente');

  return (
    <div id="consolidated-report-content" className="p-8 bg-white text-slate-900 space-y-8 max-w-[800px] mx-auto">
      {/* Header Info */}
      <div className="border-b border-slate-200 pb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">{cliente.nome}</h1>
            <p className="text-slate-500 mt-1">{cliente.email}</p>
          </div>
          <div className="text-right">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100">
              Relatório Consolidado
            </Badge>
            <p className="text-xs text-slate-400 mt-2">
              Gerado em {format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Início do Processo</p>
            <p className="text-sm font-medium">{format(new Date(cliente.data_inicio), "dd/MM/yyyy")}</p>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Mentor Responsável</p>
            <p className="text-sm font-medium">{mentorName || 'Profissional PowerLife'}</p>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status Atual</p>
            <Badge variant={cliente.status === 'ativo' ? 'success' : 'secondary'} className="mt-1">
              {cliente.status === 'ativo' ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Metas SMART */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
          <Target className="w-5 h-5 text-blue-600" />
          Objetivos e Metas SMART
        </h2>
        <div className="grid grid-cols-1 gap-3">
          {metas.length > 0 ? metas.map((meta) => (
            <div key={meta.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <div>
                <h4 className="font-bold text-slate-800">{meta.titulo}</h4>
                <p className="text-xs text-slate-500 mt-1">Prazo: {meta.prazo}</p>
              </div>
              <Badge variant={meta.status === 'concluido' ? 'success' : 'default'} className={meta.status === 'em_andamento' ? 'bg-blue-500' : ''}>
                {meta.status === 'em_andamento' ? 'Em Andamento' : meta.status === 'concluido' ? 'Concluída' : 'Pendente'}
              </Badge>
            </div>
          )) : (
            <p className="text-sm text-slate-400 italic">Nenhuma meta registrada.</p>
          )}
        </div>
      </section>

      {/* Resumo de Sessões */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
          <Activity className="w-5 h-5 text-green-600" />
          Evolução e Sessões
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-slate-100 bg-white shadow-sm">
            <p className="text-2xl font-bold text-slate-800">{pastAgendamentos.length}</p>
            <p className="text-xs text-slate-500">Sessões Realizadas</p>
          </div>
          <div className="p-4 rounded-xl border border-slate-100 bg-white shadow-sm">
            <p className="text-2xl font-bold text-slate-800">{upcomingAgendamentos.length}</p>
            <p className="text-xs text-slate-500">Sessões Agendadas</p>
          </div>
        </div>
      </section>

      {/* Anotações Profissionais (Resumo) */}
      {notas.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
            <FileText className="w-5 h-5 text-purple-600" />
            Observações do Mentor
          </h2>
          <div className="space-y-3">
            {notas.slice(0, 3).map((nota) => (
              <div key={nota.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/30">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">
                  {nota.created_at?.toDate ? format(nota.created_at.toDate(), "dd/MM/yyyy", { locale: ptBR }) : 'Recentemente'}
                </p>
                <p className="text-sm text-slate-700 leading-relaxed italic">"{nota.content.substring(0, 200)}{nota.content.length > 200 ? '...' : ''}"</p>
              </div>
            ))}
            {notas.length > 3 && (
              <p className="text-xs text-slate-400 text-center">+ {notas.length - 3} outras anotações no histórico.</p>
            )}
          </div>
        </section>
      )}

      {/* Footer Relatório */}
      <div className="pt-8 border-t border-slate-100 text-center">
        <p className="text-[10px] text-slate-400 leading-relaxed">
          Este documento é confidencial e destinado exclusivamente ao acompanhamento do processo de mentoring.<br />
          Gerado automaticamente pela plataforma PowerLife.
        </p>
      </div>
    </div>
  );
}
