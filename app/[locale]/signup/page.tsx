"use client"

import { useState, Suspense } from "react"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useLocale } from "next-intl"

const purple = "#7c5cfc"
const navy = "#0a0e27"
const gray900 = "#0f172a"
const gray600 = "#64748b"
const white = "#ffffff"

const PLAN_LABELS: Record<string, string> = {
  pro: "You're signing up for Pro — €9/mo",
  premium: "You're signing up for Premium — €19/mo",
}

function SignupForm({ locale }: { locale: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const plan = searchParams.get("plan") || "free"

  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const postSignupUrl = plan !== "free" ? `/upgrade?plan=${plan}` : "/dashboard"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, fullName }),
      })

      if (res.ok) {
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        })
        if (result?.error) {
          setError("Account created but sign-in failed. Please sign in manually.")
        } else {
          router.push(postSignupUrl)
        }
      } else {
        const data = await res.json()
        setError(data.error || "Something went wrong")
      }
    } catch {
      setError("Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: postSignupUrl })
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "13px 16px", borderRadius: 12, fontSize: 15,
    border: "1px solid #e2e8f0", outline: "none", background: white,
    boxSizing: "border-box", color: gray900, transition: "border-color 0.15s, box-shadow 0.15s",
  }

  return (
    <>
      {/* Plan badge */}
      {PLAN_LABELS[plan] && (
        <div style={{ background: "#ede9fe", color: purple, fontSize: 13, fontWeight: 600, padding: "10px 16px", borderRadius: 10, marginBottom: 20, textAlign: "center" }}>
          {PLAN_LABELS[plan]}
        </div>
      )}

      {/* Google button */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          padding: "13px", borderRadius: 12, border: "1px solid #e2e8f0",
          background: white, cursor: "pointer", fontSize: 14, fontWeight: 600, color: gray900,
          marginBottom: 16,
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      </button>

      {/* Divider */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
        <span style={{ fontSize: 12, color: gray600, fontWeight: 500 }}>or with email</span>
        <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: gray900, display: "block", marginBottom: 6 }}>Full name</label>
          <input
            type="text"
            placeholder="Alex Johnson"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            style={inputStyle}
            onFocus={e => { e.target.style.borderColor = purple; e.target.style.boxShadow = "0 0 0 3px rgba(124,92,252,0.12)"; }}
            onBlur={e => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; }}
          />
        </div>

        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: gray900, display: "block", marginBottom: 6 }}>Email address</label>
          <input
            type="email"
            required
            placeholder="alex@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={inputStyle}
            onFocus={e => { e.target.style.borderColor = purple; e.target.style.boxShadow = "0 0 0 3px rgba(124,92,252,0.12)"; }}
            onBlur={e => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; }}
          />
        </div>

        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: gray900, display: "block", marginBottom: 6 }}>Password</label>
          <input
            type="password"
            required
            placeholder="At least 8 characters"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={inputStyle}
            onFocus={e => { e.target.style.borderColor = purple; e.target.style.boxShadow = "0 0 0 3px rgba(124,92,252,0.12)"; }}
            onBlur={e => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; }}
          />
        </div>

        {error && (
          <div style={{ background: "#fee2e2", color: "#dc2626", fontSize: 13, padding: "10px 14px", borderRadius: 10, fontWeight: 500 }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          style={{
            width: "100%", padding: "14px", borderRadius: 12, border: "none",
            background: isLoading ? "#a78bfa" : purple, color: white,
            fontWeight: 700, fontSize: 15, cursor: isLoading ? "not-allowed" : "pointer",
            marginTop: 4, boxShadow: "0 4px 14px rgba(124,92,252,0.35)",
          }}
        >
          {isLoading ? "Creating account…" : "Create account"}
        </button>
      </form>

      {/* Sign in link */}
      <p style={{ fontSize: 13, color: gray600, textAlign: "center", margin: "20px 0 0" }}>
        Already have an account?{" "}
        <Link href={`/${locale}/login`} style={{ color: purple, fontWeight: 600, textDecoration: "none" }}>
          Sign in
        </Link>
      </p>

      <p style={{ fontSize: 11, color: "#94a3b8", textAlign: "center", margin: "14px 0 0", lineHeight: 1.5 }}>
        By creating an account you agree to our Terms of Service and Privacy Policy.
      </p>
    </>
  )
}

export default function SignupPage() {
  const locale = useLocale()

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fe", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ width: "100%", maxWidth: 440, background: white, borderRadius: 24, boxShadow: "0 4px 32px rgba(10,14,39,0.1)", padding: "40px 36px" }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <Link href={`/${locale}`} style={{ textDecoration: "none" }}>
            <span style={{ fontSize: 28, fontWeight: 900, color: navy, letterSpacing: "-0.04em" }}>
              c<span style={{ color: purple }}>volt</span>
            </span>
          </Link>
        </div>

        {/* Headline */}
        <h1 style={{ fontSize: 22, fontWeight: 800, color: gray900, textAlign: "center", margin: "0 0 6px", letterSpacing: "-0.03em" }}>
          Start your CVolt journey
        </h1>
        <p style={{ fontSize: 14, color: gray600, textAlign: "center", margin: "0 0 24px" }}>
          Join thousands of job seekers landing more interviews.
        </p>

        <Suspense fallback={null}>
          <SignupForm locale={locale} />
        </Suspense>
      </div>
    </div>
  )
}
