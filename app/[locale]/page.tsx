'use client';

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function LandingPage() {
  const t = useTranslations();
  const locale = useLocale();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <main className="relative bg-[#f8f6f1] text-[#19181e] overflow-x-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ─── Noise texture overlay (fixed, decorative) ─── */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.04] mix-blend-multiply"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* ═══════════════════════════════════════════════════
          NAV
      ═══════════════════════════════════════════════════ */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[rgba(248,246,241,0.85)] backdrop-blur-xl border-b border-[#e3dfd8]'
          : 'bg-transparent'
      }`}>
        <div className="max-w-6xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between">
          <Link href={`/${locale}`} className="flex items-center gap-0.5 text-[1.35rem] font-bold tracking-[-0.03em]" style={{ fontFamily: "'Fraunces', serif" }}>
            {t('nav.brand')}
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a href="#how" className="text-[0.88rem] font-medium text-[#6b6779] hover:text-[#19181e] transition-colors">{t('nav.howItWorks')}</a>
            <a href="#features" className="text-[0.88rem] font-medium text-[#6b6779] hover:text-[#19181e] transition-colors">{t('nav.features')}</a>
            <a href="#pricing" className="text-[0.88rem] font-medium text-[#6b6779] hover:text-[#19181e] transition-colors">{t('nav.pricing')}</a>
            <a href="#faq" className="text-[0.88rem] font-medium text-[#6b6779] hover:text-[#19181e] transition-colors">{t('nav.faq')}</a>
          </div>

          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Link
              href={`/app/cv`}
              className="bg-[#19181e] text-white text-[0.82rem] font-semibold px-4 py-2.5 rounded-full hover:bg-[#2c2b34] transition-all duration-200 hover:-translate-y-0.5 shadow-[0_1px_3px_rgba(25,24,30,.08)]"
            >
              {t('nav.buildMyCV')}
            </Link>
          </div>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════
          HERO
      ═══════════════════════════════════════════════════ */}
      <section className="relative pt-32 md:pt-40 pb-20 md:pb-32 px-5 md:px-8">

        {/* Decorative blur orb */}
        <div aria-hidden className="absolute top-32 right-[-10%] w-[500px] h-[500px] rounded-full opacity-40 blur-3xl"
          style={{ background: 'radial-gradient(circle, #fef3dc 0%, transparent 70%)' }}
        />
        <div aria-hidden className="absolute bottom-20 left-[-15%] w-[400px] h-[400px] rounded-full opacity-30 blur-3xl"
          style={{ background: 'radial-gradient(circle, #d5f5e8 0%, transparent 70%)' }}
        />

        <div className="relative max-w-6xl mx-auto grid lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-16 items-center">

          {/* Left — copy */}
          <div className="relative z-10">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 bg-white border border-[#e3dfd8] px-3 py-1.5 rounded-full mb-7 shadow-[0_1px_3px_rgba(25,24,30,.04)]">
              <span className="w-1.5 h-1.5 bg-[#1f8a5e] rounded-full animate-pulse" />
              <span className="text-[0.72rem] font-semibold tracking-wide text-[#2c2b34]">{t('hero.eyebrow')}</span>
            </div>

            {/* Headline */}
            <h1 className="text-[2.75rem] sm:text-[3.5rem] lg:text-[4.5rem] font-bold leading-[0.95] tracking-[-0.04em] text-[#19181e] mb-6" style={{ fontFamily: "'Fraunces', serif" }}>
              {t('hero.headline').split(' ').slice(0, 2).join(' ')}{' '}
              <em className="italic font-semibold text-[#d4922a]">{t('hero.headline').split(' ')[2]}</em>
              <br />
              {t('hero.headline').split(' ').slice(3).join(' ')}
            </h1>

            {/* Sub */}
            <p className="text-[1.05rem] md:text-[1.18rem] text-[#6b6779] leading-[1.55] mb-9 max-w-[540px]">
              {t('hero.subtitle')}
            </p>

            {/* CTA row */}
            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <Link
                href={`/app/cv`}
                className="group inline-flex items-center justify-center gap-2 bg-[#d4922a] text-white font-bold text-[1rem] px-7 py-4 rounded-full hover:brightness-105 hover:-translate-y-0.5 transition-all duration-200 shadow-[0_8px_24px_rgba(212,146,42,.35)]"
              >
                {t('hero.ctaPrimary')}
                <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">→</span>
              </Link>
              <a
                href="#how"
                className="inline-flex items-center justify-center gap-2 bg-white border border-[#e3dfd8] text-[#19181e] font-semibold text-[1rem] px-6 py-4 rounded-full hover:border-[#d4cfc6] transition-all duration-200"
              >
                {t('hero.ctaSecondary')}
              </a>
            </div>

            {/* Trust bar */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-[0.8rem] text-[#6b6779]">
              <span className="flex items-center gap-1.5">
                <span className="text-[#1f8a5e]">✓</span> {t('hero.trust1')}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-[#1f8a5e]">✓</span> {t('hero.trust2')}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-[#1f8a5e]">✓</span> {t('hero.trust3')}
              </span>
            </div>
          </div>

          {/* Right — hero visual (CV card mockup) */}
          <div className="relative z-10">
            <HeroCVMockup />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          SOCIAL PROOF STRIP
      ═══════════════════════════════════════════════════ */}
      <section className="relative py-10 border-y border-[#e3dfd8] bg-white/40">
        <div className="max-w-6xl mx-auto px-5 md:px-8">
          <p className="text-center text-[0.68rem] font-bold tracking-[0.15em] uppercase text-[#a09cb2] mb-5">
            {t('socialProof.title')}
          </p>
          <div className="flex flex-wrap justify-center items-center gap-x-10 gap-y-4">
            {[
              { k: '1,247', v: t('socialProof.stats.cvs') },
              { k: '87%', v: 'pass ATS first try' },
              { k: '3.2×', v: 'more interviews' },
              { k: '4.8★', v: 'avg rating' },
              { k: '15', v: 'countries' },
            ].map(stat => (
              <div key={stat.v} className="flex items-baseline gap-2">
                <span className="text-[1.3rem] font-bold text-[#19181e]" style={{ fontFamily: "'Fraunces', serif" }}>
                  {stat.k}
                </span>
                <span className="text-[0.78rem] text-[#6b6779]">{stat.v}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          HOW IT WORKS — 3 steps
      ═══════════════════════════════════════════════════ */}
      <section id="how" className="relative py-20 md:py-28 px-5 md:px-8 bg-white border-y border-[#e3dfd8]">
        <div className="max-w-6xl mx-auto">

          <div className="max-w-2xl mb-16">
            <div className="text-[0.68rem] font-bold tracking-[0.15em] uppercase text-[#d4922a] mb-4">
              {t('howItWorks.title')}
            </div>
            <h2 className="text-[2rem] md:text-[2.75rem] font-bold leading-[1.05] tracking-[-0.03em] text-[#19181e]" style={{ fontFamily: "'Fraunces', serif" }}>
              {t('howItWorks.subtitle')}
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                n: '01',
                title: t('howItWorks.step1.title'),
                desc: t('howItWorks.step1.description'),
                icon: '✍️',
              },
              {
                n: '02',
                title: t('howItWorks.step2.title'),
                desc: t('howItWorks.step2.description'),
                icon: '🎯',
              },
              {
                n: '03',
                title: t('howItWorks.step3.title'),
                desc: t('howItWorks.step3.description'),
                icon: '⬇️',
              },
            ].map((step, i) => (
              <div key={step.n} className="relative group">
                {/* Card */}
                <div className="bg-[#f8f6f1] border border-[#e3dfd8] rounded-[18px] p-7 h-full transition-all duration-300 hover:border-[#d4922a] hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(25,24,30,.08)]">
                  <div className="flex items-start justify-between mb-5">
                    <div className="text-[0.72rem] font-bold tracking-[0.1em] text-[#a09cb2]">
                      {step.n}
                    </div>
                    <div className="text-[1.75rem] opacity-80 group-hover:scale-110 transition-transform duration-300">
                      {step.icon}
                    </div>
                  </div>
                  <h3 className="text-[1.35rem] font-bold tracking-[-0.02em] text-[#19181e] mb-2.5 leading-[1.15]" style={{ fontFamily: "'Fraunces', serif" }}>
                    {step.title}
                  </h3>
                  <p className="text-[0.92rem] text-[#6b6779] leading-[1.6]">
                    {step.desc}
                  </p>
                </div>

                {/* Connector arrow (desktop only) */}
                {i < 2 && (
                  <div aria-hidden className="hidden md:block absolute top-1/2 -right-5 w-10 h-[1px] bg-[#e3dfd8] z-0">
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 text-[#d4cfc6] text-sm">→</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════════════ */}
      <footer className="relative py-16 md:py-20 px-5 md:px-8 bg-[#19181e] text-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-0.5 text-[1.5rem] font-bold tracking-[-0.03em] mb-4" style={{ fontFamily: "'Fraunces', serif" }}>
                {t('nav.brand')}
              </div>
              <p className="text-[#a09cb2] text-sm leading-[1.6]">
                AI-powered CV optimization to help you land more interviews.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-[#a09cb2]">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#how" className="hover:text-white transition-colors">How it works</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-[#a09cb2]">
                <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Help</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-[#a09cb2]">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-[#2c2b34] flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-[#a09cb2] text-sm">
              {t('footer.copyright')}
            </p>
            <div className="flex items-center gap-6 text-sm text-[#a09cb2]">
              <a href="#" className="hover:text-white transition-colors">{t('footer.links.privacy')}</a>
              <a href="#" className="hover:text-white transition-colors">{t('footer.links.terms')}</a>
              <a href="#" className="hover:text-white transition-colors">{t('footer.links.contact')}</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

// ── Hero CV Mockup Component ──────────────────────────────────────────

function HeroCVMockup() {
  return (
    <div className="relative">
      {/* Mockup container */}
      <div className="relative bg-white rounded-[24px] shadow-[0_20px_40px_rgba(25,24,30,.15)] p-8 max-w-sm mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[#d4922a] rounded-full flex items-center justify-center text-white font-bold">
            JD
          </div>
          <div>
            <div className="font-semibold text-[#19181e]">Jane Doe</div>
            <div className="text-sm text-[#6b6779]">Software Engineer</div>
          </div>
        </div>

        {/* Content preview */}
        <div className="space-y-4">
          <div className="h-3 bg-[#f0ede6] rounded w-3/4"></div>
          <div className="h-3 bg-[#f0ede6] rounded w-full"></div>
          <div className="h-3 bg-[#f0ede6] rounded w-5/6"></div>
          <div className="h-3 bg-[#f0ede6] rounded w-2/3"></div>
        </div>

        {/* Skills tags */}
        <div className="flex flex-wrap gap-2 mt-6">
          {['React', 'TypeScript', 'Node.js'].map(skill => (
            <span key={skill} className="px-3 py-1 bg-[#f0ede6] text-[#6b6779] text-xs rounded-full">
              {skill}
            </span>
          ))}
        </div>

        {/* Download badge */}
        <div className="absolute -top-3 -right-3 bg-[#1f8a5e] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
          ✓ ATS Ready
        </div>
      </div>

      {/* Floating elements */}
      <div className="absolute -top-4 -left-4 w-8 h-8 bg-[#fef3dc] rounded-full opacity-80 animate-bounce" style={{ animationDelay: '0s' }} />
      <div className="absolute -bottom-2 -right-6 w-6 h-6 bg-[#d5f5e8] rounded-full opacity-60 animate-bounce" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 -left-8 w-4 h-4 bg-[#fce4e4] rounded-full opacity-70 animate-bounce" style={{ animationDelay: '2s' }} />
    </div>
  );
}