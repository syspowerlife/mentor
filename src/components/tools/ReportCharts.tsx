import React from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface RodaData {
  subject: string;
  A: number;
}

export function RodaReportChart({ data }: { data: RodaData[] }) {
  return (
    <div className="w-[600px] h-[400px] mx-auto bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
      <RadarChart cx="50%" cy="50%" outerRadius="80%" width={560} height={360} data={data}>
        <PolarGrid />
        <PolarAngleAxis dataKey="subject" tick={{fontSize: 10, fill: '#64748b'}} />
        <PolarRadiusAxis angle={30} domain={[0, 10]} />
        <Radar name="Valor" dataKey="A" stroke="#2563eb" fill="#3b82f6" fillOpacity={0.6} />
      </RadarChart>
    </div>
  );
}

export function DiscReportChart({ data }: { data: any[] }) {
  return (
    <div className="w-[600px] h-[300px] mx-auto bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
      <BarChart width={560} height={260} data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" />
        <YAxis domain={[0, 100]} />
        <Tooltip />
        <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </div>
  );
}
