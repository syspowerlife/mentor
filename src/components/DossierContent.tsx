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
  User,
  Star,
  TrendingUp,
  Brain
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';

interface DossierContentProps {
  data: any;
  mentorName?: string;
  isPrintVersion?: boolean;
}

export function DossierContent({ data, mentorName, isPrintVersion = false }: DossierContentProps) {
  if (!data || !data.profile) return null;

  const { profile, rodaData, discData, metas, sessoes, avaliacoes, pdiAcoes, notas } = data;

  const totalSessoes = sessoes?.length || 0;
  const avgSatisfaction = avaliacoes && avaliacoes.length > 0 
    ? (avaliacoes.reduce((acc: number, curr: any) => acc + curr.nota, 0) / avaliacoes.length).toFixed(1)
    : '0.0';
  const metasConcluidas = metas?.filter((m: any) => m.status === 'concluido').length || 0;
  const totalMetas = metas?.length || 0;
  const metaCompletionRate = totalMetas > 0 ? Math.round((metasConcluidas / totalMetas) * 100) : 0;

  const rodaChartData = rodaData ? [
    { subject: 'Saúde', A: rodaData.saude_fisica || 0, fullMark: 10 },
    { subject: 'Mental', A: rodaData.desenvolvimento_mental || 0, fullMark: 10 },
    { subject: 'Emocional', A: rodaData.inteligencia_emocional || 0, fullMark: 10 },
    { subject: 'Família', A: rodaData.familia || 0, fullMark: 10 },
    { subject: 'Romance', A: rodaData.romance || 0, fullMark: 10 },
    { subject: 'Social', A: rodaData.vida_social || 0, fullMark: 10 },
    { subject: 'Carreira', A: rodaData.carreira || 0, fullMark: 10 },
    { subject: 'Finanças', A: rodaData.financas || 0, fullMark: 10 },
    { subject: 'Contribuição', A: rodaData.contribuicao_social || 0, fullMark: 10 },
    { subject: 'Lazer', A: rodaData.divertimento_lazer || 0, fullMark: 10 },
    { subject: 'Ambiente', A: rodaData.saude_ambiente || 0, fullMark: 10 },
  ] : null;

  const discChartData = discData ? [
    { name: 'Dominância', value: discData.dominancia || 0 },
    { name: 'Influência', value: discData.influencia || 0 },
    { name: 'Estabilidade', value: discData.estabilidade || 0 },
    { name: 'Conformidade', value: discData.conformidade || 0 },
  ] : null;

  return (
    <div id="dossier-content" className={`bg-white text-slate-900 space-y-8 ${isPrintVersion ? 'p-0' : 'p-8 max-w-5xl mx-auto shadow-sm rounded-xl border border-slate-100'}`}>
      {/* Header Info */}
      <div className="border-b border-slate-200 pb-6">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-2xl">
              {profile.name?.charAt(0) || 'U'}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">{profile.name}</h1>
              <p className="text-slate-500 mt-1">{profile.email}</p>
            </div>
          </div>
          <div className="text-right">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100 px-3 py-1 text-sm">
              Dossiê de Evolução Consolidado
            </Badge>
            <p className="text-xs text-slate-400 mt-2 italic">
              Gerado em {format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Mentor Responsável</p>
            <p className="text-sm font-semibold">{mentorName || 'Equipe PowerLife'}</p>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Sessões</p>
            <p className="text-sm font-semibold">{totalSessoes}</p>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Satisfação Geral</p>
            <p className="text-sm font-semibold">{avgSatisfaction} / 5.0</p>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Taxa de Sucesso</p>
            <p className="text-sm font-semibold text-blue-600">{metaCompletionRate}%</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Roda da Vida */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Equilíbrio de Vida
          </h2>
          {rodaChartData ? (
            <div className="h-[300px] w-full border border-slate-100 rounded-xl p-4 bg-slate-50/30">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={rodaChartData}>
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
            <div className="h-[150px] flex items-center justify-center border border-dashed border-slate-200 rounded-xl text-slate-400 italic text-sm">
              Nenhuma Roda da Vida registrada.
            </div>
          )}
        </section>

        {/* DISC Profile */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
            <Brain className="w-5 h-5 text-purple-600" />
            Perfil Comportamental DISC
          </h2>
          {discChartData ? (
            <div className="h-[300px] w-full border border-slate-100 rounded-xl p-4 bg-slate-50/30">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={discChartData} layout="vertical" margin={{ left: 20, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis dataKey="name" type="category" tick={{ fill: '#64748b', fontSize: 11 }} width={100} />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[150px] flex items-center justify-center border border-dashed border-slate-200 rounded-xl text-slate-400 italic text-sm">
              Perfil DISC ainda não aplicado.
            </div>
          )}
        </section>
      </div>

      {/* METAS SMART */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
          <Target className="w-5 h-5 text-green-600" />
          Objetivos SMART e Evolução
        </h2>
        <div className="grid grid-cols-1 gap-3">
          {metas && metas.length > 0 ? metas.map((meta: any) => (
            <div key={meta.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex justify-between items-center group">
              <div>
                <h4 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{meta.titulo}</h4>
                <div className="flex items-center gap-4 mt-1">
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Prazo: {meta.prazo}
                  </p>
                </div>
              </div>
              <Badge 
                variant={meta.status === 'concluido' ? 'success' : 'outline'}
                className={meta.status === 'em_andamento' ? 'bg-blue-500 text-white border-none' : ''}
              >
                {meta.status === 'em_andamento' ? 'Em Andamento' : meta.status === 'concluido' ? 'Concluída' : 'Pendente'}
              </Badge>
            </div>
          )) : (
            <p className="text-sm text-slate-400 italic">O cliente ainda não definiu metas SMART.</p>
          )}
        </div>
      </section>

      {/* PDI Ações */}
      {pdiAcoes && pdiAcoes.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
            <Activity className="w-5 h-5 text-orange-600" />
            Plano de Desenvolvimento Individual (Ações)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pdiAcoes.slice(0, 4).map((acao: any) => (
              <div key={acao.id} className="p-4 rounded-xl border border-slate-100 bg-white shadow-sm flex gap-3">
                <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${acao.status === 'concluido' ? 'bg-green-500' : 'bg-orange-500'}`} />
                <div>
                  <p className="text-sm font-semibold text-slate-800">{acao.titulo}</p>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-1">{acao.evidencia}</p>
                </div>
              </div>
            ))}
          </div>
          {pdiAcoes.length > 4 && (
            <p className="text-xs text-slate-400 text-right font-medium">+ {pdiAcoes.length - 4} outras ações planejadas.</p>
          )}
        </section>
      )}

      {/* Mentor Private Notes */}
      {notas && notas.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
            <FileText className="w-5 h-5 text-slate-600" />
            Resumo de Evolução (Notas do Mentor)
          </h2>
          <div className="space-y-3">
            {notas.slice(0, 3).map((nota: any) => (
              <div key={nota.id} className="p-4 rounded-xl border border-slate-100 bg-blue-50/30">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">
                    {nota.created_at?.toDate ? format(nota.created_at.toDate(), "dd 'de' MMMM", { locale: ptBR }) : 'Nota Recente'}
                  </p>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed italic line-clamp-3">
                  "{nota.content}"
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Footer Relatório */}
      <div className="pt-8 border-t border-slate-100 text-center">
        <div className="flex justify-center gap-2 mb-4 opacity-30">
          <Star className="w-3 h-3 text-slate-400 fill-slate-400" />
          <Star className="w-3 h-3 text-slate-400 fill-slate-400" />
          <Star className="w-3 h-3 text-slate-400 fill-slate-400" />
        </div>
        <p className="text-[10px] text-slate-400 leading-relaxed max-w-md mx-auto">
          Relatório gerado em ambiente seguro e criptografado.<br />
          Este documento é confidencial e destinado exclusivamente ao acompanhamento do processo de mentoring.<br />
          <strong>© 2026 PowerLife - Excelência em Desenvolvimento Humano</strong>
        </p>
      </div>
    </div>
  );
}
