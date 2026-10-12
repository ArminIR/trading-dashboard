import { endOfMonth, endOfWeek, format, isAfter, isBefore, startOfMonth, startOfWeek, subMonths, subWeeks } from 'date-fns';
import { buildAnalytics } from './analytics';
import { TradeWithRelations } from './types';
import { formatCurrency } from './utils';

export type CoachPeriod = 'weekly' | 'monthly' | 'all';

type Confidence = 'high' | 'medium' | 'low';

type InsightItem = {
  title: string;
  evidence: string;
  confidence: Confidence;
};

export type CoachReport = {
  periodLabel: string;
  generatedAt: string;
  disclaimer: string;
  summary: {
    tradeCount: number;
    netPnl: number;
    winRate: number;
    avgR: number;
    profitFactor: number;
    expectancy: number;
  };
  strengths: InsightItem[];
  mistakes: InsightItem[];
  behavioralPatterns: InsightItem[];
  scores: {
    discipline: number;
    consistency: number;
    riskManagement: number;
    planAdherence: number;
    emotionalControl: number;
  };
  actions: string[];
  highlights: {
    bestSetup?: string;
    bestTimeBucket?: string;
    bestWeekday?: string;
    worstWeekday?: string;
  };
  dataQuality: {
    missingFields: string[];
    notes: string;
  };
};

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function confidenceForSample(size: number): Confidence {
  if (size >= 8) return 'high';
  if (size >= 4) return 'medium';
  return 'low';
}

function avg(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function calculateWinRate(items: TradeWithRelations[]) {
  const decisiveTrades = items.filter((trade) => trade.netPnl !== 0);
  if (!decisiveTrades.length) return 0;
  const winners = decisiveTrades.filter((trade) => trade.netPnl > 0);
  return winners.length / decisiveTrades.length;
}

function getTimeBucket(hour?: number | null) {
  if (hour == null || Number.isNaN(hour)) return 'Unknown';
  if (hour < 10) return 'Open';
  if (hour < 12) return 'Morning';
  if (hour < 15) return 'Midday';
  return 'Afternoon';
}

function group<T>(items: T[], keyFn: (item: T) => string) {
  return items.reduce((acc, item) => {
    const key = keyFn(item);
    (acc[key] ||= []).push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

function sortByDateAsc(trades: TradeWithRelations[]) {
  return [...trades].sort((a, b) => +new Date(a.tradeDate) - +new Date(b.tradeDate));
}

export function getTradesForPeriod(trades: TradeWithRelations[], period: CoachPeriod) {
  if (period === 'all') return trades;
  const now = new Date();
  const start = period === 'weekly'
    ? startOfWeek(subWeeks(now, 0), { weekStartsOn: 1 })
    : startOfMonth(subMonths(now, 0));
  const end = period === 'weekly'
    ? endOfWeek(now, { weekStartsOn: 1 })
    : endOfMonth(now);

  return trades.filter((trade) => {
    const date = new Date(trade.tradeDate);
    return !isBefore(date, start) && !isAfter(date, end);
  });
}

function buildMissingFieldNotes(trades: TradeWithRelations[]) {
  const checks = [
    ['confidence rating', trades.filter((t) => t.confidenceRating == null).length],
    ['playbook', trades.filter((t) => !t.playbookId).length],
    ['pre-trade notes', trades.filter((t) => !t.preTradeNotes?.trim()).length],
    ['post-trade notes', trades.filter((t) => !t.postTradeNotes?.trim() && !t.lessonsLearned?.trim()).length],
    ['entry or exit time', trades.filter((t) => !t.entryTime || !t.exitTime).length],
    ['mistake tags', trades.filter((t) => !t.tags.some((tag) => tag.tag.type === 'MISTAKE')).length],
    ['emotion tags', trades.filter((t) => !t.tags.some((tag) => tag.tag.type === 'EMOTION')).length],
  ];

  const missingFields = checks
    .filter(([, count]) => trades.length > 0 && (count / trades.length) >= 0.35)
    .map(([field]) => field as string);

  const notes = missingFields.length
    ? `Insights are directionally useful, but stronger journaling quality would improve confidence. Missing often: ${missingFields.join(', ')}.`
    : 'Journal quality is good enough for stronger behavioral feedback.';

  return { missingFields, notes };
}

export function buildCoachReport(trades: TradeWithRelations[], period: CoachPeriod = 'monthly'): CoachReport {
  const periodTrades = getTradesForPeriod(trades, period);
  const analytics = buildAnalytics(periodTrades);
  const sorted = sortByDateAsc(periodTrades);
  const periodLabel = period === 'weekly' ? 'This week' : period === 'monthly' ? 'This month' : 'All time';

  if (!periodTrades.length) {
    return {
      periodLabel,
      generatedAt: new Date().toISOString(),
      disclaimer: 'Performance analysis only. No financial advice or trade recommendations.',
      summary: { tradeCount: 0, netPnl: 0, winRate: 0, avgR: 0, profitFactor: 0, expectancy: 0 },
      strengths: [],
      mistakes: [],
      behavioralPatterns: [],
      scores: { discipline: 0, consistency: 0, riskManagement: 0, planAdherence: 0, emotionalControl: 0 },
      actions: ['Log trades with playbooks, confidence, and notes so the coach can detect patterns.'],
      highlights: {},
      dataQuality: { missingFields: [], notes: 'No trades in this period yet.' },
    };
  }

  const setupGroups = Object.entries(
    group(periodTrades.filter((t) => t.playbook?.name), (t) => t.playbook?.name || 'Unassigned'),
  )
    .map(([name, items]) => ({
      name,
      trades: items.length,
      avgR: avg(items.map((t) => t.rMultiple || 0)),
      pnl: items.reduce((sum, t) => sum + t.netPnl, 0),
      winRate: calculateWinRate(items),
    }))
    .sort((a, b) => b.avgR - a.avgR || b.pnl - a.pnl);

  const timeGroups = Object.entries(group(periodTrades, (t) => getTimeBucket(t.entryTime ? new Date(t.entryTime).getHours() : null)))
    .map(([bucket, items]) => ({
      bucket,
      trades: items.length,
      avgR: avg(items.map((t) => t.rMultiple || 0)),
      pnl: items.reduce((sum, t) => sum + t.netPnl, 0),
    }))
    .filter((item) => item.bucket !== 'Unknown')
    .sort((a, b) => b.pnl - a.pnl);

  const weekdayMap = analytics.charts.byWeekday;
  const bestWeekday = [...weekdayMap].sort((a, b) => b.pnl - a.pnl)[0];
  const worstWeekday = [...weekdayMap].sort((a, b) => a.pnl - b.pnl)[0];

  const lowConfidence = periodTrades.filter((t) => (t.confidenceRating || 0) > 0 && (t.confidenceRating || 0) <= 4);
  const highConfidence = periodTrades.filter((t) => (t.confidenceRating || 0) >= 7);
  const noPlan = periodTrades.filter((t) => !t.followedPlan);
  const followedPlan = periodTrades.filter((t) => t.followedPlan);
  const stopMistakeTrades = periodTrades.filter((t) => t.tags.some((tag) => tag.tag.type === 'MISTAKE' && /stop|stopped|sl/i.test(tag.tag.name)));
  const emotionalTrades = periodTrades.filter((t) => t.tags.some((tag) => tag.tag.type === 'EMOTION'));
  const revengeTrades: TradeWithRelations[] = [];

  for (let i = 2; i < sorted.length; i += 1) {
    if (sorted[i - 1].netPnl < 0 && sorted[i - 2].netPnl < 0) revengeTrades.push(sorted[i]);
  }

  const disciplineScore = clampScore(
    55
    + ((followedPlan.length / periodTrades.length) * 25)
    - ((noPlan.length / periodTrades.length) * 15)
    - ((stopMistakeTrades.length / periodTrades.length) * 18)
    - ((revengeTrades.filter((t) => t.netPnl < 0).length / Math.max(revengeTrades.length, 1)) * 12),
  );

  const consistencyScore = clampScore(
    analytics.summary.consistencyScore
    - Math.min(18, Math.abs(bestWeekday.pnl - worstWeekday.pnl) / Math.max(Math.abs(analytics.summary.expectancy), 1) / 10),
  );

  const riskManagementScore = clampScore(
    60
    + Math.min(20, analytics.summary.profitFactor * 8)
    + (analytics.summary.averageR * 8)
    - ((stopMistakeTrades.length / periodTrades.length) * 20)
    - (analytics.summary.maxDrawdown < 0 ? Math.min(20, Math.abs(analytics.summary.maxDrawdown) / 200) : 0),
  );

  const planAdherenceScore = clampScore((followedPlan.length / periodTrades.length) * 100);
  const emotionalControlScore = clampScore(
    70
    - ((emotionalTrades.filter((t) => t.netPnl < 0).length / Math.max(emotionalTrades.length, 1)) * 20)
    - ((revengeTrades.length / Math.max(periodTrades.length, 1)) * 25),
  );

  const strengths: InsightItem[] = [];
  const mistakes: InsightItem[] = [];
  const patterns: InsightItem[] = [];

  if (setupGroups[0] && setupGroups[0].trades >= 2) {
    strengths.push({
      title: `Best-performing setup: ${setupGroups[0].name}`,
      evidence: `${setupGroups[0].trades} trades, ${formatCurrency(setupGroups[0].pnl)} total P&L, ${Math.round(setupGroups[0].winRate * 100)}% win rate, average R ${setupGroups[0].avgR.toFixed(2)}.`,
      confidence: confidenceForSample(setupGroups[0].trades),
    });
  }

  if (timeGroups[0] && timeGroups[0].trades >= 2) {
    strengths.push({
      title: `You perform best during the ${timeGroups[0].bucket.toLowerCase()}`,
      evidence: `${timeGroups[0].trades} trades produced ${formatCurrency(timeGroups[0].pnl)} with average R ${timeGroups[0].avgR.toFixed(2)}.`,
      confidence: confidenceForSample(timeGroups[0].trades),
    });
  }

  if (followedPlan.length >= 2 && followedPlan.reduce((sum, t) => sum + t.netPnl, 0) > noPlan.reduce((sum, t) => sum + t.netPnl, 0)) {
    strengths.push({
      title: 'Plan-following trades outperform off-plan trades',
      evidence: `Followed-plan trades made ${formatCurrency(followedPlan.reduce((sum, t) => sum + t.netPnl, 0))} versus ${formatCurrency(noPlan.reduce((sum, t) => sum + t.netPnl, 0))} off-plan.`,
      confidence: confidenceForSample(followedPlan.length),
    });
  }

  if (stopMistakeTrades.length) {
    mistakes.push({
      title: 'Stop-loss discipline is leaking P&L',
      evidence: `${stopMistakeTrades.length} trades were tagged with a stop-related mistake and they combined for ${formatCurrency(stopMistakeTrades.reduce((sum, t) => sum + t.netPnl, 0))}.`,
      confidence: confidenceForSample(stopMistakeTrades.length),
    });
  }

  const topMistake = analytics.insights.mistakesFrequency[0];
  if (topMistake) {
    mistakes.push({
      title: `Recurring mistake: ${topMistake.name}`,
      evidence: `This mistake appeared ${topMistake.count} times in ${periodLabel.toLowerCase()}.`,
      confidence: confidenceForSample(topMistake.count),
    });
  }

  if (lowConfidence.length >= 2) {
    mistakes.push({
      title: 'Low-confidence trades drag your edge',
      evidence: `Low-confidence trades averaged R ${avg(lowConfidence.map((t) => t.rMultiple || 0)).toFixed(2)} versus ${avg(highConfidence.map((t) => t.rMultiple || 0)).toFixed(2)} on high-confidence trades.`,
      confidence: confidenceForSample(lowConfidence.length),
    });
  }

  if (revengeTrades.length) {
    patterns.push({
      title: 'Loss streaks change your behavior',
      evidence: `${revengeTrades.length} trades happened right after two consecutive losses. They produced ${formatCurrency(revengeTrades.reduce((sum, t) => sum + t.netPnl, 0))}.`,
      confidence: confidenceForSample(revengeTrades.length),
    });
  }

  if (bestWeekday && worstWeekday && bestWeekday.label !== worstWeekday.label) {
    patterns.push({
      title: `${bestWeekday.label} is stronger than ${worstWeekday.label}`,
      evidence: `${bestWeekday.label} produced ${formatCurrency(bestWeekday.pnl)} while ${worstWeekday.label} produced ${formatCurrency(worstWeekday.pnl)}.`,
      confidence: confidenceForSample(bestWeekday.trades + worstWeekday.trades),
    });
  }

  if (emotionalTrades.length) {
    const losingEmotional = emotionalTrades.filter((t) => t.netPnl < 0).length;
    patterns.push({
      title: 'Emotion-tagged trades need review',
      evidence: `${losingEmotional} of ${emotionalTrades.length} emotion-tagged trades closed negative. Review the notes tied to those sessions.`,
      confidence: confidenceForSample(emotionalTrades.length),
    });
  }

  const actions = [
    stopMistakeTrades.length ? 'Review every stop-related mistake and write one non-negotiable stop rule for next week.' : 'Keep tagging mistakes so the coach can isolate your recurring leaks.',
    noPlan.length > followedPlan.length ? 'Cut off-plan trades first. Require a linked playbook or written entry reason before submitting.' : 'Protect your edge by repeating the same plan-following process on every trade.',
    revengeTrades.length ? 'Add a hard pause after 2 consecutive losses before taking the next trade.' : 'After each losing streak, log one sentence about whether the next trade was fully planned.',
    lowConfidence.length >= 2 ? 'Size down or skip low-confidence trades until their average R improves.' : 'Keep recording confidence so the coach can compare conviction versus performance.',
  ].slice(0, 4);

  return {
    periodLabel,
    generatedAt: new Date().toISOString(),
    disclaimer: 'Performance analysis only. No financial advice or trade recommendations.',
    summary: {
      tradeCount: periodTrades.length,
      netPnl: analytics.summary.totalPnl,
      winRate: analytics.summary.winRate,
      avgR: analytics.summary.averageR,
      profitFactor: analytics.summary.profitFactor,
      expectancy: analytics.summary.expectancy,
    },
    strengths: strengths.slice(0, 3),
    mistakes: mistakes.slice(0, 3),
    behavioralPatterns: patterns.slice(0, 3),
    scores: {
      discipline: disciplineScore,
      consistency: consistencyScore,
      riskManagement: riskManagementScore,
      planAdherence: planAdherenceScore,
      emotionalControl: emotionalControlScore,
    },
    actions,
    highlights: {
      bestSetup: setupGroups[0]?.name,
      bestTimeBucket: timeGroups[0]?.bucket,
      bestWeekday: bestWeekday?.label,
      worstWeekday: worstWeekday?.label,
    },
    dataQuality: buildMissingFieldNotes(periodTrades),
  };
}
