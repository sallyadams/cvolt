"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

const purple = "#7c5cfc"
const navy = "#0a0e27"
const gray900 = "#0f172a"
const gray600 = "#64748b"
const white = "#ffffff"

interface ProfileData {
  fullName: string
  jobTitle: string
  location: string
  phone: string
  linkedin: string
  website: string
  summary: string
  skills: string[]
  experience: Array<{ title: string; company: string; dates: string; desc: string }>
  education: Array<{ degree: string; institution: string; dates: string }>
}

const EMPTY_PROFILE: ProfileData = {
  fullName: "", jobTitle: "", location: "", phone: "",
  linkedin: "", website: "", summary: "", skills: [],
  experience: [{ title: "", company: "", dates: "", desc: "" }],
  education: [{ degree: "", institution: "", dates: "" }],
}

const STEPS = ["Personal Info", "Professional Summary", "Experience", "Education", "Skills", "Review"]

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [profile, setProfile] = useState<ProfileData>(EMPTY_PROFILE)
  const [skillInput, setSkillInput] = useState("")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const completedSteps = [
    !!(profile.fullName && profile.jobTitle),
    !!profile.summary,
    profile.experience.some(e => e.title && e.company),
    profile.education.some(e => e.degree && e.institution),
    profile.skills.length > 0,
  ]
  const overallPct = Math.round((completedSteps.filter(Boolean).length / completedSteps.length) * 100)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
  }, [status, router])

  const update = (key: keyof ProfileData, value: unknown) =>
    setProfile(p => ({ ...p, [key]: value }))

  const addSkill = () => {
    const s = skillInput.trim()
    if (s && !profile.skills.includes(s)) {
      update("skills", [...profile.skills, s])
      setSkillInput("")
    }
  }

  const removeSkill = (s: string) => update("skills", profile.skills.filter(x => x !== s))

  const updateExp = (i: number, key: string, val: string) =>
    update("experience", profile.experience.map((e, idx) => idx === i ? { ...e, [key]: val } : e))

  const updateEdu = (i: number, key: string, val: string) =>
    update("education", profile.education.map((e, idx) => idx === i ? { ...e, [key]: val } : e))

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch("/api/profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(profile) })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch { /* silent */ } finally {
      setSaving(false)
    }
  }

  const inputStyle = {
    width: "100%", padding: "11px 14px", borderRadius: 10, fontSize: 14,
    border: "1px solid #e2e8f0", outline: "none", background: white,
    boxSizing: "border-box" as const, color: gray900,
    transition: "border-color 0.15s",
  }
  const labelStyle = { fontSize: 13, fontWeight: 600, color: gray900, display: "block", marginBottom: 6 }

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fe", padding: "32px 24px" }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: gray900, margin: "0 0 4px", letterSpacing: "-0.03em" }}>Your Profile</h1>
          <p style={{ color: gray600, fontSize: 15, margin: 0 }}>Build a strong profile to power your job applications.</p>
        </div>

        {/* Profile strength bar */}
        <div style={{ background: white, borderRadius: 16, padding: "20px 24px", marginBottom: 28, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #f0f0f0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: gray900 }}>Profile Strength</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: purple }}>{overallPct}%</span>
          </div>
          <div style={{ height: 8, background: "#f1f5f9", borderRadius: 50, overflow: "hidden" }}>
            <div style={{ width: `${overallPct}%`, height: "100%", background: overallPct >= 80 ? "#16a34a" : purple, borderRadius: 50, transition: "width 0.5s" }} />
          </div>
          <p style={{ fontSize: 12, color: gray600, margin: "8px 0 0" }}>
            {overallPct < 40 ? "Fill in the sections below to get started." : overallPct < 80 ? "Good progress! Add more details to stand out." : "Great profile! You're ready to apply."}
          </p>
        </div>

        <div style={{ display: "grid", gap: 24 }} className="grid grid-cols-1 lg:grid-cols-4">

          {/* Step nav */}
          <div style={{ background: white, borderRadius: 16, padding: "20px 16px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #f0f0f0", height: "fit-content" }}>
            {STEPS.map((s, i) => (
              <button key={s} onClick={() => setStep(i)} style={{
                display: "flex", alignItems: "center", gap: 12, width: "100%",
                padding: "10px 12px", borderRadius: 10, border: "none", cursor: "pointer",
                background: step === i ? "#ede9fe" : "transparent",
                marginBottom: 4, textAlign: "left",
                transition: "all 0.15s",
              }}>
                <div style={{
                  width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                  background: completedSteps[i] ? "#16a34a" : step === i ? purple : "#e2e8f0",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, color: white, fontWeight: 700,
                }}>
                  {completedSteps[i] ? "✓" : i + 1}
                </div>
                <span style={{ fontSize: 13, fontWeight: step === i ? 700 : 500, color: step === i ? purple : gray900 }}>{s}</span>
              </button>
            ))}
          </div>

          {/* Form */}
          <div style={{ gridColumn: "span 3" }}>
            <div style={{ background: white, borderRadius: 16, padding: "32px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid #f0f0f0" }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: gray900, margin: "0 0 24px" }}>{STEPS[step]}</h2>

              {/* Step 0: Personal Info */}
              {step === 0 && (
                <div style={{ display: "grid", gap: 18 }} className="grid grid-cols-1 sm:grid-cols-2">
                  {([
                    { key: "fullName", label: "Full Name", placeholder: "Alex Johnson" },
                    { key: "jobTitle", label: "Job Title", placeholder: "Product Designer" },
                    { key: "location", label: "Location", placeholder: "Lagos, Nigeria" },
                    { key: "phone", label: "Phone", placeholder: "+234 800 000 0000" },
                    { key: "linkedin", label: "LinkedIn URL", placeholder: "linkedin.com/in/alexjohnson" },
                    { key: "website", label: "Website / Portfolio", placeholder: "alexjohnson.dev" },
                  ] as Array<{ key: keyof ProfileData; label: string; placeholder: string }>).map(f => (
                    <div key={f.key}>
                      <label style={labelStyle}>{f.label}</label>
                      <input
                        style={inputStyle} placeholder={f.placeholder}
                        value={profile[f.key] as string}
                        onChange={e => update(f.key, e.target.value)}
                        onFocus={e => { e.target.style.borderColor = purple; e.target.style.boxShadow = `0 0 0 3px rgba(124,92,252,0.1)`; }}
                        onBlur={e => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; }}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Step 1: Summary */}
              {step === 1 && (
                <div>
                  <label style={labelStyle}>Professional Summary</label>
                  <textarea
                    rows={6} style={{ ...inputStyle, resize: "vertical" as const }}
                    placeholder="A results-driven Product Designer with 5+ years of experience creating user-centered digital experiences..."
                    value={profile.summary}
                    onChange={e => update("summary", e.target.value)}
                    onFocus={e => { e.target.style.borderColor = purple; e.target.style.boxShadow = `0 0 0 3px rgba(124,92,252,0.1)`; }}
                    onBlur={e => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; }}
                  />
                  <p style={{ fontSize: 12, color: gray600, marginTop: 8 }}>Aim for 3–5 sentences. Focus on your key strengths and career goals.</p>
                </div>
              )}

              {/* Step 2: Experience */}
              {step === 2 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                  {profile.experience.map((exp, i) => (
                    <div key={i} style={{ padding: "20px", background: "#f8f9fe", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: gray900 }}>Experience {i + 1}</span>
                        {profile.experience.length > 1 && (
                          <button onClick={() => update("experience", profile.experience.filter((_, idx) => idx !== i))}
                            style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 12 }}>Remove</button>
                        )}
                      </div>
                      <div style={{ display: "grid", gap: 14 }} className="grid grid-cols-1 sm:grid-cols-2">
                        {[
                          { key: "title", label: "Job Title", placeholder: "Product Designer" },
                          { key: "company", label: "Company", placeholder: "Innovate Studio" },
                          { key: "dates", label: "Dates", placeholder: "Jan 2022 – Present" },
                        ].map(f => (
                          <div key={f.key}>
                            <label style={labelStyle}>{f.label}</label>
                            <input style={inputStyle} placeholder={f.placeholder} value={(exp as Record<string, string>)[f.key]}
                              onChange={e => updateExp(i, f.key, e.target.value)} />
                          </div>
                        ))}
                        <div style={{ gridColumn: "span 2" }}>
                          <label style={labelStyle}>Description</label>
                          <textarea rows={3} style={{ ...inputStyle, resize: "vertical" as const }} placeholder="• Led the redesign of the main product dashboard..." value={exp.desc}
                            onChange={e => updateExp(i, "desc", e.target.value)} />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => update("experience", [...profile.experience, { title: "", company: "", dates: "", desc: "" }])}
                    style={{ background: "#ede9fe", color: purple, border: "none", borderRadius: 10, padding: "12px", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                    + Add Experience
                  </button>
                </div>
              )}

              {/* Step 3: Education */}
              {step === 3 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {profile.education.map((edu, i) => (
                    <div key={i} style={{ padding: "20px", background: "#f8f9fe", borderRadius: 12, border: "1px solid #e2e8f0" }}>
                      <div style={{ display: "grid", gap: 14 }} className="grid grid-cols-1 sm:grid-cols-3">
                        {[
                          { key: "degree", label: "Degree / Qualification", placeholder: "BSc Computer Science" },
                          { key: "institution", label: "Institution", placeholder: "University of Lagos" },
                          { key: "dates", label: "Dates", placeholder: "2018 – 2022" },
                        ].map(f => (
                          <div key={f.key}>
                            <label style={labelStyle}>{f.label}</label>
                            <input style={inputStyle} placeholder={f.placeholder} value={(edu as Record<string, string>)[f.key]}
                              onChange={e => updateEdu(i, f.key, e.target.value)} />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  <button onClick={() => update("education", [...profile.education, { degree: "", institution: "", dates: "" }])}
                    style={{ background: "#ede9fe", color: purple, border: "none", borderRadius: 10, padding: "12px", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                    + Add Education
                  </button>
                </div>
              )}

              {/* Step 4: Skills */}
              {step === 4 && (
                <div>
                  <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                    <input style={{ ...inputStyle, flex: 1 }} placeholder="e.g. UI/UX Design, Figma, React..." value={skillInput}
                      onChange={e => setSkillInput(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addSkill())} />
                    <button onClick={addSkill} style={{ background: purple, color: white, border: "none", borderRadius: 10, padding: "0 20px", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>Add</button>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                    {profile.skills.map(s => (
                      <span key={s} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#ede9fe", color: purple, padding: "7px 14px", borderRadius: 50, fontSize: 13, fontWeight: 600 }}>
                        {s}
                        <button onClick={() => removeSkill(s)} style={{ background: "none", border: "none", cursor: "pointer", color: purple, fontSize: 16, lineHeight: 1, padding: 0 }}>×</button>
                      </span>
                    ))}
                    {profile.skills.length === 0 && <p style={{ color: gray600, fontSize: 14 }}>Add your key skills above (press Enter or click Add).</p>}
                  </div>
                </div>
              )}

              {/* Step 5: Review */}
              {step === 5 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {STEPS.slice(0, 5).map((s, i) => (
                    <div key={s} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderRadius: 12, background: completedSteps[i] ? "#f0fdf4" : "#fef9c3", border: `1px solid ${completedSteps[i] ? "#bbf7d0" : "#fde68a"}` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ fontSize: 18 }}>{completedSteps[i] ? "✅" : "⚠️"}</span>
                        <span style={{ fontSize: 14, fontWeight: 600, color: gray900 }}>{s}</span>
                      </div>
                      <button onClick={() => setStep(i)} style={{ background: "none", border: "none", color: purple, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                        {completedSteps[i] ? "Edit" : "Complete →"}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Navigation */}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 28 }}>
                <button onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}
                  style={{ background: "#f1f5f9", color: gray600, border: "none", borderRadius: 10, padding: "12px 24px", fontWeight: 600, fontSize: 14, cursor: step === 0 ? "not-allowed" : "pointer", opacity: step === 0 ? 0.5 : 1 }}>
                  ← Back
                </button>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={handleSave} disabled={saving}
                    style={{ background: "#f1f5f9", color: gray900, border: "none", borderRadius: 10, padding: "12px 20px", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                    {saved ? "✓ Saved" : saving ? "Saving..." : "Save"}
                  </button>
                  {step < STEPS.length - 1 && (
                    <button onClick={() => setStep(Math.min(STEPS.length - 1, step + 1))}
                      style={{ background: purple, color: white, border: "none", borderRadius: 10, padding: "12px 24px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                      Next →
                    </button>
                  )}
                  {step === STEPS.length - 1 && (
                    <button onClick={() => { handleSave(); router.push("/cv"); }}
                      style={{ background: purple, color: white, border: "none", borderRadius: 10, padding: "12px 24px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                      Save & Continue →
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
