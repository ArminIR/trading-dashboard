'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Account, Playbook, Tag } from '@prisma/client';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { tradePayloadSchema } from '@/lib/validation';
import { calculateGrossPnl, calculateHoldMinutes, calculateNetPnl, calculateRMultiple } from '@/lib/trade-math';
import { z } from 'zod';
import { TradeWithRelations } from '@/lib/types';
import { futuresSymbols, getPointValueForSymbol } from '@/lib/constants';

const schema = tradePayloadSchema;
type FormValues = z.infer<typeof schema>;

function toDatetimeLocal(value?: string | Date | null) {
  if (!value) return '';
  const date = new Date(value);
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
}

export function TradeForm({
  accounts,
  playbooks,
  tags,
  defaultRiskAmount,
  trade,
}: {
  accounts: Account[];
  playbooks: Playbook[];
  tags: Tag[];
  defaultRiskAmount?: string;
  trade?: TradeWithRelations | null;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>(trade?.images.map((img) => img.url) || []);

  const defaultValues: FormValues = {
    tradeDate: trade ? new Date(trade.tradeDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
    entryTime: toDatetimeLocal(trade?.entryTime),
    exitTime: toDatetimeLocal(trade?.exitTime),
    symbol: trade?.symbol || 'NQ',
    market: trade?.market || 'Futures',
    accountId: trade?.accountId || accounts[0]?.id || '',
    playbookId: trade?.playbookId || '',
    side: trade?.side || 'LONG',
    quantity: trade?.quantity || 1,
    entryPrice: trade?.entryPrice || 0,
    exitPrice: trade?.exitPrice || 0,
    fees: trade?.fees || 0,
    riskAmount: trade?.riskAmount || Number(defaultRiskAmount || '100'),
    confidenceRating: trade?.confidenceRating || 7,
    entryReason: trade?.entryReason || '',
    exitReason: trade?.exitReason || '',
    notes: trade?.notes || '',
    preTradeNotes: trade?.preTradeNotes || '',
    postTradeNotes: trade?.postTradeNotes || '',
    lessonsLearned: trade?.lessonsLearned || '',
    executionQuality: trade?.executionQuality || '',
    followedPlan: trade?.followedPlan || false,
    rating: trade?.rating === 'A_PLUS' ? 'A+' : (trade?.rating as FormValues['rating']) || 'B',
    tagIds: trade?.tags.map((tag) => tag.tagId) || [],
    imageUrls: trade?.images.map((img) => img.url) || [],
  };

  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues });
  const watched = form.watch();

  const computed = useMemo(() => {
    const grossPnl = calculateGrossPnl({
      side: watched.side,
      entryPrice: Number(watched.entryPrice || 0),
      exitPrice: Number(watched.exitPrice || 0),
      quantity: Number(watched.quantity || 0),
      market: watched.market,
      symbol: watched.symbol,
    });
    const netPnl = calculateNetPnl(grossPnl, Number(watched.fees || 0));
    const rMultiple = calculateRMultiple(netPnl, watched.riskAmount);
    const holdMinutes = calculateHoldMinutes(watched.entryTime, watched.exitTime);
    return { grossPnl, netPnl, rMultiple, holdMinutes };
  }, [watched.side, watched.entryPrice, watched.exitPrice, watched.quantity, watched.market, watched.symbol, watched.fees, watched.riskAmount, watched.entryTime, watched.exitTime]);

  async function onUpload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      const next: string[] = [];
      for (const file of Array.from(files)) {
        const body = new FormData();
        body.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', body });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Upload failed');
        next.push(json.url);
      }
      const merged = [...imageUrls, ...next];
      setImageUrls(merged);
      form.setValue('imageUrls', merged, { shouldDirty: true });
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      const res = await fetch(trade ? `/api/trades/${trade.id}` : '/api/trades', {
        method: trade ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, imageUrls }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to save trade');
      router.push(`/trades/${json.trade.id}`);
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to save trade');
    } finally {
      setSubmitting(false);
    }
  }

  const groupedTags = tags.reduce((acc, tag) => {
    acc[tag.type] = acc[tag.type] || [];
    acc[tag.type].push(tag);
    return acc;
  }, {} as Record<string, Tag[]>);

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <div>
          <label className="mb-2 block text-sm text-muted">Trade date</label>
          <Input type="date" {...form.register('tradeDate')} />
        </div>
        <div>
          <label className="mb-2 block text-sm text-muted">Entry time</label>
          <Input type="datetime-local" {...form.register('entryTime')} />
        </div>
        <div>
          <label className="mb-2 block text-sm text-muted">Exit time</label>
          <Input type="datetime-local" {...form.register('exitTime')} />
        </div>
        <div>
          <label className="mb-2 block text-sm text-muted">Market</label>
          <Select {...form.register('market')}>
            <option value="Futures">Futures</option>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div>
          <label className="mb-2 block text-sm text-muted">Symbol</label>
          <Select {...form.register('symbol')}>
            {futuresSymbols.map((symbol) => (
              <option key={symbol} value={symbol}>{symbol}</option>
            ))}
          </Select>
          <p className="mt-2 text-xs text-muted">{watched.symbol || 'NQ'} pays ${getPointValueForSymbol(watched.symbol)} per point per contract.</p>
        </div>
        <div>
          <label className="mb-2 block text-sm text-muted">Account</label>
          <Select {...form.register('accountId')}>
            {accounts.length === 0 ? <option value="">No accounts yet</option> : null}
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>{account.name}</option>
            ))}
          </Select>
        </div>
        <div>
          <label className="mb-2 block text-sm text-muted">Side</label>
          <Select {...form.register('side')}>
            <option value="LONG">LONG</option>
            <option value="SHORT">SHORT</option>
          </Select>
        </div>
        <div>
          <label className="mb-2 block text-sm text-muted">Playbook</label>
          <Select {...form.register('playbookId')}>
            <option value="">No playbook</option>
            {playbooks.map((playbook) => (
              <option key={playbook.id} value={playbook.id}>{playbook.name}</option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <div>
          <label className="mb-2 block text-sm text-muted">Quantity</label>
          <Input type="number" step="0.01" {...form.register('quantity')} />
        </div>
        <div>
          <label className="mb-2 block text-sm text-muted">Entry price</label>
          <Input type="number" step="0.0001" {...form.register('entryPrice')} />
        </div>
        <div>
          <label className="mb-2 block text-sm text-muted">Exit price</label>
          <Input type="number" step="0.0001" {...form.register('exitPrice')} />
        </div>
        <div>
          <label className="mb-2 block text-sm text-muted">Fees</label>
          <Input type="number" step="0.01" {...form.register('fees')} />
        </div>
        <div>
          <label className="mb-2 block text-sm text-muted">Risk amount</label>
          <Input type="number" step="0.01" {...form.register('riskAmount')} />
        </div>
      </div>

      <div className="grid gap-4 rounded-2xl border border-border bg-soft/50 p-4 md:grid-cols-5">
        <Metric label="Gross P&L" value={computed.grossPnl.toFixed(2)} />
        <Metric label="Net P&L" value={computed.netPnl.toFixed(2)} />
        <Metric label="R multiple" value={computed.rMultiple?.toFixed(2) || '—'} />
        <Metric label="Point value" value={`$${getPointValueForSymbol(watched.symbol)}`} />
        <Metric label="Hold duration" value={computed.holdMinutes ? `${computed.holdMinutes}m` : '—'} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="mb-2 block text-sm text-muted">Confidence (1-10)</label>
          <Input type="number" min="1" max="10" {...form.register('confidenceRating')} />
        </div>
        <div>
          <label className="mb-2 block text-sm text-muted">Rating</label>
          <Select {...form.register('rating')}>
            <option value="A+">A+</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="F">F</option>
          </Select>
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input type="checkbox" className="h-4 w-4 rounded border-border bg-soft" {...form.register('followedPlan')} />
            Followed my plan
          </label>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Entry reason"><Textarea {...form.register('entryReason')} /></Field>
        <Field label="Exit reason"><Textarea {...form.register('exitReason')} /></Field>
        <Field label="Pre-trade notes"><Textarea {...form.register('preTradeNotes')} /></Field>
        <Field label="Post-trade notes"><Textarea {...form.register('postTradeNotes')} /></Field>
        <Field label="Lessons learned"><Textarea {...form.register('lessonsLearned')} /></Field>
        <Field label="Execution quality"><Textarea {...form.register('executionQuality')} /></Field>
      </div>

      <Field label="General notes">
        <Textarea {...form.register('notes')} className="min-h-[140px]" />
      </Field>

      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm text-muted">Screenshots</label>
          <Input type="file" multiple accept="image/*" onChange={(e) => onUpload(e.target.files)} />
          <p className="mt-2 text-xs text-muted">Upload chart screenshots or execution snapshots. {uploading ? 'Uploading...' : ''}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {imageUrls.map((url) => (
            <Badge key={url}>{url.split('/').pop()}</Badge>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="text-sm font-medium text-white">Tags</div>
        <div className="grid gap-4 md:grid-cols-2">
          {Object.entries(groupedTags).map(([type, list]) => (
            <div key={type} className="rounded-2xl border border-border bg-soft/40 p-4">
              <div className="mb-3 text-xs uppercase tracking-[0.2em] text-muted">{type}</div>
              <div className="flex flex-wrap gap-2">
                {list.map((tag) => {
                  const checked = watched.tagIds?.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => {
                        const next = checked
                          ? watched.tagIds.filter((id) => id !== tag.id)
                          : [...(watched.tagIds || []), tag.id];
                        form.setValue('tagIds', next, { shouldDirty: true });
                      }}
                      className={`rounded-full border px-3 py-1.5 text-xs ${checked ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-panel text-zinc-300'}`}
                    >
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <Button className="bg-accent text-black hover:bg-accent/90" disabled={submitting}>
          {submitting ? 'Saving...' : trade ? 'Update Trade' : 'Save Trade'}
        </Button>
        <Button type="button" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-sm text-muted">{label}</label>
      {children}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-[0.2em] text-muted">{label}</div>
      <div className="mt-1 text-xl font-semibold text-white">{value}</div>
    </div>
  );
}
