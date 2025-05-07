import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const { pathname } = request.nextUrl;

  // Public paths that are allowed to access
  const publicPaths = [
    '/',
    '/home',
    '/login',
    '/register',
    '/api/auth',
  ];

  // Check if it's a public path
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

  // If user is not logged in and accessing non-public path, redirect to login page
  if (!token && !isPublicPath) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If user is logged in and accessing login/register page, redirect to home page
  if (token && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  // Check user role
  if (token) {
    // If accessing trainer page but user is not a trainer
    if (pathname.startsWith('/trainer') && token.role !== 'trainer') {
      return NextResponse.redirect(new URL('/home', request.url));
    }
  }

  return NextResponse.next();
}

// Configure middleware matching paths
export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - api/auth (NextAuth.js related)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (website icon)
     * - public paths
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
}; 