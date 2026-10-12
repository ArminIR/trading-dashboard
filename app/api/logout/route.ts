import { NextResponse } from 'next/server';
import { invalidateSession } from '@/lib/auth';

export async function POST(request: Request) {
  await invalidateSession();
  return NextResponse.redirect(new URL('/login', request.headers.get('origin') || request.url));
}
