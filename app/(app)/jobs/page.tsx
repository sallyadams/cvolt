"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

const purple = "#7c5cfc"
const navy = "#0a0e27"
const gray900 = "#0f172a"
const gray600 = "#64748b"
const white = "#ffffff"

interface Job {
  id: string
  title: string
  company: string
  location: string
  type: string
  salary?: string
  tags: string[]
  matchScore: number
  posted: string
  description: string
}

// Demo jobs — replace with real API when available
const DEMO_JOBS: Job[] = [
  { id: "1", title: "UI/UX Designer", company: "Innovate Studio", location: "Lagos, Nigeria", type: "Full-time", salary: "₦400k–₦600k/mo", tags: ["Figma", "UI Design", "Research"], matchScore: 92, posted: "2 days ago", description: "We're looking for a talented UI/UX Designer to create amazing user experiences." },
  { id: "2", title: "Product Designer", company: "TechNova", location: "Remote", type: "Full-time", salary: "₦350k–₦500k/mo", tags: ["Product Design", "Prototyping", "User Research"], matchScore: 87, posted: "1 day ago", description: "Join our design team to shape the future of our product suite." },
  { id: "3", title: "Visual Designer", company: "Creatix Labs", location: "Abuja, Nigeria", type: "Contract", salary: "₦250k–₦400k/mo", tags: ["Adobe CC", "Brand Design", "Motion"], matchScore: 79, posted: "3 days ago", description: "Help us build a compelling visual identity across all our touchpoints." },
  { id: "4", title: "Frontend Developer", company: "BuildFast", location: "Remote", type: "Full-time", salary: "$60k–$90k/yr", tags: ["React", "TypeScript", "Next.js"], matchScore: 74, posted: "5 days ago", description: "Build performant, accessible web applications for our growing platform." },
  { id: "5", title: "Product Manager", company: "ScaleUp", location: "Lagos, Nigeria", type: "Full-time", salary: "₦500k–₦800k/mo", tags: ["Roadmapping", "Agile", "Data Analysis"], matchScore: 68, posted: "1 week ago", description: "Drive product strategy and execution for our flagship product." },
  { id: "6", title: "Digital Marketing Manager", company: "GrowthLab", location: "Remote", type: "Part-time", salary: "₦200k–₦350k/mo", tags: ["SEO", "Content", "Analytics"], matchScore: 61, posted: "4 days ago", description: "Lead our digital marketing efforts across all channels." },
]

const TYPES = ["All", "Full-time", "Part-time", "Contract", "Remote"]

function MatchBar({ score }: { score: number }) {
  const color = score >= 80 ? "#16a34a" : score >= 60 ? "#d97706" : "#ef4444"
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: "#f1f5f9", borderRadius: 50, overflow: "hidden" }}>
        <div style={{ width: `${score}%`, height: "100%", background: color, borderRadius: 50 }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color, minWidth: 32 }}>{score}%</span>
    </div>
  )
}

export default function JobsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("All")
  const [selected, setSelected] = useState<Job | null>(DEMO_JOBS[0])
  const [saved, setSaved] = useState<string[]>([])

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
  }, [status, router])

  const filtered = DEMO_JOBS.filter(j => {
    const q = search.toLowerCase()
    const matchesSearch = !q || j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q) || j.tags.some(t => t.toLowerCase().includes(q))
    const matchesType = typeFilter === "All" || j.type === typeFilter || (typeFilter === "Remote" && j.location === "Remote")
    return matchesSearch && matchesType
  })

  const toggleSave = (id: string) =>
    setSaved(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fe" }}>
      {/* Header */}
      <div style={{ background: white, borderBottom: "1px solid #f0f0f0", padding: "24px 28px" }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: gray900, margin: "0 0 4px", letterSpacing: "-0.03em" }}>Job Match</h1>
        <p style={{ fontSize: 14, color: gray600, margin: "0 0 20px" }}>Jobs matched to your CV and skills. Updated daily.</p>

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
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", height: "calc(100vh - 180px)" }} className="grid grid-cols-1 lg:grid-cols-5">
        {/* Job list */}
        <div style={{ overflowY: "auto", borderRight: "1px solid #f0f0f0", background: white }} className="lg:col-span-2">
          <div style={{ padding: "12px" }}>
            <div style={{ padding: "8px 12px", fontSize: 12, color: gray600, fontWeight: 600, marginBottom: 4 }}>
              {filtered.length} jobs found
            </div>
            {filtered.map(job => (
              <button key={job.id} onClick={() => setSelected(job)} style={{
                display: "block", width: "100%", textAlign: "left", border: "none", cursor: "pointer",
                padding: "16px", borderRadius: 12, marginBottom: 6,
                background: selected?.id === job.id ? "#ede9fe" : "#f8f9fe",
                transition: "all 0.15s",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: gray900 }}>{job.title}</div>
                    <div style={{ fontSize: 12, color: gray600 }}>{job.company} · {job.location}</div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); toggleSave(job.id); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, flexShrink: 0 }}>
                    {saved.includes(job.id) ? "🔖" : "🗒️"}
                  </button>
                </div>
                <MatchBar score={job.matchScore} />
                <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                  {job.tags.slice(0, 3).map(t => (
                    <span key={t} style={{ fontSize: 11, background: "#f1f5f9", color: gray600, padding: "3px 8px", borderRadius: 50 }}>{t}</span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Job detail */}
        <div style={{ overflowY: "auto", padding: "28px" }} className="hidden lg:block lg:col-span-3">
          {selected ? (
            <div>
              {/* Match score */}
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
                <div style={{
                  width: 64, height: 64, borderRadius: "50%",
                  background: selected.matchScore >= 80 ? "#dcfce7" : selected.matchScore >= 60 ? "#fef3c7" : "#fee2e2",
                  border: `3px solid ${selected.matchScore >= 80 ? "#16a34a" : selected.matchScore >= 60 ? "#d97706" : "#ef4444"}`,
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{ fontSize: 18, fontWeight: 900, color: selected.matchScore >= 80 ? "#16a34a" : selected.matchScore >= 60 ? "#d97706" : "#ef4444" }}>{selected.matchScore}%</span>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: gray600, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Match Score</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: gray900 }}>
                    {selected.matchScore >= 80 ? "Excellent match" : selected.matchScore >= 60 ? "Good match" : "Partial match"}
                  </div>
                </div>
              </div>

              <h2 style={{ fontSize: 24, fontWeight: 800, color: gray900, margin: "0 0 4px" }}>{selected.title}</h2>
              <div style={{ fontSize: 16, color: gray600, marginBottom: 16 }}>{selected.company}</div>

              <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
                {[`📍 ${selected.location}`, `⏰ ${selected.type}`, selected.salary ? `💰 ${selected.salary}` : "", `🕐 ${selected.posted}`].filter(Boolean).map(item => (
                  <span key={item} style={{ fontSize: 13, color: gray600, display: "flex", alignItems: "center", gap: 4 }}>{item}</span>
                ))}
              </div>

              <div style={{ display: "flex", gap: 10, marginBottom: 28 }}>
                <button style={{ flex: 1, background: purple, color: white, border: "none", borderRadius: 10, padding: "13px", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
                  Apply Now ⚡
                </button>
                <button onClick={() => toggleSave(selected.id)} style={{ padding: "13px 16px", border: "1px solid #e2e8f0", borderRadius: 10, background: white, cursor: "pointer", fontSize: 18 }}>
                  {saved.includes(selected.id) ? "🔖" : "🗒️"}
                </button>
              </div>

              <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: gray900, marginBottom: 10 }}>Required Skills</h3>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {selected.tags.map(t => (
                    <span key={t} style={{ background: "#ede9fe", color: purple, padding: "6px 14px", borderRadius: 50, fontSize: 13, fontWeight: 600 }}>{t}</span>
                  ))}
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: gray900, marginBottom: 10 }}>About the Role</h3>
                <p style={{ fontSize: 14, color: gray600, lineHeight: 1.7, margin: 0 }}>{selected.description}</p>
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
              Select a job to view details
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
