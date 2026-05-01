"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

const ERROR_MESSAGES: Record<string, { title: string; detail: string }> = {
  Configuration: {
    title: "Server configuration error",
    detail:
      "A required environment variable is missing on the server. " +
      "NEXTAUTH_SECRET and NEXTAUTH_URL must be set in your Vercel project settings.",
  },
  AccessDenied: {
    title: "Access denied",
    detail: "You do not have permission to sign in.",
  },
  Verification: {
    title: "Verification failed",
    detail: "The sign-in link has expired or has already been used.",
  },
  OAuthSignin: {
    title: "OAuth sign-in error",
    detail: "Could not start the OAuth sign-in flow. Check your provider configuration.",
  },
  OAuthCallback: {
    title: "OAuth callback error",
    detail:
      "The OAuth provider returned an error. " +
      "Make sure the callback URL in your provider settings matches: " +
      (typeof window !== "undefined"
        ? `${window.location.origin}/api/auth/callback/google`
        : "/api/auth/callback/google"),
  },
  OAuthCreateAccount: {
    title: "Account creation failed",
    detail: "Could not create an account using the OAuth provider.",
  },
  EmailCreateAccount: {
    title: "Account creation failed",
    detail: "Could not create an account using this email address.",
  },
  Callback: {
    title: "Callback error",
    detail: "An error occurred during the sign-in callback.",
  },
  Default: {
    title: "Authentication error",
    detail: "An unexpected error occurred during sign-in.",
  },
}

export default function AuthErrorPage() {
  const [errorCode, setErrorCode] = useState("Default")

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const code = params.get("error") || "Default"
      setErrorCode(code)
      console.error("[auth-error] error code:", code)
    } catch {
      /* ignore */
    }
  }, [])

  const { title, detail } =
    ERROR_MESSAGES[errorCode] ?? ERROR_MESSAGES.Default

  const isConfig = errorCode === "Configuration"

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm p-8">
        {/* Icon */}
        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-100 mx-auto mb-5">
          <svg
            className="w-7 h-7 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            />
          </svg>
        </div>

        <h1 className="text-xl font-bold text-gray-900 text-center mb-2">
          {title}
        </h1>
        <p className="text-sm text-gray-600 text-center mb-6">{detail}</p>

        {/* Config checklist */}
        {isConfig && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-sm text-amber-800 space-y-1">
            <p className="font-semibold mb-2">Vercel environment variables required:</p>
            <ul className="space-y-1 list-none">
              {[
                "NEXTAUTH_SECRET  — strong random secret (openssl rand -hex 32)",
                "NEXTAUTH_URL     — https://cvolt-app.vercel.app",
                "DATABASE_URL     — PostgreSQL connection string",
                "ANTHROPIC_API_KEY",
              ].map((v) => (
                <li key={v} className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5 flex-shrink-0">▸</span>
                  <code className="font-mono text-xs break-all">{v}</code>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Error code badge */}
        {errorCode !== "Default" && (
          <p className="text-center text-xs text-gray-400 mb-6">
            Error code:{" "}
            <code className="font-mono bg-gray-100 px-1 py-0.5 rounded">
              {errorCode}
            </code>
          </p>
        )}

        <div className="flex flex-col gap-3">
          <Link
            href="/login"
            className="block w-full text-center bg-indigo-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            Back to sign in
          </Link>
          <Link
            href="/"
            className="block w-full text-center bg-gray-100 text-gray-700 py-2.5 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Go to home
          </Link>
        </div>
      </div>
    </div>
  )
}
