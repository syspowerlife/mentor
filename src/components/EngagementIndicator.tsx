import React from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

interface EngagementIndicatorProps {
  userId: string;
  activityData?: any[]; // Mock or real data
}

export function EngagementIndicator({ userId, activityData }: EngagementIndicatorProps) {
  // Mock activity data if none provided
  // In a real app, this would be fetched based on the userId
  const data = activityData || [
    { day: 1, value: 2 },
    { day: 2, value: 5 },
    { day: 3, value: 3 },
    { day: 4, value: 8 },
    { day: 5, value: 4 },
    { day: 6, value: 10 },
    { day: 7, value: 7 },
  ];

  return (
    <div className="flex items-center gap-3">
      <div className="h-8 w-24">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="#3b82f6" 
              fillOpacity={1} 
              fill="url(#colorValue)" 
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded uppercase tracking-wider">
        Ativo
      </div>
    </div>
  );
}
