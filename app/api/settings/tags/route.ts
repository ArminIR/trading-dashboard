import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { tagSchema } from '@/lib/validation';
import { requireApiUser } from '@/lib/auth';

export async function POST(request: Request) {
  const user = await requireApiUser();
  if (!user) return NextResponse.redirect(new URL('/login', request.headers.get('origin') || request.url));

  const formData = await request.formData();
  const parsed = tagSchema.safeParse({
    name: formData.get('name'),
    type: formData.get('type'),
    color: formData.get('color'),
  });
  if (!parsed.success) return NextResponse.redirect(new URL('/settings', request.headers.get('origin') || request.url));
  try {
    await prisma.tag.create({ data: { userId: user.id, ...parsed.data, color: parsed.data.color || null } });
  } catch {
    return NextResponse.redirect(new URL('/settings?tagError=duplicate', request.headers.get('origin') || request.url));
  }
  return NextResponse.redirect(new URL('/settings', request.headers.get('origin') || request.url));
}
