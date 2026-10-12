import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateGrossPnl, calculateNetPnl } from '@/lib/trade-math';
import { requireApiUser } from '@/lib/auth';

function normalizeSide(value: string) {
  const v = value.toUpperCase();
  if (v.includes('SELL') || v.includes('SHORT')) return 'SHORT';
  return 'LONG';
}

export async function POST(request: Request) {
  const user = await requireApiUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const rows = Array.isArray(body.rows) ? body.rows : [];
  const mapping = body.mapping || {};
  const accountId = body.accountId as string;
  const templateName = body.templateName as string | undefined;

  if (!rows.length) {
    return NextResponse.json({ error: 'No CSV rows found.' }, { status: 400 });
  }

  const account = await prisma.account.findFirst({ where: { id: accountId, userId: user.id } });
  if (!account) {
    return NextResponse.json({ error: 'Invalid account selected.' }, { status: 400 });
  }

  const errors: { index: number; reason: string }[] = [];
  let imported = 0;

  for (const [index, row] of rows.entries()) {
    try {
      const tradeDateRaw = row[mapping.tradeDate];
      const symbol = row[mapping.symbol];
      const market = row[mapping.market] || 'Futures';
      const side = normalizeSide(row[mapping.side] || 'LONG');
      const entryPrice = Number(row[mapping.entryPrice]);
      const exitPrice = Number(row[mapping.exitPrice]);
      const quantity = Number(row[mapping.quantity]);
      const fees = Number(row[mapping.fees] || 0);

      if (!tradeDateRaw || !symbol || Number.isNaN(entryPrice) || Number.isNaN(exitPrice) || Number.isNaN(quantity)) {
        throw new Error('Missing required mapped fields');
      }

      const grossPnl = calculateGrossPnl({ side: side as 'LONG' | 'SHORT', entryPrice, exitPrice, quantity, market, symbol });
      const netPnl = calculateNetPnl(grossPnl, fees);

      await prisma.trade.create({
        data: {
          userId: user.id,
          tradeDate: new Date(tradeDateRaw),
          symbol: symbol.toUpperCase(),
          market,
          side: side as any,
          accountId,
          quantity,
          entryPrice,
          exitPrice,
          fees,
          grossPnl,
          netPnl,
          importSource: 'CSV Import',
        },
      });
      imported += 1;
    } catch (error) {
      errors.push({ index: index + 1, reason: error instanceof Error ? error.message : 'Unknown import error' });
    }
  }

  if (templateName && Object.keys(mapping).length) {
    await prisma.importTemplate.upsert({
      where: { userId_name: { userId: user.id, name: templateName } },
      update: { mappingJson: JSON.stringify(mapping) },
      create: { userId: user.id, name: templateName, mappingJson: JSON.stringify(mapping) },
    });
  }

  return NextResponse.json({ imported, errors });
}
