'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  ResultCard,
  CopyButton,
  TextBlock,
  BulletList,
  EmptyState,
  LoadingState,
} from '@/components/ResultCard'

interface CVDocument { id: string; title: string }
interface JobDescription { id: string; title: string; company: string }

interface CoverLetterResult {
  coverLetter: string
  shortVersion: string
  closingParagraph: string
  subjectLine: string
  keySellingPoints: string[]
}

export default function CoverLetterPage() {
  const { status } = useSession()
  const router = useRouter()

  const [cvs, setCvs] = useState<CVDocument[]>([])
  const [jobs, setJobs] = useState<JobDescription[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  const [selectedCvId, setSelectedCvId]         = useState('')
  const [selectedJobId, setSelectedJobId]         = useState('')
  const [jobDescriptionText, setJobDescriptionText] = useState('')
  const [result, setResult]                       = useState<CoverLetterResult | null>(null)
  const [error, setError]                         = useState('')

  const [importUrl, setImportUrl]   = useState('')
  const [importing, setImporting]   = useState(false)
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

  const canGenerate = selectedCvId && (selectedJobId || jobDescriptionText.trim().length > 20)

  const handleGenerate = async () => {
    if (!canGenerate) return
    setGenerating(true); setError(''); setResult(null)
    try {
      const body: Record<string, string> = { cvId: selectedCvId }
      if (selectedJobId) body.jobId = selectedJobId
      else body.jobDescription = jobDescriptionText.trim()

      const res = await fetch('/api/ai/cover-letter', {
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

  const handleDownload = () => {
    if (!result) return
    const content = [result.subjectLine ? `Subject: ${result.subjectLine}\n\n` : '', result.coverLetter].join('')
    const url = URL.createObjectURL(new Blob([content], { type: 'text/plain' }))
    const a = Object.assign(document.createElement('a'), { href: url, download: 'cover-letter.txt' })
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
  }

  if (status === 'loading' || loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><LoadingState message="Loading…" subMessage="" /></div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Page header */}
        <div className="mb-7">
          <h1 className="text-3xl font-bold text-gray-900">Cover Letter Generator</h1>
          <p className="mt-1.5 text-gray-500 text-sm">Full letter · Short version · Closing paragraph — all with one click.</p>
        </div>

        {/* Input card */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Generate Cover Letter</h2>

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
                  Writing your cover letter…
                </span>
              ) : 'Generate Cover Letter'}
            </button>
          </div>
        </div>

        {/* Generating state */}
        {generating && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
            <LoadingState message="Writing your cover letter…" subMessage="Crafting 3 versions tailored to the role" />
          </div>
        )}

        {/* Empty state */}
        {!generating && !result && !error && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
            <EmptyState
              icon="✉️"
              title="Your cover letter will appear here"
              description="Select a CV and add a job description, then click Generate."
            />
          </div>
        )}

        {/* Results */}
        {result && !generating && (
          <div className="space-y-4">

            {/* Subject line */}
            {result.subjectLine && (
              <ResultCard title="Subject Line" icon="📧" copyText={result.subjectLine}>
                <p className="text-sm text-gray-800 font-medium">{result.subjectLine}</p>
              </ResultCard>
            )}

            {/* Full cover letter */}
            <ResultCard
              title="Full Cover Letter"
              icon="📄"
              copyText={result.coverLetter}
              headerRight={
                <button
                  onClick={handleDownload}
                  className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download
                </button>
              }
            >
              <TextBlock text={result.coverLetter} />
            </ResultCard>

            {/* Short version */}
            {result.shortVersion && (
              <ResultCard
                title="Short Version"
                icon="⚡"
                badge="For online forms"
                badgeColor="blue"
                copyText={result.shortVersion}
              >
                <TextBlock text={result.shortVersion} tint="blue" />
              </ResultCard>
            )}

            {/* Closing paragraph */}
            {result.closingParagraph && (
              <ResultCard title="Strong Closing Paragraph" icon="🎯" copyText={result.closingParagraph}>
                <TextBlock text={result.closingParagraph} tint="green" />
              </ResultCard>
            )}

            {/* Key selling points */}
            {result.keySellingPoints?.length > 0 && (
              <ResultCard title="Key Selling Points Used" icon="✓">
                <BulletList items={result.keySellingPoints} icon="✓" iconColor="text-green-500" />
              </ResultCard>
            )}

            {/* Regenerate */}
            <button
              onClick={() => setResult(null)}
              className="w-full py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              ← Generate another
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
