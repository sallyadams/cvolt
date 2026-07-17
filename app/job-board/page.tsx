"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

const purple = "#7c5cfc"
const gray900 = "#0f172a"
const gray600 = "#64748b"
const white = "#ffffff"

interface JobPosting {
  id: string
  title: string
  location: string | null
  remote: boolean
  employmentType: string | null
  salaryMin: number | null
  salaryMax: number | null
  salaryCurrency: string
  requiredSkills: string[]
  createdAt: string
  company: { name: string; logoUrl: string | null; location: string | null }
}

const EMPLOYMENT_LABELS: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  internship: "Internship",
}

function formatSalary(job: JobPosting) {
  if (!job.salaryMin && !job.salaryMax) return null
  const fmt = (n: number) => `${job.salaryCurrency} ${n.toLocaleString()}`
  if (job.salaryMin && job.salaryMax) return `${fmt(job.salaryMin)} – ${fmt(job.salaryMax)}`
  return fmt(job.salaryMin || job.salaryMax || 0)
}

export default function JobBoardPage() {
  const [jobs, setJobs] = useState<JobPosting[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [remoteOnly, setRemoteOnly] = useState(false)

  const load = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search.trim()) params.set("q", search.trim())
    if (remoteOnly) params.set("remote", "true")

    fetch(`/api/public/jobs?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => setJobs(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Failed to load jobs:", err))
      .finally(() => setLoading(false))
  }

  useEffect(load, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [search, remoteOnly]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: gray900, margin: "0 0 4px", letterSpacing: "-0.02em" }}>Job Board</h1>
      <p style={{ fontSize: 14, color: gray600, margin: "0 0 24px" }}>Open roles posted by employers on cvolt.</p>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
        <input
          style={{ flex: 1, minWidth: 220, padding: "10px 16px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 14, color: gray900, outline: "none", background: white }}
          placeholder="Search jobs, skills…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          onClick={() => setRemoteOnly((r) => !r)}
          style={{
            padding: "10px 18px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer",
            border: "1px solid transparent",
            background: remoteOnly ? purple : "#f1f5f9",
            color: remoteOnly ? white : gray600,
          }}
        >
          Remote only
        </button>
      </div>

      {loading ? (
        <div style={{ color: gray600, fontSize: 14, padding: 40, textAlign: "center" }}>Loading…</div>
      ) : jobs.length === 0 ? (
        <div style={{ background: white, borderRadius: 12, padding: 40, textAlign: "center", color: gray600 }}>
          No open roles match your search right now.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {jobs.map((job) => {
            const salary = formatSalary(job)
            return (
              <Link
                key={job.id}
                href={`/job-board/${job.id}`}
                style={{
                  display: "block", background: white, borderRadius: 12, padding: 20,
                  textDecoration: "none", boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: gray900 }}>{job.title}</div>
                    <div style={{ fontSize: 13, color: gray600, marginTop: 2 }}>
                      {job.company.name}
                      {(job.location || job.company.location) && ` · ${job.location || job.company.location}`}
                      {job.remote && " · Remote"}
                    </div>
                  </div>
                  {job.employmentType && (
                    <span style={{ fontSize: 12, fontWeight: 600, color: purple, background: "#ede9fe", padding: "4px 12px", borderRadius: 999, height: "fit-content", whiteSpace: "nowrap" }}>
                      {EMPLOYMENT_LABELS[job.employmentType] || job.employmentType}
                    </span>
                  )}
                </div>
                {salary && <div style={{ fontSize: 13, color: gray600, marginBottom: 8 }}>💰 {salary}</div>}
                {job.requiredSkills.length > 0 && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {job.requiredSkills.slice(0, 5).map((s) => (
                      <span key={s} style={{ fontSize: 11, background: "#f1f5f9", color: gray600, padding: "3px 10px", borderRadius: 50 }}>{s}</span>
                    ))}
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
