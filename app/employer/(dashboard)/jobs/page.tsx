"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

const purple = "#7c5cfc"

interface JobPosting {
  id: string
  title: string
  status: string
  location: string | null
  remote: boolean
  applicantCount: number
  createdAt: string
}

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  draft: { bg: "#f3f4f6", color: "#6b7280" },
  published: { bg: "#dcfce7", color: "#15803d" },
  closed: { bg: "#fee2e2", color: "#b91c1c" },
}

export default function EmployerJobsPage() {
  const [jobs, setJobs] = useState<JobPosting[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/employer/jobs")
      .then((res) => res.json())
      .then((data) => setJobs(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Failed to fetch jobs:", err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div style={{ padding: 40, color: "#6b7280" }}>Loading…</div>
  }

  return (
    <div style={{ padding: "32px 40px", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#111827" }}>Job Postings</h1>
        <Link href="/employer/jobs/new" style={{ background: purple, color: "#fff", padding: "10px 18px", borderRadius: 8, textDecoration: "none", fontSize: 14, fontWeight: 600 }}>
          + Post a Job
        </Link>
      </div>

      {jobs.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: 12, padding: 40, textAlign: "center", color: "#6b7280" }}>
          No job postings yet. <Link href="/employer/jobs/new" style={{ color: purple }}>Post your first job</Link>.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {jobs.map((job) => {
            const style = STATUS_STYLE[job.status] || STATUS_STYLE.draft
            return (
              <div key={job.id} style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>{job.title}</div>
                  <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
                    {job.location || "Location not set"} {job.remote && "· Remote"}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ background: style.bg, color: style.color, padding: "4px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600, textTransform: "capitalize" }}>
                    {job.status}
                  </span>
                  <Link href={`/employer/jobs/${job.id}/applicants`} style={{ fontSize: 13, color: purple, textDecoration: "none", fontWeight: 600 }}>
                    {job.applicantCount} applicant{job.applicantCount === 1 ? "" : "s"} →
                  </Link>
                  <Link href={`/employer/jobs/${job.id}`} style={{ fontSize: 13, color: "#6b7280", textDecoration: "none" }}>
                    Edit
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
