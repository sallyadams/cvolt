'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ResultCard,
  Pill,
  EmptyState,
  LoadingState,
} from '@/components/ResultCard'

// Isolated so useSearchParams() has a Suspense boundary above it
function PrefillFromParams({ onPrefill }: { onPrefill: (cvId: string, jobId: string) => void }) {
  const searchParams = useSearchParams()
  useEffect(() => {
    onPrefill(searchParams.get('cvId') ?? '', searchParams.get('jobId') ?? '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}

interface CVDocument { id: string; title: string }
interface JobDescription { id: string; title: string; company: string }

interface Exhibit {
  letter: string
  title: string
  text: string
  source: { type: string; label: string } | null
}

interface CaseForHireResult {
  employerProblem: string
  candidatePosition: string
  exhibits: Exhibit[]
  potentialObjection: string
  response: string
  closingArgument: string
}

const SOURCE_COLOR: Record<string, 'indigo' | 'green' | 'blue' | 'orange'> = {
  experience: 'indigo',
  education: 'blue',
  skill: 'green',
  certification: 'orange',
}

export default function CaseForHirePage() {
  const { status } = useSession()
  const router = useRouter()

  const [cvs, setCvs] = useState<CVDocument[]>([])
  const [jobs, setJobs] = useState<JobDescription[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  const [selectedCvId, setSelectedCvId] = useState('')
  const [selectedJobId, setSelectedJobId] = useState('')
  const [jobDescriptionText, setJobDescriptionText] = useState('')
  const [result, setResult] = useState<CaseForHireResult | null>(null)
  const [error, setError] = useState('')

  const handlePrefill = (cvId: string, jobId: string) => {
    if (cvId) setSelectedCvId(cvId)
    if (jobId) setSelectedJobId(jobId)
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

  const canGenerate = selectedCvId && (selectedJobId || jobDescriptionText.trim().length > 20)

  const handleGenerate = async () => {
    if (!canGenerate) return
    setGenerating(true); setError(''); setResult(null)
    try {
      const body: Record<string, string> = { cvId: selectedCvId }
      if (selectedJobId) body.jobId = selectedJobId
      else body.jobDescription = jobDescriptionText.trim()

      const res = await fetch('/api/ai/case-for-hire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Generation failed'); return }
      setResult(data)
    } catch { setError('Something went wrong. Please try again.') }
    finally { setGenerating(false) }
  }

  if (status === 'loading' || loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><LoadingState message="Loading…" subMessage="" /></div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense>
        <PrefillFromParams onPrefill={handlePrefill} />
      </Suspense>
      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Page header */}
        <div className="mb-7">
          <h1 className="text-3xl font-bold text-gray-900">Case for Hire</h1>
          <p className="mt-1.5 text-gray-500 text-sm">A structured, evidence-based argument for why you fit the role — every claim cited back to your actual CV.</p>
        </div>

        {/* Input card */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Build Your Case</h2>

          <div className="space-y-4">
            {/* CV */}
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

            {/* Saved job */}
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

            {/* Paste JD */}
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
              onClick={handleGenerate}
              disabled={!canGenerate || generating}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {generating ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Building your case…
                </span>
              ) : 'Build Case for Hire'}
            </button>
          </div>
        </div>

        {/* Generating state */}
        {generating && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
            <LoadingState message="Building your case…" subMessage="Grounding every argument in your actual CV" />
          </div>
        )}

        {/* Empty state */}
        {!generating && !result && !error && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
            <EmptyState
              icon="⚖️"
              title="Your case for hire will appear here"
              description="Select a CV and add a job description, then click Build Case for Hire."
            />
          </div>
        )}

        {/* Results */}
        {result && !generating && (
          <div className="space-y-4">

            <ResultCard title="Employer Problem" icon="🎯">
              <p className="text-sm text-gray-800 leading-relaxed">{result.employerProblem}</p>
            </ResultCard>

            <ResultCard title="Candidate Position" icon="🧭">
              <p className="text-sm text-gray-800 leading-relaxed">{result.candidatePosition}</p>
            </ResultCard>

            {result.exhibits.map(ex => (
              <ResultCard key={ex.letter} title={`Exhibit ${ex.letter} — ${ex.title}`} icon="📁">
                <p className="text-sm text-gray-800 leading-relaxed mb-3">{ex.text}</p>
                {ex.source ? (
                  <Pill label={`Source: ${ex.source.label}`} color={SOURCE_COLOR[ex.source.type] ?? 'gray'} />
                ) : (
                  <Pill label="Source unverified — not found on CV" color="red" />
                )}
              </ResultCard>
            ))}

            <ResultCard title="Potential Objection" icon="⚠️" tint="amber">
              <p className="text-sm text-gray-800 leading-relaxed">{result.potentialObjection}</p>
            </ResultCard>

            <ResultCard title="Response" icon="💬">
              <p className="text-sm text-gray-800 leading-relaxed">{result.response}</p>
            </ResultCard>

            <ResultCard title="Closing Argument" icon="🏛️" tint="green">
              <p className="text-sm text-gray-800 leading-relaxed font-medium">{result.closingArgument}</p>
            </ResultCard>

            {/* Regenerate */}
            <button
              onClick={() => setResult(null)}
              className="w-full py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              ← Build another
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
