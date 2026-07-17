"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

const purple = "#7c5cfc"
const gray900 = "#0f172a"
const gray600 = "#64748b"
const white = "#ffffff"

interface Job {
  id: string
  title: string
  location: string | null
  remote: boolean
  employmentType: string | null
  salaryMin: number | null
  salaryMax: number | null
  salaryCurrency: string
  requiredSkills: string[]
  description: string
  company: { name: string; location: string | null }
}

const EMPLOYMENT_LABELS: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  internship: "Internship",
}

const TYPES = ["All", "full_time", "part_time", "contract", "Remote"]

function formatSalary(job: Job) {
  if (!job.salaryMin && !job.salaryMax) return null
  const fmt = (n: number) => `${job.salaryCurrency} ${n.toLocaleString()}`
  if (job.salaryMin && job.salaryMax) return `${fmt(job.salaryMin)} – ${fmt(job.salaryMax)}`
  return fmt(job.salaryMin || job.salaryMax || 0)
}

export default function JobsPage() {
  const { status } = useSession()
  const router = useRouter()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("All")
  const [selected, setSelected] = useState<Job | null>(null)
  const [saved, setSaved] = useState<string[]>([])

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
  }, [status, router])

  useEffect(() => {
    if (status !== "authenticated") return
    fetch("/api/public/jobs")
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => {
        const list = Array.isArray(data) ? data : []
        setJobs(list)
        setSelected(list[0] ?? null)
      })
      .catch(() => setError("Couldn't load open roles. Try refreshing the page."))
      .finally(() => setLoading(false))
  }, [status])

  const filtered = jobs.filter(j => {
    const q = search.toLowerCase()
    const matchesSearch = !q || j.title.toLowerCase().includes(q) || j.company.name.toLowerCase().includes(q) ||
      j.requiredSkills.some(t => t.toLowerCase().includes(q))
    const matchesType = typeFilter === "All" ||
      j.employmentType === typeFilter ||
      (typeFilter === "Remote" && j.remote)
    return matchesSearch && matchesType
  })

  const toggleSave = (id: string) =>
    setSaved(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fe" }}>
      {/* Header */}
      <div style={{ background: white, borderBottom: "1px solid #f0f0f0", padding: "24px 28px" }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: gray900, margin: "0 0 4px", letterSpacing: "-0.03em" }}>Browse Jobs</h1>
        <p style={{ fontSize: 14, color: gray600, margin: "0 0 20px" }}>Open roles posted by employers on cvolt.</p>

        {/* Search + filters */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <input
            style={{ flex: 1, minWidth: 220, padding: "10px 16px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 14, color: gray900, outline: "none" }}
            placeholder="Search jobs, companies, skills..."
            value={search} onChange={e => setSearch(e.target.value)}
          />
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {TYPES.map(t => (
              <button key={t} onClick={() => setTypeFilter(t)} style={{
                padding: "8px 16px", borderRadius: 50, fontSize: 13, fontWeight: 600, cursor: "pointer",
                border: "1px solid transparent",
                background: typeFilter === t ? purple : "#f1f5f9",
                color: typeFilter === t ? white : gray600,
              }}>
                {t === "All" || t === "Remote" ? t : EMPLOYMENT_LABELS[t]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div style={{ margin: "16px 28px 0", background: "#fee2e2", color: "#b91c1c", padding: "10px 14px", borderRadius: 8, fontSize: 13 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: gray600 }}>Loading…</div>
      ) : (
      <div style={{ display: "grid", height: "calc(100vh - 180px)" }} className="grid grid-cols-1 lg:grid-cols-5">
        {/* Job list */}
        <div style={{ overflowY: "auto", borderRight: "1px solid #f0f0f0", background: white }} className="lg:col-span-2">
          <div style={{ padding: "12px" }}>
            <div style={{ padding: "8px 12px", fontSize: 12, color: gray600, fontWeight: 600, marginBottom: 4 }}>
              {filtered.length} jobs found
            </div>
            {filtered.map(job => {
              const salary = formatSalary(job)
              return (
                <button key={job.id} onClick={() => setSelected(job)} style={{
                  display: "block", width: "100%", textAlign: "left", border: "none", cursor: "pointer",
                  padding: "16px", borderRadius: 12, marginBottom: 6,
                  background: selected?.id === job.id ? "#ede9fe" : "#f8f9fe",
                  transition: "all 0.15s",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: gray900 }}>{job.title}</div>
                      <div style={{ fontSize: 12, color: gray600 }}>
                        {job.company.name}
                        {(job.location || job.company.location) && ` · ${job.location || job.company.location}`}
                        {job.remote && " · Remote"}
                      </div>
                    </div>
                    <button onClick={e => { e.stopPropagation(); toggleSave(job.id); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, flexShrink: 0 }}>
                      {saved.includes(job.id) ? "🔖" : "🗒️"}
                    </button>
                  </div>
                  {salary && <div style={{ fontSize: 12, color: gray600, marginBottom: 8 }}>💰 {salary}</div>}
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {job.requiredSkills.slice(0, 3).map(t => (
                      <span key={t} style={{ fontSize: 11, background: "#f1f5f9", color: gray600, padding: "3px 8px", borderRadius: 50 }}>{t}</span>
                    ))}
                  </div>
                </button>
              )
            })}
            {filtered.length === 0 && (
              <div style={{ padding: "24px 12px", textAlign: "center", color: gray600, fontSize: 13 }}>
                No open roles match your search right now.
              </div>
            )}
          </div>
        </div>

        {/* Job detail */}
        <div style={{ overflowY: "auto", padding: "28px" }} className="hidden lg:block lg:col-span-3">
          {selected ? (
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: gray900, margin: "0 0 4px" }}>{selected.title}</h2>
              <div style={{ fontSize: 16, color: gray600, marginBottom: 16 }}>{selected.company.name}</div>

              <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
                {[
                  selected.location ? `📍 ${selected.location}` : selected.remote ? "📍 Remote" : "",
                  selected.employmentType ? `⏰ ${EMPLOYMENT_LABELS[selected.employmentType] || selected.employmentType}` : "",
                  formatSalary(selected) ? `💰 ${formatSalary(selected)}` : "",
                ].filter(Boolean).map(item => (
                  <span key={item} style={{ fontSize: 13, color: gray600, display: "flex", alignItems: "center", gap: 4 }}>{item}</span>
                ))}
              </div>

              <div style={{ display: "flex", gap: 10, marginBottom: 28 }}>
                <Link href={`/job-board/${selected.id}`} style={{
                  flex: 1, background: purple, color: white, border: "none", borderRadius: 10, padding: "13px",
                  fontWeight: 700, fontSize: 15, cursor: "pointer", textAlign: "center", textDecoration: "none", display: "block",
                }}>
                  View & Apply →
                </Link>
                <button onClick={() => toggleSave(selected.id)} style={{ padding: "13px 16px", border: "1px solid #e2e8f0", borderRadius: 10, background: white, cursor: "pointer", fontSize: 18 }}>
                  {saved.includes(selected.id) ? "🔖" : "🗒️"}
                </button>
              </div>

              {selected.requiredSkills.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: gray900, marginBottom: 10 }}>Required Skills</h3>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {selected.requiredSkills.map(t => (
                      <span key={t} style={{ background: "#ede9fe", color: purple, padding: "6px 14px", borderRadius: 50, fontSize: 13, fontWeight: 600 }}>{t}</span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: gray900, marginBottom: 10 }}>About the Role</h3>
                <p style={{ fontSize: 14, color: gray600, lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap" }}>{selected.description}</p>
              </div>

              <div style={{ marginTop: 24, padding: "16px 20px", background: "#ede9fe", borderRadius: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: purple, marginBottom: 4 }}>💡 Pro Tip</div>
                <p style={{ fontSize: 13, color: gray600, margin: 0 }}>
                  Optimise your CV for this role with our ATS Scanner for a better chance of success.
                </p>
                <Link href="/cv" style={{ display: "inline-block", marginTop: 10, fontSize: 13, fontWeight: 600, color: purple, textDecoration: "none" }}>Scan my CV →</Link>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: gray600 }}>
              {jobs.length === 0 ? "No open roles right now — check back soon." : "Select a job to view details"}
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  )
}
