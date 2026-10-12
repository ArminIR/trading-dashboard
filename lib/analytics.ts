import { format, getDay, getHours, startOfDay } from 'date-fns';
import { TradeWithRelations } from './types';

function groupBy<T, K extends string | number>(items: T[], keyFn: (item: T) => K) {
  return items.reduce((acc, item) => {
    const key = keyFn(item);
    acc[key] = acc[key] || [];
    acc[key].push(item);
    return acc;
  }, {} as Record<K, T[]>);
}

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function median(values: number[]) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function calculateWinRate(items: TradeWithRelations[]) {
  const decisiveTrades = items.filter((trade) => trade.netPnl !== 0);
  if (!decisiveTrades.length) return 0;
  const winners = decisiveTrades.filter((trade) => trade.netPnl > 0);
  return (winners.length / decisiveTrades.length) * 100;
}

function calcStreak(trades: TradeWithRelations[]) {
  let streak = 0;
  let mode: 'win' | 'loss' | null = null;
  for (const trade of trades) {
    const nextMode = trade.netPnl >= 0 ? 'win' : 'loss';
    if (!mode) {
      mode = nextMode;
      streak = 1;
      continue;
    }
    if (mode === nextMode) streak += 1;
    else break;
  }
  return { streak, kind: mode };
}

function calculateMaxDrawdown(equityCurve: { equity: number }[]) {
  let peak = 0;
  let maxDrawdown = 0;
  for (const point of equityCurve) {
    peak = Math.max(peak, point.equity);
    maxDrawdown = Math.min(maxDrawdown, point.equity - peak);
  }
  return maxDrawdown;
}

export function buildAnalytics(trades: TradeWithRelations[]) {
  const sortedAsc = [...trades].sort((a, b) => +new Date(a.tradeDate) - +new Date(b.tradeDate));
  const totalPnl = trades.reduce((sum, trade) => sum + trade.netPnl, 0);
  const winners = trades.filter((trade) => trade.netPnl > 0);
  const losers = trades.filter((trade) => trade.netPnl < 0);
  const totalWins = winners.reduce((sum, trade) => sum + trade.netPnl, 0);
  const totalLosses = losers.reduce((sum, trade) => sum + Math.abs(trade.netPnl), 0);
  const expectancy = trades.length ? totalPnl / trades.length : 0;
  const winRate = calculateWinRate(trades);
  const profitFactor = totalLosses ? totalWins / totalLosses : totalWins;
  const avgHold = average(trades.map((t) => t.holdMinutes || 0));
  const streak = calcStreak([...trades].sort((a, b) => +new Date(b.tradeDate) - +new Date(a.tradeDate)));

  const byDay = Object.entries(
    groupBy(sortedAsc, (trade) => format(startOfDay(new Date(trade.tradeDate)), 'yyyy-MM-dd')),
  ).map(([date, items]) => ({
    date,
    label: format(new Date(date), 'MMM d'),
    pnl: Number(items.reduce((sum, item) => sum + item.netPnl, 0).toFixed(2)),
    trades: items.length,
    winRate: Number(calculateWinRate(items).toFixed(1)),
  }));

  let runningEquity = 0;
  const equityCurve = byDay.map((day) => {
    runningEquity += day.pnl;
    return { ...day, equity: Number(runningEquity.toFixed(2)) };
  });

  const bySetup = Object.entries(groupBy(trades.filter((t) => t.playbook), (trade) => trade.playbook?.name || 'Unassigned')).map(
    ([name, items]) => ({
      name,
      pnl: Number(items.reduce((sum, item) => sum + item.netPnl, 0).toFixed(2)),
      winRate: Number(calculateWinRate(items).toFixed(1)),
      avgR: Number(average(items.map((item) => item.rMultiple || 0)).toFixed(2)),
      trades: items.length,
    }),
  ).sort((a, b) => b.pnl - a.pnl);

  const bySymbol = Object.entries(groupBy(trades, (trade) => trade.symbol)).map(([symbol, items]) => ({
    symbol,
    pnl: Number(items.reduce((sum, item) => sum + item.netPnl, 0).toFixed(2)),
    trades: items.length,
    winRate: Number(calculateWinRate(items).toFixed(1)),
  })).sort((a, b) => b.pnl - a.pnl);

  const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const byWeekday = weekdayNames.map((label, index) => {
    const items = trades.filter((trade) => getDay(new Date(trade.tradeDate)) === index);
    return { label, pnl: Number(items.reduce((sum, item) => sum + item.netPnl, 0).toFixed(2)), trades: items.length };
  });

  const byHour = Array.from({ length: 24 }, (_, hour) => {
    const items = trades.filter((trade) => trade.entryTime && getHours(new Date(trade.entryTime)) === hour);
    return { hour: `${hour}:00`, trades: items.length, pnl: Number(items.reduce((sum, item) => sum + item.netPnl, 0).toFixed(2)) };
  });

  const mistakesFrequency = Object.entries(
    groupBy(
      trades.flatMap((trade) => trade.tags.filter((tag) => tag.tag.type === 'MISTAKE').map((tag) => tag.tag.name)),
      (name) => name,
    ),
  ).map(([name, items]) => ({ name, count: items.length })).sort((a, b) => b.count - a.count);

  const emotionsFrequency = Object.entries(
    groupBy(
      trades.flatMap((trade) => trade.tags.filter((tag) => tag.tag.type === 'EMOTION').map((tag) => tag.tag.name)),
      (name) => name,
    ),
  ).map(([name, items]) => ({ name, count: items.length })).sort((a, b) => b.count - a.count);

  const followedPlanTrades = trades.filter((trade) => trade.followedPlan);
  const notFollowedPlanTrades = trades.filter((trade) => !trade.followedPlan);
  const followedPlan = {
    followed: followedPlanTrades.length,
    notFollowed: notFollowedPlanTrades.length,
    followedPnl: followedPlanTrades.reduce((sum, trade) => sum + trade.netPnl, 0),
    notFollowedPnl: notFollowedPlanTrades.reduce((sum, trade) => sum + trade.netPnl, 0),
  };

  const screenshotBacked = {
    withScreenshots: trades.filter((trade) => trade.images.length > 0).length,
    withoutScreenshots: trades.filter((trade) => trade.images.length === 0).length,
  };

  const monthlyCalendar = Object.entries(groupBy(trades, (trade) => format(new Date(trade.tradeDate), 'yyyy-MM'))).map(([month, items]) => ({
    month,
    label: format(new Date(`${month}-01`), 'MMM yyyy'),
    pnl: Number(items.reduce((sum, item) => sum + item.netPnl, 0).toFixed(2)),
    trades: items.length,
  }));

  const bestDay = byDay.reduce((best, day) => (day.pnl > best.pnl ? day : best), { label: '-', pnl: 0, date: '', trades: 0, winRate: 0 });
  const worstDay = byDay.reduce((worst, day) => (day.pnl < worst.pnl ? day : worst), { label: '-', pnl: 0, date: '', trades: 0, winRate: 0 });

  const bestTrades = [...trades].sort((a, b) => b.netPnl - a.netPnl).slice(0, 5);
  const worstTrades = [...trades].sort((a, b) => a.netPnl - b.netPnl).slice(0, 5);
  const topSetup = bySetup[0] || null;
  const topSymbol = bySymbol[0] || null;
  const drawdown = calculateMaxDrawdown(equityCurve);
  const planAdherenceRate = trades.length ? (followedPlan.followed / trades.length) * 100 : 0;
  const positiveDayRate = byDay.length ? (byDay.filter((day) => day.pnl > 0).length / byDay.length) * 100 : 0;
  const averageR = average(trades.map((t) => t.rMultiple || 0));
  const medianR = median(trades.map((t) => t.rMultiple || 0));
  const consistencyScore = Math.max(0, Math.min(100,
    Math.round((planAdherenceRate * 0.45) + (winRate * 0.3) + (Math.max(0, profitFactor) * 10) + (positiveDayRate * 0.15)),
  ));

  const coachingNotes = [
    topSetup ? `Best setup right now is ${topSetup.name} with ${topSetup.trades} trades and ${topSetup.winRate}% win rate.` : 'Tag a few trades to a playbook so your edge becomes measurable.',
    mistakesFrequency[0] ? `Most repeated mistake is ${mistakesFrequency[0].name}; it shows up ${mistakesFrequency[0].count} times.` : 'Start tagging mistakes to surface the leaks that keep costing you money.',
    followedPlan.followedPnl >= followedPlan.notFollowedPnl
      ? 'Trades that followed your plan are outperforming the ones that did not.'
      : 'Your off-plan trades are dragging results. Tighten your pre-trade checklist.',
  ];

  return {
    summary: {
      totalPnl,
      winRate,
      averageWin: average(winners.map((t) => t.netPnl)),
      averageLoss: average(losers.map((t) => t.netPnl)),
      profitFactor,
      expectancy,
      totalTrades: trades.length,
      bestDay,
      worstDay,
      currentStreak: streak,
      averageHoldMinutes: avgHold,
      maxDrawdown: drawdown,
      consistencyScore,
      positiveDayRate,
      averageR,
      medianR,
      planAdherenceRate,
    },
    charts: {
      dailyPnl: byDay,
      equityCurve,
      bySetup,
      bySymbol,
      byWeekday,
      byHour,
      monthlyCalendar,
    },
    insights: {
      longVsShort: [
        {
          side: 'LONG',
          pnl: trades.filter((t) => t.side === 'LONG').reduce((sum, item) => sum + item.netPnl, 0),
          trades: trades.filter((t) => t.side === 'LONG').length,
        },
        {
          side: 'SHORT',
          pnl: trades.filter((t) => t.side === 'SHORT').reduce((sum, item) => sum + item.netPnl, 0),
          trades: trades.filter((t) => t.side === 'SHORT').length,
        },
      ],
      mistakesFrequency,
      emotionsFrequency,
      followedPlan,
      screenshotBacked,
      bestTrades,
      worstTrades,
      bestSetupsOverTime: bySetup.slice(0, 5),
      worstRecurringMistakes: mistakesFrequency.slice(0, 5),
      averageWinnerVsLoser: [
        { label: 'Average Winner', value: average(winners.map((t) => t.netPnl)) },
        { label: 'Average Loser', value: average(losers.map((t) => Math.abs(t.netPnl))) },
      ],
      consecutiveWinsLosses: {
        maxWins: Math.max(...sortedAsc.map((_, i) => {
          let streakCount = 0;
          for (let x = i; x < sortedAsc.length && sortedAsc[x].netPnl > 0; x += 1) streakCount += 1;
          return streakCount;
        }), 0),
        maxLosses: Math.max(...sortedAsc.map((_, i) => {
          let streakCount = 0;
          for (let x = i; x < sortedAsc.length && sortedAsc[x].netPnl < 0; x += 1) streakCount += 1;
          return streakCount;
        }), 0),
      },
      topSetup,
      topSymbol,
      coachingNotes,
    },
  };
}
