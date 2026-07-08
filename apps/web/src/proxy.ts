// Custom proxy — sets NEXT_LOCALE cookie and passes through
// No i18n routing rewrite needed since we use localePrefix: 'never'
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const LOCALES = ['zh-CN', 'en'];
const DEFAULT_LOCALE = 'zh-CN';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip API routes, static files, and Next.js internals
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/_vercel/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check for existing locale cookie
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
  const locale: string = LOCALES.includes(cookieLocale as any) ? (cookieLocale as string) : DEFAULT_LOCALE;

  // Create response and ensure locale cookie is set
  const response = NextResponse.next();
  if (!cookieLocale) {
    response.cookies.set('NEXT_LOCALE', locale, {
      path: '/',
      maxAge: 365 * 24 * 60 * 60,
      sameSite: 'lax',
    });
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
};