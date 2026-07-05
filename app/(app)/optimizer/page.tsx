'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  ResultCard,
  CopyButton,
  BeforeAfter,
  BulletList,
  EmptyState,
  LoadingState,
  SectionLabel,
  Pill,
} from '@/components/ResultCard'

interface CVDocument { id: string; title: string }

interface Experience {
  title?: string
  company?: string
  period?: string
  dates?: string
  bullets?: string[]
}

interface ParsedCV {
  summary?: string
  experience?: Experience[]
  skills?: string[] | { technical?: string[]; soft?: string[]; tools?: string[] }
}

interface OptimizeResult {
  tailoredCV: ParsedCV
  originalCV: ParsedCV
}

function flattenSkills(skills: ParsedCV['skills']): string[] {
  if (!skills) return []
  if (Array.isArray(skills)) return skills as string[]
  return [
    ...(skills.technical ?? []),
    ...(skills.soft ?? []),
    ...(skills.tools ?? []),
  ]
}

export default function CVOptimizerPage() {
  const { status } = useSession()
  const router = useRouter()

  const [cvs, setCvs]         = useState<CVDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [optimizing, setOptimizing] = useState(false)

  const [selectedCvId, setSelectedCvId]           = useState('')
  const [jobDescriptionText, setJobDescriptionText] = useState('')
  const [result, setResult]                         = useState<OptimizeResult | null>(null)
  const [error, setError]                           = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return }
    if (status === 'authenticated') {
      fetch('/api/cv')
        .then(r => r.ok ? r.json() : [])
        .then(setCvs)
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [status, router])

  const canOptimize = selectedCvId && jobDescriptionText.trim().length > 50

  const handleOptimize = async () => {
    if (!canOptimize) return
    setOptimizing(true); setError(''); setResult(null)
    try {
      // Save JD as a job record first
      const jobRes = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Target Role', company: '—', raw_text: jobDescriptionText.trim() }),
      })
      const jobData = await jobRes.json()
      if (!jobRes.ok) { setError(jobData.error || 'Failed to process job description'); return }

      // Tailor the CV
      const tailorRes = await fetch('/api/ai/tailor-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cv_id: selectedCvId, job_id: jobData.jobId }),
      })
      const tailorData = await tailorRes.json()
      if (!tailorRes.ok) { setError(tailorData.error || 'Failed to optimize CV'); return }

      setResult({ tailoredCV: tailorData.tailoredCV, originalCV: tailorData.originalCV ?? {} })
    } catch { setError('Something went wrong. Please try again.') }
    finally { setOptimizing(false) }
  }

  if (status === 'loading' || loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><LoadingState message="Loading…" subMessage="" /></div>
  }

  const orig   = result?.originalCV   ?? {}
  const tailed = result?.tailoredCV   ?? {}

  const origSkills   = flattenSkills(orig.skills)
  const tailed_Skills = flattenSkills(tailed.skills)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">

        <div className="mb-7">
          <h1 className="text-3xl font-bold text-gray-900">CV Optimizer</h1>
          <p className="mt-1.5 text-gray-500 text-sm">Rewrites your CV for a specific role — summary, bullets, skills. See before &amp; after side by side.</p>
        </div>

        {/* Input form — hide after results */}
        {!result && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 mb-6">
            <h2 className="font-semibold text-gray-900 mb-4">Optimize for a Role</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your CV</label>
                <select
                  value={selectedCvId}
                  onChange={e => setSelectedCvId(e.target.value)}
                  className="block w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 bg-white"
                >
                  <option value="">Select a CV…</option>
                  {cvs.map(cv => <option key={cv.id} value={cv.id}>{cv.title}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job Description <span className="text-gray-400 font-normal">(paste the full JD)</span>
                </label>
                <textarea
                  value={jobDescriptionText}
                  onChange={e => setJobDescriptionText(e.target.value)}
                  rows={8}
                  placeholder="Paste the full job description here. The more detail, the better the optimization…"
                  className="block w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 resize-none"
                />
                {jobDescriptionText.length > 0 && jobDescriptionText.length < 50 && (
                  <p className="text-xs text-gray-400 mt-1">Add more detail for better results (min 50 chars)</p>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-xl">{error}</div>
              )}

              <button
                onClick={handleOptimize}
                disabled={!canOptimize || optimizing}
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {optimizing ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Optimizing your CV… (~15 seconds)
                  </span>
                ) : 'Optimize CV for This Role'}
              </button>
            </div>
          </div>
        )}

        {/* Generating */}
        {optimizing && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
            <LoadingState message="Rewriting your CV for this role…" subMessage="Tailoring summary, bullet points and skills to the job requirements" />
          </div>
        )}

        {/* Empty */}
        {!optimizing && !result && !error && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
            <EmptyState
              icon="✨"
              title="Your optimized CV will appear here"
              description="Select a CV, paste a job description, and click Optimize."
            />
          </div>
        )}

        {/* Results */}
        {result && !optimizing && (
          <div className="space-y-5">

            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Before vs. After</h2>
              <button
                onClick={() => { setResult(null); setError('') }}
                className="text-sm text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg"
              >
                ← Optimize another
              </button>
            </div>

            {/* Summary before/after */}
            {(orig.summary || tailed.summary) && (
              <ResultCard title="Professional Summary" icon="👤">
                {orig.summary && tailed.summary ? (
                  <BeforeAfter before={orig.summary} after={tailed.summary} />
                ) : (
                  <div>
                    <SectionLabel color="green">Optimized Summary</SectionLabel>
                    <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3">
                      <p className="text-sm text-gray-800 leading-relaxed">{tailed.summary}</p>
                    </div>
                    <CopyButton text={tailed.summary ?? ''} />
                  </div>
                )}
              </ResultCard>
            )}

            {/* Experience before/after */}
            {tailed.experience && tailed.experience.length > 0 && (
              <ResultCard title="Experience — Rewritten Bullets" icon="💼">
                <div className="space-y-6">
                  {tailed.experience.map((exp, i) => {
                    const origExp = orig.experience?.[i]
                    const tailedBullets = exp.bullets ?? []
                    const origBullets   = origExp?.bullets ?? []

                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{exp.title}</p>
                            {exp.company && <p className="text-xs text-gray-500">{exp.company} · {exp.dates ?? exp.period}</p>}
                          </div>
                          {tailedBullets.length > 0 && (
                            <CopyButton text={tailedBullets.map(b => `• ${b}`).join('\n')} />
                          )}
                        </div>

                        {origBullets.length > 0 && tailedBullets.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <SectionLabel color="gray">Before</SectionLabel>
                              <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 space-y-1.5">
                                {origBullets.map((b, j) => (
                                  <p key={j} className="text-xs text-gray-500 leading-relaxed line-through decoration-red-300">• {b}</p>
                                ))}
                              </div>
                            </div>
                            <div>
                              <SectionLabel color="green">After</SectionLabel>
                              <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 space-y-1.5">
                                {tailedBullets.map((b, j) => (
                                  <p key={j} className="text-xs text-gray-800 leading-relaxed font-medium">• {b}</p>
                                ))}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 space-y-1.5">
                            {tailedBullets.map((b, j) => (
                              <p key={j} className="text-xs text-gray-800 leading-relaxed">• {b}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </ResultCard>
            )}

            {/* Skills before/after */}
            {tailed_Skills.length > 0 && (
              <ResultCard
                title="Skills"
                icon="🛠"
                copyText={tailed_Skills.join(', ')}
                copyLabel="Copy all"
              >
                {origSkills.length > 0 && (
                  <div className="mb-4">
                    <SectionLabel color="gray">Before (original)</SectionLabel>
                    <div className="flex flex-wrap gap-1.5">
                      {origSkills.map((s, i) => <Pill key={i} label={s} color="gray" />)}
                    </div>
                  </div>
                )}
                <div>
                  <SectionLabel color="green">After (optimized for this role)</SectionLabel>
                  <div className="flex flex-wrap gap-1.5">
                    {tailed_Skills.map((s, i) => <Pill key={i} label={s} color="green" />)}
                  </div>
                </div>
              </ResultCard>
            )}

            {/* CTA to scan optimized CV */}
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-2xl p-5 text-white">
              <p className="font-bold mb-1">Run ATS scan on your optimized CV</p>
              <p className="text-indigo-200 text-sm mb-4">Your tailored CV has been saved. Upload it again to check the new ATS score.</p>
              <button
                onClick={() => router.push('/cv')}
                className="bg-white text-indigo-700 font-semibold px-5 py-2 rounded-xl hover:bg-indigo-50 transition-colors text-sm"
              >
                Upload &amp; Scan →
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
