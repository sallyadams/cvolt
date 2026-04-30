"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { useParams, useRouter } from "next/navigation"

interface Fix {
  fix: string
  impact: string
  effort: string
}

interface ScanResult {
  overall_score: number
  top_3_fixes: Fix[]
  verdict: string
  is_premium: boolean
}

function ScoreRing({ score }: { score: number }) {
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

  const color = score >= 70 ? "#16a34a" : score >= 40 ? "#d97706" : "#dc2626"
  const bg = score >= 70 ? "bg-green-50" : score >= 40 ? "bg-yellow-50" : "bg-red-50"
  const label = score >= 70 ? "Strong" : score >= 40 ? "Needs work" : "High risk"

  return (
    <div className={`w-36 h-36 ${bg} rounded-full flex flex-col items-center justify-center mx-auto mb-4`} style={{ border: `4px solid ${color}` }}>
      <span className="text-4xl font-bold" style={{ color }}>{displayed}</span>
      <span className="text-xs font-semibold mt-1" style={{ color }}>{label}</span>
    </div>
  )
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

        if (res.status === 402) {
          setShowUpgrade(true)
          setIsLoading(false)
          return
        }

        if (res.ok) {
          setScanResult(await res.json())
        } else {
          const d = await res.json()
          setError(d.error || "Scan failed")
        }
      } catch {
        setError("Something went wrong")
      } finally {
        setIsLoading(false)
      }
    }

    runScan()
  }, [session, cvId])

  if (!session) return <div className="min-h-screen flex items-center justify-center text-gray-600">Please sign in first</div>

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Analyzing your CV against 847 ATS criteria…</p>
          <p className="text-gray-400 text-sm mt-1">This takes about 10 seconds</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={() => router.push("/cv")} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (showUpgrade) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full text-center bg-white rounded-2xl shadow-sm p-10">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">🚫</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">You've used your free scan</h2>
          <p className="text-gray-500 mb-8">Upgrade to Pro and find out exactly what's stopping you from getting interviews.</p>
          <button onClick={() => router.push("/upgrade")} className="w-full bg-indigo-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-indigo-700 transition-colors">
            Unlock Pro — €7/month
          </button>
          <p className="mt-3 text-sm text-gray-400">Cancel anytime · 30-day money-back guarantee</p>
        </div>
      </div>
    )
  }

  if (!scanResult) return null

  const { overall_score: score, top_3_fixes, verdict, is_premium } = scanResult

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Score */}
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Your ATS Score</h1>
          <ScoreRing score={score} />
          <p className="text-gray-600 mt-2">{verdict}</p>
        </div>

        {/* Fixes */}
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-gray-900">Top Fixes</h2>
            {!is_premium && (
              <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full font-medium">
                Free preview
              </span>
            )}
          </div>

          <div className="space-y-4">
            {top_3_fixes.map((fix, i) => {
              const locked = !is_premium && i > 0

              return (
                <div key={i} className="relative border border-gray-200 rounded-xl p-4">
                  <div className={locked ? "blur-sm select-none" : ""}>
                    <p className="text-gray-800">{fix.fix}</p>
                    <div className="flex gap-2 mt-2">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        fix.impact === "high" ? "bg-red-100 text-red-700" :
                        fix.impact === "medium" ? "bg-yellow-100 text-yellow-700" :
                        "bg-gray-100 text-gray-600"
                      }`}>
                        {fix.impact} impact
                      </span>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                        {fix.effort}
                      </span>
                    </div>
                  </div>

                  {locked && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-xl">
                      <button
                        onClick={() => router.push("/upgrade")}
                        className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm"
                      >
                        Unlock fix {i + 1} →
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="flex gap-3">
          {!is_premium && (
            <button
              onClick={() => router.push("/upgrade")}
              className="flex-1 bg-indigo-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
            >
              Unlock Full Report — €7/month
            </button>
          )}
          <button
            onClick={() => router.push("/cv")}
            className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
          >
            {is_premium ? "← Back to My CVs" : "Upload Different CV"}
          </button>
        </div>

      </div>
    </div>
  )
}
