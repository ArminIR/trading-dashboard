'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartCard } from './chart-card';
import { formatCurrency } from '@/lib/utils';

export function BarChartCard({ title, data, xKey, yKey, subtitle }: { title: string; data: any[]; xKey: string; yKey: string; subtitle?: string }) {
  return (
    <ChartCard title={title} subtitle={subtitle}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid stroke="#242736" strokeDasharray="3 3" />
          <XAxis dataKey={xKey} stroke="#71717a" tickLine={false} axisLine={false} />
          <YAxis stroke="#71717a" tickLine={false} axisLine={false} />
          <Tooltip contentStyle={{ background: '#111217', border: '1px solid #242736', borderRadius: 12 }} formatter={(value: number) => formatCurrency(Number(value))} />
          <Bar dataKey={yKey} fill="#60a5fa" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
