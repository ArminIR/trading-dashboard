import { ReactNode } from 'react';
import { Sparkles } from 'lucide-react';
import { Card, CardContent } from './card';

export function EmptyState({ title, description, action, tips }: { title: string; description: string; action?: ReactNode; tips?: string[] }) {
  return (
    <Card className="border-dashed border-white/10 bg-white/[0.03]">
      <CardContent className="flex min-h-[220px] flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="rounded-full border border-white/10 bg-white/[0.05] p-3 text-accent">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="text-lg font-medium text-white">{title}</div>
        <p className="max-w-md text-sm leading-6 text-muted">{description}</p>
        {tips?.length ? (
          <div className="max-w-lg rounded-2xl border border-border bg-soft/50 px-4 py-3 text-left text-sm text-zinc-300">
            {tips.map((tip) => <div key={tip}>• {tip}</div>)}
          </div>
        ) : null}
        {action}
      </CardContent>
    </Card>
  );
}
