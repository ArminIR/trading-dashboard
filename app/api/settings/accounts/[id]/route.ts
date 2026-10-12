import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiUser } from '@/lib/auth';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireApiUser();
  if (!user) return NextResponse.redirect(new URL('/login', request.headers.get('origin') || request.url));

  const { id } = await params;
  const account = await prisma.account.findFirst({ where: { id, userId: user.id } });
  if (!account) return NextResponse.redirect(new URL('/settings?accountError=missing', request.headers.get('origin') || request.url));

  const tradeCount = await prisma.trade.count({ where: { userId: user.id, accountId: id } });
  if (tradeCount > 0) {
    return NextResponse.redirect(new URL('/settings?accountError=used', request.headers.get('origin') || request.url));
  }

  await prisma.account.delete({ where: { id } });
  return NextResponse.redirect(new URL('/settings', request.headers.get('origin') || request.url));
}
