"use client"

import { useSession } from "next-auth/react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useEffect, useState, Suspense, useCallback } from "react"

// Isolated component so useSearchParams() has a Suspense boundary above it
function UpgradeParamWatcher({ onUpgraded }: { onUpgraded: () => void }) {
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    if (searchParams.get("upgraded") !== "true") return
    onUpgraded()
    router.replace("/app")
  }, [searchParams, onUpgraded, router])

  return null
}

const purple = "#7c5cfc"
const navy = "#0a0e27"
const gray900 = "#0f172a"
const gray600 = "#64748b"
const white = "#ffffff"

interface UserStats {
  totalScans: number
  lastScore: number | null
  subscriptionTier: string
  aiCreditsUsed: number
  aiCreditsLimit: number
}

const QUICK_ACTIONS = [
  { href: "/app/cv", icon: "📄", label: "My CVs", desc: "Upload & manage CVs", color: "#ede9fe", accent: purple },
  { href: "/app/match", icon: "🎯", label: "Job Match", desc: "Find matching jobs", color: "#dbeafe", accent: "#3b82f6" },
  { href: "/app/tracker", icon: "📊", label: "Applications", desc: "Track your pipeline", color: "#dcfce7", accent: "#16a34a" },
  { href: "/app/interview", icon: "🎤", label: "Interview Prep", desc: "Practice & prepare", color: "#fef3c7", accent: "#d97706" },
  { href: "/app/bullets", icon: "✨", label: "Bullet Improver", desc: "Sharpen your bullets", color: "#fce7f3", accent: "#db2777" },
  { href: "/app/cover-letter", icon: "📝", label: "Cover Letter", desc: "AI-written letters", color: "#ffedd5", accent: "#ea580c" },
  { href: "/app/linkedin", icon: "💼", label: "LinkedIn", desc: "Optimize your profile", color: "#e0f2fe", accent: "#0284c7" },
  { href: "/app/cv", icon: "🔍", label: "ATS Scanner", desc: "Check your ATS score", color: "#f0fdf4", accent: "#15803d" },
]

function ScoreCircle({ score }: { score: number | null }) {
  const pct = score ?? 0
  const color = pct >= 70 ? "#16a34a" : pct >= 40 ? "#d97706" : pct > 0 ? "#dc2626" : gray600
  const bg = pct >= 70 ? "#dcfce7" : pct >= 40 ? "#fef3c7" : pct > 0 ? "#fee2e2" : "#f1f5f9"

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <div style={{
        width: 100, height: 100, borderRadius: "50%",
        background: bg, border: `4px solid ${color}`,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ fontSize: 28, fontWeight: 900, color, lineHeight: 1 }}>{score ?? "—"}</span>
        {score !== null && <span style={{ fontSize: 10, color, fontWeight: 600, marginTop: 2 }}>/ 100</span>}
      </div>
      <span style={{ fontSize: 12, color, fontWeight: 600 }}>
        {score === null ? "No scan yet" : score >= 70 ? "Strong" : score >= 40 ? "Needs work" : "High risk"}
      </span>
    </div>
  )
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<UserStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showUpgradeBanner, setShowUpgradeBanner] = useState(false)

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch("/api/dashboard/stats")
      if (response.ok) setStats(await response.json())
    } catch {
      // silently fail
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!session?.user?.id) return
    fetchStats()
  }, [session, fetchStats])

  const handleUpgraded = useCallback(() => {
    setShowUpgradeBanner(true)
    setTimeout(fetchStats, 2500)
  }, [fetchStats])

  if (!session) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ color: gray600, marginBottom: 16 }}>Please sign in to access your dashboard</p>
          <Link href="/login" style={{ background: purple, color: white, padding: "12px 28px", borderRadius: 10, textDecoration: "none", fontWeight: 600 }}>Sign in</Link>
        </div>
      </div>
    )
  }

  const tier = stats?.subscriptionTier || "free"
  const tierColors: Record<string, { bg: string; color: string; label: string }> = {
    free: { bg: "#f1f5f9", color: gray600, label: "Free Plan" },
    starter: { bg: "#dbeafe", color: "#1d4ed8", label: "Starter Plan" },
    pro: { bg: "#ede9fe", color: purple, label: "Pro Plan" },
    premium: { bg: "#fef3c7", color: "#d97706", label: "Premium Plan" },
  }
  const tierBadge = tierColors[tier] || tierColors.free
  const usagePct = stats ? Math.min((stats.aiCreditsUsed / stats.aiCreditsLimit) * 100, 100) : 0

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fe" }}>
      <Suspense>
        <UpgradeParamWatcher onUpgraded={handleUpgraded} />
      </Suspense>

      {/* Upgrade success banner */}
      {showUpgradeBanner && (
        <div style={{ background: "#dcfce7", borderBottom: "1px solid #bbf7d0", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ color: "#15803d", fontWeight: 600, fontSize: 14 }}>
            Payment successful! Your plan has been upgraded.
          </span>
          <button onClick={() => setShowUpgradeBanner(false)} style={{ background: "none", border: "none", color: "#16a34a", cursor: "pointer", fontSize: 13 }}>
            Dismiss
          </button>
        </div>
      )}

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>

        {/* Welcome header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: gray900, margin: "0 0 4px", letterSpacing: "-0.03em" }}>
              Hello, {session.user.name?.split(" ")[0] || "there"} 👋
            </h1>
            <p style={{ color: gray600, fontSize: 15, margin: 0 }}>Great to see you back! Here's your career summary.</p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ background: tierBadge.bg, color: tierBadge.color, fontSize: 13, fontWeight: 700, padding: "6px 14px", borderRadius: 50 }}>
              {tierBadge.label}
            </span>
            {tier === "free" && (
              <Link href="/app/upgrade" style={{ background: purple, color: white, fontSize: 13, fontWeight: 700, padding: "6px 16px", borderRadius: 50, textDecoration: "none", boxShadow: "0 4px 12px rgba(124,92,252,0.3)" }}>
                Upgrade ⚡
              </Link>
            )}
          </div>
        </div>

        {isLoading ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ width: 40, height: 40, border: `3px solid ${purple}`, borderTopColor: "transparent", borderRadius: "50%", margin: "0 auto 16px", animation: "spin 0.8s linear infinite" }} />
            <p style={{ color: gray600, fontSize: 14 }}>Loading your dashboard...</p>
          </div>
        ) : (
          <>
            {/* Stats row */}
            <div style={{ display: "grid", gap: 20, marginBottom: 28 }} className="grid grid-cols-1 sm:grid-cols-3">
              {/* ATS Score */}
              <div style={{ background: white, borderRadius: 20, padding: "28px 24px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #f0f0f0" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: gray600, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.06em" }}>CV Health Score</div>
                <ScoreCircle score={stats?.lastScore ?? null} />
                <p style={{ fontSize: 12, color: gray600, textAlign: "center", marginTop: 12, marginBottom: 0 }}>
                  {stats?.lastScore === null ? "Upload a CV to get started" : "Your last ATS scan result"}
                </p>
              </div>

              {/* Scans */}
              <div style={{ background: white, borderRadius: 20, padding: "28px 24px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #f0f0f0" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: gray600, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.06em" }}>Total Scans</div>
                <div style={{ fontSize: 52, fontWeight: 900, color: gray900, lineHeight: 1, marginBottom: 8 }}>
                  {stats?.totalScans ?? 0}
                </div>
                <p style={{ fontSize: 13, color: gray600, margin: 0 }}>ATS analyses completed</p>
                <Link href="/app/cv" style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 16, fontSize: 13, fontWeight: 600, color: purple, textDecoration: "none" }}>
                  Run a new scan →
                </Link>
              </div>

              {/* Usage */}
              <div style={{ background: white, borderRadius: 20, padding: "28px 24px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #f0f0f0" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: gray600, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.06em" }}>Monthly Usage</div>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ background: "#f1f5f9", borderRadius: 50, height: 10, overflow: "hidden", marginBottom: 8 }}>
                    <div style={{ width: `${usagePct}%`, height: "100%", background: usagePct > 80 ? "#ef4444" : purple, borderRadius: 50, transition: "width 0.5s" }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: gray600 }}>
                    <span>{stats?.aiCreditsUsed ?? 0} used</span>
                    <span>{stats?.aiCreditsLimit ?? 3} limit</span>
                  </div>
                </div>
                <p style={{ fontSize: 12, color: gray600, margin: "12px 0 0" }}>
                  {tier === "free" ? "Upgrade for more AI operations" : "AI operations this month"}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ background: white, borderRadius: 20, padding: "28px 24px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #f0f0f0", marginBottom: 28 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: gray900, margin: "0 0 20px", letterSpacing: "-0.02em" }}>Quick Actions</h2>
              <div style={{ display: "grid", gap: 12 }} className="grid grid-cols-2 sm:grid-cols-4">
                {QUICK_ACTIONS.map(action => (
                  <Link key={action.href + action.label} href={action.href} style={{
                    display: "flex", flexDirection: "column", gap: 6, padding: "16px",
                    background: action.color, borderRadius: 16, textDecoration: "none",
                    transition: "all 0.15s", border: "1px solid transparent",
                  }}
                    onMouseOver={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.1)"; }}
                    onMouseOut={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
                  >
                    <span style={{ fontSize: 22 }}>{action.icon}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: gray900 }}>{action.label}</div>
                      <div style={{ fontSize: 11, color: gray600, marginTop: 2 }}>{action.desc}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Getting started / Upgrade */}
            {tier === "free" && (
              <div style={{
                background: `linear-gradient(135deg, ${navy} 0%, #1a1f45 100%)`,
                borderRadius: 20, padding: "32px", display: "flex", alignItems: "center", justifyContent: "space-between",
                gap: 24, flexWrap: "wrap",
                boxShadow: "0 4px 24px rgba(10,14,39,0.2)",
              }}>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: white, marginBottom: 8, letterSpacing: "-0.02em" }}>
                    Unlock the full career engine ⚡
                  </div>
                  <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", margin: "0 0 16px", maxWidth: 420 }}>
                    Unlimited ATS scans, AI CV optimisation, smart job matching, interview prep, cover letters, and more.
                  </p>
                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                    {["Unlimited scans", "AI optimisation", "Interview prep", "Cover letters"].map(f => (
                      <span key={f} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
                        <span style={{ color: "#4ade80" }}>✓</span> {f}
                      </span>
                    ))}
                  </div>
                </div>
                <Link href="/app/upgrade" style={{
                  background: purple, color: white, fontWeight: 700, fontSize: 15,
                  padding: "14px 28px", borderRadius: 12, textDecoration: "none",
                  boxShadow: "0 4px 16px rgba(124,92,252,0.4)", flexShrink: 0,
                  whiteSpace: "nowrap",
                }}>
                  Upgrade to Pro — €9/mo
                </Link>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
