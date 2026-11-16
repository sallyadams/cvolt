import Link from "next/link"
import type { ReactNode } from "react"

const navy = "#0a0e27"
const purple = "#7c5cfc"

/** Highlights a value the site owner still has to fill in. Search the code for "Todo" before going live. */
export function Todo({ children }: { children: ReactNode }) {
  return (
    <mark style={{ background: "#fef08a", color: "#713f12", padding: "0 4px", borderRadius: 4 }}>
      [À COMPLÉTER : {children}]
    </mark>
  )
}

export function Section({ id, title, children }: { id?: string; title: string; children: ReactNode }) {
  return (
    <section id={id} style={{ marginBottom: 36 }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", margin: "0 0 12px" }}>{title}</h2>
      <div style={{ fontSize: 15, lineHeight: 1.75, color: "#334155" }}>{children}</div>
    </section>
  )
}

export default function LegalPage({
  locale,
  title,
  updated,
  children,
}: {
  locale: string
  title: string
  updated: string
  children: ReactNode
}) {
  return (
    <main style={{ fontFamily: "'Inter', system-ui, sans-serif", background: "#f8f9fe", minHeight: "100vh" }}>
      <nav style={{ background: navy, padding: "0 24px", height: 64, display: "flex", alignItems: "center" }}>
        <Link href={`/${locale}`} style={{ fontSize: 20, fontWeight: 800, color: "#fff", textDecoration: "none" }}>
          c<span style={{ color: purple }}>volt</span>
        </Link>
      </nav>
      <article style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px 80px" }}>
        {locale !== "fr" && (
          <p style={{ background: "#eef2ff", padding: "12px 16px", borderRadius: 10, fontSize: 14, color: "#3730a3" }}>
            This page is only available in French, the language of the contract under French law.
          </p>
        )}
        <h1 style={{ fontSize: 32, fontWeight: 900, color: "#0f172a", margin: "16px 0 6px" }}>{title}</h1>
        <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 40px" }}>Dernière mise à jour : {updated}</p>
        {children}
        <p style={{ fontSize: 14, marginTop: 48 }}>
          <Link href={`/${locale}/mentions-legales`} style={{ color: purple, marginRight: 18 }}>Mentions légales</Link>
          <Link href={`/${locale}/confidentialite`} style={{ color: purple, marginRight: 18 }}>Confidentialité</Link>
          <Link href={`/${locale}/conditions`} style={{ color: purple }}>Conditions</Link>
        </p>
      </article>
    </main>
  )
}
