import { ReactNode } from 'react';
import { Card, CardContent } from './card';
import { cn } from '@/lib/utils';

export function StatCard({
  label,
  value,
  hint,
  tone = 'default',
  icon,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: 'default' | 'positive' | 'negative';
  icon?: ReactNode;
}) {
  return (
    <Card className={cn(
      'overflow-hidden border-white/10 bg-white/[0.03]',
      tone === 'positive' && 'shadow-[0_0_0_1px_rgba(52,211,153,0.16)]',
      tone === 'negative' && 'shadow-[0_0_0_1px_rgba(248,113,113,0.16)]',
    )}>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs uppercase tracking-[0.2em] text-muted">{label}</div>
          {icon ? <div className="text-zinc-400">{icon}</div> : null}
        </div>
        <div className="text-2xl font-semibold text-white">{value}</div>
        {hint ? <div className="text-xs leading-5 text-muted">{hint}</div> : null}
      </CardContent>
    </Card>
  );
}
