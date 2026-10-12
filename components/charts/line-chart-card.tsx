'use client';

import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartCard } from './chart-card';
import { formatCurrency } from '@/lib/utils';

export function LineChartCard({ title, data, xKey, yKey, subtitle }: { title: string; data: any[]; xKey: string; yKey: string; subtitle?: string }) {
  return (
    <ChartCard title={title} subtitle={subtitle}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid stroke="#242736" strokeDasharray="3 3" />
          <XAxis dataKey={xKey} stroke="#71717a" tickLine={false} axisLine={false} />
          <YAxis stroke="#71717a" tickFormatter={(value) => `$${value}`} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={{ background: '#111217', border: '1px solid #242736', borderRadius: 12 }} formatter={(value: number) => formatCurrency(Number(value))} />
          <Line type="monotone" dataKey={yKey} stroke="#5eead4" strokeWidth={2.2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
