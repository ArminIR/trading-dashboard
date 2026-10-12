import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSession, verifyPassword } from '@/lib/auth';
import { claimLegacyData } from '@/lib/legacy';
import { loginSchema } from '@/lib/validation';

export async function POST(request: Request) {
  const formData = await request.formData();
  const parsed = loginSchema.safeParse({
    email: String(formData.get('email') || '').toLowerCase(),
    password: String(formData.get('password') || ''),
  });

  if (!parsed.success) {
    return NextResponse.redirect(new URL('/login?error=Please+enter+a+valid+email+and+password.', request.headers.get('origin') || request.url));
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user) {
    return NextResponse.redirect(new URL('/login?error=Invalid+email+or+password.', request.headers.get('origin') || request.url));
  }

  const isValid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!isValid) {
    return NextResponse.redirect(new URL('/login?error=Invalid+email+or+password.', request.headers.get('origin') || request.url));
  }

  await claimLegacyData(user.id);
  await createSession(user.id);
  return NextResponse.redirect(new URL('/dashboard', request.headers.get('origin') || request.url));
}
