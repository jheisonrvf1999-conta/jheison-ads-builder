import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_ROUTES = ['/login', '/register', '/api/auth']
const API_ROUTES_PREFIX = '/api'
const AUTH_API_PREFIX = '/api/auth'

export default auth((req) => {
  const { nextUrl, auth: session } = req
  const pathname = nextUrl.pathname

  // Allow public auth routes
  if (pathname.startsWith(AUTH_API_PREFIX)) {
    return NextResponse.next()
  }

  // Allow public pages
  if (PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(route + '/'))) {
    // If already logged in and trying to access auth pages, redirect to dashboard
    if (session && (pathname === '/login' || pathname === '/register')) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    return NextResponse.next()
  }

  // Protect API routes
  if (pathname.startsWith(API_ROUTES_PREFIX) && !pathname.startsWith(AUTH_API_PREFIX)) {
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.next()
  }

  // Protect dashboard and other app routes
  if (!session) {
    const callbackUrl = encodeURIComponent(pathname)
    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${callbackUrl}`, req.url)
    )
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
