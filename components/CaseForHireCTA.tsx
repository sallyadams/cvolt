"use client"

import Link from "next/link"

const purple = "#7c5cfc"
const navy = "#0a0e27"
const white = "#ffffff"

interface CaseForHireCTAProps {
  /** CV to prefill on the Case for Hire page, if known in this context. */
  cvId?: string
  /** Job to prefill on the Case for Hire page, if known in this context. */
  jobId?: string
  /** Short description tailored to where this CTA is shown. */
  description?: string
  /** "banner" for a full result-page card, "compact" for tight spaces like a sidebar. */
  variant?: "banner" | "compact"
}

function buildHref(cvId?: string, jobId?: string) {
  const params = new URLSearchParams()
  if (cvId) params.set("cvId", cvId)
  if (jobId) params.set("jobId", jobId)
  const qs = params.toString()
  return qs ? `/case-for-hire?${qs}` : "/case-for-hire"
}

export function CaseForHireCTA({
  cvId,
  jobId,
  description = "Turn this into a structured, evidence-based argument for why you fit the role.",
  variant = "banner",
}: CaseForHireCTAProps) {
  const href = buildHref(cvId, jobId)

  if (variant === "compact") {
    return (
      <Link
        href={href}
        style={{
          display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
          borderRadius: 10, textDecoration: "none", background: "rgba(124,92,252,0.12)",
          color: purple, fontWeight: 700, fontSize: 13,
        }}
      >
        <span style={{ fontSize: 15 }}>⚖️</span>
        Build a Case for Hire
      </Link>
    )
  }

  return (
    <div style={{
      background: `linear-gradient(135deg, ${navy} 0%, #1a1f45 100%)`,
      borderRadius: 20, padding: "24px 28px", display: "flex", alignItems: "center",
      justifyContent: "space-between", gap: 20, flexWrap: "wrap",
      boxShadow: "0 4px 24px rgba(10,14,39,0.2)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, minWidth: 240 }}>
        <span style={{ fontSize: 28, flexShrink: 0 }}>⚖️</span>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: white, marginBottom: 4, letterSpacing: "-0.01em" }}>
            Build a Case for Hire
          </div>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", margin: 0, maxWidth: 420 }}>
            {description}
          </p>
        </div>
      </div>
      <Link href={href} style={{
        background: purple, color: white, fontWeight: 700, fontSize: 14,
        padding: "12px 22px", borderRadius: 12, textDecoration: "none",
        boxShadow: "0 4px 16px rgba(124,92,252,0.4)", flexShrink: 0, whiteSpace: "nowrap",
      }}>
        Build My Case →
      </Link>
    </div>
  )
}
