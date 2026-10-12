import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { Topbar } from '@/components/layout/topbar';
import { requireAuth } from '@/lib/auth';
import { getTrades } from '@/lib/data';
import { buildAnalytics } from '@/lib/analytics';
import { BarChartCard } from '@/components/charts/bar-chart-card';
import { PieChartCard } from '@/components/charts/pie-chart-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { MonthlyPnlCalendar } from '@/components/reports/monthly-pnl-calendar';
import { buildCoachReport } from '@/lib/coach';
import { CoachPanel } from '@/components/coach/coach-panel';

export default async function ReportsPage({ searchParams }: { searchParams?: Promise<{ month?: string }> }) {
  await requireAuth();
  const resolvedSearchParams = (await searchParams) || {};
  const trades = await getTrades();
  const analytics = buildAnalytics(trades);
  const monthlyCoach = buildCoachReport(trades, 'monthly');

  if (!trades.length) {
    return (
      <AppShell>
        <Topbar title="Reports" subtitle="Once trades are logged, this page turns raw results into useful patterns." />
        <EmptyState
          title="No report data yet"
          description="Reports become valuable after you log trades with tags, screenshots, and playbooks."
          tips={['Import a week of trades from CSV.', 'Tag mistakes and emotions for pattern analysis.', 'Link trades to playbooks so best setups stand out.']}
          action={<Link href="/imports"><Button className="bg-accent text-black hover:bg-accent/90">Import trades</Button></Link>}
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Topbar title="Reports" subtitle="See where edge compounds, where process leaks, and which patterns keep repeating." />

      <MonthlyPnlCalendar month={resolvedSearchParams.month} days={analytics.charts.dailyPnl} />

      <div className="mt-6">
        <CoachPanel report={monthlyCoach} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Score title="Consistency" value={`${analytics.summary.consistencyScore}/100`} caption={`Plan adherence ${formatPercent(analytics.summary.planAdherenceRate)}`} />
        <Score title="Positive days" value={formatPercent(analytics.summary.positiveDayRate)} caption={`Best day ${formatCurrency(analytics.summary.bestDay.pnl)}`} />
        <Score title="Average R" value={analytics.summary.averageR.toFixed(2)} caption={`Median R ${analytics.summary.medianR.toFixed(2)}`} />
        <Score title="Max drawdown" value={formatCurrency(analytics.summary.maxDrawdown)} caption="Measured from the equity curve" negative />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <BarChartCard title="Performance by symbol" subtitle="Concentrate on symbols that actually pay you." data={analytics.charts.bySymbol} xKey="symbol" yKey="pnl" />
        <BarChartCard title="Performance by weekday" subtitle="Use this to reduce trading on your historically weak days." data={analytics.charts.byWeekday} xKey="label" yKey="pnl" />
        <BarChartCard title="Time-of-day activity" subtitle="This can reveal revenge-trading windows and your strongest session." data={analytics.charts.byHour} xKey="hour" yKey="trades" />
        <PieChartCard title="Long vs short" subtitle="Compare opportunity quality, not just trade count." data={analytics.insights.longVsShort.map((item) => ({ name: item.side, value: item.trades }))} dataKey="value" nameKey="name" />
        <PieChartCard title="Screenshot-backed trades" subtitle="Visual review often leads to better pattern recognition." data={[{ name: 'With screenshots', value: analytics.insights.screenshotBacked.withScreenshots }, { name: 'Without screenshots', value: analytics.insights.screenshotBacked.withoutScreenshots }]} dataKey="value" nameKey="name" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <InsightList title="Mistake frequency" items={analytics.insights.mistakesFrequency.map((item) => ({ label: item.name, value: `${item.count}x` }))} />
        <InsightList title="Emotion frequency" items={analytics.insights.emotionsFrequency.map((item) => ({ label: item.name, value: `${item.count}x` }))} />
        <InsightList title="Average winner vs loser" items={analytics.insights.averageWinnerVsLoser.map((item) => ({ label: item.label, value: formatCurrency(item.value) }))} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <InsightList title="Best trades" items={analytics.insights.bestTrades.map((trade) => ({ label: `${trade.symbol} · ${trade.side}`, value: formatCurrency(trade.netPnl) }))} />
        <InsightList title="Worst trades" items={analytics.insights.worstTrades.map((trade) => ({ label: `${trade.symbol} · ${trade.side}`, value: formatCurrency(trade.netPnl) }))} />
      </div>
    </AppShell>
  );
}

function Score({ title, value, caption, negative }: { title: string; value: string; caption: string; negative?: boolean }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="text-xs uppercase tracking-[0.18em] text-muted">{title}</div>
        <div className={`mt-2 text-2xl font-semibold ${negative ? 'text-rose-300' : 'text-white'}`}>{value}</div>
        <div className="mt-2 text-sm text-zinc-400">{caption}</div>
      </CardContent>
    </Card>
  );
}

function InsightList({ title, items }: { title: string; items: { label: string; value: string }[] }) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {items.length ? items.map((item) => (
          <div key={item.label} className="flex items-center justify-between rounded-2xl border border-border bg-soft/50 px-4 py-3 text-sm">
            <span className="text-zinc-300">{item.label}</span>
            <span className="font-medium text-white">{item.value}</span>
          </div>
        )) : <div className="text-sm text-muted">No data yet.</div>}
      </CardContent>
    </Card>
  );
}
