"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useParams, useRouter } from "next/navigation"
import {
  ResultCard,
  BulletList,
  Pill,
  ProgressBar,
  LoadingState,
  SectionLabel,
} from "@/components/ResultCard"
import { CaseForHireCTA } from "@/components/CaseForHireCTA"

interface Improvement { what: string; why: string; example: string }

interface RecruiterScanResult {
  first_impression_score: number
  first_impression_verdict: string
  clarity_score: number
  clarity_issues: string[]
  impact_score: number
  impact_issues: string[]
  overall_score: number
  strengths: string[]
  red_flags: string[]
  would_interview: boolean
  reason_for_decision: string
  top_3_improvements: Improvement[]
}

export default function RecruiterScanResultsPage() {
  const { data: session } = useSession()
  const params = useParams()
  const router = useRouter()
  const cvId = params.cvId as string

  const [result, setResult] = useState<RecruiterScanResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [showUpgrade, setShowUpgrade] = useState(false)

  useEffect(() => {
    if (!session) return
    const runScan = async () => {
      try {
        const res = await fetch("/api/ai/recruiter-scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cv_id: cvId }),
        })
        if (res.status === 402) { setShowUpgrade(true); setIsLoading(false); return }
        if (res.ok) {
          setResult(await res.json())
        } else {
          const d = await res.json()
          setError(d.error || "Scan failed")
        }
      } catch {
        setError("Something went wrong. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }
    runScan()
  }, [session, cvId])

  if (!session) return <div className="min-h-screen flex items-center justify-center text-gray-600">Please sign in</div>

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingState message="Reviewing your CV like a recruiter would…" subMessage="This takes about 10 seconds" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">⚠</div>
          <p className="text-red-600 font-semibold mb-2">Scan failed</p>
          <p className="text-gray-500 text-sm mb-5">{error}</p>
          <button onClick={() => router.push("/cv")} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-indigo-700">
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (showUpgrade) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-10 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5 text-3xl">🚫</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Recruiter Scan is a paid feature</h2>
          <p className="text-gray-500 mb-7 text-sm leading-relaxed">
            Upgrade to unlock a recruiter&apos;s honest, first-impression read on your CV.
          </p>
          <button
            onClick={() => router.push("/upgrade")}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors mb-3"
          >
            View Plans
          </button>
        </div>
      </div>
    )
  }

  if (!result) return null

  const {
    first_impression_score, first_impression_verdict, clarity_score, clarity_issues,
    impact_score, impact_issues, overall_score, strengths, red_flags,
    would_interview, reason_for_decision, top_3_improvements,
  } = result

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* ── Verdict hero ── */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-4">Recruiter Scan</h1>
          <div className="flex items-center justify-center gap-3 mb-3">
            <span className="text-4xl font-bold text-gray-900">{overall_score}</span>
            <span className="text-gray-400 text-sm">/ 100</span>
          </div>
          <Pill
            label={would_interview ? "Would interview" : "Would not interview"}
            color={would_interview ? "green" : "red"}
          />
          <p className="text-gray-600 text-sm italic mt-4">&ldquo;{first_impression_verdict}&rdquo;</p>
        </div>

        {/* ── Reason for decision ── */}
        <ResultCard title="Why This Verdict" icon="🧭" tint={would_interview ? "green" : "red"}>
          <p className="text-sm text-gray-800 leading-relaxed">{reason_for_decision}</p>
        </ResultCard>

        {/* ── Score breakdown ── */}
        <ResultCard title="Score Breakdown" icon="📊">
          <div className="space-y-4">
            <ProgressBar label="First Impression" value={first_impression_score} />
            <ProgressBar label="Clarity" value={clarity_score} />
            <ProgressBar label="Impact" value={impact_score} />
          </div>
        </ResultCard>

        {/* ── Strengths & red flags ── */}
        {(strengths?.length > 0 || red_flags?.length > 0) && (
          <ResultCard title="Strengths & Red Flags" icon="🔍">
            {strengths?.length > 0 && (
              <div className="mb-4">
                <SectionLabel color="green">Strengths</SectionLabel>
                <BulletList items={strengths} icon="✓" iconColor="text-green-500" />
              </div>
            )}
            {red_flags?.length > 0 && (
              <div>
                <SectionLabel color="red">Red Flags</SectionLabel>
                <BulletList items={red_flags} icon="✗" iconColor="text-red-500" />
              </div>
            )}
          </ResultCard>
        )}

        {/* ── Clarity / impact issues ── */}
        {(clarity_issues?.length > 0 || impact_issues?.length > 0) && (
          <ResultCard title="Issues Found" icon="⚠️" tint="yellow">
            {clarity_issues?.length > 0 && (
              <div className="mb-4">
                <SectionLabel color="yellow">Clarity Issues</SectionLabel>
                <BulletList items={clarity_issues} icon="→" iconColor="text-yellow-500" />
              </div>
            )}
            {impact_issues?.length > 0 && (
              <div>
                <SectionLabel color="yellow">Impact Issues</SectionLabel>
                <BulletList items={impact_issues} icon="→" iconColor="text-yellow-500" />
              </div>
            )}
          </ResultCard>
        )}

        {/* ── Top 3 improvements ── */}
        {top_3_improvements?.length > 0 && (
          <ResultCard title="Top 3 Improvements" icon="🔧">
            <div className="space-y-3">
              {top_3_improvements.map((imp, i) => (
                <div key={i} className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <p className="text-gray-900 text-sm font-medium leading-relaxed">{imp.what}</p>
                      <p className="text-gray-600 text-sm leading-relaxed mt-1">{imp.why}</p>
                      {imp.example && (
                        <div className="bg-gray-50 rounded-lg px-3 py-2 mt-2">
                          <p className="text-xs text-gray-500 font-medium mb-0.5">Example</p>
                          <p className="text-sm text-gray-700">{imp.example}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ResultCard>
        )}

        {/* ── Case for Hire CTA ── */}
        <CaseForHireCTA
          cvId={cvId}
          description="Applying to a specific role? Build a structured, evidence-based case for why this CV fits it."
        />

        {/* ── Bottom nav ── */}
        <div className="flex gap-3 pb-4">
          <button
            onClick={() => router.push("/cv")}
            className="flex-1 bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors text-sm"
          >
            ← My CVs
          </button>
        </div>

      </div>
    </div>
  )
}
