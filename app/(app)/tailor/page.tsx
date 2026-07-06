'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CVDocument { id: string; title: string | null }
interface JobDescription { id: string; title: string | null; company: string | null }

interface ExperienceEntry {
  title: string
  company: string
  dates: string
  bullets_original: string[]
  bullets_tailored: string[]
}

interface TailorResult {
  docId: string
  cvTitle: string
  jobTitle: string
  companyName: string
  ats_score_before: number
  ats_score_after: number
  professional_summary: { original: string; tailored: string }
  experience: ExperienceEntry[]
  skills: { original: string[]; tailored: string[]; added: string[]; deprioritized: string[] }
  missing_keywords: string[]
  incorporated_keywords: string[]
  recruiter_feedback: string
  top_changes: string[]
}

interface HistoryItem {
  id: string
  createdAt: string
  jobTitle: string
  companyName: string
  cvTitle: string
  ats_score_before: number
  ats_score_after: number
  result: TailorResult & { docId?: string }
}

// ─── Download helpers ─────────────────────────────────────────────────────────

function escapeRTF(text: string): string {
  return (text ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/[^\x00-\x7F]/g, (c) => `\\u${c.charCodeAt(0)}?`)
}

function generateRTF(r: TailorResult): string {
  const lines: string[] = [
    '{\\rtf1\\ansi\\deff0',
    '{\\fonttbl{\\f0 Calibri;}}',
    '{\\colortbl ;\\red26\\green26\\blue26;\\red100\\green100\\blue100;}',
    '\\f0\\fs24\\cf1',
    `{\\b\\fs32 ${escapeRTF(r.jobTitle)} — Tailored CV}\\line`,
    `{\\fs20\\cf2 ${escapeRTF(r.companyName)}}\\line\\line`,
  ]

  if (r.professional_summary?.tailored) {
    lines.push('{\\b\\fs26 PROFESSIONAL SUMMARY}\\line')
    lines.push(`${escapeRTF(r.professional_summary.tailored)}\\line\\line`)
  }

  if (r.experience?.length) {
    lines.push('{\\b\\fs26 EXPERIENCE}\\line')
    for (const exp of r.experience) {
      lines.push(`{\\b ${escapeRTF(exp.title)} \\emdash  ${escapeRTF(exp.company)}}\\line`)
      if (exp.dates) lines.push(`{\\cf2 ${escapeRTF(exp.dates)}}\\line`)
      for (const b of (exp.bullets_tailored ?? [])) {
        lines.push(`\\bullet  ${escapeRTF(b)}\\line`)
      }
      lines.push('\\line')
    }
  }

  if (r.skills?.tailored?.length) {
    lines.push('{\\b\\fs26 SKILLS}\\line')
    lines.push(`${r.skills.tailored.map(escapeRTF).join('  \\bullet  ')}\\line\\line`)
  }

  lines.push('}')
  return lines.join('\n')
}

function downloadBlob(content: string, mimeType: string, filename: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = Object.assign(document.createElement('a'), { href: url, download: filename })
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function generatePrintHTML(r: TailorResult): string {
  const expHtml = (r.experience ?? []).map(e => `
    <div class="exp">
      <div class="exp-head"><strong>${e.title}</strong> &mdash; ${e.company} <span class="dates">${e.dates ?? ''}</span></div>
      <ul>${(e.bullets_tailored ?? []).map(b => `<li>${b}</li>`).join('')}</ul>
    </div>`).join('')

  const skillsHtml = (r.skills?.tailored ?? []).map(s => `<span class="skill">${s}</span>`).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Tailored CV — ${r.jobTitle}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:Calibri,Arial,sans-serif;font-size:11pt;color:#1a1a1a;line-height:1.55;padding:25mm 20mm}
  h1{font-size:20pt;font-weight:700;margin-bottom:3px}
  .sub{color:#555;font-size:11pt;margin-bottom:18px}
  h2{font-size:12pt;font-weight:700;text-transform:uppercase;letter-spacing:.5px;border-bottom:1px solid #ccc;padding-bottom:3px;margin:16px 0 8px}
  p{margin-bottom:6px}
  .exp{margin-bottom:12px}
  .exp-head{margin-bottom:4px}
  .dates{color:#666;font-size:10pt;float:right}
  ul{margin-left:18px}
  li{margin-bottom:3px}
  .skills{display:flex;flex-wrap:wrap;gap:5px;margin-top:4px}
  .skill{background:#f0f0f0;padding:2px 9px;border-radius:4px;font-size:10pt}
  @media print{body{padding:15mm 12mm}}
</style>
</head>
<body>
  <h1>Tailored CV</h1>
  <p class="sub">${r.jobTitle} at ${r.companyName}</p>
  ${r.professional_summary?.tailored ? `<h2>Professional Summary</h2><p>${r.professional_summary.tailored}</p>` : ''}
  ${expHtml ? `<h2>Experience</h2>${expHtml}` : ''}
  ${skillsHtml ? `<h2>Skills</h2><div class="skills">${skillsHtml}</div>` : ''}
</body>
</html>`
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-gray-500">{label}</span>
        <span className="text-sm font-bold" style={{ color }}>{value}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${Math.min(value, 100)}%`, background: color }}
        />
      </div>
    </div>
  )
}

function Pill({ text, color }: { text: string; color: 'green' | 'blue' | 'red' | 'gray' | 'yellow' }) {
  const map = {
    green: 'bg-green-100 text-green-800',
    blue: 'bg-blue-100 text-blue-800',
    red: 'bg-red-100 text-red-700',
    gray: 'bg-gray-100 text-gray-700',
    yellow: 'bg-yellow-100 text-yellow-800',
  }
  return (
    <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${map[color]}`}>
      {text}
    </span>
  )
}

function SideBySide({ left, right, leftLabel = 'Before', rightLabel = 'After' }: {
  left: React.ReactNode
  right: React.ReactNode
  leftLabel?: string
  rightLabel?: string
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">{leftLabel}</p>
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-gray-500 leading-relaxed h-full">
          {left}
        </div>
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-green-600 mb-2">{rightLabel}</p>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-gray-800 leading-relaxed h-full">
          {right}
        </div>
      </div>
    </div>
  )
}

function Card({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
        <span className="text-lg">{icon}</span>
        <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ResumeTailorPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // Lists
  const [cvs, setCvs]   = useState<CVDocument[]>([])
  const [jobs, setJobs] = useState<JobDescription[]>([])
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)

  // Form
  const [selectedCvId, setSelectedCvId]             = useState('')
  const [selectedJobId, setSelectedJobId]             = useState('')
  const [jobDescriptionText, setJobDescriptionText]   = useState('')
  const [jobTitle, setJobTitle]                       = useState('')
  const [companyName, setCompanyName]                 = useState('')

  // URL import
  const [importUrl, setImportUrl]     = useState('')
  const [importing, setImporting]     = useState(false)
  const [importError, setImportError] = useState('')

  // AI run
  const [tailoring, setTailoring]       = useState(false)
  const [result, setResult]             = useState<TailorResult | null>(null)
  const [error, setError]               = useState('')
  const [upgradeRequired, setUpgradeRequired] = useState(false)

  // History panel
  const [showHistory, setShowHistory] = useState(false)

  // User tier
  const [userTier, setUserTier] = useState<string>('free')

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return }
    if (status === 'authenticated') {
      Promise.all([
        fetch('/api/cv').then(r => r.ok ? r.json() : []),
        fetch('/api/jobs').then(r => r.ok ? r.json() : []),
        fetch('/api/ai/resume-tailor/history').then(r => r.ok ? r.json() : []),
        fetch('/api/user').then(r => r.ok ? r.json() : {}),
      ])
        .then(([c, j, h, u]) => {
          setCvs(c)
          setJobs(j)
          setHistory(h)
          setUserTier((u as { subscriptionTier?: string })?.subscriptionTier ?? 'free')
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [status, router])

  const isPro = userTier === 'pro' || userTier === 'premium'

  const canTailor =
    selectedCvId &&
    (selectedJobId || jobDescriptionText.trim().length > 20) &&
    !tailoring

  // URL import
  const handleImportUrl = async () => {
    if (!importUrl.trim()) return
    setImporting(true); setImportError('')
    try {
      const res = await fetch('/api/jobs/import-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: importUrl.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setImportError("We couldn't import this job post. Please paste the description manually.")
        return
      }
      setJobDescriptionText(data.text)
      setSelectedJobId('')
      setImportUrl('')
    } catch {
      setImportError("We couldn't import this job post. Please paste the description manually.")
    } finally {
      setImporting(false)
    }
  }

  // Run AI tailoring
  const handleTailor = async () => {
    if (!canTailor) return
    setTailoring(true); setError(''); setResult(null); setUpgradeRequired(false)
    try {
      const body: Record<string, string> = { cvId: selectedCvId }
      if (selectedJobId) {
        body.jobId = selectedJobId
        const job = jobs.find(j => j.id === selectedJobId)
        if (job?.title) body.jobTitle = job.title
        if (job?.company) body.companyName = job.company
      } else {
        body.jobDescription = jobDescriptionText.trim()
      }
      if (jobTitle.trim()) body.jobTitle = jobTitle.trim()
      if (companyName.trim()) body.companyName = companyName.trim()

      const res = await fetch('/api/ai/resume-tailor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.upgrade_required) { setUpgradeRequired(true); return }
        setError(data.error || 'Failed to tailor CV. Please try again.')
        return
      }
      setResult(data as TailorResult)

      // Refresh history
      fetch('/api/ai/resume-tailor/history')
        .then(r => r.ok ? r.json() : [])
        .then(setHistory)
        .catch(() => {})
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setTailoring(false)
    }
  }

  // Restore a history item as the active result
  const handleViewHistory = (item: HistoryItem) => {
    const { docId: _d, cvTitle: _c, jobTitle: _j, companyName: _co, ...rest } = item.result as Partial<TailorResult>
    void _d; void _c; void _j; void _co
    const restored: TailorResult = {
      docId: item.id,
      cvTitle: item.cvTitle,
      jobTitle: item.jobTitle,
      companyName: item.companyName,
      ...rest,
    } as TailorResult
    setResult(restored)
    setShowHistory(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Downloads
  const handleDownloadPDF = () => {
    if (!result) return
    const html = generatePrintHTML(result)
    const win = window.open('', '_blank')
    if (!win) { alert('Please allow pop-ups to download the PDF.'); return }
    win.document.write(html)
    win.document.close()
    setTimeout(() => { win.focus(); win.print() }, 400)
  }

  const handleDownloadDocx = () => {
    if (!result) return
    const rtf = generateRTF(result)
    const slug = (result.jobTitle || 'role').toLowerCase().replace(/\s+/g, '-')
    downloadBlob(rtf, 'application/rtf', `cv-tailored-${slug}.rtf`)
  }

  // ── Render ──

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-gray-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading…</p>
        </div>
      </div>
    )
  }

  const gain = result ? result.ats_score_after - result.ats_score_before : 0
  const gainColor = gain >= 20 ? '#16a34a' : gain >= 10 ? '#d97706' : '#6366f1'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-7 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">AI Resume Tailoring</h1>
            <p className="mt-1.5 text-gray-500 text-sm">
              Optimise your CV for a specific role — ATS score, bullets, summary and skills all improved.
            </p>
          </div>
          {history.length > 0 && (
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="shrink-0 text-sm text-indigo-600 border border-indigo-200 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              {showHistory ? 'Hide' : 'View'} history ({history.length})
            </button>
          )}
        </div>

        {/* ── History panel ── */}
        {showHistory && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 mb-6">
            <h2 className="font-semibold text-gray-900 mb-4 text-sm">Previous Tailored CVs</h2>
            <div className="space-y-3">
              {history.map(item => (
                <div key={item.id} className="flex items-center justify-between gap-4 border border-gray-100 rounded-xl p-3">
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">
                      {item.jobTitle} at {item.companyName}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {item.cvTitle} · {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-gray-500">
                      {item.ats_score_before} → <span className="text-green-700 font-semibold">{item.ats_score_after}</span>
                    </span>
                    <button
                      onClick={() => handleViewHistory(item)}
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-medium border border-indigo-200 px-2.5 py-1 rounded-lg hover:bg-indigo-50 transition-colors"
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Input form ── */}
        {!result && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 mb-6">
            <h2 className="font-semibold text-gray-900 mb-5">Tailor Your CV for a Role</h2>

            <div className="space-y-4">
              {/* CV selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your CV</label>
                <select
                  value={selectedCvId}
                  onChange={e => setSelectedCvId(e.target.value)}
                  className="block w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 bg-white"
                >
                  <option value="">Select a CV…</option>
                  {cvs.map(cv => <option key={cv.id} value={cv.id}>{cv.title ?? 'Untitled CV'}</option>)}
                </select>
                {cvs.length === 0 && (
                  <p className="text-xs text-gray-400 mt-1">
                    No CVs uploaded yet. <Link href="/cv" className="text-indigo-600 hover:underline">Upload one first →</Link>
                  </p>
                )}
              </div>

              {/* Job title + company */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={e => setJobTitle(e.target.value)}
                    placeholder="e.g. Senior Product Manager"
                    className="block w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                    placeholder="e.g. Acme Corp"
                    className="block w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              {/* Saved job selector */}
              {jobs.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Saved job <span className="text-gray-400 font-normal">(or paste/import below)</span>
                  </label>
                  <select
                    value={selectedJobId}
                    onChange={e => { setSelectedJobId(e.target.value); if (e.target.value) setJobDescriptionText('') }}
                    disabled={!!jobDescriptionText.trim()}
                    className="block w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 bg-white disabled:opacity-50"
                  >
                    <option value="">Select a saved job…</option>
                    {jobs.map(j => <option key={j.id} value={j.id}>{j.title} at {j.company}</option>)}
                  </select>
                </div>
              )}

              {/* URL import */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Import from job URL <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={importUrl}
                    onChange={e => { setImportUrl(e.target.value); setImportError('') }}
                    placeholder="https://www.linkedin.com/jobs/view/…"
                    className="flex-1 rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <button
                    type="button"
                    onClick={handleImportUrl}
                    disabled={!importUrl.trim() || importing}
                    className="bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap transition-colors"
                  >
                    {importing ? 'Importing…' : 'Import'}
                  </button>
                </div>
                {importError && <p className="text-red-600 text-xs mt-1.5">{importError}</p>}
              </div>

              {/* Job description textarea */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {jobs.length ? 'Or paste job description' : 'Job description'}
                </label>
                <textarea
                  value={jobDescriptionText}
                  onChange={e => { setJobDescriptionText(e.target.value); if (e.target.value.trim()) setSelectedJobId('') }}
                  rows={6}
                  placeholder="Paste the full job description here — the more detail, the better the tailoring…"
                  className="block w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 resize-none"
                />
              </div>

              {/* Upgrade wall */}
              {upgradeRequired && (
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl p-5">
                  <p className="font-semibold text-indigo-900 mb-1">Pro feature</p>
                  <p className="text-sm text-indigo-700 mb-3">
                    AI Resume Tailoring is available on Pro and Premium plans. Get unlimited tailoring, PDF & DOCX downloads, and saved versions.
                  </p>
                  <Link
                    href="/upgrade"
                    className="inline-block bg-indigo-600 text-white text-sm font-semibold px-5 py-2 rounded-xl hover:bg-indigo-700 transition-colors"
                  >
                    Upgrade to Pro ⚡
                  </Link>
                </div>
              )}

              {/* Generic error */}
              {error && !upgradeRequired && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-xl">{error}</div>
              )}

              {/* Submit */}
              <button
                onClick={handleTailor}
                disabled={!canTailor}
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {tailoring ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Tailoring your CV… (~20 seconds)
                  </span>
                ) : 'Tailor My CV for This Role'}
              </button>
            </div>
          </div>
        )}

        {/* ── Loading / progress ── */}
        {tailoring && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-10 mb-6 text-center">
            <div className="w-12 h-12 border-3 border-gray-100 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" style={{ borderWidth: 3 }} />
            <p className="font-semibold text-gray-900 mb-1">Tailoring your CV…</p>
            <p className="text-sm text-gray-500">Comparing keywords · Improving bullets · Rewriting summary · Scoring ATS compatibility</p>
          </div>
        )}

        {/* ── Results ── */}
        {result && !tailoring && (
          <div className="space-y-5">

            {/* Result header + actions */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-medium mb-1">Tailored for</p>
                  <h2 className="text-lg font-bold text-gray-900">
                    {result.jobTitle}
                    {result.companyName !== '—' && <span className="font-normal text-gray-500"> at {result.companyName}</span>}
                  </h2>
                  <p className="text-sm text-gray-500 mt-0.5">Based on: {result.cvTitle}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {isPro ? (
                    <>
                      <button
                        onClick={handleDownloadPDF}
                        className="flex items-center gap-1.5 bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        Download PDF
                      </button>
                      <button
                        onClick={handleDownloadDocx}
                        className="flex items-center gap-1.5 bg-white border border-gray-300 text-gray-700 text-sm font-medium px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        Download DOCX
                      </button>
                    </>
                  ) : (
                    <Link
                      href="/upgrade"
                      className="flex items-center gap-1.5 border border-indigo-300 text-indigo-700 text-sm font-medium px-4 py-2 rounded-xl hover:bg-indigo-50 transition-colors"
                    >
                      ⚡ Upgrade for downloads
                    </Link>
                  )}
                  <button
                    onClick={() => { setResult(null); setError(''); setUpgradeRequired(false) }}
                    className="text-sm text-gray-500 border border-gray-200 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Tailor another
                  </button>
                </div>
              </div>
            </div>

            {/* ATS Score improvement */}
            <Card title="ATS Compatibility Score" icon="📊">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 items-center">
                <div className="space-y-2">
                  <ScoreBar label="Before tailoring" value={result.ats_score_before} color="#ef4444" />
                </div>
                <div className="text-center">
                  <div className="text-3xl font-black" style={{ color: gainColor }}>
                    +{gain}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">score improvement</p>
                </div>
                <div className="space-y-2">
                  <ScoreBar label="After tailoring" value={result.ats_score_after} color="#16a34a" />
                </div>
              </div>

              {result.top_changes?.length > 0 && (
                <div className="mt-5 pt-4 border-t border-gray-100">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Top changes made</p>
                  <ul className="space-y-1.5">
                    {result.top_changes.map((c, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-green-500 font-bold shrink-0 mt-0.5">✓</span>
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>

            {/* Professional summary */}
            {(result.professional_summary?.original || result.professional_summary?.tailored) && (
              <Card title="Professional Summary" icon="👤">
                <SideBySide
                  left={
                    result.professional_summary.original
                      ? <p className="line-through decoration-red-200">{result.professional_summary.original}</p>
                      : <p className="italic text-gray-400">No summary in original CV</p>
                  }
                  right={<p>{result.professional_summary.tailored}</p>}
                />
              </Card>
            )}

            {/* Experience bullets */}
            {result.experience?.length > 0 && (
              <Card title="Experience — Improved Bullets" icon="💼">
                <div className="space-y-6">
                  {result.experience.map((exp, i) => (
                    <div key={i}>
                      <div className="mb-3">
                        <p className="font-semibold text-gray-900 text-sm">{exp.title}</p>
                        {exp.company && (
                          <p className="text-xs text-gray-500">{exp.company}{exp.dates ? ` · ${exp.dates}` : ''}</p>
                        )}
                      </div>
                      <SideBySide
                        left={
                          <ul className="space-y-1.5">
                            {(exp.bullets_original ?? []).map((b, j) => (
                              <li key={j} className="line-through decoration-red-200">• {b}</li>
                            ))}
                            {!exp.bullets_original?.length && <li className="italic text-gray-400">No bullets in original</li>}
                          </ul>
                        }
                        right={
                          <ul className="space-y-1.5">
                            {(exp.bullets_tailored ?? []).map((b, j) => (
                              <li key={j} className="font-medium">• {b}</li>
                            ))}
                          </ul>
                        }
                      />
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Skills */}
            {(result.skills?.original?.length > 0 || result.skills?.tailored?.length > 0) && (
              <Card title="Skills — Reordered by Relevance" icon="🛠">
                <div className="space-y-4">
                  {result.skills?.original?.length > 0 && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Original order</p>
                      <div className="flex flex-wrap gap-2">
                        {result.skills.original.map((s, i) => <Pill key={i} text={s} color="gray" />)}
                      </div>
                    </div>
                  )}
                  {result.skills?.tailored?.length > 0 && (
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-green-600 mb-2">Optimised for this role</p>
                      <div className="flex flex-wrap gap-2">
                        {result.skills.tailored.map((s, i) => {
                          const isNew = result.skills.added?.includes(s)
                          return <Pill key={i} text={s} color={isNew ? 'green' : 'blue'} />
                        })}
                      </div>
                      {result.skills.added?.length > 0 && (
                        <p className="text-xs text-gray-400 mt-2">
                          <span className="inline-block bg-green-100 text-green-800 px-1.5 py-0.5 rounded text-xs mr-1">Green</span>
                          = newly emphasised
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Missing keywords */}
            {result.missing_keywords?.length > 0 && (
              <Card title="Missing Keywords" icon="🔑">
                <p className="text-sm text-gray-500 mb-3">
                  These keywords appear in the job description but could not be honestly incorporated. Consider developing these skills or adding relevant context if you have it.
                </p>
                <div className="flex flex-wrap gap-2">
                  {result.missing_keywords.map((kw, i) => <Pill key={i} text={kw} color="red" />)}
                </div>
                {result.incorporated_keywords?.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-2">Already incorporated in the tailored CV:</p>
                    <div className="flex flex-wrap gap-2">
                      {result.incorporated_keywords.map((kw, i) => <Pill key={i} text={kw} color="green" />)}
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* Recruiter feedback */}
            {result.recruiter_feedback && (
              <Card title="Recruiter Feedback" icon="🧑‍💼">
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                  <p className="text-sm text-gray-800 leading-relaxed">{result.recruiter_feedback}</p>
                </div>
              </Card>
            )}

            {/* Cross-feature CTAs */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5">
              <p className="text-sm font-semibold text-gray-900 mb-3">What to do next</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { href: '/scan', icon: '🔍', label: 'ATS Scan', desc: 'Verify your new score' },
                  { href: '/cover-letter', icon: '📝', label: 'Cover Letter', desc: 'Write a tailored letter' },
                  { href: '/interview', icon: '🎤', label: 'Interview Prep', desc: 'Prepare for questions' },
                  { href: '/tracker', icon: '📊', label: 'Track Application', desc: 'Add to your pipeline' },
                ].map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-start gap-3 border border-gray-100 rounded-xl p-3 hover:bg-gray-50 transition-colors group"
                  >
                    <span className="text-xl">{item.icon}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900 group-hover:text-indigo-700">{item.label}</p>
                      <p className="text-xs text-gray-500">{item.desc}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ── Empty state ── */}
        {!tailoring && !result && !error && !upgradeRequired && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-10 text-center">
            <div className="text-5xl mb-4">🪄</div>
            <p className="font-semibold text-gray-900 mb-1">Your tailored CV will appear here</p>
            <p className="text-sm text-gray-500">Select a CV, add a job description, and click Tailor.</p>
            {!isPro && (
              <div className="mt-5 inline-block bg-indigo-50 border border-indigo-200 text-indigo-800 text-sm px-5 py-3 rounded-xl">
                This is a <strong>Pro feature</strong>.{' '}
                <Link href="/upgrade" className="underline font-semibold hover:text-indigo-900">Upgrade to Pro ⚡</Link>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
