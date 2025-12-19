import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyTokenEdge } from '@/lib/jwt-edge'

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value
  const { pathname } = request.nextUrl

  // Protected routes that require authentication
  const protectedPaths = ['/dashboard', '/bookings', '/delivery', '/admin']
  const adminPaths = ['/admin']

  // Check if path is protected
  const isProtectedPath = protectedPaths.some((path) => pathname.startsWith(path))
  const isAdminPath = adminPaths.some((path) => pathname.startsWith(path))

  // Debug logging
  if (isProtectedPath) {
    console.log(`🔒 Middleware check - Path: ${pathname}, Token exists: ${!!token}`)
  }

  // If protected path and no token, redirect to login
  if (isProtectedPath && !token) {
    console.log(`❌ No token for protected path: ${pathname}`)
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  // Verify token for protected paths
  if (isProtectedPath && token) {
    const user = await verifyTokenEdge(token)
    if (!user) {
      console.log(`❌ Invalid token for: ${pathname}`)
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    console.log(`✅ Valid token for ${pathname}: ${user.email}`)

    // Check admin access
    if (isAdminPath && user.role !== 'ADMIN') {
      console.log(`❌ Non-admin accessing admin path: ${pathname}`)
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }

    // If admin tries to access user dashboard routes, send to admin
    if (!isAdminPath && user.role === 'ADMIN' && isProtectedPath) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin'
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api).*)',
  ],
}
