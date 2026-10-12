import { NextResponse, type NextRequest } from 'next/server';
import { AUTH_COOKIE } from '@/lib/constants';

const PUBLIC_PATHS = ['/login', '/register', '/api/login', '/api/register', '/sample-trades.csv'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/uploads') ||
    PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))
  ) {
    return NextResponse.next();
  }

  const auth = request.cookies.get(AUTH_COOKIE)?.value;
  if (auth) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = '/login';
  url.searchParams.set('error', 'Please log in to continue.');
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|uploads).*)'],
};
