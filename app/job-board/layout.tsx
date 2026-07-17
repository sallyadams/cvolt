"use client"

import Link from "next/link"
import { useSession } from "next-auth/react"
import type { ReactNode } from "react"

const purple = "#7c5cfc"
const navy = "#0a0e27"
const white = "#ffffff"

export default function JobBoardLayout({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fe" }}>
      <header style={{
        background: navy, padding: "0 28px", height: 64,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <Link href="/job-board" style={{ fontSize: 20, fontWeight: 800, color: white, textDecoration: "none" }}>
          c<span style={{ color: purple }}>volt</span>
          <span style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.5)", marginLeft: 10 }}>Job Board</span>
        </Link>
        {status === "authenticated" ? (
          <Link href={session?.user?.role === "employer" ? "/employer/dashboard" : "/dashboard"} style={{
            fontSize: 13, fontWeight: 600, color: white, textDecoration: "none",
            padding: "8px 16px", borderRadius: 8, background: "rgba(255,255,255,0.08)",
          }}>
            Dashboard
          </Link>
        ) : (
          <div style={{ display: "flex", gap: 10 }}>
            <Link href="/login" style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.75)", textDecoration: "none", padding: "8px 12px" }}>
              Log in
            </Link>
            <Link href="/signup" style={{
              fontSize: 13, fontWeight: 600, color: white, textDecoration: "none",
              padding: "8px 16px", borderRadius: 8, background: purple,
            }}>
              Sign up
            </Link>
          </div>
        )}
      </header>
      {children}
    </div>
  )
}
