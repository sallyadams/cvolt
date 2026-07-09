"use client"

import { useEffect, useState } from "react"

const purple = "#7c5cfc"

interface Company {
  name: string
  logoUrl: string | null
  website: string | null
  description: string | null
  industry: string | null
  location: string | null
}

export default function EmployerCompanyPage() {
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/employer/company")
      .then((res) => res.json())
      .then((data) => setCompany(data))
      .catch((err) => console.error("Failed to fetch company:", err))
      .finally(() => setLoading(false))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!company) return
    setSaving(true)
    setMessage(null)
    setError(null)

    try {
      const response = await fetch("/api/employer/company", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(company),
      })
      const data = await response.json().catch(() => ({}))
      if (response.ok) {
        setCompany(data)
        setMessage("Company profile updated.")
      } else {
        setError(data.error || "Failed to update company profile.")
      }
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div style={{ padding: 40, color: "#6b7280" }}>Loading…</div>
  }

  if (!company) {
    return <div style={{ padding: 40, color: "#6b7280" }}>Could not load company profile.</div>
  }

  const field = (key: keyof Company, label: string, placeholder: string, multiline = false) => (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>{label}</label>
      {multiline ? (
        <textarea
          value={company[key] ?? ""}
          onChange={(e) => setCompany({ ...company, [key]: e.target.value })}
          placeholder={placeholder}
          rows={4}
          style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14 }}
        />
      ) : (
        <input
          type="text"
          value={company[key] ?? ""}
          onChange={(e) => setCompany({ ...company, [key]: e.target.value })}
          placeholder={placeholder}
          style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14 }}
        />
      )}
    </div>
  )

  return (
    <div style={{ padding: "32px 40px", maxWidth: 700, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: "#111827", marginBottom: 24 }}>Company Profile</h1>

      <form onSubmit={handleSubmit} style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        {field("name", "Company name", "Acme Inc")}
        {field("logoUrl", "Logo URL", "https://example.com/logo.png")}
        {field("website", "Website", "https://example.com")}
        {field("industry", "Industry", "Software, Finance, Healthcare…")}
        {field("location", "Location", "Paris, France")}
        {field("description", "Description", "Tell candidates about your company…", true)}

        {error && (
          <div style={{ background: "#fee2e2", color: "#b91c1c", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{error}</div>
        )}
        {message && (
          <div style={{ background: "#dcfce7", color: "#15803d", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{message}</div>
        )}

        <button
          type="submit"
          disabled={saving}
          style={{ background: purple, color: "#fff", padding: "10px 20px", borderRadius: 8, border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer", opacity: saving ? 0.6 : 1 }}
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </form>
    </div>
  )
}
