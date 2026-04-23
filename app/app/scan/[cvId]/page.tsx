"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useParams, useRouter } from "next/navigation"

interface ScanResult {
  overall_score: number
  top_3_fixes: Array<{
    fix: string
    impact: string
    effort: string
  }>
  verdict: string
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
        const response = await fetch("/api/ai/ats-scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cv_id: cvId }),
        })

        if (response.status === 402) {
          // Feature limit reached
          setShowUpgrade(true)
          setIsLoading(false)
          return
        }

        if (response.ok) {
          const data = await response.json()
          setScanResult(data)
        } else {
          const data = await response.json()
          setError(data.error || "Scan failed")
        }
      } catch (err) {
        setError("Something went wrong")
      } finally {
        setIsLoading(false)
      }
    }

    runScan()
  }, [session, cvId])

  if (!session) {
    return <div>Please sign in first</div>
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Analyzing your CV against 847 ATS criteria...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => router.push("/app/cv")}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (showUpgrade) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md mx-auto text-center">
          <div className="mb-8">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🚫</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Your CV is likely missing keywords that filters delete before a human sees it.
            </h2>
            <p className="text-gray-600">
              Unlock ATS scanning to find out exactly what's missing.
            </p>
          </div>

          <button
            onClick={() => router.push("/app/upgrade")}
            className="w-full bg-indigo-600 text-white py-3 px-6 rounded-md font-medium hover:bg-indigo-700"
          >
            Unlock Pro - €7/month
          </button>

          <p className="mt-4 text-sm text-gray-500">
            Cancel anytime • 30-day money-back guarantee
          </p>
        </div>
      </div>
    )
  }

  if (!scanResult) return null

  const score = scanResult.overall_score
  const scoreColor = score >= 70 ? "text-green-600" : score >= 40 ? "text-yellow-600" : "text-red-600"
  const scoreBg = score >= 70 ? "bg-green-100" : score >= 40 ? "bg-yellow-100" : "bg-red-100"

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Your ATS Score
          </h1>

          {/* Score Circle */}
          <div className={`w-32 h-32 ${scoreBg} rounded-full flex items-center justify-center mx-auto mb-6`}>
            <div className={`text-4xl font-bold ${scoreColor}`}>
              {score}
            </div>
          </div>

          <p className="text-lg text-gray-700 mb-6">
            {scanResult.verdict}
          </p>
        </div>

        {/* Teaser Recommendations */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Top Fixes (Preview)
          </h2>

          <div className="space-y-4">
            {scanResult.top_3_fixes.slice(0, 3).map((fix, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 relative">
                <div className="blur-sm">
                  <p className="text-gray-700">{fix.fix}</p>
                  <div className="flex gap-2 mt-2">
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {fix.impact} impact
                    </span>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      {fix.effort}
                    </span>
                  </div>
                </div>

                {/* Overlay for locked content */}
                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-900 mb-2">
                      Unlock full recommendations
                    </p>
                    <button
                      onClick={() => router.push("/app/upgrade")}
                      className="text-xs bg-indigo-600 text-white px-3 py-1 rounded"
                    >
                      Upgrade to Pro
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => router.push("/app/upgrade")}
            className="bg-indigo-600 text-white px-6 py-3 rounded-md font-medium hover:bg-indigo-700"
          >
            Unlock Full Report - €7/month
          </button>
          <button
            onClick={() => router.push("/app/cv")}
            className="bg-gray-200 text-gray-700 px-6 py-3 rounded-md font-medium hover:bg-gray-300"
          >
            Upload Different CV
          </button>
        </div>
      </div>
    </div>
  )
}