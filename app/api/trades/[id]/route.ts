import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { tradePayloadSchema } from '@/lib/validation';
import { calculateGrossPnl, calculateHoldMinutes, calculateNetPnl, calculateRMultiple } from '@/lib/trade-math';
import { requireApiUser } from '@/lib/auth';

function mapRating(rating?: string | null) {
  if (!rating) return null;
  return rating === 'A+' ? 'A_PLUS' : rating;
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireApiUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const parsed = tradePayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { id } = await params;
  const existingTrade = await prisma.trade.findFirst({ where: { id, userId: user.id } });
  if (!existingTrade) return NextResponse.json({ error: 'Trade not found.' }, { status: 404 });

  const values = parsed.data;
  const [account, playbook, tags] = await Promise.all([
    prisma.account.findFirst({ where: { id: values.accountId, userId: user.id } }),
    values.playbookId ? prisma.playbook.findFirst({ where: { id: values.playbookId, userId: user.id } }) : Promise.resolve(null),
    values.tagIds.length ? prisma.tag.findMany({ where: { id: { in: values.tagIds }, userId: user.id } }) : Promise.resolve([]),
  ]);

  if (!account) return NextResponse.json({ error: 'Invalid account.' }, { status: 400 });
  if (values.playbookId && !playbook) return NextResponse.json({ error: 'Invalid playbook.' }, { status: 400 });
  if (tags.length !== values.tagIds.length) return NextResponse.json({ error: 'One or more tags are invalid.' }, { status: 400 });

  const grossPnl = calculateGrossPnl(values);
  const netPnl = calculateNetPnl(grossPnl, values.fees);
  const rMultiple = calculateRMultiple(netPnl, values.riskAmount);
  const holdMinutes = calculateHoldMinutes(values.entryTime, values.exitTime);

  const trade = await prisma.trade.update({
    where: { id },
    data: {
      tradeDate: new Date(values.tradeDate),
      entryTime: values.entryTime ? new Date(values.entryTime) : null,
      exitTime: values.exitTime ? new Date(values.exitTime) : null,
      symbol: values.symbol.toUpperCase(),
      market: values.market,
      accountId: values.accountId,
      side: values.side,
      playbookId: values.playbookId || null,
      quantity: values.quantity,
      entryPrice: values.entryPrice,
      exitPrice: values.exitPrice,
      fees: values.fees,
      grossPnl,
      netPnl,
      riskAmount: values.riskAmount || null,
      rMultiple,
      confidenceRating: values.confidenceRating || null,
      entryReason: values.entryReason || null,
      exitReason: values.exitReason || null,
      notes: values.notes || null,
      preTradeNotes: values.preTradeNotes || null,
      postTradeNotes: values.postTradeNotes || null,
      lessonsLearned: values.lessonsLearned || null,
      executionQuality: values.executionQuality || null,
      holdMinutes,
      followedPlan: values.followedPlan,
      rating: mapRating(values.rating) as any,
      images: {
        deleteMany: {},
        create: values.imageUrls.map((url) => ({ url })),
      },
      tags: {
        deleteMany: {},
        create: values.tagIds.map((tagId) => ({ tagId })),
      },
    },
  });

  return NextResponse.json({ trade });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireApiUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const trade = await prisma.trade.findFirst({ where: { id, userId: user.id } });
  if (!trade) return NextResponse.json({ error: 'Trade not found.' }, { status: 404 });

  await prisma.trade.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
