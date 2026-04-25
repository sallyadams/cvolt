"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useEffect, useState } from "react"

interface UserStats {
  totalScans: number
  lastScore: number | null
  subscriptionTier: string
  aiCreditsUsed: number
  aiCreditsLimit: number
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<UserStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!session?.user?.id) return

    const fetchStats = async () => {
      try {
        const response = await fetch("/api/dashboard/stats")
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (err) {
        console.error("Failed to load stats:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [session])

  if (!session) {
    return <div>Please sign in first</div>
  }

  const tierColor = {
    free: "bg-gray-100 text-gray-800",
    starter: "bg-blue-100 text-blue-800",
    pro: "bg-purple-100 text-purple-800",
    premium: "bg-yellow-100 text-yellow-800",
  }

  const tierLabel = stats?.subscriptionTier || "free"

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back, {session.user.name || session.user.email}</p>
          </div>
          <div className={`px-4 py-2 rounded-full text-sm font-medium ${tierColor[tierLabel as keyof typeof tierColor]}`}>
            {tierLabel.charAt(0).toUpperCase() + tierLabel.slice(1)} Plan
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        ) : stats ? (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* CV Health Score */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-sm font-medium text-gray-600 mb-4">CV Health Score</h2>
                <div className="flex items-center justify-center mb-4">
                  <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-3xl font-bold text-indigo-600">
                      {stats.lastScore ?? "—"}
                    </span>
                  </div>
                </div>
                <p className="text-gray-600 text-sm text-center">
                  {stats.lastScore === null
                    ? "Upload a CV to get started"
                    : stats.lastScore >= 70
                    ? "Great! Keep improving"
                    : "Room for improvement"}
                </p>
              </div>

              {/* Total Scans */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-sm font-medium text-gray-600 mb-4">Total Scans</h2>
                <div className="text-4xl font-bold text-gray-900 mb-4">{stats.totalScans}</div>
                <p className="text-gray-600 text-sm">ATS analyses run</p>
              </div>

              {/* Usage Meter */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-sm font-medium text-gray-600 mb-4">Monthly Usage</h2>
                <div className="mb-4">
                  <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full transition-all"
                      style={{
                        width: `${Math.min(
                          (stats.aiCreditsUsed / stats.aiCreditsLimit) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
                <p className="text-gray-600 text-sm">
                  {stats.aiCreditsUsed} / {stats.aiCreditsLimit} operations used
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link
                  href="/cv"
                  className="flex items-center justify-center px-6 py-4 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors"
                >
                  <span className="text-2xl mr-3">📄</span>
                  <span className="font-medium">Upload CV</span>
                </Link>

                <Link
                  href="/scan"
                  className="flex items-center justify-center px-6 py-4 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  <span className="text-2xl mr-3">🔍</span>
                  <span className="font-medium">ATS Scanner</span>
                </Link>

                <Link
                  href="/match"
                  className="flex items-center justify-center px-6 py-4 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <span className="text-2xl mr-3">🎯</span>
                  <span className="font-medium">Job Matcher</span>
                </Link>

                <Link
                  href="/tracker"
                  className="flex items-center justify-center px-6 py-4 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <span className="text-2xl mr-3">📊</span>
                  <span className="font-medium">Application Tracker</span>
                </Link>

                <Link
                  href="/bullets"
                  className="flex items-center justify-center px-6 py-4 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors"
                >
                  <span className="text-2xl mr-3">✨</span>
                  <span className="font-medium">Bullet Improver</span>
                </Link>

                <Link
                  href="/interview"
                  className="flex items-center justify-center px-6 py-4 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <span className="text-2xl mr-3">🎤</span>
                  <span className="font-medium">Interview Readiness</span>
                </Link>

                <Link
                  href="/cover-letter"
                  className="flex items-center justify-center px-6 py-4 bg-pink-50 text-pink-700 rounded-lg hover:bg-pink-100 transition-colors"
                >
                  <span className="text-2xl mr-3">📝</span>
                  <span className="font-medium">Cover Letter</span>
                </Link>

                <Link
                  href="/linkedin"
                  className="flex items-center justify-center px-6 py-4 bg-cyan-50 text-cyan-700 rounded-lg hover:bg-cyan-100 transition-colors"
                >
                  <span className="text-2xl mr-3">💼</span>
                  <span className="font-medium">LinkedIn Summary</span>
                </Link>
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Available Features */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Features</h3>
                <ul className="space-y-3">
                  <li className="flex items-center text-gray-700">
                    <span className="text-green-500 mr-3">✓</span>
                    ATS Scanner
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="text-green-500 mr-3">✓</span>
                    CV Upload & Storage
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="text-green-500 mr-3">✓</span>
                    Job Matcher
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className="text-green-500 mr-3">✓</span>
                    Application Tracker
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className={stats.subscriptionTier !== "free" ? "text-green-500" : "text-gray-300"} mr-3>
                      {stats.subscriptionTier !== "free" ? "✓" : "—"}
                    </span>
                    <span>Recruiter Scan</span>
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className={stats.subscriptionTier !== "free" ? "text-green-500" : "text-gray-300"} mr-3>
                      {stats.subscriptionTier !== "free" ? "✓" : "—"}
                    </span>
                    <span>Bullet Point Improver</span>
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className={stats.subscriptionTier !== "free" ? "text-green-500" : "text-gray-300"} mr-3>
                      {stats.subscriptionTier !== "free" ? "✓" : "—"}
                    </span>
                    <span>Interview Readiness Score</span>
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className={stats.subscriptionTier === "pro" || stats.subscriptionTier === "premium" ? "text-green-500" : "text-gray-300"} mr-3>
                      {stats.subscriptionTier === "pro" || stats.subscriptionTier === "premium" ? "✓" : "—"}
                    </span>
                    <span>Cover Letter Generator</span>
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className={stats.subscriptionTier === "pro" || stats.subscriptionTier === "premium" ? "text-green-500" : "text-gray-300"} mr-3>
                      {stats.subscriptionTier === "pro" || stats.subscriptionTier === "premium" ? "✓" : "—"}
                    </span>
                    <span>LinkedIn Summary Generator</span>
                  </li>
                  <li className="flex items-center text-gray-700">
                    <span className={stats.subscriptionTier === "pro" || stats.subscriptionTier === "premium" ? "text-green-500" : "text-gray-300"} mr-3>
                      {stats.subscriptionTier === "pro" || stats.subscriptionTier === "premium" ? "✓" : "—"}
                    </span>
                    <span>CV Editor with Version History</span>
                  </li>
                </ul>
              </div>

              {/* Upgrade CTA */}
              {stats.subscriptionTier === "free" && (
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg shadow-sm p-6 border border-indigo-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Upgrade to Pro</h3>
                  <p className="text-gray-600 mb-4">
                    Unlock unlimited ATS scans, recruiter feedback, and AI-powered improvements.
                  </p>
                  <Link
                    href="/app/upgrade"
                    className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                  >
                    View Plans
                  </Link>
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}