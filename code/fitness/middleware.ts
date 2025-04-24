import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const { pathname } = request.nextUrl;

  // 允许访问的公开路径
  const publicPaths = [
    '/',
    '/home',
    '/login',
    '/register',
    '/api/auth',
  ];

  // 检查是否是公开路径
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

  // 如果用户未登录且访问非公开路径，重定向到登录页
  if (!token && !isPublicPath) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 如果用户已登录且访问登录/注册页，重定向到首页
  if (token && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  // 检查用户角色
  if (token) {
    // 如果访问 trainer 页面但用户不是 trainer 角色
    if (pathname.startsWith('/trainer') && token.role !== 'trainer') {
      return NextResponse.redirect(new URL('/home', request.url));
    }
  }

  return NextResponse.next();
}

// 配置中间件匹配的路径
export const config = {
  matcher: [
    /*
     * 匹配所有路径除了:
     * - api/auth (NextAuth.js 相关)
     * - _next/static (静态文件)
     * - _next/image (图片优化)
     * - favicon.ico (网站图标)
     * - 公开路径
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
}; 