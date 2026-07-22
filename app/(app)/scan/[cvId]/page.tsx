"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { useParams, useRouter } from "next/navigation"
import {
  ResultCard,
  CopyButton,
  Badge,
  BulletList,
  Pill,
  ProgressBar,
  LoadingState,
  SectionLabel,
} from "@/components/ResultCard"
import { CaseForHireCTA } from "@/components/CaseForHireCTA"

interface Fix {
  fix: string
  impact: string
  effort: string
}

interface KeywordAnalysis {
  matched: { keyword: string; frequency: number }[]
  missing_critical: string[]
  missing_beneficial: string[]
}

interface SectionScores {
  summary: number
  experience: number
  skills: number
  education: number
}

interface ScanResult {
  overall_score: number
  top_3_fixes: Fix[]
  verdict: string
  is_premium: boolean
  keyword_analysis: KeywordAnalysis
  format_score: number
  format_issues: string[]
  section_scores: SectionScores
}

function AnimatedScore({ score }: { score: number }) {
  const [displayed, setDisplayed] = useState(0)
  const raf = useRef<number | null>(null)

  useEffect(() => {
    const start = performance.now()
    const duration = 1200
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayed(Math.round(eased * score))
      if (progress < 1) raf.current = requestAnimationFrame(animate)
    }
    raf.current = requestAnimationFrame(animate)
    return () => { if (raf.current) cancelAnimationFrame(raf.current) }
  }, [score])

  const isStrong  = score >= 70
  const isOk      = score >= 40
  const color     = isStrong ? "#16a34a" : isOk ? "#d97706" : "#dc2626"
  const ringBg    = isStrong ? "#f0fdf4" : isOk ? "#fffbeb" : "#fef2f2"
  const label     = isStrong ? "Strong" : isOk ? "Needs work" : "High risk"
  const subLabel  = isStrong
    ? "Your CV is ATS-ready"
    : isOk
    ? "Several issues to fix"
    : "Likely filtered out"

  const circumference = 2 * Math.PI * 54
  const strokeDash    = circumference - (circumference * displayed) / 100

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-40 h-40 mb-4">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" fill={ringBg} stroke="#e5e7eb" strokeWidth="8" />
          <circle
            cx="60" cy="60" r="54"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDash}
            style={{ transition: "stroke-dashoffset 0.05s linear" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold" style={{ color }}>{displayed}</span>
          <span className="text-xs font-bold mt-0.5" style={{ color }}>{label}</span>
        </div>
      </div>
      <p className="text-sm text-gray-500">{subLabel}</p>
    </div>
  )
}

function ImpactBadge({ impact }: { impact: string }) {
  const color = impact === "high" ? "red" : impact === "medium" ? "yellow" : "gray"
  return <Badge label={`${impact} impact`} color={color as "red" | "yellow" | "gray"} />
}

export default function ScanResultsPage() {
  const { data: session } = useSession()
  const params = useParams()
  const router = useRouter()
  const cvId = params.cvId as string

  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [showUpgrade, setShowUpgrade] = useState(false)

  useEffect(() => {
    if (!session) return
    const runScan = async () => {
      try {
        const res = await fetch("/api/ai/ats-scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cv_id: cvId }),
        })
        if (res.status === 402) { setShowUpgrade(true); setIsLoading(false); return }
        if (res.ok) {
          setScanResult(await res.json())
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
        <LoadingState message="Analyzing your CV against 847 ATS criteria…" subMessage="This takes about 10 seconds" />
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Free scan used</h2>
          <p className="text-gray-500 mb-7 text-sm leading-relaxed">
            You&apos;ve used your free ATS scan. Upgrade to Pro to unlock unlimited scans and the full report.
          </p>
          <button
            onClick={() => router.push("/upgrade")}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors mb-3"
          >
            Unlock Pro — €7/month
          </button>
          <p className="text-xs text-gray-400">Cancel anytime · 30-day money-back</p>
        </div>
      </div>
    )
  }

  if (!scanResult) return null

  const { overall_score: score, top_3_fixes, verdict, is_premium, keyword_analysis, format_issues, section_scores } = scanResult

  // Build "Why you're being rejected" list from low scores + missing keywords + format issues
  const rejectionReasons: string[] = []
  if (keyword_analysis?.missing_critical?.length) {
    rejectionReasons.push(`Missing ${keyword_analysis.missing_critical.length} critical keyword${keyword_analysis.missing_critical.length > 1 ? "s" : ""} the ATS is scanning for: ${keyword_analysis.missing_critical.slice(0, 3).join(", ")}${keyword_analysis.missing_critical.length > 3 ? "…" : ""}`)
  }
  if (section_scores) {
    const weakSections = Object.entries(section_scores).filter(([, v]) => v < 60)
    for (const [key] of weakSections) {
      rejectionReasons.push(`${key.charAt(0).toUpperCase() + key.slice(1)} section scores below 60 — likely flagged as weak`)
    }
  }
  if (format_issues?.length) {
    rejectionReasons.push(...format_issues.slice(0, 2))
  }

  const allFixesText = top_3_fixes.map((f, i) => `${i + 1}. ${f.fix}`).join("\n")

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* ── Score hero ── */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-6">ATS Compatibility Report</h1>
          <AnimatedScore score={score} />
          <div className="mt-5 flex items-center justify-center gap-2">
            <p className="text-gray-600 text-sm italic">&ldquo;{verdict}&rdquo;</p>
            <CopyButton text={verdict} />
          </div>
        </div>

        {/* ── Why you're rejected ── */}
        {rejectionReasons.length > 0 && (
          <ResultCard title="Why You're Being Rejected" icon="🚫" tint="red">
            <BulletList items={rejectionReasons} icon="✗" iconColor="text-red-500" />
          </ResultCard>
        )}

        {/* ── Section breakdown ── */}
        {section_scores && (
          <ResultCard title="Section Scores" icon="📊">
            <div className="space-y-4">
              {Object.entries(section_scores).map(([key, val]) => (
                <ProgressBar key={key} label={key} value={val} />
              ))}
            </div>
          </ResultCard>
        )}

        {/* ── Keyword analysis ── */}
        {keyword_analysis && (
          <ResultCard
            title="Keyword Analysis"
            icon="🔍"
            copyText={keyword_analysis.missing_critical?.join(", ")}
            copyLabel="Copy missing"
          >
            {keyword_analysis.missing_critical?.length > 0 && (
              <div className="mb-4">
                <SectionLabel color="red">Add these — ATS is scanning for them</SectionLabel>
                <div className="flex flex-wrap gap-2">
                  {keyword_analysis.missing_critical.map((kw, i) => (
                    <Pill key={i} label={kw} color="red" />
                  ))}
                </div>
              </div>
            )}
            {keyword_analysis.matched?.length > 0 && (
              <div className="mb-4">
                <SectionLabel color="green">Already in your CV</SectionLabel>
                <div className="flex flex-wrap gap-2">
                  {keyword_analysis.matched.map((m, i) => (
                    <Pill key={i} label={m.keyword} color="green" />
                  ))}
                </div>
              </div>
            )}
            {keyword_analysis.missing_beneficial?.length > 0 && (
              <div>
                <SectionLabel color="yellow">Nice-to-have additions</SectionLabel>
                <div className="flex flex-wrap gap-2">
                  {keyword_analysis.missing_beneficial.map((kw, i) => (
                    <Pill key={i} label={kw} color="yellow" />
                  ))}
                </div>
              </div>
            )}
          </ResultCard>
        )}

        {/* ── What to fix ── */}
        <ResultCard
          title="What to Fix"
          icon="🔧"
          badge={is_premium ? undefined : "Free preview"}
          badgeColor="indigo"
          copyText={is_premium ? allFixesText : undefined}
        >
          <div className="space-y-3">
            {top_3_fixes.map((fix, i) => {
              const locked = !is_premium && i > 0
              return (
                <div key={i} className={`relative border border-gray-200 rounded-xl p-4 ${locked ? "overflow-hidden" : ""}`}>
                  <div className={locked ? "blur-sm select-none pointer-events-none" : ""}>
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <div className="flex-1">
                        <p className="text-gray-800 text-sm leading-relaxed">{fix.fix}</p>
                        <div className="flex gap-2 mt-2">
                          <ImpactBadge impact={fix.impact} />
                          <Badge label={fix.effort} color="green" />
                        </div>
                      </div>
                    </div>
                  </div>
                  {locked && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-[1px] rounded-xl">
                      <button
                        onClick={() => router.push("/upgrade")}
                        className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow"
                      >
                        Unlock fix {i + 1} →
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </ResultCard>

        {/* ── Improved CV CTA ── */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-2xl p-6 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-bold text-lg mb-1">Get an Improved CV</h3>
              <p className="text-indigo-200 text-sm leading-relaxed">
                Use the CV Optimizer to automatically rewrite your summary, bullet points, and skills for this role.
              </p>
            </div>
            <span className="text-3xl shrink-0">✨</span>
          </div>
          <button
            onClick={() => router.push("/optimizer")}
            className="mt-4 bg-white text-indigo-700 font-semibold px-5 py-2.5 rounded-xl hover:bg-indigo-50 transition-colors text-sm"
          >
            Optimize My CV →
          </button>
        </div>

        {/* ── Case for Hire CTA ── */}
        <CaseForHireCTA
          cvId={cvId}
          description="Applying to a specific role? Build a structured, evidence-based case for why this CV fits it."
        />

        {/* ── Bottom nav ── */}
        <div className="flex gap-3 pb-4">
          {!is_premium && (
            <button
              onClick={() => router.push("/upgrade")}
              className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors text-sm"
            >
              Unlock Full Report — €7/month
            </button>
          )}
          <button
            onClick={() => router.push("/cv")}
            className="flex-1 bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors text-sm"
          >
            {is_premium ? "← My CVs" : "Upload Different CV"}
          </button>
        </div>

      </div>
    </div>
  )
}
