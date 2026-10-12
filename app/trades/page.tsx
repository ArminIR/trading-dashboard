import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { Topbar } from '@/components/layout/topbar';
import { Button } from '@/components/ui/button';
import { TradeTable } from '@/components/trades/trade-table';
import { TradeFilters } from '@/components/trades/trade-filters';
import { getDashboardFilters, getTradeFiltersFromSearchParams, getTrades } from '@/lib/data';
import { requireAuth } from '@/lib/auth';
import { buildAnalytics } from '@/lib/analytics';
import { formatCurrency, formatPercent } from '@/lib/utils';

export default async function TradesPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAuth();
  const params = (await searchParams) || {};
  const [{ accounts, playbooks, tags }, trades] = await Promise.all([
    getDashboardFilters(),
    getTrades(await getTradeFiltersFromSearchParams(params)),
  ]);
  const analytics = buildAnalytics(trades);

  return (
    <AppShell>
      <Topbar
        title="Trade journal"
        subtitle="Search, filter, and review every decision behind your P&L."
        actions={<Link href="/trades/new"><Button className="bg-accent text-black hover:bg-accent/90">Add trade</Button></Link>}
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <MiniStat label="Filtered trades" value={`${analytics.summary.totalTrades}`} />
        <MiniStat label="Net P&L" value={formatCurrency(analytics.summary.totalPnl)} />
        <MiniStat label="Plan adherence" value={formatPercent(analytics.summary.planAdherenceRate)} />
      </div>
      <div className="space-y-6">
        <TradeFilters accounts={accounts} playbooks={playbooks} tags={tags} searchParams={params} />
        <TradeTable trades={trades} />
      </div>
    </AppShell>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-white/[0.03] p-4">
      <div className="text-xs uppercase tracking-[0.18em] text-muted">{label}</div>
      <div className="mt-2 text-xl font-semibold text-white">{value}</div>
    </div>
  );
}
