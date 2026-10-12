import { AppShell } from '@/components/layout/app-shell';
import { Topbar } from '@/components/layout/topbar';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ensurePreferredAccounts } from '@/lib/accounts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

export default async function SettingsPage() {
  const user = await requireAuth();
  const [accounts, tags, templates, settings] = await Promise.all([
    ensurePreferredAccounts(user.id),
    prisma.tag.findMany({ where: { userId: user.id }, orderBy: [{ type: 'asc' }, { name: 'asc' }] }),
    prisma.importTemplate.findMany({ where: { userId: user.id }, orderBy: { updatedAt: 'desc' } }),
    prisma.setting.findMany({ where: { userId: user.id } }),
  ]);
  const risk = settings.find((item) => item.key === 'defaultRiskAmount')?.value || '100';

  return (
    <AppShell>
      <Topbar title="Settings" subtitle="Keep it simple: accounts, tags, import templates, and a default risk anchor." />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Add account</CardTitle></CardHeader>
          <CardContent>
            <form action="/api/settings/accounts" method="post" className="grid gap-3 md:grid-cols-3">
              <Input name="name" placeholder="Topstep" />
              <Input name="broker" placeholder="Tradovate" />
              <div className="flex gap-2">
                <Input name="initialSize" type="number" placeholder="50000" />
                <Button className="bg-accent text-black hover:bg-accent/90">Save</Button>
              </div>
            </form>
            <div className="mt-4 space-y-2 text-sm text-zinc-300">
              {accounts.map((account) => (
                <div key={account.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-soft/50 px-4 py-3">
                  <div>
                    <div>{account.name}</div>
                    <div className="text-xs text-muted">{account.broker || '—'}</div>
                  </div>
                  <form action={`/api/settings/accounts/${account.id}`} method="post">
                    <Button type="submit" className="border border-rose-500/30 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20">Delete</Button>
                  </form>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted">Suggested accounts: Topstep, LucidTrading, Alpha Futures.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Add custom tag</CardTitle></CardHeader>
          <CardContent>
            <form action="/api/settings/tags" method="post" className="grid gap-3 md:grid-cols-4">
              <Input name="name" placeholder="Failed hold" className="md:col-span-2" />
              <Select name="type">
                <option value="SETUP">Setup</option>
                <option value="MISTAKE">Mistake</option>
                <option value="EMOTION">Emotion</option>
                <option value="EXECUTION">Execution</option>
                <option value="GENERAL">General</option>
              </Select>
              <div className="flex gap-2">
                <Input name="color" placeholder="#5eead4" />
                <Button className="bg-accent text-black hover:bg-accent/90">Save</Button>
              </div>
            </form>
            <div className="mt-4 flex flex-wrap gap-2">
              {tags.map((tag) => <span key={tag.id} className="rounded-full border border-border bg-soft px-3 py-1 text-xs text-zinc-300">{tag.type}: {tag.name}</span>)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Default risk</CardTitle></CardHeader>
          <CardContent>
            <form action="/api/settings/default-risk" method="post" className="flex gap-3">
              <Input name="value" defaultValue={risk} type="number" />
              <Button className="bg-accent text-black hover:bg-accent/90">Update</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Saved import templates</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm text-zinc-300">
            {templates.map((template) => <div key={template.id} className="rounded-xl border border-border bg-soft/50 px-4 py-3">{template.name}</div>)}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
