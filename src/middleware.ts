import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySession } from '@/lib/auth/session-token';

const SESSION_COOKIE = 'delta_session';

// everything under these stays reachable without logging in — the public apply form, status
// lookup, challenge page, and the API routes (which have their own request-level checks, e.g.
// the ingest webhook's shared secret).
const PUBLIC_PREFIXES = ['/apply', '/status', '/challenge', '/login', '/api'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const userId = await verifySession(token);
  if (!userId) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
