"use client"

import { useLocale } from "next-intl"
import Link from "next/link"
import { useState } from "react"
import LanguageSwitcher from "@/components/LanguageSwitcher"

const purple = "#7c5cfc"
const navy = "#0a0e27"
const gray900 = "#0f172a"
const gray600 = "#64748b"
const white = "#ffffff"

type Feature = { text: string; ok: boolean }
type Plan = { name: string; planKey: string; monthly: string; desc: string; features: Feature[]; cta: string; highlighted: boolean; badge: string | null }

// Limits below mirror lib/middleware.ts (TIER_LIMITS). Keep them in sync when limits change.
const COPY: Record<"en" | "fr", {
  eyebrow: string; title: string; subtitle: string; perMonth: string; plans: Plan[];
  unsureTitle: string; unsureText: string; startFree: string; learnMore: string; faqTitle: string;
  faqs: { q: string; a: string }[]; copyright: string; legal: string; privacy: string; terms: string
}> = {
  en: {
    eyebrow: "Pricing",
    title: "Start free. Upgrade when you're ready.",
    subtitle: "No hidden fees. Cancel anytime.",
    perMonth: "/month",
    plans: [
      { name: "Free", planKey: "free", monthly: "€0", desc: "Perfect to get started", highlighted: false, badge: null, cta: "Start free",
        features: [
          { text: "Upload and store your CV", ok: true },
          { text: "1 ATS scan", ok: true },
          { text: "3 bullet point improvements", ok: true },
          { text: "Application tracker", ok: true },
          { text: "AI CV optimisation", ok: false },
          { text: "Cover letter generator", ok: false },
          { text: "Job matching", ok: false },
          { text: "Interview practice", ok: false },
        ] },
      { name: "Pro", planKey: "pro", monthly: "€9", desc: "For serious job seekers", highlighted: true, badge: "MOST POPULAR", cta: "Start Pro",
        features: [
          { text: "20 ATS scans", ok: true },
          { text: "15 recruiter scans", ok: true },
          { text: "AI CV tailoring for each job", ok: true },
          { text: "10 cover letters", ok: true },
          { text: "10 interview practice scores", ok: true },
          { text: "10 job matches", ok: true },
          { text: "LinkedIn summary optimizer", ok: true },
          { text: "AI career coach (50 messages)", ok: true },
          { text: "Bullet point improver", ok: true },
        ] },
      { name: "Premium", planKey: "premium", monthly: "€19", desc: "For an intensive job search", highlighted: false, badge: "NO LIMITS", cta: "Go Premium",
        features: [
          { text: "Everything in Pro", ok: true },
          { text: "Unlimited ATS and recruiter scans", ok: true },
          { text: "Unlimited cover letters and CV tailoring", ok: true },
          { text: "Unlimited interview practice", ok: true },
          { text: "Unlimited AI career coach", ok: true },
          { text: "Unlimited Case for Hire", ok: true },
        ] },
    ],
    unsureTitle: "Still unsure?",
    unsureText: "Start with the Free plan. Upgrade whenever you're ready — your data moves with you.",
    startFree: "Start for free →",
    learnMore: "Learn more",
    faqTitle: "Frequently asked questions",
    faqs: [
      { q: "Can I cancel anytime?", a: "Yes — cancel from your dashboard. You keep access until the end of your billing period." },
      { q: "What payment methods do you accept?", a: "All major credit and debit cards (Visa, Mastercard, Amex), plus Apple Pay and Google Pay, via Stripe. We never see or store your card details." },
      { q: "Is my data safe?", a: "Your CV is private and never sold. To run the AI features, your text is processed by our providers (Anthropic for AI, Stripe for payments, Vercel for hosting). Details are in our privacy policy." },
      { q: "What is ATS and why does it matter?", a: "ATS (Applicant Tracking System) software filters CVs before a recruiter reads them. Our scanner shows what is missing so your CV gets through." },
      { q: "How does AI CV optimisation work?", a: "The AI reads the job offer and your CV, then suggests keywords, stronger bullet points and structure changes. Results are AI-generated: always check them before sending." },
    ],
    copyright: "© 2026 cvolt. All rights reserved.",
    legal: "Legal notice", privacy: "Privacy", terms: "Terms",
  },
  fr: {
    eyebrow: "Tarifs",
    title: "Commencez gratuitement. Passez à la suite quand vous voulez.",
    subtitle: "Pas de frais cachés. Résiliable à tout moment.",
    perMonth: "/mois",
    plans: [
      { name: "Gratuit", planKey: "free", monthly: "0 €", desc: "Parfait pour commencer", highlighted: false, badge: null, cta: "Commencer gratuitement",
        features: [
          { text: "Import et stockage de votre CV", ok: true },
          { text: "1 scan ATS", ok: true },
          { text: "3 améliorations de points clés", ok: true },
          { text: "Suivi des candidatures", ok: true },
          { text: "Optimisation du CV par l'IA", ok: false },
          { text: "Générateur de lettre de motivation", ok: false },
          { text: "Matching d'offres", ok: false },
          { text: "Entraînement à l'entretien", ok: false },
        ] },
      { name: "Pro", planKey: "pro", monthly: "9 €", desc: "Pour une recherche d'emploi sérieuse", highlighted: true, badge: "LE PLUS CHOISI", cta: "Passer Pro",
        features: [
          { text: "20 scans ATS", ok: true },
          { text: "15 scans recruteur", ok: true },
          { text: "CV adapté par l'IA à chaque offre", ok: true },
          { text: "10 lettres de motivation", ok: true },
          { text: "10 entraînements d'entretien notés", ok: true },
          { text: "10 matchings d'offres", ok: true },
          { text: "Optimisation du résumé LinkedIn", ok: true },
          { text: "Coach carrière IA (50 messages)", ok: true },
          { text: "Amélioration des points clés du CV", ok: true },
        ] },
      { name: "Premium", planKey: "premium", monthly: "19 €", desc: "Pour une recherche intensive", highlighted: false, badge: "SANS LIMITES", cta: "Passer Premium",
        features: [
          { text: "Tout le plan Pro", ok: true },
          { text: "Scans ATS et recruteur illimités", ok: true },
          { text: "Lettres et CV adaptés illimités", ok: true },
          { text: "Entraînements d'entretien illimités", ok: true },
          { text: "Coach carrière IA illimité", ok: true },
          { text: "Case for Hire illimité", ok: true },
        ] },
    ],
    unsureTitle: "Vous hésitez encore ?",
    unsureText: "Commencez avec le plan Gratuit. Passez à un plan payant quand vous êtes prêt — vos données vous suivent.",
    startFree: "Commencer gratuitement →",
    learnMore: "En savoir plus",
    faqTitle: "Questions fréquentes",
    faqs: [
      { q: "Puis-je résilier à tout moment ?", a: "Oui — depuis votre tableau de bord. Vous gardez l'accès jusqu'à la fin de la période payée." },
      { q: "Quels moyens de paiement acceptez-vous ?", a: "Toutes les cartes bancaires (Visa, Mastercard, Amex), Apple Pay et Google Pay, via Stripe. Nous ne voyons ni ne stockons vos données de carte." },
      { q: "Mes données sont-elles protégées ?", a: "Votre CV reste privé et n'est jamais vendu. Pour les fonctions IA, votre texte est traité par nos prestataires (Anthropic pour l'IA, Stripe pour le paiement, Vercel pour l'hébergement). Tous les détails sont dans notre politique de confidentialité." },
      { q: "C'est quoi un ATS et pourquoi c'est important ?", a: "Un ATS (logiciel de suivi des candidatures) filtre les CV avant qu'un recruteur les lise. Notre scan vous montre ce qui manque pour passer ce filtre." },
      { q: "Comment fonctionne l'optimisation IA du CV ?", a: "L'IA lit l'offre et votre CV, puis propose des mots-clés, des formulations plus fortes et une meilleure structure. Les résultats sont générés par IA : relisez-les toujours avant envoi." },
    ],
    copyright: "© 2026 cvolt. Tous droits réservés.",
    legal: "Mentions légales", privacy: "Confidentialité", terms: "Conditions",
  },
}

export default function PricingPage() {
  const locale = useLocale()
  const c = COPY[locale === "fr" ? "fr" : "en"]
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <main style={{ fontFamily: "'Inter', system-ui, sans-serif", overflowX: "hidden" }}>
      {/* Nav */}
      <nav style={{ background: navy, padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href={`/${locale}`} style={{ fontSize: 20, fontWeight: 800, color: white, textDecoration: "none" }}>
          c<span style={{ color: purple }}>volt</span>
        </Link>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <LanguageSwitcher />
          <Link href="/dashboard" style={{ background: purple, color: white, fontSize: 13, fontWeight: 700, padding: "8px 18px", borderRadius: 50, textDecoration: "none" }}>
            Dashboard
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ background: `linear-gradient(135deg, ${navy} 0%, #1a1f45 100%)`, padding: "80px 24px 60px", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(124,92,252,0.2)", color: "#c4b5fd", padding: "6px 16px", borderRadius: 50, fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 20 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#c4b5fd" }} />
          {c.eyebrow}
        </div>
        <h1 style={{ fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 900, color: white, margin: "0 0 16px", letterSpacing: "-0.04em" }}>
          {c.title}
        </h1>
        <p style={{ fontSize: 18, color: "rgba(255,255,255,0.6)", margin: "0 0 36px" }}>
          {c.subtitle}
        </p>

      </section>

      {/* Plans */}
      <section style={{ background: "#f8f9fe", padding: "60px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gap: 24, alignItems: "stretch" }} className="grid grid-cols-1 md:grid-cols-3">
          {c.plans.map((plan) => (
            <div key={plan.name} style={{
              background: plan.highlighted ? navy : white,
              borderRadius: 24, padding: "36px 28px",
              border: plan.highlighted ? `2px solid ${purple}` : "1px solid #f0f0f0",
              boxShadow: plan.highlighted ? "0 20px 60px rgba(10,14,39,0.2)" : "0 2px 12px rgba(0,0,0,0.06)",
              transform: plan.highlighted ? "scale(1.03)" : "none",
              position: "relative", display: "flex", flexDirection: "column",
            }}>
              {plan.badge && (
                <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: plan.planKey === "pro" ? "#fbbf24" : purple, color: plan.planKey === "pro" ? "#1a1a1a" : white, fontSize: 10, fontWeight: 800, padding: "4px 14px", borderRadius: 50, whiteSpace: "nowrap" }}>
                  {plan.badge}
                </div>
              )}

              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: plan.highlighted ? white : gray900, marginBottom: 4 }}>{plan.name}</div>
                <div style={{ fontSize: 13, color: plan.highlighted ? "rgba(255,255,255,0.5)" : gray600, marginBottom: 24 }}>{plan.desc}</div>
                <div style={{ marginBottom: 28 }}>
                  <span style={{ fontSize: 48, fontWeight: 900, color: plan.highlighted ? white : gray900 }}>
                    {plan.monthly}
                  </span>
                  <span style={{ fontSize: 14, color: plan.highlighted ? "rgba(255,255,255,0.45)" : gray600, marginLeft: 6 }}>
                    {c.perMonth}
                  </span>
                </div>
              </div>

              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
                {plan.features.map((f, i) => (
                  <li key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 14, color: plan.highlighted ? (f.ok ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.3)") : (f.ok ? gray900 : "#cbd5e1") }}>
                    <span style={{ color: f.ok ? "#4ade80" : (plan.highlighted ? "rgba(255,255,255,0.2)" : "#cbd5e1"), flexShrink: 0, marginTop: 1 }}>{f.ok ? "✓" : "–"}</span>
                    {f.text}
                  </li>
                ))}
              </ul>

              <Link href={`/${locale}/signup?plan=${plan.planKey}`} style={{
                display: "block", textAlign: "center",
                background: plan.highlighted ? purple : "#f1f5f9",
                color: plan.highlighted ? white : gray900,
                fontWeight: 700, fontSize: 15, padding: "14px", borderRadius: 12,
                textDecoration: "none", boxShadow: plan.highlighted ? "0 4px 16px rgba(124,92,252,0.4)" : "none",
              }}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison callout */}
      <section style={{ background: white, padding: "60px 24px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: gray900, margin: "0 0 12px" }}>{c.unsureTitle}</h2>
          <p style={{ fontSize: 16, color: gray600, margin: "0 0 32px" }}>{c.unsureText}</p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href={`/${locale}/signup?plan=free`} style={{ background: purple, color: white, padding: "13px 28px", borderRadius: 10, textDecoration: "none", fontWeight: 700, fontSize: 15 }}>
              {c.startFree}
            </Link>
            <Link href={`/${locale}`} style={{ background: "#f1f5f9", color: gray900, padding: "13px 28px", borderRadius: 10, textDecoration: "none", fontWeight: 600, fontSize: 15 }}>
              {c.learnMore}
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ background: "#f8f9fe", padding: "60px 24px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: gray900, textAlign: "center", margin: "0 0 40px" }}>{c.faqTitle}</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {c.faqs.map((faq, i) => (
              <div key={i} style={{ background: white, borderRadius: 12, border: "1px solid #f0f0f0", overflow: "hidden" }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{ width: "100%", background: "none", border: "none", padding: "18px 20px", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
                >
                  <span style={{ fontSize: 15, fontWeight: 600, color: gray900 }}>{faq.q}</span>
                  <span style={{ fontSize: 20, color: gray600, transition: "transform 0.2s", transform: openFaq === i ? "rotate(45deg)" : "none", flexShrink: 0, marginLeft: 16 }}>+</span>
                </button>
                {openFaq === i && (
                  <div style={{ padding: "0 20px 18px" }}>
                    <p style={{ fontSize: 14, color: gray600, margin: 0, lineHeight: 1.7 }}>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: navy, padding: "32px 24px", textAlign: "center" }}>
        <Link href={`/${locale}`} style={{ fontSize: 18, fontWeight: 800, color: white, textDecoration: "none" }}>
          c<span style={{ color: purple }}>volt</span>
        </Link>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginTop: 8 }}>{c.copyright}</p>
        <div style={{ display: "flex", gap: 18, justifyContent: "center", marginTop: 8, flexWrap: "wrap" }}>
          <Link href={`/${locale}/mentions-legales`} style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>{c.legal}</Link>
          <Link href={`/${locale}/confidentialite`} style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>{c.privacy}</Link>
          <Link href={`/${locale}/conditions`} style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>{c.terms}</Link>
        </div>
      </footer>
    </main>
  )
}
