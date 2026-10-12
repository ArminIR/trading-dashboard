import { AppShell } from '@/components/layout/app-shell';
import { Topbar } from '@/components/layout/topbar';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ensurePreferredAccounts } from '@/lib/accounts';
import { ImportWizard } from '@/components/forms/import-wizard';

export default async function ImportsPage() {
  const user = await requireAuth();
  const [accounts, templates] = await Promise.all([
    ensurePreferredAccounts(user.id),
    prisma.importTemplate.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } }),
  ]);
  return (
    <AppShell>
      <Topbar title="Imports" subtitle="Map your broker CSV once, save the template, and merge notes later inside the journal." />
      <ImportWizard accounts={accounts} templates={templates} />
    </AppShell>
  );
}
