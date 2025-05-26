"use client";

import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { useRouter } from 'next/navigation';

// Temporarily disabled middleware to test if it's causing the loop
export async function middleware(req: NextRequest) {
  // Simply pass through all requests for now
  console.log('Middleware disabled - passing through all requests');
  return NextResponse.next();
  
  /*
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const { data } = await supabase.auth.getSession();
  const session = data.session;

  console.log('Middleware - Path:', req.nextUrl.pathname);
  console.log('Middleware - Session exists:', !!session);

  // For protected routes, redirect to sign-in if no session
  if (!session && req.nextUrl.pathname.startsWith('/student')) {
    console.log('Middleware - No session, redirecting to signin');
    const redirectUrl = new URL('/auth/signin', req.url);
    return NextResponse.redirect(redirectUrl);
  }

  // Allow all other requests to pass through
  return res;
  */
}

export const config = {
  matcher: ['/student/:path*']
}; 