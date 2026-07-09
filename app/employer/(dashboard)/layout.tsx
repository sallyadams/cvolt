"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import type { ReactNode } from "react"

const navy = "#0a0e27"
const purple = "#7c5cfc"
const white = "#ffffff"

const NAV_ITEMS = [
  { href: "/employer/dashboard", icon: "🏠", label: "Dashboard", exact: true },
  { href: "/employer/jobs", icon: "📋", label: "Job Postings" },
  { href: "/employer/company", icon: "🏢", label: "Company Profile" },
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

export default function EmployerDashboardLayout({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/employer/login")
    } else if (status === "authenticated" && session?.user.role !== "employer") {
      router.push("/dashboard")
    }
  }, [status, session, router])

  if (status === "loading" || (status === "authenticated" && session?.user.role !== "employer")) {
    return (
      <div style={{ minHeight: "100vh", background: "#f8f9fe", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, border: "3px solid #e5e7eb", borderTopColor: "#7c5cfc", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
          <p style={{ marginTop: 16, color: "#6b7280", fontSize: 14 }}>Loading…</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return null
  }

  const Sidebar = ({ mobile }: { mobile?: boolean }) => (
    <aside style={{
      width: 240, background: navy, height: "100%",
      display: "flex", flexDirection: "column",
      borderRight: "1px solid rgba(255,255,255,0.06)",
      ...(mobile ? { position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 200 } : {}),
    }}>
      <div style={{ padding: "24px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <Link href="/employer/dashboard" style={{ fontSize: 22, fontWeight: 800, color: white, textDecoration: "none" }}>
          c<span style={{ color: purple }}>volt</span>
        </Link>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2, fontWeight: 500 }}>Employer Portal</div>
      </div>

      <nav style={{ flex: 1, padding: "16px 12px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV_ITEMS.map(item => <NavItem key={item.href} {...item} />)}
      </nav>

      <div style={{ padding: "16px 12px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: 8 }}>
        <Link href="/employer/jobs/new" style={{
          display: "block", background: `linear-gradient(135deg, ${purple}, #9b7fff)`,
          borderRadius: 12, padding: "12px 16px", textDecoration: "none",
          fontSize: 13, fontWeight: 600, color: white, textAlign: "center",
          boxShadow: "0 4px 12px rgba(124,92,252,0.3)",
        }}>
          + Post a Job
        </Link>

        {session?.user && (
          <div style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.05)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: purple, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: white, flexShrink: 0 }}>
                {(session.user.name || session.user.email || "E")[0].toUpperCase()}
              </div>
              <div style={{ overflow: "hidden" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: white, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {session.user.name || "Employer"}
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {session.user.email}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "flex-end" }}>
              <button
                onClick={() => signOut({ callbackUrl: "/employer/login" })}
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
      <div className="hidden lg:flex" style={{ width: 240, flexShrink: 0 }}>
        <Sidebar />
      </div>

      {mobileOpen && (
        <>
          <div
            onClick={() => setMobileOpen(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 190 }}
          />
          <Sidebar mobile />
        </>
      )}

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div className="lg:hidden" style={{ background: navy, padding: "0 20px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <button
            onClick={() => setMobileOpen(true)}
            style={{ background: "none", border: "none", color: white, fontSize: 22, cursor: "pointer", padding: "4px 0" }}
            aria-label="Open menu"
          >
            ☰
          </button>
          <Link href="/employer/dashboard" style={{ fontSize: 18, fontWeight: 800, color: white, textDecoration: "none" }}>
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
