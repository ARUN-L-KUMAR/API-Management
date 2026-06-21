import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes
  if (pathname === '/login') {
    return NextResponse.next()
  }

  // Redirect root to /keys
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/keys', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
