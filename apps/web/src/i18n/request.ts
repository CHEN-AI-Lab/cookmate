import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { locales, defaultLocale } from '@cookmate/shared/messages';
import { cookies } from 'next/headers';

export default getRequestConfig(async ({ requestLocale }) => {
  // Try middleware-provided locale first (set via x-next-intl-locale header)
  let requested = await requestLocale;

  // Without middleware, read the NEXT_LOCALE cookie directly
  if (!requested || !hasLocale(locales, requested)) {
    try {
      const cookieStore = await cookies();
      const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value;
      if (cookieLocale && hasLocale(locales, cookieLocale)) {
        requested = cookieLocale;
      }
    } catch {
      // cookies() may throw in some contexts — fall through to default
    }
  }

  const locale = hasLocale(locales, requested) ? requested : defaultLocale;

  return {
    locale,
    messages: (await import(`@cookmate/shared/messages/${locale}.json`)).default,
  };
});