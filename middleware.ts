import createMiddleware from 'next-intl/middleware';

const locales = ['en', 'fr'];

export default createMiddleware({
  // A list of all locales that are supported
  locales,

  // Used when no locale matches
  defaultLocale: 'en',

  // Routes that should be localized
  localePrefix: 'as-needed'
});

export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/(en|fr)/:path*']
};