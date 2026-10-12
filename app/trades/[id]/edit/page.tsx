import { notFound } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { Topbar } from '@/components/layout/topbar';
import { Card, CardContent } from '@/components/ui/card';
import { TradeForm } from '@/components/forms/trade-form';
import { getDashboardFilters, getSettingsMap, getTradeById } from '@/lib/data';
import { requireAuth } from '@/lib/auth';

export default async function EditTradePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAuth();
  const { id } = await params;
  const [trade, filters, settings] = await Promise.all([getTradeById(id), getDashboardFilters(), getSettingsMap()]);
  if (!trade) return notFound();
  return (
    <AppShell>
      <Topbar title="Edit trade" subtitle="Improve context, labels, and lessons while the chart is still easy to remember." />
      <Card>
        <CardContent className="p-6">
          <TradeForm accounts={filters.accounts} playbooks={filters.playbooks} tags={filters.tags} defaultRiskAmount={settings.defaultRiskAmount} trade={trade} />
        </CardContent>
      </Card>
    </AppShell>
  );
}
