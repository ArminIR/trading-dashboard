import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { accountSchema } from '@/lib/validation';
import { requireApiUser } from '@/lib/auth';

export async function POST(request: Request) {
  const user = await requireApiUser();
  if (!user) return NextResponse.redirect(new URL('/login', request.headers.get('origin') || request.url));

  const formData = await request.formData();
  const parsed = accountSchema.safeParse({
    name: formData.get('name'),
    broker: formData.get('broker'),
    initialSize: formData.get('initialSize') || undefined,
  });
  if (!parsed.success) return NextResponse.redirect(new URL('/settings', request.headers.get('origin') || request.url));

  try {
    await prisma.account.create({
      data: { userId: user.id, ...parsed.data, initialSize: parsed.data.initialSize || null },
    });
  } catch {
    return NextResponse.redirect(new URL('/settings?accountError=duplicate', request.headers.get('origin') || request.url));
  }
  return NextResponse.redirect(new URL('/settings', request.headers.get('origin') || request.url));
}
