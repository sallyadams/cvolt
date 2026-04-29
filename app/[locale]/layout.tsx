import { NextIntlClientProvider } from 'next-intl';
import { notFound } from 'next/navigation';
import { locales } from '@/i18n';
import en from '../../messages/en.json';
import fr from '../../messages/fr.json';

export default function LocaleLayout(props: any) {
  const { children, params } = props;
  const locale = params?.locale;

  if (!locales.includes(locale as any)) {
    notFound();
  }

  const messages = locale === 'fr' ? fr : en;

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
