"use client"

import { Suspense, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"

const plans = [
  {
    key: "starter",
    name: "Starter",
    price: "€1",
    period: "/month",
    features: [
      "5 ATS scans/month",
      "3 Recruiter scans/month",
      "20 bullet improvements/month",
      "2 cover letters/month",
      "1 LinkedIn summary/month",
    ],
    stripePriceId: "price_starter",
    popular: false,
  },
  {
    key: "pro",
    name: "Pro",
    price: "€7",
    period: "/month",
    features: [
      "20 ATS scans/month",
      "15 Recruiter scans/month",
      "100 bullet improvements/month",
      "10 cover letters/month",
      "5 LinkedIn summaries/month",
      "5 tailored CVs/month",
      "10 interview scores/month",
    ],
    stripePriceId: "price_pro",
    popular: true,
  },
  {
    key: "premium",
    name: "Premium",
    price: "€15",
    period: "/month",
    features: [
      "Unlimited everything",
      "Priority AI processing",
      "Advanced analytics",
      "Team features (coming soon)",
    ],
    stripePriceId: "price_premium",
    popular: false,
  },
]

function UpgradeContent() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedPlan = searchParams.get("plan")?.toLowerCase() ?? null
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleSubscribe = async (planKey: string, tier: string) => {
    if (!session) {
      router.push("/login")
      return
    }

    setIsLoading(planKey)
    setErrorMsg(null)

    try {
      const response = await fetch("/api/billing/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      })

      const data = await response.json().catch(() => ({}))

      if (response.ok && data.url) {
        window.location.href = data.url
      } else if (response.status === 503 || !data.url) {
        setErrorMsg("Payment setup is missing. Please contact support.")
      } else {
        setErrorMsg(data.error || "Failed to start checkout. Please try again.")
      }
    } catch {
      setErrorMsg("Network error. Please check your connection and try again.")
    } finally {
      setIsLoading(null)
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please sign in to upgrade your plan.</p>
          <button
            onClick={() => router.push("/login")}
            className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700"
          >
            Sign in
          </button>
        </div>
      </div>
    )
  }

  const hasPreselection = preselectedPlan && plans.some((p) => p.key === preselectedPlan)

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {hasPreselection ? "Complete Your Upgrade" : "Choose Your Plan"}
          </h1>
          <p className="text-xl text-gray-600">
            {hasPreselection
              ? `You selected the ${plans.find((p) => p.key === preselectedPlan)?.name} plan — click below to continue.`
              : "Stop guessing. Start getting interviews."}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-8 max-w-xl mx-auto bg-red-50 border border-red-200 rounded-lg px-5 py-4 flex items-start gap-3">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-red-700">{errorMsg}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const isPreselected = plan.key === preselectedPlan
            return (
              <div
                key={plan.name}
                id={`plan-${plan.key}`}
                className={`bg-white rounded-lg shadow-sm p-8 relative transition-all ${
                  isPreselected
                    ? "ring-2 ring-indigo-600 shadow-lg scale-[1.02]"
                    : plan.popular && !hasPreselection
                    ? "ring-2 ring-indigo-600"
                    : ""
                }`}
              >
                {isPreselected && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-indigo-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Your Selection
                    </span>
                  </div>
                )}
                {!isPreselected && plan.popular && !hasPreselection && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-indigo-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-500">{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(plan.key, plan.key)}
                  disabled={isLoading === plan.key}
                  className={`w-full py-3 px-6 rounded-md font-medium transition-colors ${
                    isPreselected || (plan.popular && !hasPreselection)
                      ? "bg-indigo-600 text-white hover:bg-indigo-700"
                      : "bg-gray-200 text-gray-900 hover:bg-gray-300"
                  } disabled:opacity-50`}
                >
                  {isLoading === plan.key ? "Processing..." : `Choose ${plan.name}`}
                </button>
              </div>
            )
          })}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-600">
            All plans include a 30-day money-back guarantee. Cancel anytime.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function UpgradePage() {
  return (
    <Suspense>
      <UpgradeContent />
    </Suspense>
  )
}
