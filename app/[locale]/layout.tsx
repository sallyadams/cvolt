import { notFound } from "next/navigation";
import type { ReactNode } from "react";

const locales = ["en", "fr"] as const;

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!locales.includes(locale as any)) {
    notFound();
  }

  return <>{children}</>;
}
