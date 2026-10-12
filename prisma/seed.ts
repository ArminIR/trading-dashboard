import crypto from 'crypto';
import { PrismaClient, ReviewPeriodType, TagType, TradeRating, TradeSide } from '@prisma/client';
import { addHours, subDays } from 'date-fns';

const prisma = new PrismaClient();
const FUTURES_POINT_VALUES = { NQ: 20, MNQ: 2, ES: 50, MES: 5, YM: 5, MYM: 0.5 } as const;

async function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (error, key) => {
      if (error) reject(error);
      else resolve(key as Buffer);
    });
  });
  return `${salt}:${derived.toString('hex')}`;
}

async function main() {
  // Seeding clears existing records. Never wipe an existing journal silently.
  const existingUsers = await prisma.user.count();
  if (existingUsers > 0 && process.env.ALLOW_DESTRUCTIVE_SEED !== 'true') {
    throw new Error('Database contains users. Seeding would delete existing data. Back up your database and explicitly set ALLOW_DESTRUCTIVE_SEED=true to replace it.');
  }
  await prisma.tradeTag.deleteMany();
  await prisma.tradeImage.deleteMany();
  await prisma.trade.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.playbook.deleteMany();
  await prisma.account.deleteMany();
  await prisma.review.deleteMany();
  await prisma.importTemplate.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  const user = await prisma.user.create({
    data: {
      name: 'Demo Trader',
      email: 'demo@arminir.local',
      passwordHash: await hashPassword('tradejournal123'),
    },
  });

  const [topstep, lucid, alpha] = await Promise.all([
    prisma.account.create({ data: { userId: user.id, name: 'Topstep', broker: 'Tradovate', initialSize: 50000 } }),
    prisma.account.create({ data: { userId: user.id, name: 'LucidTrading', broker: 'Tradovate', initialSize: 50000 } }),
    prisma.account.create({ data: { userId: user.id, name: 'Alpha Futures', broker: 'Tradovate', initialSize: 50000 } }),
  ]);

  const tagMap = Object.fromEntries((await Promise.all([
    prisma.tag.create({ data: { userId: user.id, name: 'Opening Range Breakout', type: TagType.SETUP, color: '#5eead4' } }),
    prisma.tag.create({ data: { userId: user.id, name: 'Pullback Trend', type: TagType.SETUP, color: '#60a5fa' } }),
    prisma.tag.create({ data: { userId: user.id, name: 'Late Entry', type: TagType.MISTAKE, color: '#f97316' } }),
    prisma.tag.create({ data: { userId: user.id, name: 'FOMO', type: TagType.EMOTION, color: '#f59e0b' } }),
    prisma.tag.create({ data: { userId: user.id, name: 'Calm', type: TagType.EMOTION, color: '#34d399' } }),
    prisma.tag.create({ data: { userId: user.id, name: 'A Execution', type: TagType.EXECUTION, color: '#a78bfa' } }),
  ])).map((tag) => [tag.name, tag.id]));

  const [orb, pullback] = await Promise.all([
    prisma.playbook.create({ data: {
      userId: user.id,
      name: 'ORB Momentum',
      description: 'Opening range break with volume confirmation.',
      marketConditions: 'Trend day or strong catalyst.',
      entryCriteria: 'Break above opening range high, reclaim VWAP.',
      exitCriteria: 'Scale at 2R and trail remainder.',
      invalidationRules: 'No hold above opening range with weak volume.',
      checklist: 'Catalyst confirmed\nRelative volume\nDefined stop',
    }}),
    prisma.playbook.create({ data: {
      userId: user.id,
      name: 'Trend Pullback',
      description: 'Higher timeframe continuation off intraday support.',
      marketConditions: 'Clean trend and orderly pullback.',
      entryCriteria: 'Higher low holds and momentum returns.',
      exitCriteria: 'Partial at prior high, trail extension.',
      invalidationRules: 'Support fails on heavy selling.',
      checklist: 'Trend intact\nSupport respected\nRisk under control',
    }}),
  ]);

  const seeds = [
    { daysAgo: 1, symbol: 'NQ', accountId: topstep.id, playbookId: orb.id, side: TradeSide.LONG, qty: 2, entry: 18450, exit: 18489, fees: 8, risk: 120, confidence: 8, rating: TradeRating.A, followedPlan: true, tags: ['Opening Range Breakout', 'Calm', 'A Execution'] },
    { daysAgo: 2, symbol: 'MNQ', accountId: lucid.id, playbookId: pullback.id, side: TradeSide.SHORT, qty: 4, entry: 212.4, exit: 209.9, fees: 4.5, risk: 150, confidence: 7, rating: TradeRating.B, followedPlan: true, tags: ['Pullback Trend', 'Calm', 'A Execution'] },
    { daysAgo: 3, symbol: 'ES', accountId: topstep.id, playbookId: orb.id, side: TradeSide.LONG, qty: 3, entry: 5211, exit: 5205, fees: 9, risk: 90, confidence: 5, rating: TradeRating.C, followedPlan: false, tags: ['Opening Range Breakout', 'Late Entry', 'FOMO'] },
    { daysAgo: 4, symbol: 'MES', accountId: alpha.id, playbookId: pullback.id, side: TradeSide.LONG, qty: 5, entry: 418.6, exit: 423.2, fees: 4.4, risk: 140, confidence: 8, rating: TradeRating.A, followedPlan: true, tags: ['Pullback Trend', 'Calm', 'A Execution'] },
  ];

  for (const seed of seeds) {
    const tradeDate = subDays(new Date(), seed.daysAgo);
    const entryTime = addHours(tradeDate, 14);
    const exitTime = addHours(entryTime, 1);
    const pointValue = FUTURES_POINT_VALUES[seed.symbol as keyof typeof FUTURES_POINT_VALUES] ?? 1;
    const grossPnl = seed.side === TradeSide.LONG
      ? (seed.exit - seed.entry) * seed.qty * pointValue
      : (seed.entry - seed.exit) * seed.qty * pointValue;
    const netPnl = grossPnl - seed.fees;

    await prisma.trade.create({
      data: {
        userId: user.id,
        tradeDate,
        entryTime,
        exitTime,
        symbol: seed.symbol,
        market: 'Futures',
        side: seed.side,
        accountId: seed.accountId,
        playbookId: seed.playbookId,
        quantity: seed.qty,
        entryPrice: seed.entry,
        exitPrice: seed.exit,
        fees: seed.fees,
        grossPnl,
        netPnl,
        riskAmount: seed.risk,
        rMultiple: netPnl / seed.risk,
        confidenceRating: seed.confidence,
        rating: seed.rating,
        followedPlan: seed.followedPlan,
        entryReason: 'Seeded demo entry reason.',
        exitReason: 'Seeded demo exit reason.',
        notes: 'Seeded demo note.',
        preTradeNotes: 'Seeded pre-trade note.',
        postTradeNotes: 'Seeded post-trade note.',
        lessonsLearned: 'Seeded lesson learned.',
        executionQuality: 'Good overall execution.',
        holdMinutes: 60,
        importSource: 'Seed Demo',
        tags: { create: seed.tags.map((name) => ({ tagId: tagMap[name] })) },
      },
    });
  }

  await prisma.review.create({
    data: {
      userId: user.id,
      periodType: ReviewPeriodType.WEEKLY,
      reviewDate: subDays(new Date(), 1),
      title: 'Weekly review',
      summary: 'A setups paid well, but one emotional chase hurt efficiency.',
      topLessons: 'Waiting for confirmation improved entry quality.',
      biggestMistakes: 'Late entries after missing the first move.',
      repeatedPatterns: 'Better discipline when premarket plan is explicit.',
      improvementGoals: 'Pause after missed openers before taking a reactive entry.',
    },
  });

  await prisma.importTemplate.create({
    data: {
      userId: user.id,
      name: 'Tradovate CSV',
      mappingJson: JSON.stringify({
        tradeDate: 'Date',
        symbol: 'Symbol',
        market: 'Market',
        side: 'Side',
        entryPrice: 'Entry Price',
        exitPrice: 'Exit Price',
        quantity: 'Quantity',
        fees: 'Fees',
      }),
    },
  });

  await prisma.setting.create({
    data: { userId: user.id, key: 'defaultRiskAmount', value: '100' },
  });

  console.log('Seeded demo user: demo@arminir.local / tradejournal123');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
