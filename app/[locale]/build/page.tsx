"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import CVPreview from "./CVPreview";
import LanguageSwitcher from "@/components/LanguageSwitcher";

// react-pdf uses browser APIs — must be client-only
const DownloadPDF = dynamic(() => import("./DownloadPDF"), {
  ssr: false,
  loading: () => (
    <span className="inline-flex items-center gap-2 bg-amber-200 text-amber-800 font-bold px-5 py-2.5 rounded-lg text-sm cursor-wait">
      <span className="inline-block w-3.5 h-3.5 border-2 border-amber-400 border-t-amber-700 rounded-full animate-spin" />
      Loading PDF...
    </span>
  ),
});

// CV data is saved here before the Stripe redirect so it survives the page reload
const STORAGE_KEY = "cvolt_pending_cv";

type Experience = {
  title: string;
  company: string;
  period: string;
  bullets: string[];
};

type CV = {
  summary: string;
  skills: string[];
  experience: Experience[];
};

type PaymentStatus =
  | "idle"       // default, no payment attempt
  | "pending"    // waiting for checkout URL / about to redirect
  | "verifying"  // returned from Stripe, confirming server-side
  | "success"    // payment verified, PDF unlocked
  | "cancelled"  // user clicked "back" on Stripe
  | "error";     // verification failed

function saveCVToStorage(name: string, jobTitle: string, cv: CV) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ name, jobTitle, cv }));
  } catch { /* private/storage-full — graceful no-op */ }
}

function loadCVFromStorage(): { name: string; jobTitle: string; cv: CV } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function clearCVStorage() {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* no-op */ }
}

export default function BuildPage() {
  const t = useTranslations();
  const locale = useLocale();
  const [name, setName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cv, setCv] = useState<CV | null>(null);

  // Payment gate state
  const [isPaid, setIsPaid] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("idle");
  const [verifyError, setVerifyError] = useState("");

  // On mount: check if we're returning from a Stripe redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get("payment");
    const sessionId = params.get("session_id");

    // Clean the URL immediately so it doesn't confuse on refresh
    window.history.replaceState(null, "", `/${locale}/build`);

    if (payment === "success" && sessionId) {
      handlePaymentReturn(sessionId);
    } else if (payment === "cancelled") {
      handlePaymentCancel();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Stripe return handlers ────────────────────────────────────────────────

  async function handlePaymentReturn(sessionId: string) {
    // Restore CV first so the user sees their work immediately
    const saved = loadCVFromStorage();
    if (saved) {
      setName(saved.name);
      setJobTitle(saved.jobTitle);
      setCv(saved.cv);
    }

    setPaymentStatus("verifying");

    try {
      console.log("[build] Verifying payment with sessionId:", sessionId.slice(0, 25) + "…");
      const res = await fetch(`/api/verify-payment?session_id=${encodeURIComponent(sessionId)}`);
      const data = await res.json();

      console.log("[build] Verification response:", data);

      if (data.verified) {
        setIsPaid(true);
        setPaymentStatus("success");
        clearCVStorage();
      } else {
        const errorMsg = data.error || "Payment could not be verified.";
        console.error("[build] Payment verification failed:", errorMsg);
        setVerifyError(errorMsg);
        setPaymentStatus("error");
      }
    } catch (err) {
      console.error("[build] Verification request failed:", err);
      setVerifyError(err instanceof Error ? err.message : "Network error during verification.");
      setPaymentStatus("error");
    }
  }

  function handlePaymentCancel() {
    const saved = loadCVFromStorage();
    if (saved) {
      setName(saved.name);
      setJobTitle(saved.jobTitle);
      setCv(saved.cv);
      setPaymentStatus("cancelled");
    }
    // If localStorage was lost, the user just sees the empty form — acceptable edge case
  }

  // ── Main actions ──────────────────────────────────────────────────────────

  async function handleGenerate() {
    if (!name.trim() || !jobTitle.trim()) {
      setError("Please fill in your name and job title.");
      return;
    }
    setError("");
    setVerifyError("");
    setLoading(true);
    setCv(null);
    setIsPaid(false);
    setPaymentStatus("idle");
    clearCVStorage();

    try {
      const res = await fetch("/api/generate-cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, jobTitle, jobDescription }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Generation failed");
      }
      setCv(data.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handlePayToDownload() {
    if (!cv) return;

    // Persist CV before leaving — Stripe redirects kill React state
    saveCVToStorage(name, jobTitle, cv);
    setPaymentStatus("pending");

    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Could not start checkout");
      }
      // Hard redirect — Stripe Checkout lives on stripe.com
      window.location.href = data.url;
    } catch (e) {
      setPaymentStatus("error");
      setError(e instanceof Error ? e.message : "Payment setup failed. Please try again.");
    }
  }

  function handleEdit() {
    setCv(null);
    setIsPaid(false);
    setPaymentStatus("idle");
    setError("");
    setVerifyError("");
    clearCVStorage();
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <nav className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href={`/${locale}`} className="font-bold text-lg">
            {t('nav.brand')}
          </Link>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Link href={`/${locale}`} className="text-sm text-gray-600 hover:text-gray-900">
              ← {t('common.back')}
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10">

        {/* ── Input form (shown when no CV yet) ── */}
        {!cv && (
          <>
            <header className="text-center mb-8">
              <h1 className="text-4xl font-bold tracking-tight mb-3">
                {t('build.title')}
              </h1>
              <p className="text-gray-600">
                {t('build.subtitle')}
              </p>
            </header>

            <section className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm">
              <div className="space-y-5">

                <div>
                  <label htmlFor="name" className="block text-sm font-semibold mb-2">
                    {t('build.form.name')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('build.form.namePlaceholder')}
                    disabled={loading}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-base outline-none focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 transition disabled:opacity-60"
                  />
                </div>

                <div>
                  <label htmlFor="jobTitle" className="block text-sm font-semibold mb-2">
                    {t('build.form.jobTitle')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="jobTitle"
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder={t('build.form.jobTitlePlaceholder')}
                    disabled={loading}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-base outline-none focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 transition disabled:opacity-60"
                  />
                </div>

                <div>
                  <label htmlFor="jd" className="block text-sm font-semibold mb-2">
                    {t('build.form.jobDescription')}{" "}
                    <span className="text-xs font-normal text-gray-500">
                      (optional — boosts ATS score)
                    </span>
                  </label>
                  <textarea
                    id="jd"
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    rows={6}
                    placeholder={t('build.form.jobDescriptionPlaceholder')}
                    disabled={loading}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-base outline-none focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 transition disabled:opacity-60 resize-none"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="w-full bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold px-6 py-4 rounded-lg transition flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {t('build.form.generating')}
                    </>
                  ) : (
                    t('build.form.generate')
                  )}
                </button>
              </div>
            </section>
          </>
        )}

        {/* ── CV section (free preview + gated download) ── */}
        {cv && (
          <div>

            {/* ── Status banners ── */}
            {paymentStatus === "success" && (
              <div className="flex items-center gap-3 bg-green-50 border border-green-200 text-green-800 rounded-xl px-4 py-3 mb-5 text-sm font-medium">
                <span className="text-base">✓</span>
                {t('build.payment.success')}
              </div>
            )}
            {paymentStatus === "verifying" && (
              <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl px-4 py-3 mb-5 text-sm">
                <span className="inline-block w-3.5 h-3.5 border-2 border-blue-300 border-t-blue-700 rounded-full animate-spin shrink-0" />
                {t('build.payment.loading')}
              </div>
            )}
            {paymentStatus === "cancelled" && (
              <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 mb-5 text-sm">
                {t('build.payment.cancelled')}
              </div>
            )}
            {paymentStatus === "error" && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-5 text-sm space-y-1">
                <p className="font-semibold">{t('build.payment.error')}</p>
                {verifyError && <p className="opacity-80">{verifyError}</p>}
              </div>
            )}

            {/* ── Top action bar ── */}
            <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
              <button
                onClick={handleEdit}
                className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
              >
                ← {t('common.back')}
              </button>

              {isPaid ? (
                <DownloadPDF name={name} jobTitle={jobTitle} cv={cv} />
              ) : (
                <PayButton status={paymentStatus} onClick={handlePayToDownload} />
              )}
            </div>

            {/* ── Premium CV card (always free) ── */}
            <CVPreview name={name} jobTitle={jobTitle} cv={cv} />

            {/* ── Bottom CTA ── */}
            <div className="mt-6">
              {isPaid ? (
                <div className="flex justify-center">
                  <DownloadPDF name={name} jobTitle={jobTitle} cv={cv} />
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center shadow-sm">
                  <p className="text-sm text-gray-500 mb-4">
                    Your CV looks great. Pay once to download a high-quality, ATS-ready PDF.
                  </p>
                  <PayButton status={paymentStatus} onClick={handlePayToDownload} size="lg" />
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </main>
  );
}

// ── PayButton ─────────────────────────────────────────────────────────────────

type PayButtonProps = {
  status: PaymentStatus;
  onClick: () => void;
  size?: "default" | "lg";
};

function PayButton({ status, onClick, size = "default" }: PayButtonProps) {
  const t = useTranslations();
  const busy = status === "pending" || status === "verifying";

  const base =
    "inline-flex items-center justify-center gap-2 font-bold rounded-lg transition-colors shadow-sm text-white";
  const sizeClass =
    size === "lg"
      ? "px-8 py-3.5 text-base"
      : "px-5 py-2.5 text-sm";
  const colorClass = busy
    ? "bg-amber-300 cursor-wait"
    : "bg-amber-600 hover:bg-amber-700";

  return (
    <button
      onClick={onClick}
      disabled={busy}
      className={`${base} ${sizeClass} ${colorClass}`}
    >
      {busy ? (
        <>
          <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          {status === "verifying" ? t('build.payment.loading') : t('build.payment.paying')}
        </>
      ) : (
        <>
          <LockIcon />
          {t('build.payment.downloadButton')}
        </>
      )}
    </button>
  );
}

function LockIcon() {
  return (
    <svg
      className="w-4 h-4 shrink-0"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    </svg>
  );
}
