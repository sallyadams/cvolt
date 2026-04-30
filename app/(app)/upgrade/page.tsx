"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

const plans = [
  {
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
    stripePriceId: "price_starter", // Will be set up in Stripe
    popular: false,
  },
  {
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

export default function UpgradePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState<string | null>(null)

  const handleSubscribe = async (priceId: string, tier: string) => {
    if (!session) {
      router.push("/login")
      return
    }

    setIsLoading(priceId)

    try {
      const response = await fetch("/api/billing/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, priceId }),
      })

      if (response.ok) {
        const { url } = await response.json()
        window.location.href = url
      } else {
        alert("Failed to create checkout session")
      }
    } catch (error) {
      alert("Something went wrong")
    } finally {
      setIsLoading(null)
    }
  }

  if (!session) {
    return <div>Please sign in first</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600">
            Stop guessing. Start getting interviews.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`bg-white rounded-lg shadow-sm p-8 relative ${
                plan.popular ? "ring-2 ring-indigo-600" : ""
              }`}
            >
              {plan.popular && (
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
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(plan.stripePriceId, plan.name.toLowerCase())}
                disabled={isLoading === plan.stripePriceId}
                className={`w-full py-3 px-6 rounded-md font-medium transition-colors ${
                  plan.popular
                    ? "bg-indigo-600 text-white hover:bg-indigo-700"
                    : "bg-gray-200 text-gray-900 hover:bg-gray-300"
                } disabled:opacity-50`}
              >
                {isLoading === plan.stripePriceId ? "Processing..." : `Choose ${plan.name}`}
              </button>
            </div>
          ))}
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