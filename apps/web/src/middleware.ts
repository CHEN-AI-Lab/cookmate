import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from '@cookmate/shared/messages';

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'never',
  localeDetection: false,
});

export const config = {
  // Match all pathnames except for api, static files, _next
  matcher: [
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
};