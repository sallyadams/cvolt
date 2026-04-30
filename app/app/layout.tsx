"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import type { ReactNode } from "react"

const navy = "#0a0e27"
const purple = "#7c5cfc"
const white = "#ffffff"

const NAV_ITEMS = [
  { href: "/app", icon: "🏠", label: "Dashboard", exact: true },
  { href: "/app/cv", icon: "📄", label: "My CVs" },
  { href: "/app/scan", icon: "🔍", label: "ATS Scanner" },
  { href: "/app/match", icon: "🎯", label: "Job Match" },
  { href: "/app/tracker", icon: "📊", label: "Applications" },
  { href: "/app/interview", icon: "🎤", label: "Interview Prep" },
  { href: "/app/bullets", icon: "✨", label: "Bullet Improver" },
  { href: "/app/cover-letter", icon: "📝", label: "Cover Letter" },
  { href: "/app/linkedin", icon: "💼", label: "LinkedIn" },
]

function NavItem({ href, icon, label, exact }: { href: string; icon: string; label: string; exact?: boolean }) {
  const pathname = usePathname()
  const active = exact ? pathname === href : pathname.startsWith(href)

  return (
    <Link
      href={href}
      style={{
        display: "flex", alignItems: "center", gap: 12, padding: "10px 16px",
        borderRadius: 12, textDecoration: "none", transition: "all 0.15s",
        background: active ? "rgba(124,92,252,0.15)" : "transparent",
        color: active ? purple : "rgba(255,255,255,0.65)",
        fontWeight: active ? 600 : 500, fontSize: 14,
        borderLeft: active ? `3px solid ${purple}` : "3px solid transparent",
      }}
    >
      <span style={{ fontSize: 17 }}>{icon}</span>
      <span>{label}</span>
    </Link>
  )
}

export default function AppLayout({ children }: { children: ReactNode }) {
  const { data: session } = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)

  const tierBadge = (tier: string) => {
    const map: Record<string, { bg: string; color: string }> = {
      free: { bg: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" },
      starter: { bg: "rgba(96,165,250,0.2)", color: "#93c5fd" },
      pro: { bg: "rgba(124,92,252,0.25)", color: "#c4b5fd" },
      premium: { bg: "rgba(251,191,36,0.2)", color: "#fcd34d" },
    }
    return map[tier] || map.free
  }

  const Sidebar = ({ mobile }: { mobile?: boolean }) => (
    <aside style={{
      width: 240, background: navy, height: "100%",
      display: "flex", flexDirection: "column",
      borderRight: "1px solid rgba(255,255,255,0.06)",
      ...(mobile ? { position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 200 } : {}),
    }}>
      {/* Logo */}
      <div style={{ padding: "24px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <Link href="/app" style={{ fontSize: 22, fontWeight: 800, color: white, textDecoration: "none" }}>
          c<span style={{ color: purple }}>volt</span>
        </Link>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2, fontWeight: 500 }}>Career Platform</div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "16px 12px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV_ITEMS.map(item => <NavItem key={item.href} {...item} />)}
      </nav>

      {/* Bottom */}
      <div style={{ padding: "16px 12px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: 8 }}>
        {/* Upgrade CTA for free users */}
        <Link href="/app/upgrade" style={{
          display: "block", background: `linear-gradient(135deg, ${purple}, #9b7fff)`,
          borderRadius: 12, padding: "12px 16px", textDecoration: "none",
          fontSize: 13, fontWeight: 600, color: white, textAlign: "center",
          boxShadow: "0 4px 12px rgba(124,92,252,0.3)",
        }}>
          Upgrade to Pro ⚡
        </Link>

        {/* User */}
        {session?.user && (
          <div style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.05)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: purple, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: white, flexShrink: 0 }}>
                {(session.user.name || session.user.email || "U")[0].toUpperCase()}
              </div>
              <div style={{ overflow: "hidden" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: white, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {session.user.name || "User"}
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {session.user.email}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "space-between" }}>
              <Link href="/app/settings" style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", textDecoration: "none" }}>Settings</Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  )

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8f9fe" }}>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex" style={{ width: 240, flexShrink: 0 }}>
        <Sidebar />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <>
          <div
            onClick={() => setMobileOpen(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 190 }}
          />
          <Sidebar mobile />
        </>
      )}

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Mobile top bar */}
        <div className="lg:hidden" style={{ background: navy, padding: "0 20px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <button
            onClick={() => setMobileOpen(true)}
            style={{ background: "none", border: "none", color: white, fontSize: 22, cursor: "pointer", padding: "4px 0" }}
            aria-label="Open menu"
          >
            ☰
          </button>
          <Link href="/app" style={{ fontSize: 18, fontWeight: 800, color: white, textDecoration: "none" }}>
            c<span style={{ color: purple }}>volt</span>
          </Link>
          <div style={{ width: 32 }} />
        </div>

        <main style={{ flex: 1, overflow: "auto" }}>
          {children}
        </main>
      </div>
    </div>
  )
}
