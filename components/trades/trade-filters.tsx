import { Account, Playbook, Tag } from '@prisma/client';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

export function TradeFilters({
  accounts,
  playbooks,
  tags,
  searchParams,
}: {
  accounts: Account[];
  playbooks: Playbook[];
  tags: Tag[];
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  return (
    <form className="grid gap-3 rounded-2xl border border-border bg-panel p-4 md:grid-cols-6" method="get">
      <Select name="accountId" defaultValue={typeof searchParams?.accountId === 'string' ? searchParams.accountId : ''}>
        <option value="">All accounts</option>
        {accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
      </Select>
      <Select name="setup" defaultValue={typeof searchParams?.setup === 'string' ? searchParams.setup : ''}>
        <option value="">All setups</option>
        {playbooks.map((playbook) => <option key={playbook.id} value={playbook.id}>{playbook.name}</option>)}
      </Select>
      <Select name="side" defaultValue={typeof searchParams?.side === 'string' ? searchParams.side : ''}>
        <option value="">Any side</option>
        <option value="LONG">Long</option>
        <option value="SHORT">Short</option>
      </Select>
      <Select name="tagId" defaultValue={typeof searchParams?.tagId === 'string' ? searchParams.tagId : ''}>
        <option value="">Any tag</option>
        {tags.map((tag) => <option key={tag.id} value={tag.id}>{tag.name}</option>)}
      </Select>
      <Input name="startDate" type="date" defaultValue={typeof searchParams?.startDate === 'string' ? searchParams.startDate : ''} />
      <div className="flex gap-2">
        <Input name="endDate" type="date" defaultValue={typeof searchParams?.endDate === 'string' ? searchParams.endDate : ''} />
        <Button className="whitespace-nowrap">Apply</Button>
      </div>
    </form>
  );
}
