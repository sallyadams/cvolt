import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';
import en from './messages/en.json';
import fr from './messages/fr.json';

// Can be imported from a shared config
export const locales = ['en', 'fr'] as const;
export type Locale = typeof locales[number];

const messages = {
  en,
  fr,
};

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locale || !locales.includes(locale as any)) notFound();

  return {
    locale,
    messages: messages[locale as Locale]
  };
});