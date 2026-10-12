import Link from 'next/link';
import { ArrowRight, BrainCircuit, CalendarClock, CheckCircle2, CircleAlert, Download, LineChart, Plus, ShieldCheck, Trophy } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Topbar } from '@/components/layout/topbar';
import { StatCard } from '@/components/ui/stat-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChartCard } from '@/components/charts/bar-chart-card';
import { LineChartCard } from '@/components/charts/line-chart-card';
import { PieChartCard } from '@/components/charts/pie-chart-card';
import { buildAnalytics } from '@/lib/analytics';
import { getTradeFiltersFromSearchParams, getTrades } from '@/lib/data';
import { requireAuth } from '@/lib/auth';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { EmptyState } from '@/components/ui/empty-state';
import { buildCoachReport } from '@/lib/coach';
import { CoachPanel } from '@/components/coach/coach-panel';

export default async function DashboardPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAuth();
  const params = (await searchParams) || {};
  const trades = await getTrades(await getTradeFiltersFromSearchParams(params));
  const analytics = buildAnalytics(trades);
  const weeklyCoach = buildCoachReport(trades, 'weekly');

  if (!trades.length) {
    return (
      <AppShell>
        <Topbar
          title="Dashboard"
          subtitle="Your personal command center for process, discipline, and trade review."
          actions={(
            <>
              <Link href="/trades/new"><Button className="bg-accent text-black hover:bg-accent/90">Log first trade</Button></Link>
              <Link href="/imports"><Button>Import CSV</Button></Link>
            </>
          )}
        />
        <EmptyState
          title="No trades yet — start with one clean trade log"
          description="This journal gets powerful once your notes, screenshots, and tags start building context around the numbers."
          tips={[
            'Log one recent trade manually with pre-trade notes and lessons learned.',
            'Import your last week of trades from CSV to populate the dashboard quickly.',
            'Tag at least one setup, one emotion, and one mistake so analytics can surface patterns.',
          ]}
          action={<Link href="/trades/new"><Button className="bg-accent text-black hover:bg-accent/90">Create first trade entry</Button></Link>}
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Topbar
        title="Dashboard"
        subtitle="A premium trading journal focused on process, self-awareness, and repeatable improvement."
        actions={(
          <>
            <Link href="/trades/new"><Button className="bg-accent text-black hover:bg-accent/90"><Plus className="mr-2 h-4 w-4" />Log trade</Button></Link>
            <Link href="/imports"><Button><Download className="mr-2 h-4 w-4" />Import CSV</Button></Link>
            <Link href="/reviews"><Button><CalendarClock className="mr-2 h-4 w-4" />Weekly review</Button></Link>
          </>
        )}
      />

      <section className="data-grid overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
          <div>
            <Badge className="border-emerald-400/20 bg-emerald-400/10 text-emerald-300">Consistency score {analytics.summary.consistencyScore}/100</Badge>
            <h2 className="mt-4 text-2xl font-semibold text-white">Trade like the version of you that follows the plan.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
              Your strongest edge right now is <span className="text-white">{analytics.insights.topSetup?.name || 'still forming'}</span>.
              {' '}Plan adherence is <span className="text-white">{formatPercent(analytics.summary.planAdherenceRate)}</span> and your positive day rate is <span className="text-white">{formatPercent(analytics.summary.positiveDayRate)}</span>.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <QuickMetric label="Top setup" value={analytics.insights.topSetup?.name || 'Unassigned'} subValue={analytics.insights.topSetup ? `${analytics.insights.topSetup.trades} trades` : 'Start tagging'} />
              <QuickMetric label="Best symbol" value={analytics.insights.topSymbol?.symbol || '—'} subValue={analytics.insights.topSymbol ? formatCurrency(analytics.insights.topSymbol.pnl) : 'No leader yet'} />
              <QuickMetric label="Max drawdown" value={formatCurrency(analytics.summary.maxDrawdown)} subValue="Keep losses shallow" tone="negative" />
            </div>
          </div>

          <Card className="border-white/10 bg-black/20">
            <CardHeader>
              <CardTitle>Coach notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-zinc-300">
              {analytics.insights.coachingNotes.map((note) => (
                <div key={note} className="flex gap-3 rounded-2xl border border-border bg-soft/40 px-4 py-3">
                  <BrainCircuit className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <p>{note}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total P&L" value={formatCurrency(analytics.summary.totalPnl)} hint={`${analytics.summary.totalTrades} trades tracked`} tone={analytics.summary.totalPnl >= 0 ? 'positive' : 'negative'} icon={<LineChart className="h-4 w-4" />} />
        <StatCard label="Win rate" value={formatPercent(analytics.summary.winRate)} hint={`Profit factor ${analytics.summary.profitFactor.toFixed(2)}`} icon={<Trophy className="h-4 w-4" />} />
        <StatCard label="Average win" value={formatCurrency(analytics.summary.averageWin)} hint={`Average loss ${formatCurrency(Math.abs(analytics.summary.averageLoss))}`} tone="positive" icon={<CheckCircle2 className="h-4 w-4" />} />
        <StatCard label="Expectancy" value={formatCurrency(analytics.summary.expectancy)} hint={`Average R ${analytics.summary.averageR.toFixed(2)}`} icon={<ShieldCheck className="h-4 w-4" />} />
        <StatCard label="Current streak" value={`${analytics.summary.currentStreak.streak} ${analytics.summary.currentStreak.kind || ''}`} hint={`Avg hold ${analytics.summary.averageHoldMinutes.toFixed(0)}m`} tone={analytics.summary.currentStreak.kind === 'win' ? 'positive' : 'negative'} icon={<CircleAlert className="h-4 w-4" />} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <LineChartCard title="Equity curve" subtitle="Smooth upward equity usually means your process is doing the heavy lifting." data={analytics.charts.equityCurve} xKey="label" yKey="equity" />
        <BarChartCard title="Daily P&L" subtitle="Use this to spot overtrading clusters and bounce-back days." data={analytics.charts.dailyPnl} xKey="label" yKey="pnl" />
        <BarChartCard title="P&L by setup" subtitle="Promote setups with the best combination of P&L, win rate, and clean execution." data={analytics.charts.bySetup} xKey="name" yKey="pnl" />
        <PieChartCard title="Followed plan vs not" subtitle="Behavior score: clean process beats raw win rate." data={[{ name: 'Followed', value: analytics.insights.followedPlan.followed }, { name: 'Did not follow', value: analytics.insights.followedPlan.notFollowed }]} dataKey="value" nameKey="name" />
      </div>

      <div className="mt-6">
        <CoachPanel report={weeklyCoach} compact />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Setups earning more focus</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analytics.insights.bestSetupsOverTime.length ? analytics.insights.bestSetupsOverTime.map((setup) => (
              <div key={setup.name} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-soft/50 px-4 py-3">
                <div>
                  <div className="font-medium text-white">{setup.name}</div>
                  <div className="text-xs text-muted">{setup.trades} trades · {setup.winRate}% win rate · Avg R {setup.avgR}</div>
                </div>
                <div className="text-success">{formatCurrency(setup.pnl)}</div>
              </div>
            )) : <div className="text-sm text-muted">No playbook-linked trades yet.</div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Behavioral drift alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {analytics.insights.worstRecurringMistakes.length ? analytics.insights.worstRecurringMistakes.map((mistake) => (
              <div key={mistake.name} className="flex items-center justify-between rounded-2xl border border-border bg-soft/50 px-4 py-3 text-sm">
                <span className="text-zinc-300">{mistake.name}</span>
                <Badge>{mistake.count}x</Badge>
              </div>
            )) : <div className="text-sm text-muted">Tag mistakes to reveal recurring behavioral leaks.</div>}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <InsightPanel title="Best day" value={formatCurrency(analytics.summary.bestDay.pnl)} caption={`${analytics.summary.bestDay.label} · ${analytics.summary.bestDay.trades} trades`} />
        <InsightPanel title="Worst day" value={formatCurrency(analytics.summary.worstDay.pnl)} caption={`${analytics.summary.worstDay.label} · ${analytics.summary.worstDay.trades} trades`} negative />
        <InsightPanel title="Plan-followed P&L" value={formatCurrency(analytics.insights.followedPlan.followedPnl)} caption={`Off-plan P&L ${formatCurrency(analytics.insights.followedPlan.notFollowedPnl)}`} />
      </div>

      <div className="mt-6 flex justify-end">
        <Link href="/reports" className="inline-flex items-center gap-2 text-sm text-zinc-300 hover:text-white">
          Open full performance reports
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </AppShell>
  );
}

function QuickMetric({ label, value, subValue, tone = 'default' }: { label: string; value: string; subValue: string; tone?: 'default' | 'negative' }) {
  return (
    <div className="rounded-2xl border border-border bg-black/20 p-4">
      <div className="text-xs uppercase tracking-[0.18em] text-muted">{label}</div>
      <div className={`mt-2 text-lg font-semibold ${tone === 'negative' ? 'text-rose-300' : 'text-white'}`}>{value}</div>
      <div className="mt-1 text-xs text-zinc-400">{subValue}</div>
    </div>
  );
}

function InsightPanel({ title, value, caption, negative }: { title: string; value: string; caption: string; negative?: boolean }) {
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
