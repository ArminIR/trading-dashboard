import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireApiUser } from '@/lib/auth';

export async function POST(request: Request) {
  const user = await requireApiUser();
  if (!user) return NextResponse.redirect(new URL('/login', request.headers.get('origin') || request.url));

  const formData = await request.formData();
  const value = String(formData.get('value') || '100');
  await prisma.setting.upsert({
    where: { userId_key: { userId: user.id, key: 'defaultRiskAmount' } },
    update: { value },
    create: { userId: user.id, key: 'defaultRiskAmount', value },
  });
  return NextResponse.redirect(new URL('/settings', request.headers.get('origin') || request.url));
}
