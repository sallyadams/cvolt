"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"

const purple = "#7c5cfc"
const gray900 = "#0f172a"
const gray600 = "#64748b"
const white = "#ffffff"

interface JobDetail {
  id: string
  title: string
  description: string
  location: string | null
  remote: boolean
  employmentType: string | null
  experienceLevel: string | null
  salaryMin: number | null
  salaryMax: number | null
  salaryCurrency: string
  requiredSkills: string[]
  hasApplied: boolean
  company: { name: string; logoUrl: string | null; website: string | null; location: string | null; description: string | null }
}

interface CV {
  id: string
  title: string | null
  version: number
}

const EMPLOYMENT_LABELS: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  internship: "Internship",
}

export default function JobBoardDetailPage() {
  const params = useParams()
  const jobId = params.jobId as string
  const { data: session, status } = useSession()

  const [job, setJob] = useState<JobDetail | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading] = useState(true)

  const [cvs, setCvs] = useState<CV[]>([])
  const [cvId, setCvId] = useState("")
  const [coverLetter, setCoverLetter] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [applied, setApplied] = useState(false)

  useEffect(() => {
    fetch(`/api/public/jobs/${jobId}`)
      .then(async (res) => {
        if (!res.ok) { setNotFound(true); return }
        const data = await res.json()
        setJob(data)
        setApplied(!!data.hasApplied)
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [jobId])

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role !== "employer") {
      fetch("/api/cv")
        .then((res) => res.json())
        .then((data) => {
          const list = Array.isArray(data) ? data : []
          setCvs(list)
          if (list[0]) setCvId(list[0].id)
        })
        .catch((err) => console.error("Failed to load CVs:", err))
    }
  }, [status, session?.user?.role])

  const submitApplication = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/public/jobs/${jobId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cvId, coverLetter }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setApplied(true)
      } else {
        setError(data.error || "Failed to submit application.")
      }
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div style={{ padding: 40, color: gray600 }}>Loading…</div>
  if (notFound || !job) {
    return (
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "60px 24px", textAlign: "center" }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: gray900 }}>Job posting not found</h1>
        <p style={{ color: gray600, fontSize: 14 }}>It may have been closed or removed.</p>
        <Link href="/job-board" style={{ color: purple, fontSize: 14, fontWeight: 600 }}>← Back to Job Board</Link>
      </div>
    )
  }

  const salary = job.salaryMin || job.salaryMax
    ? job.salaryMin && job.salaryMax
      ? `${job.salaryCurrency} ${job.salaryMin.toLocaleString()} – ${job.salaryCurrency} ${job.salaryMax.toLocaleString()}`
      : `${job.salaryCurrency} ${(job.salaryMin || job.salaryMax || 0).toLocaleString()}`
    : null

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 24px" }}>
      <Link href="/job-board" style={{ color: gray600, fontSize: 13, textDecoration: "none" }}>← Back to Job Board</Link>

      <h1 style={{ fontSize: 26, fontWeight: 800, color: gray900, margin: "12px 0 4px" }}>{job.title}</h1>
      <div style={{ fontSize: 15, color: gray600, marginBottom: 16 }}>{job.company.name}</div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
        {[
          job.location ? `📍 ${job.location}` : job.remote ? "📍 Remote" : "",
          job.employmentType ? `⏰ ${EMPLOYMENT_LABELS[job.employmentType] || job.employmentType}` : "",
          job.experienceLevel ? `🎯 ${job.experienceLevel}` : "",
          salary ? `💰 ${salary}` : "",
        ].filter(Boolean).map((item) => (
          <span key={item} style={{ fontSize: 13, color: gray600 }}>{item}</span>
        ))}
      </div>

      {job.requiredSkills.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: gray900, marginBottom: 10 }}>Required Skills</h3>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {job.requiredSkills.map((s) => (
              <span key={s} style={{ background: "#ede9fe", color: purple, padding: "6px 14px", borderRadius: 50, fontSize: 13, fontWeight: 600 }}>{s}</span>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginBottom: 28 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: gray900, marginBottom: 10 }}>About the Role</h3>
        <p style={{ fontSize: 14, color: gray600, lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap" }}>{job.description}</p>
      </div>

      <div style={{ background: white, borderRadius: 12, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        {status === "loading" ? null : status !== "authenticated" ? (
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 14, color: gray600, marginBottom: 12 }}>Log in as a job seeker to apply for this role.</p>
            <Link href={`/login?callbackUrl=/job-board/${jobId}`} style={{
              display: "inline-block", background: purple, color: white, textDecoration: "none",
              padding: "12px 24px", borderRadius: 10, fontWeight: 700, fontSize: 14,
            }}>
              Log in to Apply
            </Link>
          </div>
        ) : session?.user?.role === "employer" ? (
          <p style={{ fontSize: 14, color: gray600, textAlign: "center", margin: 0 }}>
            Employer accounts can&apos;t apply to jobs. Log in with a job seeker account to apply.
          </p>
        ) : applied ? (
          <div style={{ textAlign: "center" }}>
            <span style={{ background: "#dcfce7", color: "#15803d", padding: "8px 20px", borderRadius: 999, fontSize: 14, fontWeight: 700 }}>
              Applied ✓
            </span>
          </div>
        ) : cvs.length === 0 ? (
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 14, color: gray600, marginBottom: 12 }}>Upload a CV before applying.</p>
            <Link href="/cv" style={{ color: purple, fontWeight: 600, fontSize: 14, textDecoration: "none" }}>Upload a CV →</Link>
          </div>
        ) : (
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: gray900, marginBottom: 12 }}>Apply for this role</h3>
            {error && <div style={{ background: "#fee2e2", color: "#b91c1c", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 12 }}>{error}</div>}
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: gray900, marginBottom: 6 }}>CV</label>
            <select
              value={cvId}
              onChange={(e) => setCvId(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14, marginBottom: 16 }}
            >
              {cvs.map((cv) => (
                <option key={cv.id} value={cv.id}>{cv.title || `CV v${cv.version}`}</option>
              ))}
            </select>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: gray900, marginBottom: 6 }}>Cover letter (optional)</label>
            <textarea
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              rows={4}
              placeholder="A short note to the employer…"
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14, marginBottom: 16, fontFamily: "inherit", resize: "vertical" }}
            />
            <button
              onClick={submitApplication}
              disabled={submitting || !cvId}
              style={{
                width: "100%", background: purple, color: white, border: "none", borderRadius: 10,
                padding: "13px", fontWeight: 700, fontSize: 15, cursor: submitting ? "default" : "pointer",
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? "Submitting…" : "Submit Application"}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
