import createMiddleware from 'next-intl/middleware';
import type { NextRequest } from 'next/server';

const handleI18n = createMiddleware({
  locales: ['zh-CN', 'en'],
  defaultLocale: 'zh-CN',
  localePrefix: 'never',
  localeDetection: false,
});

export default function proxy(request: NextRequest) {
  return handleI18n(request);
}

export const config = {
  matcher: [
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
};