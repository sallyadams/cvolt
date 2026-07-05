'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  ResultCard,
  CopyButton,
  TextBlock,
  Pill,
  EmptyState,
  LoadingState,
  SectionLabel,
} from '@/components/ResultCard'

interface CVDocument { id: string; title: string }

interface LinkedInResult {
  summary: string
  headlineSuggestions: string[]
  keywords: string[]
  experienceSection: string
  skillsSection: string
  characterCount: number
}

export default function LinkedInSummaryPage() {
  const { status } = useSession()
  const router = useRouter()

  const [cvs, setCvs]         = useState<CVDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  const [selectedCvId, setSelectedCvId] = useState('')
  const [targetRole, setTargetRole]     = useState('')
  const [result, setResult]             = useState<LinkedInResult | null>(null)
  const [error, setError]               = useState('')

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

  const handleGenerate = async () => {
    if (!selectedCvId) return
    setGenerating(true); setError(''); setResult(null)
    try {
      const res = await fetch('/api/ai/linkedin-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cvId: selectedCvId, targetRole: targetRole.trim() || undefined }),
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
      <div className="max-w-3xl mx-auto px-4 py-8">

        <div className="mb-7">
          <h1 className="text-3xl font-bold text-gray-900">LinkedIn Profile Optimizer</h1>
          <p className="mt-1.5 text-gray-500 text-sm">Headline · About · Experience highlights · Skills — all optimized for visibility.</p>
        </div>

        {/* Input */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Generate Profile</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                Target Role <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={targetRole}
                onChange={e => setTargetRole(e.target.value)}
                placeholder="e.g. Senior Product Manager"
                className="block w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-xl mb-4">{error}</div>
          )}

          <button
            onClick={handleGenerate}
            disabled={!selectedCvId || generating}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {generating ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating full profile…
              </span>
            ) : 'Generate LinkedIn Profile'}
          </button>
        </div>

        {/* Generating */}
        {generating && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
            <LoadingState message="Optimizing your LinkedIn profile…" subMessage="Writing headline options, About section, experience and skills" />
          </div>
        )}

        {/* Empty state */}
        {!generating && !result && (
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
            <EmptyState
              icon="💼"
              title="Your LinkedIn profile will appear here"
              description="Select your CV and click Generate to get your full profile upgrade."
            />
          </div>
        )}

        {/* Results */}
        {result && !generating && (
          <div className="space-y-4">

            {/* Headline options */}
            {result.headlineSuggestions?.length > 0 && (
              <ResultCard title="Headline Options" icon="🏷" badge="Pick one" badgeColor="indigo">
                <div className="space-y-2">
                  {result.headlineSuggestions.map((h, i) => (
                    <div key={i} className="flex items-center justify-between bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 gap-3">
                      <span className="text-sm text-gray-800 font-medium">{h}</span>
                      <CopyButton text={h} />
                    </div>
                  ))}
                </div>
              </ResultCard>
            )}

            {/* About section */}
            <ResultCard
              title="About Section"
              icon="📝"
              badge={result.characterCount ? `${result.characterCount} chars` : undefined}
              badgeColor="gray"
              copyText={result.summary}
            >
              <TextBlock text={result.summary} />
            </ResultCard>

            {/* Keywords */}
            {result.keywords?.length > 0 && (
              <ResultCard title="Keywords to Include" icon="🔑" copyText={result.keywords.join(', ')} copyLabel="Copy all">
                <div>
                  <SectionLabel color="indigo">Add these to your profile for better search visibility</SectionLabel>
                  <div className="flex flex-wrap gap-2">
                    {result.keywords.map((kw, i) => <Pill key={i} label={kw} color="indigo" />)}
                  </div>
                </div>
              </ResultCard>
            )}

            {/* Experience highlights */}
            {result.experienceSection && (
              <ResultCard title="Experience Highlights" icon="💼" copyText={result.experienceSection}>
                <TextBlock text={result.experienceSection} tint="indigo" />
              </ResultCard>
            )}

            {/* Skills */}
            {result.skillsSection && (
              <ResultCard title="Optimized Skills List" icon="🛠" copyText={result.skillsSection}>
                <TextBlock text={result.skillsSection} tint="green" />
              </ResultCard>
            )}

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
