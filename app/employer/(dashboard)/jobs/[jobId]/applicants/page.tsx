"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"

const purple = "#7c5cfc"

interface Applicant {
  id: string
  status: string
  coverLetter: string | null
  createdAt: string
  applicant: { id: string; email: string; fullName: string | null }
  cv: { id: string; title: string | null } | null
}

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  applied: { bg: "#f3f4f6", color: "#6b7280", label: "Applied" },
  shortlisted: { bg: "#e0e7ff", color: "#4338ca", label: "Shortlisted" },
  interview: { bg: "#fef3c7", color: "#92400e", label: "Interview" },
  offer: { bg: "#dcfce7", color: "#15803d", label: "Offer" },
  rejected: { bg: "#fee2e2", color: "#b91c1c", label: "Rejected" },
}

const ACTIONS: { status: string; label: string }[] = [
  { status: "shortlisted", label: "Shortlist" },
  { status: "interview", label: "Interview" },
  { status: "offer", label: "Offer" },
  { status: "rejected", label: "Reject" },
]

export default function JobApplicantsPage() {
  const params = useParams()
  const jobId = params.jobId as string

  const [jobTitle, setJobTitle] = useState("")
  const [applicants, setApplicants] = useState<Applicant[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    fetch(`/api/employer/jobs/${jobId}/applicants`)
      .then((res) => res.json())
      .then((data) => {
        setJobTitle(data.job?.title ?? "")
        setApplicants(Array.isArray(data.applicants) ? data.applicants : [])
      })
      .catch((err) => console.error("Failed to fetch applicants:", err))
      .finally(() => setLoading(false))
  }

  useEffect(load, [jobId])

  const updateStatus = async (applicationId: string, status: string) => {
    setUpdatingId(applicationId)
    setError(null)
    try {
      const response = await fetch(`/api/employer/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      const data = await response.json().catch(() => ({}))
      if (response.ok) {
        setApplicants((prev) => prev.map((a) => (a.id === applicationId ? { ...a, status: data.status } : a)))
      } else {
        setError(data.error || "Failed to update application status.")
      }
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setUpdatingId(null)
    }
  }

  if (loading) return <div style={{ padding: 40, color: "#6b7280" }}>Loading…</div>

  return (
    <div style={{ padding: "32px 40px", maxWidth: 900, margin: "0 auto" }}>
      <Link href={`/employer/jobs/${jobId}`} style={{ color: "#6b7280", fontSize: 13, textDecoration: "none" }}>← Back to job posting</Link>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: "#111827", margin: "8px 0 24px" }}>
        Applicants — {jobTitle}
      </h1>

      {error && <div style={{ background: "#fee2e2", color: "#b91c1c", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{error}</div>}

      {applicants.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: 12, padding: 40, textAlign: "center", color: "#6b7280" }}>
          No applicants yet.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {applicants.map((a) => {
            const style = STATUS_STYLE[a.status] || STATUS_STYLE.applied
            return (
              <div key={a.id} style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>{a.applicant.fullName || a.applicant.email}</div>
                    <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>
                      {a.applicant.email} · Applied {new Date(a.createdAt).toLocaleDateString()}
                      {a.cv && <> · {a.cv.title || "CV"}</>}
                    </div>
                  </div>
                  <span style={{ background: style.bg, color: style.color, padding: "4px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600 }}>
                    {style.label}
                  </span>
                </div>

                {a.coverLetter && (
                  <p style={{ fontSize: 13, color: "#4b5563", background: "#f9fafb", borderRadius: 8, padding: 12, marginBottom: 12 }}>
                    {a.coverLetter}
                  </p>
                )}

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {ACTIONS.map((action) => (
                    <button
                      key={action.status}
                      onClick={() => updateStatus(a.id, action.status)}
                      disabled={updatingId === a.id || a.status === action.status}
                      style={{
                        padding: "6px 14px", borderRadius: 8, border: "1px solid #e5e7eb",
                        background: a.status === action.status ? "#f3f4f6" : "#fff",
                        color: a.status === action.status ? "#9ca3af" : "#374151",
                        fontSize: 13, fontWeight: 600, cursor: a.status === action.status ? "default" : "pointer",
                        opacity: updatingId === a.id ? 0.5 : 1,
                      }}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
