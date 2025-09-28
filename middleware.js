import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Generate a secure random secret if NEXTAUTH_SECRET is not set
const secret = process.env.NEXTAUTH_SECRET || require('crypto').randomBytes(32).toString('hex');

const publicPaths = ['/auth/signin', '/auth/signup', '/auth/register', '/auth/error', '/', '/api/auth/**'];
const protectedPaths = ['/dashboard/**', '/api/admin/**'];

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for public paths
  if (publicPaths.some(path => 
    path === pathname || 
    (path.endsWith('**') && pathname.startsWith(path.slice(0, -3)))
  )) {
    return NextResponse.next();
  }

  // Check if the path is protected
  const isProtected = protectedPaths.some(path => 
    path === pathname || 
    (path.endsWith('**') && pathname.startsWith(path.slice(0, -3)))
  );

  if (isProtected) {
    const token = await getToken({ 
      req: request,
      secret,
      secureCookie: process.env.NODE_ENV === 'production'
    });
    
    // Redirect to signin if not authenticated
    if (!token) {
      const signInUrl = new URL('/auth/signin', request.url);
      signInUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(signInUrl);
    }

    // Check for admin routes
    if (pathname.startsWith('/api/admin') && token.role !== 'ADMIN') {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
