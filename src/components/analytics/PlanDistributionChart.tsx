import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface PlanDistributionChartProps {
  data: {
    name: string;
    value: number;
  }[];
}

const COLORS = {
  free: '#94a3b8',   // slate-400
  pro: '#3b82f6',    // blue-500
  master: '#4f46e5', // indigo-600
};

export function PlanDistributionChart({ data }: PlanDistributionChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400 text-sm italic">
        Sem dados de distribuição disponíveis.
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((entry: any) => (
              <Cell 
                key={`cell-${entry.name}`} 
                fill={COLORS[entry.name.toLowerCase() as keyof typeof COLORS] || '#cbd5e1'} 
              />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
          />
          <Legend verticalAlign="bottom" height={36}/>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
