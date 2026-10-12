import Link from 'next/link';
import type { ReactNode } from 'react';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ArrowUpRight, BadgeCheck, BookOpenText, Brain, Camera, Clock3, ShieldCheck } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Topbar } from '@/components/layout/topbar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DeleteTradeButton } from '@/components/actions/delete-trade-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getTradeById } from '@/lib/data';
import { requireAuth } from '@/lib/auth';
import { formatCurrency, formatDate } from '@/lib/utils';

export default async function TradeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAuth();
  const { id } = await params;
  const trade = await getTradeById(id);
  if (!trade) return notFound();

  const processTone = trade.followedPlan ? 'text-emerald-300' : 'text-rose-300';

  return (
    <AppShell>
      <Topbar
        title={`${trade.symbol} ${trade.side}`}
        subtitle={`Logged on ${formatDate(trade.tradeDate)} · ${trade.account.name} · ${trade.playbook?.name || 'No playbook linked'}`}
        actions={(
          <>
            <Link href={`/trades/${trade.id}/edit`}><Button>Edit trade</Button></Link>
            <DeleteTradeButton tradeId={trade.id} />
            <Link href="/trades"><Button>Back to journal</Button></Link>
          </>
        )}
      />

      <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.9fr]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={trade.netPnl >= 0 ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300' : 'border-rose-400/20 bg-rose-400/10 text-rose-300'}>
                Net {formatCurrency(trade.netPnl)}
              </Badge>
              <Badge>{trade.rating === 'A_PLUS' ? 'A+' : trade.rating || 'Unrated'}</Badge>
              <Badge>{trade.followedPlan ? 'Followed plan' : 'Off plan'}</Badge>
            </div>
            <h2 className="mt-4 text-2xl font-semibold text-white">One trade, fully unpacked.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
              This page is meant to make each trade review feel worth doing. Capture the decision, inspect the context, and leave with one improvement that changes the next trade.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <HeroMetric label="Net P&L" value={formatCurrency(trade.netPnl)} accent={trade.netPnl >= 0 ? 'text-emerald-300' : 'text-rose-300'} />
              <HeroMetric label="R multiple" value={trade.rMultiple?.toFixed(2) || '—'} />
              <HeroMetric label="Hold time" value={trade.holdMinutes ? `${trade.holdMinutes}m` : '—'} />
              <HeroMetric label="Confidence" value={trade.confidenceRating?.toString() || '—'} />
            </div>
          </div>

          <Card className="border-white/10 bg-black/20">
            <CardHeader><CardTitle>Process verdict</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-sm text-zinc-300">
              <div className="rounded-2xl border border-border bg-soft/50 p-4">
                <div className="flex items-center gap-2 text-white"><ShieldCheck className="h-4 w-4 text-accent" /> Checklist integrity</div>
                <p className={`mt-2 ${processTone}`}>{trade.followedPlan ? 'This trade respected your plan. Review what made that possible and repeat it.' : 'This trade broke your plan. Treat it as tuition and tighten the trigger conditions.'}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Mini label="Playbook" value={trade.playbook?.name || 'Unassigned'} />
                <Mini label="Execution quality" value={trade.executionQuality || 'Not logged'} />
                <Mini label="Import source" value={trade.importSource || 'Manual'} />
                <Mini label="Screenshot count" value={`${trade.images.length}`} />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_0.9fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Trade breakdown</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Metric label="Gross P&L" value={formatCurrency(trade.grossPnl)} />
              <Metric label="Fees" value={formatCurrency(trade.fees)} />
              <Metric label="Risk amount" value={trade.riskAmount ? formatCurrency(trade.riskAmount) : '—'} />
              <Metric label="Quantity" value={trade.quantity.toString()} />
              <Metric label="Entry" value={trade.entryPrice.toString()} />
              <Metric label="Exit" value={trade.exitPrice.toString()} />
              <Metric label="Market" value={trade.market} />
              <Metric label="Date" value={formatDate(trade.tradeDate)} />
              <Metric label="Side" value={trade.side} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Decision journal</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Block title="Entry reason" text={trade.entryReason} icon={<ArrowUpRight className="h-4 w-4" />} />
              <Block title="Exit reason" text={trade.exitReason} icon={<Clock3 className="h-4 w-4" />} />
              <Block title="Pre-trade notes" text={trade.preTradeNotes} icon={<BookOpenText className="h-4 w-4" />} />
              <Block title="Post-trade notes" text={trade.postTradeNotes} icon={<Brain className="h-4 w-4" />} />
              <Block title="Lessons learned" text={trade.lessonsLearned} icon={<BadgeCheck className="h-4 w-4" />} featured />
              <Block title="General notes" text={trade.notes} icon={<BookOpenText className="h-4 w-4" />} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Screenshots & replay</CardTitle></CardHeader>
            <CardContent>
              {trade.images.length ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {trade.images.map((image, index) => (
                    <a key={image.id} href={image.url} target="_blank" className="group overflow-hidden rounded-3xl border border-border bg-soft">
                      <div className="relative">
                        <Image src={image.url} alt="Trade screenshot" width={1200} height={800} className="h-64 w-full object-cover transition duration-300 group-hover:scale-[1.02]" />
                        <div className="absolute left-3 top-3 rounded-full border border-white/10 bg-black/50 px-3 py-1 text-xs text-white">Shot {index + 1}</div>
                      </div>
                    </a>
                  ))}
                </div>
              ) : <div className="flex items-center gap-3 rounded-2xl border border-dashed border-border px-4 py-8 text-sm text-muted"><Camera className="h-4 w-4" /> No screenshots added yet. Add at least one to make replay review more useful.</div>}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Scorecard</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Row label="Followed plan" value={trade.followedPlan ? 'Yes' : 'No'} />
              <Row label="Rating" value={trade.rating === 'A_PLUS' ? 'A+' : trade.rating || '—'} />
              <Row label="Account" value={trade.account.name} />
              <div>
                <div className="mb-2 text-xs uppercase tracking-[0.18em] text-muted">Tags</div>
                <div className="flex flex-wrap gap-2">
                  {trade.tags.length ? trade.tags.map((tag) => <Badge key={tag.tagId}>{tag.tag.name}</Badge>) : <span className="text-sm text-muted">No tags yet.</span>}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Reflection prompts</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm text-zinc-300">
              <Prompt text="Would I take this exact trade again tomorrow with the same size?" />
              <Prompt text="Was the result good because of process, or despite process?" />
              <Prompt text="What single rule would have improved this trade the most?" />
              <Prompt text="What condition would have prevented the weakest part of this trade?" />
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function HeroMetric({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-black/20 p-4">
      <div className="text-xs uppercase tracking-[0.2em] text-muted">{label}</div>
      <div className={`mt-2 text-2xl font-semibold ${accent || 'text-white'}`}>{value}</div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-soft/50 p-4">
      <div className="text-xs uppercase tracking-[0.2em] text-muted">{label}</div>
      <div className="mt-2 text-lg font-semibold text-white">{value}</div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-soft/50 p-3">
      <div className="text-xs uppercase tracking-[0.18em] text-muted">{label}</div>
      <div className="mt-2 text-sm text-white">{value}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-soft/40 px-4 py-3 text-sm">
      <span className="text-zinc-300">{label}</span>
      <span className="font-medium text-white">{value}</span>
    </div>
  );
}

function Block({ title, text, icon, featured }: { title: string; text?: string | null; icon?: ReactNode; featured?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${featured ? 'border-accent/30 bg-accent/5' : 'border-border bg-soft/50'}`}>
      <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted">{icon}{title}</div>
      <div className="whitespace-pre-wrap text-sm leading-6 text-zinc-300">{text || '—'}</div>
    </div>
  );
}

function Prompt({ text }: { text: string }) {
  return <p className="rounded-2xl border border-border bg-soft/50 px-4 py-3">{text}</p>;
}
