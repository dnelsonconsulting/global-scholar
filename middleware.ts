import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // List of public routes that don't require auth
  const publicRoutes = ['/auth', '/_next', '/favicon.ico'];

  // Allow public routes
  if (publicRoutes.some(route => request.nextUrl.pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check for Supabase auth cookie (adjust if your cookie name is different)
  const supabaseToken = request.cookies.get('sb-access-token') || request.cookies.get('supabase-auth-token');
  if (!supabaseToken) {
    // Redirect to sign-in page if not authenticated
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }

  // Allow the request if authenticated
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all routes except for:
    // - /auth/*
    // - /_next/*
    // - /favicon.ico
    '/((?!auth|_next|favicon.ico).*)',
  ],
}; 