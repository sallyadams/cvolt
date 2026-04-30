"use client"

import { useLocale, useTranslations } from "next-intl"
import Link from "next/link"
import { useState } from "react"
import LanguageSwitcher from "@/components/LanguageSwitcher"

const purple = "#7c5cfc"
const navy = "#0a0e27"
const gray900 = "#0f172a"
const gray600 = "#64748b"
const white = "#ffffff"

const PLANS = [
  {
    name: "Free",
    monthly: "€0",
    yearly: "€0",
    desc: "Perfect to get started",
    features: [
      { text: "1 CV upload & storage", ok: true },
      { text: "1 ATS scan per month", ok: true },
      { text: "Basic job matching", ok: true },
      { text: "Application tracker", ok: true },
      { text: "AI CV optimisation", ok: false },
      { text: "Interview prep", ok: false },
      { text: "Cover letter generator", ok: false },
      { text: "LinkedIn optimizer", ok: false },
      { text: "Priority support", ok: false },
    ],
    cta: "Start free",
    href: "/signup",
    highlighted: false,
    badge: null,
  },
  {
    name: "Pro",
    monthly: "€9",
    yearly: "€7",
    desc: "For serious job seekers",
    features: [
      { text: "Unlimited CV uploads", ok: true },
      { text: "Unlimited ATS scans", ok: true },
      { text: "AI CV optimisation", ok: true },
      { text: "Smart job matching", ok: true },
      { text: "Interview prep", ok: true },
      { text: "Cover letter generator", ok: true },
      { text: "LinkedIn optimizer", ok: true },
      { text: "Bullet point improver", ok: true },
      { text: "Priority support", ok: true },
    ],
    cta: "Start Pro",
    href: "/upgrade",
    highlighted: true,
    badge: "MOST POPULAR",
  },
  {
    name: "Premium",
    monthly: "€19",
    yearly: "€15",
    desc: "For maximum results",
    features: [
      { text: "Everything in Pro", ok: true },
      { text: "1-on-1 career coaching", ok: true },
      { text: "Direct recruiter access", ok: true },
      { text: "Salary negotiation guide", ok: true },
      { text: "B2B employer matching", ok: true },
      { text: "CV ghostwriting service", ok: true },
      { text: "Custom job alerts", ok: true },
      { text: "Dedicated account manager", ok: true },
      { text: "30-day money-back guarantee", ok: true },
    ],
    cta: "Go Premium",
    href: "/upgrade",
    highlighted: false,
    badge: "BEST RESULTS",
  },
]

const FAQS = [
  { q: "Can I cancel anytime?", a: "Yes — cancel with one click from your dashboard. You keep access until the end of your billing period. No questions asked." },
  { q: "What payment methods do you accept?", a: "All major credit and debit cards (Visa, Mastercard, Amex), as well as Apple Pay and Google Pay via Stripe." },
  { q: "Is my data safe?", a: "Absolutely. We encrypt all your data and never share it with third parties. Your CV stays private." },
  { q: "What is ATS and why does it matter?", a: "ATS (Applicant Tracking System) software scans CVs before humans see them. 75% of CVs are rejected by ATS. Our scanner helps you pass it." },
  { q: "How does AI CV optimisation work?", a: "Our AI reads the job description and your CV, then suggests keyword additions, bullet improvements, and structure changes to increase your match score." },
  { q: "Do you offer refunds?", a: "Yes — 30-day money-back guarantee on all paid plans, no questions asked." },
]

export default function PricingPage() {
  const locale = useLocale()
  const [yearly, setYearly] = useState(false)
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
          Pricing
        </div>
        <h1 style={{ fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 900, color: white, margin: "0 0 16px", letterSpacing: "-0.04em" }}>
          Start free. Upgrade when you're ready.
        </h1>
        <p style={{ fontSize: 18, color: "rgba(255,255,255,0.6)", margin: "0 0 36px" }}>
          No hidden fees. Cancel anytime. 30-day money-back guarantee.
        </p>

        {/* Toggle */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 14, background: "rgba(255,255,255,0.08)", borderRadius: 50, padding: "6px 6px 6px 16px" }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: !yearly ? white : "rgba(255,255,255,0.5)" }}>Monthly</span>
          <button onClick={() => setYearly(v => !v)} style={{
            width: 44, height: 24, borderRadius: 12, background: yearly ? purple : "rgba(255,255,255,0.2)",
            border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s",
          }}>
            <div style={{ position: "absolute", top: 3, left: yearly ? 23 : 3, width: 18, height: 18, borderRadius: "50%", background: white, transition: "left 0.2s" }} />
          </button>
          <span style={{ fontSize: 14, fontWeight: 600, color: yearly ? white : "rgba(255,255,255,0.5)" }}>
            Yearly <span style={{ background: "#4ade80", color: "#14532d", fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 50, marginLeft: 4 }}>-22%</span>
          </span>
        </div>
      </section>

      {/* Plans */}
      <section style={{ background: "#f8f9fe", padding: "60px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gap: 24, alignItems: "stretch" }} className="grid grid-cols-1 md:grid-cols-3">
          {PLANS.map((plan) => (
            <div key={plan.name} style={{
              background: plan.highlighted ? navy : white,
              borderRadius: 24, padding: "36px 28px",
              border: plan.highlighted ? `2px solid ${purple}` : "1px solid #f0f0f0",
              boxShadow: plan.highlighted ? "0 20px 60px rgba(10,14,39,0.2)" : "0 2px 12px rgba(0,0,0,0.06)",
              transform: plan.highlighted ? "scale(1.03)" : "none",
              position: "relative", display: "flex", flexDirection: "column",
            }}>
              {plan.badge && (
                <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: plan.name === "Pro" ? "#fbbf24" : purple, color: plan.name === "Pro" ? "#1a1a1a" : white, fontSize: 10, fontWeight: 800, padding: "4px 14px", borderRadius: 50, whiteSpace: "nowrap" }}>
                  {plan.badge}
                </div>
              )}

              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: plan.highlighted ? white : gray900, marginBottom: 4 }}>{plan.name}</div>
                <div style={{ fontSize: 13, color: plan.highlighted ? "rgba(255,255,255,0.5)" : gray600, marginBottom: 24 }}>{plan.desc}</div>
                <div style={{ marginBottom: 28 }}>
                  <span style={{ fontSize: 48, fontWeight: 900, color: plan.highlighted ? white : gray900 }}>
                    {yearly ? plan.yearly : plan.monthly}
                  </span>
                  <span style={{ fontSize: 14, color: plan.highlighted ? "rgba(255,255,255,0.45)" : gray600, marginLeft: 6 }}>
                    /{yearly ? "month, billed yearly" : "month"}
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

              <Link href={plan.href} style={{
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
          <h2 style={{ fontSize: 28, fontWeight: 800, color: gray900, margin: "0 0 12px" }}>Still unsure?</h2>
          <p style={{ fontSize: 16, color: gray600, margin: "0 0 32px" }}>Start with the Free plan. Upgrade whenever you're ready — your data moves with you.</p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/signup" style={{ background: purple, color: white, padding: "13px 28px", borderRadius: 10, textDecoration: "none", fontWeight: 700, fontSize: 15 }}>
              Start for free →
            </Link>
            <Link href={`/${locale}`} style={{ background: "#f1f5f9", color: gray900, padding: "13px 28px", borderRadius: 10, textDecoration: "none", fontWeight: 600, fontSize: 15 }}>
              Learn more
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ background: "#f8f9fe", padding: "60px 24px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: gray900, textAlign: "center", margin: "0 0 40px" }}>Frequently asked questions</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {FAQS.map((faq, i) => (
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
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginTop: 8 }}>© 2025 CVolt. All rights reserved.</p>
      </footer>
    </main>
  )
}
