import { NextRequest, NextResponse } from 'next/server';
import { getTrades } from '@/lib/data';
import { buildCoachReport, CoachPeriod } from '@/lib/coach';

export async function GET(request: NextRequest) {
  const period = (request.nextUrl.searchParams.get('period') || 'monthly') as CoachPeriod;
  const safePeriod: CoachPeriod = ['weekly', 'monthly', 'all'].includes(period) ? period : 'monthly';
  const trades = await getTrades();
  const report = buildCoachReport(trades, safePeriod);
  return NextResponse.json(report);
}
