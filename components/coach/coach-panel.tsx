import type { ReactNode } from 'react';
import { BrainCircuit, ShieldAlert, Sparkles, Target } from 'lucide-react';
import { CoachReport } from '@/lib/coach';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn, formatCurrency, formatPercent } from '@/lib/utils';

export function CoachPanel({ report, compact = false }: { report: CoachReport; compact?: boolean }) {
  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardHeader className="flex flex-row items-start justify-between gap-4 border-b border-border px-5 py-4">
        <div>
          <div className="flex items-center gap-2">
            <BrainCircuit className="h-4 w-4 text-accent" />
            <CardTitle className="text-base">ArminIR AI Coach</CardTitle>
          </div>
          <p className="mt-2 text-sm text-zinc-400">
            {report.periodLabel} summary · {report.summary.tradeCount} trades · {formatCurrency(report.summary.netPnl)} net P&amp;L
          </p>
        </div>
        <Badge className="border-accent/20 bg-accent/10 text-accent">No trade advice</Badge>
      </CardHeader>

      <CardContent className="space-y-5 p-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <ScoreChip label="Discipline" value={report.scores.discipline} />
          <ScoreChip label="Consistency" value={report.scores.consistency} />
          <ScoreChip label="Risk" value={report.scores.riskManagement} />
          <ScoreChip label="Plan" value={report.scores.planAdherence} />
          <ScoreChip label="Emotional" value={report.scores.emotionalControl} />
        </div>

        <div className={cn('grid gap-4', compact ? 'xl:grid-cols-2' : 'xl:grid-cols-3')}>
          <InsightColumn
            title="What is working"
            icon={<Sparkles className="h-4 w-4 text-emerald-300" />}
            items={report.strengths}
            empty="Add more tagged trades to surface strengths."
          />
          <InsightColumn
            title="What is hurting results"
            icon={<ShieldAlert className="h-4 w-4 text-rose-300" />}
            items={report.mistakes}
            empty="No repeated mistake pattern detected yet."
          />
          {!compact ? (
            <InsightColumn
              title="Behavior patterns"
              icon={<Target className="h-4 w-4 text-amber-300" />}
              items={report.behavioralPatterns}
              empty="No meaningful behavior pattern detected yet."
            />
          ) : null}
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-border bg-soft/40 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-muted">Actionable next focus</div>
            <div className="mt-3 space-y-2 text-sm text-zinc-200">
              {report.actions.map((action) => (
                <div key={action} className="rounded-xl border border-border bg-black/20 px-3 py-2">• {action}</div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-soft/40 p-4 text-sm text-zinc-300">
            <div className="text-xs uppercase tracking-[0.18em] text-muted">Coach read</div>
            <div className="mt-3 space-y-2">
              <div>Win rate: <span className="font-medium text-white">{formatPercent(report.summary.winRate)}</span></div>
              <div>Profit factor: <span className="font-medium text-white">{report.summary.profitFactor.toFixed(2)}</span></div>
              <div>Expectancy: <span className="font-medium text-white">{formatCurrency(report.summary.expectancy)}</span></div>
              <div>Average R: <span className="font-medium text-white">{report.summary.avgR.toFixed(2)}</span></div>
              {report.highlights.bestSetup ? <div>Best setup: <span className="font-medium text-white">{report.highlights.bestSetup}</span></div> : null}
              {report.highlights.bestTimeBucket ? <div>Best time: <span className="font-medium text-white">{report.highlights.bestTimeBucket}</span></div> : null}
              <div className="pt-2 text-xs leading-5 text-zinc-400">{report.dataQuality.notes}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ScoreChip({ label, value }: { label: string; value: number }) {
  const tone = value >= 75
    ? 'text-emerald-300 border-emerald-500/20 bg-emerald-500/10'
    : value >= 55
      ? 'text-amber-200 border-amber-500/20 bg-amber-500/10'
      : 'text-rose-200 border-rose-500/20 bg-rose-500/10';
  return (
    <div className={cn('rounded-2xl border px-4 py-3', tone)}>
      <div className="text-[11px] uppercase tracking-[0.18em] opacity-75">{label}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function InsightColumn({
  title,
  items,
  empty,
  icon,
}: {
  title: string;
  items: CoachReport['strengths'];
  empty: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-soft/30 p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-white">{icon}{title}</div>
      <div className="mt-3 space-y-3">
        {items.length ? items.map((item) => (
          <div key={item.title} className="rounded-xl border border-border bg-black/20 px-3 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-medium text-white">{item.title}</div>
              <Badge>{item.confidence}</Badge>
            </div>
            <div className="mt-2 text-sm leading-6 text-zinc-400">{item.evidence}</div>
          </div>
        )) : <div className="text-sm text-zinc-500">{empty}</div>}
      </div>
    </div>
  );
}
