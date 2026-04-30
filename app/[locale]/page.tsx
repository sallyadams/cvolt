'use client';

import { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import LanguageSwitcher from "@/components/LanguageSwitcher";

// ─── Design tokens ───────────────────────────────────────────────────────────
const navy = "#0a0e27";
const purple = "#7c5cfc";
const purpleHover = "#6a4be0";
const purpleLight = "#f0edff";
const white = "#ffffff";
const gray50 = "#f8f9fe";
const gray600 = "#64748b";
const gray900 = "#0f172a";

// ─── Phone Mockup ─────────────────────────────────────────────────────────────
function PhoneMockup() {
  return (
    <div style={{
      width: 260, height: 520, background: "#1a1f45",
      borderRadius: 36, border: "8px solid #2a3060",
      boxShadow: "0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)",
      position: "relative", overflow: "hidden", flexShrink: 0,
    }}>
      {/* Status bar */}
      <div style={{ height: 28, background: "#12183a", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", fontSize: 10, color: "rgba(255,255,255,0.6)" }}>
        <span>9:41</span>
        <span>●●●</span>
      </div>

      {/* App content */}
      <div style={{ padding: "12px 14px", background: "#f8f9fe", height: "calc(100% - 28px)", overflowY: "hidden" }}>
        {/* Header */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: gray600 }}>Hello, Alex 👋</div>
          <div style={{ fontSize: 9, color: gray600 }}>Great to see you back!</div>
        </div>

        {/* Search */}
        <div style={{ background: white, borderRadius: 8, padding: "7px 10px", fontSize: 9, color: "#aaa", marginBottom: 10, border: "1px solid #eee" }}>
          Search jobs, roles or companies
        </div>

        {/* Recommended */}
        <div style={{ fontSize: 10, fontWeight: 700, color: gray900, marginBottom: 6 }}>Recommended Jobs</div>

        {[
          { role: "UI/UX Designer", co: "Innovate Studio", loc: "Lagos, Nigeria", time: "Full-time" },
          { role: "Product Designer", co: "TechNova", loc: "Lagos, Nigeria", time: "Full-time" },
        ].map((j, i) => (
          <div key={i} style={{ background: white, borderRadius: 8, padding: "8px 10px", marginBottom: 6, border: "1px solid #eee" }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: gray900 }}>{j.role}</div>
            <div style={{ fontSize: 8, color: gray600 }}>{j.co}</div>
            <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
              <span style={{ fontSize: 7, color: gray600 }}>📍 {j.loc}</span>
              <span style={{ fontSize: 7, color: gray600 }}>⏰ {j.time}</span>
            </div>
          </div>
        ))}

        {/* Profile strength */}
        <div style={{ background: purple, borderRadius: 10, padding: "10px 12px", marginTop: 8 }}>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.8)", marginBottom: 4 }}>Profile Strength</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: white }}>85%</div>
            <div style={{ fontSize: 8, color: "rgba(255,255,255,0.8)" }}>Great job! Keep it up.</div>
          </div>
          <div style={{ height: 4, background: "rgba(255,255,255,0.25)", borderRadius: 2, marginTop: 6 }}>
            <div style={{ width: "85%", height: "100%", background: white, borderRadius: 2 }} />
          </div>
        </div>
      </div>

      {/* Bottom nav */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        background: white, borderTop: "1px solid #eee",
        display: "flex", justifyContent: "space-around", padding: "8px 0",
      }}>
        {["🏠", "🔍", "📄", "📊", "👤"].map((icon, i) => (
          <span key={i} style={{ fontSize: 14, opacity: i === 0 ? 1 : 0.4 }}>{icon}</span>
        ))}
      </div>
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({ bg, children, id }: { bg?: string; children: React.ReactNode; id?: string }) {
  return (
    <section id={id} style={{ background: bg || white, padding: "80px 24px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {children}
      </div>
    </section>
  );
}

function Eyebrow({ label, light }: { label: string; light?: boolean }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 8,
      background: light ? "rgba(124,92,252,0.15)" : purpleLight,
      color: light ? "rgba(255,255,255,0.9)" : purple,
      padding: "6px 14px", borderRadius: 50,
      fontSize: 12, fontWeight: 700, letterSpacing: "0.05em",
      textTransform: "uppercase", marginBottom: 16,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: light ? "rgba(255,255,255,0.7)" : purple, flexShrink: 0 }} />
      {label}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const t = useTranslations();
  const locale = useLocale();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <main style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif", overflowX: "hidden" }}>

      {/* ═══ NAV ══════════════════════════════════════════════════════════════ */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? "rgba(10,14,39,0.96)" : navy,
        backdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.08)" : "none",
        transition: "all 0.3s",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: 68, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* Logo */}
          <Link href={`/${locale}`} style={{ fontSize: 22, fontWeight: 800, color: white, textDecoration: "none", letterSpacing: "-0.03em" }}>
            c<span style={{ color: purple }}>volt</span>
          </Link>

          {/* Links */}
          <div className="hidden md:flex" style={{ gap: 32, alignItems: "center" }}>
            {[
              { label: t("nav.howItWorks"), href: "#how-it-works" },
              { label: t("nav.features"), href: "#why-different" },
              { label: t("nav.pricing"), href: "#pricing" },
              { label: t("nav.employers"), href: "#employers" },
            ].map(({ label, href }) => (
              <a key={label} href={href} style={{ color: "rgba(255,255,255,0.65)", fontSize: 14, fontWeight: 500, textDecoration: "none", transition: "color 0.2s" }}
                onMouseOver={e => (e.currentTarget.style.color = white)}
                onMouseOut={e => (e.currentTarget.style.color = "rgba(255,255,255,0.65)")}>
                {label}
              </a>
            ))}
          </div>

          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <LanguageSwitcher />
            <Link href="/login" style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: 500, textDecoration: "none" }}>
              {t("nav.signIn")}
            </Link>
            <Link href="/cv" style={{
              background: purple, color: white, fontSize: 14, fontWeight: 600,
              padding: "10px 22px", borderRadius: 50, textDecoration: "none",
              boxShadow: "0 4px 14px rgba(124,92,252,0.4)", transition: "all 0.2s",
            }}
              onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = purpleHover; (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
              onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = purple; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}>
              {t("nav.getStarted")}
            </Link>
          </div>
        </div>
      </nav>

      {/* ═══ HERO ═════════════════════════════════════════════════════════════ */}
      <section style={{
        background: `linear-gradient(135deg, ${navy} 0%, #1a1f45 60%, #0d1235 100%)`,
        padding: "140px 24px 100px", minHeight: "100vh", display: "flex", alignItems: "center",
        position: "relative", overflow: "hidden",
      }}>
        {/* Glow orbs */}
        <div style={{ position: "absolute", top: "20%", right: "5%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,92,252,0.18) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "10%", left: "-5%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,92,252,0.1) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%", display: "grid", gap: 60, alignItems: "center" }} className="grid-cols-1 lg:grid-cols-2 grid">

          {/* Left — copy */}
          <div>
            <Eyebrow label={t("hero.eyebrow")} light />

            <h1 style={{
              fontSize: "clamp(2.5rem, 6vw, 4rem)", fontWeight: 900, color: white,
              lineHeight: 1.1, letterSpacing: "-0.04em", marginBottom: 24, marginTop: 0,
            }}>
              Get Hired with{" "}
              <span style={{ color: purple }}>cvolt</span>
            </h1>

            <p style={{ fontSize: 18, color: "rgba(255,255,255,0.65)", lineHeight: 1.7, marginBottom: 36, maxWidth: 500, marginTop: 0 }}>
              {t("hero.subtitle")}
            </p>

            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 48 }}>
              <Link href="/cv" style={{
                background: purple, color: white, fontWeight: 700, fontSize: 16,
                padding: "14px 32px", borderRadius: 50, textDecoration: "none",
                boxShadow: "0 8px 24px rgba(124,92,252,0.4)", display: "inline-flex", alignItems: "center", gap: 8,
                transition: "all 0.2s",
              }}>
                {t("hero.ctaPrimary")}
              </Link>
              <a href="#how-it-works" style={{
                background: "rgba(255,255,255,0.08)", color: white, fontWeight: 600, fontSize: 16,
                padding: "14px 32px", borderRadius: 50, textDecoration: "none",
                border: "1px solid rgba(255,255,255,0.15)", backdropFilter: "blur(8px)",
                display: "inline-flex", alignItems: "center", gap: 8,
              }}>
                {t("hero.ctaSecondary")}
              </a>
            </div>

            {/* Trust bar */}
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
              {[t("hero.trust1"), t("hero.trust2"), t("hero.trust3")].map((item) => (
                <span key={item} style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: 500 }}>
                  <span style={{ color: "#4ade80", fontSize: 16 }}>✓</span> {item}
                </span>
              ))}
            </div>
          </div>

          {/* Right — phone mockup */}
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            <PhoneMockup />
          </div>
        </div>
      </section>

      {/* ═══ PROBLEM ══════════════════════════════════════════════════════════ */}
      <Section bg={gray50} id="problem">
        <div style={{ display: "grid", gap: 48, alignItems: "center" }} className="grid grid-cols-1 lg:grid-cols-2">
          <div>
            <Eyebrow label={t("problem.eyebrow")} />
            <h2 style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.5rem)", fontWeight: 800, color: gray900, lineHeight: 1.2, margin: "0 0 32px" }}>
              {t("problem.title")}
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {(t.raw("problem.items") as string[]).map((item: string, i: number) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 14, background: white, padding: "14px 18px", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #f0f0f0" }}>
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0 }}>✕</div>
                  <span style={{ fontSize: 15, color: gray900, fontWeight: 500 }}>{item}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 24, padding: "14px 20px", background: "#fff3cd", borderRadius: 12, border: "1px solid #ffd700", fontSize: 15, fontWeight: 600, color: "#92400e" }}>
              Result: {t("problem.result")}
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div style={{ width: 280, height: 280, background: `linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)`, borderRadius: 32, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 100 }}>
              😞
            </div>
          </div>
        </div>
      </Section>

      {/* ═══ SOLUTION ═════════════════════════════════════════════════════════ */}
      <Section bg={white} id="solution">
        <div style={{ display: "grid", gap: 48, alignItems: "center" }} className="grid grid-cols-1 lg:grid-cols-2">
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div style={{ width: 280, height: 280, background: `linear-gradient(135deg, ${purpleLight} 0%, #ddd6fe 100%)`, borderRadius: 32, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <span style={{ fontSize: 72, fontWeight: 900, color: purple }}>c<span style={{ color: navy }}>v</span></span>
              <div style={{ fontSize: 13, color: gray600, fontWeight: 600 }}>Your Career. Our Mission.</div>
            </div>
          </div>
          <div>
            <Eyebrow label={t("solution.eyebrow")} />
            <h2 style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.5rem)", fontWeight: 800, color: gray900, lineHeight: 1.2, margin: "0 0 32px" }}>
              {t("solution.title")}
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {(t.raw("solution.items") as string[]).map((item: string, i: number) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", borderRadius: 12, background: purpleLight, border: `1px solid #ddd6fe` }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: purple, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: white, flexShrink: 0 }}>
                    {["📄", "🎯", "⚡", "📊"][i]}
                  </div>
                  <span style={{ fontSize: 15, color: gray900, fontWeight: 600 }}>{item}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 24, fontSize: 18, fontWeight: 700, color: purple }}>
              {t("solution.subtitle")}
            </div>
          </div>
        </div>
      </Section>

      {/* ═══ HOW IT WORKS ═════════════════════════════════════════════════════ */}
      <section id="how-it-works" style={{ background: navy, padding: "80px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <Eyebrow label={t("howItWorks.eyebrow")} light />
            <h2 style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.5rem)", fontWeight: 800, color: white, margin: "0 0 16px" }}>
              {t("howItWorks.title")}
            </h2>
          </div>

          <div style={{ display: "grid", gap: 24 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {(t.raw("howItWorks.steps") as Array<{ num: string; title: string; desc: string }>).map((step, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.06)", borderRadius: 20, padding: "28px 24px", border: "1px solid rgba(255,255,255,0.1)", position: "relative", overflow: "hidden" }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: purple, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 900, color: white, marginBottom: 16 }}>
                  {step.num}
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: white, margin: "0 0 10px" }}>{step.title}</h3>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", lineHeight: 1.6, margin: 0 }}>{step.desc}</p>
                {i < 3 && (
                  <div className="hidden lg:block" style={{ position: "absolute", right: -20, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.2)", fontSize: 28, zIndex: 1 }}>→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ WHY DIFFERENT ════════════════════════════════════════════════════ */}
      <Section bg={gray50} id="why-different">
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <Eyebrow label={t("whyDifferent.eyebrow")} />
          <h2 style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.5rem)", fontWeight: 800, color: gray900, margin: "0 0 16px" }}>
            {t("whyDifferent.title")}
          </h2>
        </div>

        <div style={{ display: "grid", gap: 20 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {(t.raw("whyDifferent.items") as Array<{ title: string; desc: string }>).map((item, i) => {
            const icons = ["🎯", "⚡", "🤖", "📊", "🤝"];
            const colors = ["#dbeafe", "#fef3c7", "#ede9fe", "#dcfce7", "#fce7f3"];
            return (
              <div key={i} style={{ background: white, borderRadius: 20, padding: "28px 22px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #f0f0f0", textAlign: "center" }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: colors[i], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, margin: "0 auto 16px" }}>{icons[i]}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: gray900, marginBottom: 6 }}>{item.title}</div>
                <div style={{ fontSize: 13, color: gray600 }}>{item.desc}</div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* ═══ USER JOURNEY ═════════════════════════════════════════════════════ */}
      <Section bg={white} id="journey">
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <Eyebrow label={t("journey.eyebrow")} />
          <h2 style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.5rem)", fontWeight: 800, color: gray900, margin: "0 0 8px" }}>
            {t("journey.title")}
          </h2>
        </div>

        <div style={{ display: "grid", gap: 24, alignItems: "stretch" }} className="grid grid-cols-1 md:grid-cols-2">
          {/* Before */}
          <div style={{ background: "#fef2f2", borderRadius: 20, padding: "32px", border: "1px solid #fecaca" }}>
            <div style={{ display: "inline-block", background: "#ef4444", color: white, fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 50, marginBottom: 20 }}>
              {t("journey.before.label")}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
              <div style={{ fontSize: 60 }}>😔</div>
              <p style={{ fontSize: 16, color: "#991b1b", fontWeight: 600, margin: 0 }}>{t("journey.before.desc")}</p>
            </div>
          </div>

          {/* After */}
          <div style={{ background: "#f0fdf4", borderRadius: 20, padding: "32px", border: "1px solid #bbf7d0" }}>
            <div style={{ display: "inline-block", background: "#16a34a", color: white, fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 50, marginBottom: 20 }}>
              {t("journey.after.label")}
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              {(t.raw("journey.after.steps") as string[]).map((step: string, i: number) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ background: white, borderRadius: 12, padding: "10px 14px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
                    <div style={{ fontSize: ["📄", "🎯", "🎤", "🏆"][i] ? 22 : 22 }}>
                      {["📄", "🎯", "🎤", "🏆"][i]}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: gray900, marginTop: 4, maxWidth: 70 }}>{step}</div>
                  </div>
                  {i < 3 && <span style={{ color: "#16a34a", fontSize: 18, fontWeight: 700 }}>→</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ═══ TARGET USERS ═════════════════════════════════════════════════════ */}
      <Section bg={gray50} id="users">
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <Eyebrow label={t("users.eyebrow")} />
          <h2 style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.5rem)", fontWeight: 800, color: gray900, margin: "0 0 8px" }}>
            {t("users.title")}
          </h2>
        </div>

        <div style={{ display: "grid", gap: 20 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {(t.raw("users.personas") as Array<{ title: string; desc: string }>).map((p, i) => {
            const avatars = ["🎓", "🔄", "💼", "💻"];
            const bgColors = [purpleLight, "#dbeafe", "#dcfce7", "#fef3c7"];
            return (
              <div key={i} style={{ background: white, borderRadius: 20, padding: "32px 24px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #f0f0f0", textAlign: "center" }}>
                <div style={{ width: 72, height: 72, borderRadius: "50%", background: bgColors[i], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, margin: "0 auto 16px" }}>{avatars[i]}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: gray900, margin: "0 0 8px" }}>{p.title}</h3>
                <p style={{ fontSize: 13, color: gray600, margin: 0 }}>{p.desc}</p>
              </div>
            );
          })}
        </div>
      </Section>

      {/* ═══ PRICING ══════════════════════════════════════════════════════════ */}
      <section id="pricing" style={{ background: navy, padding: "80px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <Eyebrow label={t("pricing.eyebrow")} light />
            <h2 style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.5rem)", fontWeight: 800, color: white, margin: "0 0 10px" }}>
              {t("pricing.title")}
            </h2>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 16, margin: 0 }}>{t("pricing.subtitle")}</p>
          </div>

          <div style={{ display: "grid", gap: 24, alignItems: "stretch" }} className="grid grid-cols-1 md:grid-cols-3">
            {(t.raw("pricing.plans") as Array<{ name: string; price: string; period: string; desc: string; features: string[]; cta: string; highlighted: boolean }>)
              .map((plan, i) => (
                <div key={i} style={{
                  background: plan.highlighted ? purple : "rgba(255,255,255,0.06)",
                  borderRadius: 24, padding: "36px 28px",
                  border: plan.highlighted ? `2px solid ${purple}` : "1px solid rgba(255,255,255,0.1)",
                  position: "relative", transform: plan.highlighted ? "scale(1.02)" : "none",
                  boxShadow: plan.highlighted ? "0 20px 60px rgba(124,92,252,0.3)" : "none",
                }}>
                  {plan.highlighted && (
                    <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "#fbbf24", color: "#1a1a1a", fontSize: 11, fontWeight: 700, padding: "4px 14px", borderRadius: 50 }}>
                      MOST POPULAR
                    </div>
                  )}
                  <div style={{ fontSize: 18, fontWeight: 700, color: white, marginBottom: 4 }}>{plan.name}</div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginBottom: 20 }}>{plan.desc}</div>
                  <div style={{ marginBottom: 28 }}>
                    <span style={{ fontSize: 44, fontWeight: 900, color: white }}>{plan.price}</span>
                    <span style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", marginLeft: 6 }}>/{plan.period}</span>
                  </div>
                  <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", display: "flex", flexDirection: "column", gap: 10 }}>
                    {plan.features.map((f: string, j: number) => (
                      <li key={j} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 14, color: "rgba(255,255,255,0.8)" }}>
                        <span style={{ color: "#4ade80", flexShrink: 0, marginTop: 1 }}>✓</span> {f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/signup" style={{
                    display: "block", textAlign: "center",
                    background: plan.highlighted ? white : "rgba(255,255,255,0.1)",
                    color: plan.highlighted ? purple : white,
                    fontWeight: 700, fontSize: 15, padding: "13px", borderRadius: 12,
                    textDecoration: "none", transition: "all 0.2s",
                  }}>
                    {plan.cta}
                  </Link>
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* ═══ VISION ═══════════════════════════════════════════════════════════ */}
      <Section bg={gray50} id="vision">
        <div style={{ display: "grid", gap: 48, alignItems: "center" }} className="grid grid-cols-1 lg:grid-cols-2">
          <div>
            <Eyebrow label={t("vision.eyebrow")} />
            <h2 style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.5rem)", fontWeight: 800, color: gray900, lineHeight: 1.2, margin: "0 0 28px" }}>
              {t("vision.title")}
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 36 }}>
              {(t.raw("vision.points") as string[]).map((p: string, i: number) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: purple, display: "flex", alignItems: "center", justifyContent: "center", color: white, fontWeight: 800, fontSize: 14, flexShrink: 0 }}>
                    {i + 1}
                  </div>
                  <span style={{ fontSize: 16, fontWeight: 600, color: gray900 }}>{p}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: `linear-gradient(135deg, ${navy}, #1a1f45)`, borderRadius: 24, padding: "48px 40px" }}>
            <div style={{ fontSize: 60, marginBottom: 24, color: purple }}>"</div>
            <blockquote style={{ fontSize: 22, fontWeight: 700, color: white, lineHeight: 1.5, margin: "0 0 24px", fontStyle: "italic" }}>
              {t("vision.quote")}
            </blockquote>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)" }}>— cvolt team</div>
          </div>
        </div>
      </Section>

      {/* ═══ FINAL CTA ════════════════════════════════════════════════════════ */}
      <section id="employers" style={{ background: `linear-gradient(135deg, ${navy} 0%, #1a1f45 50%, #0d1235 100%)`, padding: "80px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gap: 48, alignItems: "center" }} className="grid grid-cols-1 lg:grid-cols-2">
          <div>
            <h2 style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.5rem)", fontWeight: 800, color: white, margin: "0 0 20px", lineHeight: 1.2 }}>
              {t("cta.title")}
            </h2>
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 36px", display: "flex", flexDirection: "column", gap: 12 }}>
              {(t.raw("cta.points") as string[]).map((p: string, i: number) => (
                <li key={i} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 16, color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>
                  <span style={{ color: "#4ade80", fontSize: 18 }}>●</span> {p}
                </li>
              ))}
            </ul>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <Link href="/signup" style={{
                background: purple, color: white, fontWeight: 700, fontSize: 16,
                padding: "14px 32px", borderRadius: 50, textDecoration: "none",
                boxShadow: "0 8px 24px rgba(124,92,252,0.4)",
              }}>
                {t("cta.button")}
              </Link>
              <Link href="/contact" style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, display: "flex", alignItems: "center", textDecoration: "none" }}>
                {t("cta.employers")} →
              </Link>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 24, padding: "40px 32px", textAlign: "center" }}>
              <div style={{ fontSize: 56, marginBottom: 12 }}>
                c<span style={{ color: purple }}>volt</span>
              </div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginBottom: 24 }}>Your Career. Your Future. Our Mission.</div>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", margin: "0 0 24px" }}>{t("cta.subtitle")}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <Link href="/signup" style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  background: "#1a1a2e", color: white, padding: "12px 24px", borderRadius: 10,
                  textDecoration: "none", fontWeight: 600, fontSize: 14, border: "1px solid rgba(255,255,255,0.1)",
                }}>
                  <span>🚀</span> Start on Web — Free
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══════════════════════════════════════════════════════════ */}
      <footer style={{ background: "#06091a", padding: "40px 24px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 20 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: white, marginBottom: 4 }}>c<span style={{ color: purple }}>volt</span></div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>{t("footer.tagline")}</div>
          </div>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            {Object.entries(t.raw("footer.links") as Record<string, string>).map(([key, label]) => (
              <a key={key} href="#" style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, textDecoration: "none" }}>{label}</a>
            ))}
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>{t("footer.copyright")}</div>
        </div>
      </footer>
    </main>
  );
}
