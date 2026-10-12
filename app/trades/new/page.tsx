import { AppShell } from '@/components/layout/app-shell';
import { Topbar } from '@/components/layout/topbar';
import { Card, CardContent } from '@/components/ui/card';
import { TradeForm } from '@/components/forms/trade-form';
import { getDashboardFilters, getSettingsMap } from '@/lib/data';
import { requireAuth } from '@/lib/auth';

export default async function NewTradePage() {
  await requireAuth();
  const [{ accounts, playbooks, tags }, settings] = await Promise.all([getDashboardFilters(), getSettingsMap()]);
  return (
    <AppShell>
      <Topbar title="Log new trade" subtitle="Capture context while it is still fresh — especially the why, not just the what." />
      <Card>
        <CardContent className="p-6">
          <TradeForm accounts={accounts} playbooks={playbooks} tags={tags} defaultRiskAmount={settings.defaultRiskAmount} />
        </CardContent>
      </Card>
    </AppShell>
  );
}
