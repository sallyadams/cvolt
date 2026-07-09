"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"

const purple = "#7c5cfc"

interface JobPosting {
  id: string
  title: string
  description: string
  location: string | null
  remote: boolean
  employmentType: string | null
  experienceLevel: string | null
  salaryMin: number | null
  salaryMax: number | null
  requiredSkills: string[]
  status: string
  applicantCount: number
}

export default function EditJobPostingPage() {
  const params = useParams()
  const router = useRouter()
  const jobId = params.jobId as string

  const [job, setJob] = useState<JobPosting | null>(null)
  const [skillsText, setSkillsText] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/employer/jobs/${jobId}`)
      .then((res) => res.json())
      .then((data) => {
        setJob(data)
        setSkillsText(Array.isArray(data.requiredSkills) ? data.requiredSkills.join(", ") : "")
      })
      .catch((err) => console.error("Failed to fetch job:", err))
      .finally(() => setLoading(false))
  }, [jobId])

  const save = async (extra: Partial<JobPosting> = {}) => {
    if (!job) return
    setSaving(true)
    setError(null)
    setMessage(null)

    try {
      const response = await fetch(`/api/employer/jobs/${jobId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...job,
          requiredSkills: skillsText.split(",").map((s) => s.trim()).filter(Boolean),
          ...extra,
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (response.ok) {
        setJob({ ...data, requiredSkills: Array.isArray(data.requiredSkills) ? data.requiredSkills : [] })
        setMessage("Saved.")
      } else {
        setError(data.error || "Failed to save job posting.")
      }
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!confirm("Delete this job posting? This cannot be undone.")) return
    const response = await fetch(`/api/employer/jobs/${jobId}`, { method: "DELETE" })
    if (response.ok) {
      router.push("/employer/jobs")
    } else {
      setError("Failed to delete job posting.")
    }
  }

  if (loading) return <div style={{ padding: 40, color: "#6b7280" }}>Loading…</div>
  if (!job) return <div style={{ padding: 40, color: "#6b7280" }}>Job posting not found.</div>

  return (
    <div style={{ padding: "32px 40px", maxWidth: 700, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#111827" }}>Edit Job Posting</h1>
        <Link href={`/employer/jobs/${jobId}/applicants`} style={{ color: purple, fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
          View {job.applicantCount} applicant{job.applicantCount === 1 ? "" : "s"} →
        </Link>
      </div>

      <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Job title</label>
          <input type="text" value={job.title} onChange={(e) => setJob({ ...job, title: e.target.value })}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14 }} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Description</label>
          <textarea value={job.description} onChange={(e) => setJob({ ...job, description: e.target.value })} rows={8}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14 }} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Location</label>
            <input type="text" value={job.location ?? ""} onChange={(e) => setJob({ ...job, location: e.target.value })}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14 }} />
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: 10 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#374151" }}>
              <input type="checkbox" checked={job.remote} onChange={(e) => setJob({ ...job, remote: e.target.checked })} />
              Remote position
            </label>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Required skills (comma-separated)</label>
          <input type="text" value={skillsText} onChange={(e) => setSkillsText(e.target.value)}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #d1d5db", fontSize: 14 }} />
        </div>

        {error && <div style={{ background: "#fee2e2", color: "#b91c1c", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{error}</div>}
        {message && <div style={{ background: "#dcfce7", color: "#15803d", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{message}</div>}

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button onClick={() => save()} disabled={saving}
            style={{ background: purple, color: "#fff", padding: "10px 20px", borderRadius: 8, border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
            {saving ? "Saving…" : "Save changes"}
          </button>
          {job.status !== "published" ? (
            <button onClick={() => save({ status: "published" })} disabled={saving}
              style={{ background: "#dcfce7", color: "#15803d", padding: "10px 20px", borderRadius: 8, border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              Publish
            </button>
          ) : (
            <button onClick={() => save({ status: "closed" })} disabled={saving}
              style={{ background: "#fee2e2", color: "#b91c1c", padding: "10px 20px", borderRadius: 8, border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              Close posting
            </button>
          )}
          <button onClick={remove}
            style={{ background: "none", color: "#9ca3af", padding: "10px 20px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 14, fontWeight: 600, cursor: "pointer", marginLeft: "auto" }}>
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
