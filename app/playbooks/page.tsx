import { AppShell } from '@/components/layout/app-shell';
import { Topbar } from '@/components/layout/topbar';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PlaybookForm } from '@/components/forms/playbook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, safeJsonParse } from '@/lib/utils';

export default async function PlaybooksPage() {
  const user = await requireAuth();
  const playbooks = await prisma.playbook.findMany({
    where: { userId: user.id },
    include: { trades: true },
    orderBy: { name: 'asc' },
  });

  return (
    <AppShell>
      <Topbar title="Playbooks" subtitle="Define your setups, tag your trades against them, and track which ideas deserve more capital." />
      <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
        <PlaybookForm />
        <div className="space-y-4">
          {playbooks.map((playbook) => {
            const pnl = playbook.trades.reduce((sum, trade) => sum + trade.netPnl, 0);
            const checklist = (playbook.checklist || '').split('\n').filter(Boolean);
            const images = safeJsonParse<string[]>(playbook.exampleImagesJson, []);
            return (
              <Card key={playbook.id}>
                <CardHeader>
                  <CardTitle>{playbook.name}</CardTitle>
                  <p className="text-sm text-muted">{playbook.description}</p>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-zinc-300">
                  <div className="grid gap-3 md:grid-cols-2">
                    <Block label="Market conditions" value={playbook.marketConditions} />
                    <Block label="Entry criteria" value={playbook.entryCriteria} />
                    <Block label="Exit criteria" value={playbook.exitCriteria} />
                    <Block label="Invalidation rules" value={playbook.invalidationRules} />
                  </div>
                  <div className="rounded-xl border border-border bg-soft/50 p-4">
                    <div className="mb-2 text-xs uppercase tracking-[0.2em] text-muted">Checklist</div>
                    <ul className="list-disc space-y-1 pl-5">
                      {checklist.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-border bg-soft/50 px-4 py-3">
                    <span>{playbook.trades.length} linked trades</span>
                    <span className={pnl >= 0 ? 'text-success' : 'text-danger'}>{formatCurrency(pnl)}</span>
                  </div>
                  {images.length ? <div className="text-xs text-muted">Example screenshots: {images.join(', ')}</div> : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}

function Block({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-xl border border-border bg-soft/50 p-4">
      <div className="mb-2 text-xs uppercase tracking-[0.2em] text-muted">{label}</div>
      <div>{value || '—'}</div>
    </div>
  );
}
