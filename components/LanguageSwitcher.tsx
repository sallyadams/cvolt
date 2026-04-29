'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next-intl/client';
import { useTransition } from 'react';

export default function LanguageSwitcher() {
  const t = useTranslations('language');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const switchLocale = (newLocale: string) => {
    startTransition(() => {
      router.replace(pathname, { locale: newLocale });
    });
  };

  return (
    <div className="relative">
      <select
        value={locale}
        onChange={(e) => switchLocale(e.target.value)}
        disabled={isPending}
        className="bg-white border border-[#e3dfd8] text-[#19181e] text-[0.82rem] font-medium px-3 py-2 rounded-full hover:border-[#d4cfc6] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#d4922a] focus:ring-opacity-50 disabled:opacity-50"
      >
        <option value="en">{t('english')}</option>
        <option value="fr">{t('french')}</option>
      </select>
    </div>
  );
}