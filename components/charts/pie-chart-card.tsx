'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { ChartCard } from './chart-card';

const colors = ['#5eead4', '#60a5fa', '#f59e0b', '#fb7185', '#a78bfa', '#34d399'];

export function PieChartCard({ title, data, dataKey, nameKey, subtitle }: { title: string; data: any[]; dataKey: string; nameKey: string; subtitle?: string }) {
  return (
    <ChartCard title={title} subtitle={subtitle}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey={dataKey} nameKey={nameKey} innerRadius={58} outerRadius={92} paddingAngle={2}>
            {data.map((_, index) => (
              <Cell key={index} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ background: '#111217', border: '1px solid #242736', borderRadius: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
