import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip
} from 'recharts';

interface CompetencyGapChartProps {
  data: any[];
  competencias: any[];
}

export function CompetencyGapChart({ data, competencias }: CompetencyGapChartProps) {
  const chartData = data.map(pc => {
    const comp = competencias.find(c => c.id === pc.competencia_id);
    return {
      subject: comp?.nome || 'Desconhecida',
      atual: Number(pc.nivel_atual),
      meta: Number(pc.nivel_meta),
      fullMark: 5,
    };
  });

  if (chartData.length < 3) {
    return (
      <div className="h-[300px] flex items-center justify-center text-slate-400 text-sm italic border-2 border-dashed border-slate-100 rounded-xl">
        Adicione pelo menos 3 competências para visualizar o gráfico de radar.
      </div>
    );
  }

  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12 }} />
          <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
          <Radar
            name="Nível Atual"
            dataKey="atual"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.5}
          />
          <Radar
            name="Nível Meta"
            dataKey="meta"
            stroke="#10b981"
            fill="#10b981"
            fillOpacity={0.3}
          />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
