import { AppShell } from '@/components/layout/app-shell';
import { Topbar } from '@/components/layout/topbar';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getTrades } from '@/lib/data';
import { buildAnalytics } from '@/lib/analytics';
import { ReviewForm } from '@/components/forms/review-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';

export default async function ReviewsPage() {
  const user = await requireAuth();
  const [reviews, analytics] = await Promise.all([
    prisma.review.findMany({ where: { userId: user.id }, orderBy: { reviewDate: 'desc' } }),
    getTrades().then(buildAnalytics),
  ]);

  return (
    <AppShell>
      <Topbar title="Reviews" subtitle="Turn raw trades into a repeatable review loop: what happened, why it happened, and what changes tomorrow." />
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <ReviewForm />
          <Card>
            <CardHeader><CardTitle>Review prompts</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm text-zinc-300">
              <p>Best trade this period: {analytics.insights.bestTrades[0] ? `${analytics.insights.bestTrades[0].symbol} ${analytics.insights.bestTrades[0].side}` : '—'}</p>
              <p>Biggest recurring mistake: {analytics.insights.worstRecurringMistakes[0]?.name || '—'}</p>
              <p>Repeated emotional pattern: {analytics.insights.emotionsFrequency[0]?.name || '—'}</p>
              <p>Trades not following plan: {analytics.insights.followedPlan.notFollowed}</p>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardHeader>
                <CardTitle>{review.title}</CardTitle>
                <p className="text-sm text-muted">{review.periodType.toLowerCase()} review · {formatDate(review.reviewDate)}</p>
              </CardHeader>
              <CardContent className="grid gap-4 text-sm text-zinc-300 md:grid-cols-2">
                <Block label="Summary" value={review.summary} />
                <Block label="Top lessons" value={review.topLessons} />
                <Block label="Biggest mistakes" value={review.biggestMistakes} />
                <Block label="Repeated patterns" value={review.repeatedPatterns} />
                <div className="md:col-span-2"><Block label="Improvement goals" value={review.improvementGoals} /></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

function Block({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-xl border border-border bg-soft/50 p-4">
      <div className="mb-2 text-xs uppercase tracking-[0.2em] text-muted">{label}</div>
      <div className="whitespace-pre-wrap">{value || '—'}</div>
    </div>
  );
}
