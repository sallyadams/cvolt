import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import type { ReactNode } from "react";
import type { Metadata } from "next";

const locales = ["en", "fr"] as const;

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

const META: Record<string, Metadata> = {
  fr: {
    title: "cvolt — Transformez votre CV en entretiens",
    description:
      "Score ATS gratuit, CV et lettre de motivation adaptés à chaque offre, préparation d'entretien avec l'IA. Commencez gratuitement.",
  },
  en: {
    title: "cvolt — Turn your CV into interviews",
    description:
      "Free ATS score, a CV and cover letter tailored to each job, and AI interview practice. Start for free.",
  },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const meta = META[locale] ?? META.fr;
  return {
    ...meta,
    alternates: { languages: { fr: "/fr", en: "/en", "x-default": "/fr" } },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages({ locale });

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}

