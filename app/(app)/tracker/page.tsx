"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
const purple = "#7c5cfc"
const gray900 = "#0f172a"
const gray600 = "#64748b"
const white = "#ffffff"

interface Application {
  id: string
  company: string
  jobTitle: string
  status: string
  appliedDate?: string
  notes?: string
  nextAction?: string
}

const COLUMNS = [
  { id: "saved", label: "Saved", icon: "🔖", color: "#f1f5f9", accent: gray600 },
  { id: "applied", label: "Applied", icon: "📤", color: "#dbeafe", accent: "#2563eb" },
  { id: "screening", label: "Screening", icon: "📞", color: "#fef3c7", accent: "#d97706" },
  { id: "interview", label: "Interview", icon: "🎤", color: "#ede9fe", accent: purple },
  { id: "offer", label: "Offer", icon: "🏆", color: "#dcfce7", accent: "#16a34a" },
  { id: "rejected", label: "Rejected", icon: "❌", color: "#fee2e2", accent: "#dc2626" },
]

const DEMO_APPS: Application[] = [
  { id: "1", company: "Innovate Studio", jobTitle: "UI/UX Designer", status: "interview", appliedDate: "2025-04-20", notes: "3rd round interview scheduled", nextAction: "Prepare portfolio" },
  { id: "2", company: "TechNova", jobTitle: "Product Designer", status: "screening", appliedDate: "2025-04-22", notes: "HR call went well", nextAction: "Technical interview" },
  { id: "3", company: "Creatix Labs", jobTitle: "Visual Designer", status: "applied", appliedDate: "2025-04-25" },
  { id: "4", company: "BuildFast", jobTitle: "Frontend Dev", status: "offer", appliedDate: "2025-04-15", notes: "Offer received: €60k", nextAction: "Negotiate salary" },
  { id: "5", company: "GrowthLab", jobTitle: "Marketing Manager", status: "rejected", appliedDate: "2025-04-10", notes: "Not a good fit" },
  { id: "6", company: "ScaleUp", jobTitle: "Product Manager", status: "saved" },
]

export default function TrackerPage() {
  const { status } = useSession()
  const router = useRouter()
  const [apps, setApps] = useState<Application[]>(DEMO_APPS)
  const [dragId, setDragId] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState<string | null>(null)
  const [selected, setSelected] = useState<Application | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newApp, setNewApp] = useState({ company: "", jobTitle: "", status: "saved" })

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
  }, [status, router])

  useEffect(() => {
    if (status !== "authenticated") return
    fetch("/api/applications").then(r => r.ok ? r.json() : null).then(data => { if (data?.length) setApps(data) }).catch(() => {})
  }, [status])

  const byStatus = (colId: string) => apps.filter(a => a.status === colId)

  const moveApp = (id: string, newStatus: string) =>
    setApps(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a))

  const addApp = () => {
    if (!newApp.company || !newApp.jobTitle) return
    setApps(prev => [...prev, { ...newApp, id: Date.now().toString() }])
    setNewApp({ company: "", jobTitle: "", status: "saved" })
    setShowAdd(false)
  }

  const totalActive = apps.filter(a => !["saved", "rejected"].includes(a.status)).length

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fe", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ background: white, borderBottom: "1px solid #f0f0f0", padding: "24px 28px", flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: gray900, margin: "0 0 4px", letterSpacing: "-0.03em" }}>Application Tracker</h1>
            <p style={{ fontSize: 14, color: gray600, margin: 0 }}>Drag cards to update their status. {totalActive} active application{totalActive !== 1 ? "s" : ""}.</p>
          </div>
          <button onClick={() => setShowAdd(true)} style={{ background: purple, color: white, border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
            + Add Application
          </button>
        </div>

        {/* Summary row */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {COLUMNS.map(col => {
            const count = byStatus(col.id).length
            return count > 0 ? (
              <div key={col.id} style={{ background: col.color, borderRadius: 8, padding: "6px 12px", display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 13 }}>{col.icon}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: col.accent }}>{count}</span>
                <span style={{ fontSize: 12, color: gray600 }}>{col.label}</span>
              </div>
            ) : null
          })}
        </div>
      </div>

      {/* Kanban board */}
      <div style={{ flex: 1, overflowX: "auto", padding: "24px 20px" }}>
        <div style={{ display: "flex", gap: 16, minWidth: "max-content", height: "100%" }}>
          {COLUMNS.map(col => (
            <div
              key={col.id}
              style={{ width: 240, flexShrink: 0 }}
              onDragOver={e => { e.preventDefault(); setDragOver(col.id); }}
              onDrop={e => { e.preventDefault(); if (dragId) { moveApp(dragId, col.id); setDragId(null); setDragOver(null); } }}
              onDragLeave={() => setDragOver(null)}
            >
              {/* Column header */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, padding: "0 4px" }}>
                <span style={{ fontSize: 16 }}>{col.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: gray900 }}>{col.label}</span>
                <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, color: col.accent, background: col.color, padding: "2px 8px", borderRadius: 50 }}>
                  {byStatus(col.id).length}
                </span>
              </div>

              {/* Drop zone */}
              <div style={{
                minHeight: 400, borderRadius: 14,
                background: dragOver === col.id ? col.color : "transparent",
                border: dragOver === col.id ? `2px dashed ${col.accent}` : "2px dashed transparent",
                padding: 4, transition: "all 0.15s",
              }}>
                {byStatus(col.id).map(app => (
                  <div
                    key={app.id}
                    draggable
                    onDragStart={() => setDragId(app.id)}
                    onDragEnd={() => { setDragId(null); setDragOver(null); }}
                    onClick={() => setSelected(app)}
                    style={{
                      background: white, borderRadius: 12, padding: "14px 16px", marginBottom: 8,
                      boxShadow: dragId === app.id ? "0 8px 24px rgba(0,0,0,0.15)" : "0 1px 4px rgba(0,0,0,0.06)",
                      border: "1px solid #f0f0f0", cursor: "grab", transition: "all 0.15s",
                      opacity: dragId === app.id ? 0.5 : 1,
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 700, color: gray900, marginBottom: 4 }}>{app.jobTitle}</div>
                    <div style={{ fontSize: 12, color: gray600, marginBottom: 8 }}>{app.company}</div>
                    {app.appliedDate && (
                      <div style={{ fontSize: 11, color: gray600 }}>
                        Applied {new Date(app.appliedDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </div>
                    )}
                    {app.nextAction && (
                      <div style={{ marginTop: 8, fontSize: 11, color: col.accent, fontWeight: 600, background: col.color, padding: "4px 8px", borderRadius: 6 }}>
                        → {app.nextAction}
                      </div>
                    )}
                  </div>
                ))}

                {byStatus(col.id).length === 0 && (
                  <div style={{ padding: "20px 12px", textAlign: "center", color: gray600, fontSize: 12 }}>
                    Drop here
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Application modal */}
      {showAdd && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={() => setShowAdd(false)}>
          <div style={{ background: white, borderRadius: 20, padding: "32px", width: "100%", maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: gray900, margin: "0 0 24px" }}>Add Application</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                { key: "company", label: "Company", placeholder: "e.g. Innovate Studio" },
                { key: "jobTitle", label: "Job Title", placeholder: "e.g. UI/UX Designer" },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: gray900, display: "block", marginBottom: 6 }}>{f.label}</label>
                  <input
                    style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box" as const }}
                    placeholder={f.placeholder}
                    value={(newApp as Record<string, string>)[f.key]}
                    onChange={e => setNewApp(p => ({ ...p, [f.key]: e.target.value }))}
                  />
                </div>
              ))}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: gray900, display: "block", marginBottom: 6 }}>Status</label>
                <select style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 14, outline: "none" }}
                  value={newApp.status} onChange={e => setNewApp(p => ({ ...p, status: e.target.value }))}>
                  {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
              <button onClick={() => setShowAdd(false)} style={{ flex: 1, background: "#f1f5f9", color: gray900, border: "none", borderRadius: 10, padding: "12px", fontWeight: 600, cursor: "pointer" }}>Cancel</button>
              <button onClick={addApp} style={{ flex: 1, background: purple, color: white, border: "none", borderRadius: 10, padding: "12px", fontWeight: 700, cursor: "pointer" }}>Add</button>
            </div>
          </div>
        </div>
      )}

      {/* App detail panel */}
      {selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "flex-end" }} onClick={() => setSelected(null)}>
          <div style={{ background: white, height: "100%", width: "100%", maxWidth: 380, padding: "32px 28px", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: gray900, margin: 0 }}>Details</h2>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: gray600 }}>×</button>
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: gray900, marginBottom: 4 }}>{selected.jobTitle}</div>
              <div style={{ fontSize: 15, color: gray600 }}>{selected.company}</div>
            </div>
            {selected.appliedDate && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: gray600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Applied</div>
                <div style={{ fontSize: 14, color: gray900 }}>{new Date(selected.appliedDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</div>
              </div>
            )}
            {selected.notes && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: gray600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Notes</div>
                <div style={{ fontSize: 14, color: gray900, lineHeight: 1.6 }}>{selected.notes}</div>
              </div>
            )}
            {selected.nextAction && (
              <div style={{ background: "#ede9fe", borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: purple, marginBottom: 4 }}>Next Action</div>
                <div style={{ fontSize: 14, color: gray900 }}>{selected.nextAction}</div>
              </div>
            )}
            <div style={{ marginTop: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: gray600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Move to</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {COLUMNS.map(col => (
                  <button key={col.id} onClick={() => { moveApp(selected.id, col.id); setSelected({ ...selected, status: col.id }); }}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, border: "none", cursor: "pointer", background: selected.status === col.id ? col.color : "#f8f9fe", fontWeight: selected.status === col.id ? 700 : 500, color: selected.status === col.id ? col.accent : gray900, fontSize: 13 }}>
                    <span>{col.icon}</span> {col.label}
                    {selected.status === col.id && <span style={{ marginLeft: "auto", fontSize: 11 }}>← current</span>}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
