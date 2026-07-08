import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from '@cookmate/shared/messages';

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed',
});

export const config = {
  matcher: [
    // Match all pathnames except for api, static files, _next
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
};