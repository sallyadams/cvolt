'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  ResultCard,
  BulletList,
  EmptyState,
  LoadingState,
  ProgressBar,
} from '@/components/ResultCard'

interface CVDocument { id: string; title: string }
interface JobDescription { id: string; title: string; company: string }

interface Question {
  question: string
  suggested_answer: string
  tip: string
}

interface InlineResult {
  id: string
  overallScore: number
  likelyQuestions: Question[]
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
}

function QuestionCard({ q, index }: { q: Question; index: number }) {
  const [open, setOpen] = useState(index === 0)
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="text-sm font-medium text-gray-900 pr-4">
          <span className="text-indigo-600 font-bold mr-2">Q{index + 1}.</span>
          {q.question}
        </span>
        <span className="text-gray-400 text-xl font-light shrink-0">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="px-5 pb-5 space-y-3 border-t border-gray-100">
          <div className="pt-4">
            <p className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-2">Suggested Answer</p>
            <div className="bg-indigo-50 rounded-xl px-4 py-3">
              <p className="text-sm text-gray-800 leading-relaxed">{q.suggested_answer}</p>
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 flex items-start gap-2">
            <span className="text-amber-500 shrink-0 mt-0.5">💡</span>
            <p className="text-sm text-amber-800">{q.tip}</p>
          </div>
        </div>
      )}
    </div>
  )
}

function ScoreCircle({ score }: { score: number }) {
  const color = score >= 80 ? '#16a34a' : score >= 60 ? '#d97706' : '#dc2626'
  const bg    = score >= 80 ? 'bg-green-50'  : score >= 60 ? 'bg-yellow-50'  : 'bg-red-50'
  const label = score >= 80 ? 'Interview Ready' : score >= 60 ? 'Almost Ready' : 'Needs Prep'
  return (
    <div className={`${bg} rounded-2xl p-6 text-center`}>
      <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-3" style={{ border: `4px solid ${color}` }}>
        <span className="text-3xl font-bold" style={{ color }}>{score}</span>
      </div>
      <p className="font-semibold text-sm" style={{ color }}>{label}</p>
    </div>
  )
}

export default function InterviewReadinessPage() {
  const { status } = useSession()
  const router = useRouter()

  const [cvs, setCvs]   = useState<CVDocument[]>([])
  const [jobs, setJobs] = useState<JobDescription[]>([])
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)

  const [selectedCvId, setSelectedCvId]           = useState('')
  const [selectedJobId, setSelectedJobId]           = useState('')
  const [jobDescriptionText, setJobDescriptionText] = useState('')
  const [inlineResult, setInlineResult]             = useState<InlineResult | null>(null)
  const [error, setError]                           = useState('')

  const [importUrl, setImportUrl]     = useState('')
  const [importing, setImporting]     = useState(false)
  const [importError, setImportError] = useState('')

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

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return }
    if (status === 'authenticated') {
      Promise.all([fetch('/api/cv'), fetch('/api/jobs')])
        .then(([cr, jr]) => Promise.all([cr.ok ? cr.json() : [], jr.ok ? jr.json() : []]))
        .then(([c, j]) => { setCvs(c); setJobs(j) })
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [status, router])

  const canAnalyze = selectedCvId && (selectedJobId || jobDescriptionText.trim().length > 20)

  const handleAnalyze = async () => {
    if (!canAnalyze) return
    setAnalyzing(true); setError(''); setInlineResult(null)
    try {
      const body: Record<string, string> = { cvId: selectedCvId }
      if (selectedJobId) body.jobId = selectedJobId
      else body.jobDescription = jobDescriptionText.trim()

      const res = await fetch('/api/ai/interview-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Analysis failed'); return }

      try { sessionStorage.setItem(`questions_${data.id}`, JSON.stringify(data.likelyQuestions)) } catch { /* ignore */ }

      setInlineResult({
        id: data.id,
        overallScore: data.overallScore,
        likelyQuestions: data.likelyQuestions ?? [],
        strengths: data.strengths ?? [],
        weaknesses: data.weaknesses ?? [],
        recommendations: data.recommendations ?? [],
      })
    } catch { setError('Something went wrong. Please try again.') }
    finally { setAnalyzing(false) }
  }

  if (status === 'loading' || loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><LoadingState message="Loading…" subMessage="" /></div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">

        <div className="mb-7">
          <h1 className="text-3xl font-bold text-gray-900">Interview Prep</h1>
          <p className="mt-1.5 text-gray-500 text-sm">Readiness score · Likely questions · Suggested answers · Practice tips</p>
        </div>

        {/* Input form — hide after results */}
        {!inlineResult && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 mb-6">
            <h2 className="font-semibold text-gray-900 mb-4">Analyze Interview Readiness</h2>

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

              {jobs.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Saved job <span className="text-gray-400 font-normal">(or paste below)</span>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {jobs.length ? 'Or paste job description' : 'Job description'}
                </label>
                <textarea
                  value={jobDescriptionText}
                  onChange={e => { setJobDescriptionText(e.target.value); if (e.target.value.trim()) setSelectedJobId('') }}
                  rows={5}
                  placeholder="Paste the job description here…"
                  className="block w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 resize-none"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-xl">{error}</div>
              )}

              <button
                onClick={handleAnalyze}
                disabled={!canAnalyze || analyzing}
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {analyzing ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Analyzing your readiness…
                  </span>
                ) : 'Analyze Interview Readiness'}
              </button>
            </div>
          </div>
        )}

        {/* Generating placeholder */}
        {analyzing && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
            <LoadingState message="Analyzing your interview readiness…" subMessage="Generating 6 tailored interview questions with answers" />
          </div>
        )}

        {/* Empty state */}
        {!analyzing && !inlineResult && !error && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
            <EmptyState
              icon="🎤"
              title="Your interview prep will appear here"
              description="Select your CV and add a job description to get started."
            />
          </div>
        )}

        {/* Results */}
        {inlineResult && !analyzing && (
          <div className="space-y-5">

            {/* Score + link to full report */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-900">Interview Readiness Score</h2>
                <a
                  href={`/interview/${inlineResult.id}`}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-medium border border-indigo-200 bg-indigo-50 px-3 py-1.5 rounded-lg"
                >
                  Full category breakdown →
                </a>
              </div>
              <ScoreCircle score={inlineResult.overallScore} />
            </div>

            {/* Interview questions */}
            {inlineResult.likelyQuestions.length > 0 && (
              <ResultCard title="Likely Interview Questions" icon="🎤" badge={`${inlineResult.likelyQuestions.length} questions`} badgeColor="indigo">
                <div className="space-y-3">
                  {inlineResult.likelyQuestions.map((q, i) => (
                    <QuestionCard key={i} q={q} index={i} />
                  ))}
                </div>
              </ResultCard>
            )}

            {/* Weaknesses */}
            {inlineResult.weaknesses.length > 0 && (
              <ResultCard title="Weakness Analysis" icon="⚠️">
                <BulletList items={inlineResult.weaknesses} icon="⚠" iconColor="text-yellow-500" />
              </ResultCard>
            )}

            {/* Practice tips */}
            {inlineResult.recommendations.length > 0 && (
              <ResultCard title="Practice Tips" icon="📋">
                <BulletList items={inlineResult.recommendations} icon="→" iconColor="text-indigo-400" />
              </ResultCard>
            )}

            <button
              onClick={() => { setInlineResult(null); setError('') }}
              className="w-full py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              ← Start over
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
