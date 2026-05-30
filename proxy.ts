import { NextResponse, type NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const token = request.cookies.get('orbynex_token')?.value;
  const { pathname } = request.nextUrl;

  // Public routes that don't need authentication
  const publicRoutes = ['/', '/login', '/register'];

  // If on a public route, let them through (no redirects)
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // If user doesn't have a token and tries to access protected routes, redirect to login
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // User has token and is on a protected route, allow access
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};