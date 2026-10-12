import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSession, hashPassword } from '@/lib/auth';
import { registerSchema } from '@/lib/validation';
import { ensurePreferredAccounts } from '@/lib/accounts';
import { claimLegacyData } from '@/lib/legacy';

export async function POST(request: Request) {
  const formData = await request.formData();
  const parsed = registerSchema.safeParse({
    name: String(formData.get('name') || ''),
    email: String(formData.get('email') || '').toLowerCase(),
    password: String(formData.get('password') || ''),
  });

  if (!parsed.success) {
    return NextResponse.redirect(new URL('/register?error=Please+complete+all+fields+with+a+valid+email+and+8%2B+character+password.', request.headers.get('origin') || request.url));
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return NextResponse.redirect(new URL('/register?error=An+account+with+that+email+already+exists.', request.headers.get('origin') || request.url));
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const user = await prisma.user.create({
    data: {
      name: parsed.data.name || null,
      email: parsed.data.email,
      passwordHash,
    },
  });

  await claimLegacyData(user.id);
  await ensurePreferredAccounts(user.id);
  await createSession(user.id);
  return NextResponse.redirect(new URL('/dashboard', request.headers.get('origin') || request.url));
}
