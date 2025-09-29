import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// In production, require NEXTAUTH_SECRET to be set
if (process.env.NODE_ENV === 'production' && !process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET is required in production');
}

const secret = process.env.NEXTAUTH_SECRET;

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

  // Get the token
  const token = await getToken({ req: request, secret });

  // If no token and path is protected, redirect to signin
  if (!token && protectedPaths.some(path => 
    path === pathname || 
    (path.endsWith('**') && pathname.startsWith(path.slice(0, -3)))
  )) {
    const url = new URL('/auth/signin', request.url);
    url.searchParams.set('callbackUrl', encodeURI(request.url));
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};