"use client";

import { useState } from "react";
import Link from "next/link";

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

export default function BuildPage() {
  const [name, setName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cv, setCv] = useState<CV | null>(null);

  async function handleGenerate() {
    if (!name.trim() || !jobTitle.trim()) {
      setError("Please fill in your name and job title.");
      return;
    }
    setError("");
    setLoading(true);
    setCv(null);

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

  function handleEdit() {
    setCv(null);
    setError("");
  }

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <nav className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="font-bold text-lg">
            CVolt ⚡
          </Link>
          <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
            ← Home
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10">

        {!cv && (
          <>
            <header className="text-center mb-8">
              <h1 className="text-4xl font-bold tracking-tight mb-3">
                Build your CV
              </h1>
              <p className="text-gray-600">
                Fill in your details. AI will generate an ATS-optimized CV in seconds.
              </p>
            </header>

            <section className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm">
              <div className="space-y-5">

                <div>
                  <label htmlFor="name" className="block text-sm font-semibold mb-2">
                    Your name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jamie Dupont"
                    disabled={loading}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-base outline-none focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 transition disabled:opacity-60"
                  />
                </div>

                <div>
                  <label htmlFor="jobTitle" className="block text-sm font-semibold mb-2">
                    Job title <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="jobTitle"
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g. Marketing Manager, Software Engineer"
                    disabled={loading}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-base outline-none focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 transition disabled:opacity-60"
                  />
                </div>

                <div>
                  <label htmlFor="jd" className="block text-sm font-semibold mb-2">
                    Job description{" "}
                    <span className="text-xs font-normal text-gray-500">
                      (optional — boosts ATS score)
                    </span>
                  </label>
                  <textarea
                    id="jd"
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    rows={6}
                    placeholder="Paste the full job description here..."
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
                      Generating...
                    </>
                  ) : (
                    "Generate CV"
                  )}
                </button>
              </div>
            </section>
          </>
        )}

        {cv && (
          <section className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="flex items-start justify-between mb-6 pb-6 border-b border-gray-200 gap-4 flex-wrap">
              <div>
                <h2 className="text-2xl font-bold">{name}</h2>
                <p className="text-amber-600 font-medium mt-1">{jobTitle}</p>
              </div>
              <button
                onClick={handleEdit}
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                ← Edit
              </button>
            </div>

            {cv.summary && (
              <div className="mb-8">
                <h3 className="text-xs font-bold tracking-widest uppercase text-gray-500 mb-3">
                  Profile
                </h3>
                <p className="text-gray-800 leading-relaxed">{cv.summary}</p>
              </div>
            )}

            {cv.experience && cv.experience.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xs font-bold tracking-widest uppercase text-gray-500 mb-3">
                  Experience
                </h3>
                <div className="space-y-6">
                  {cv.experience.map((exp, i) => (
                    <div key={i}>
                      <div className="flex items-baseline justify-between mb-1 gap-2 flex-wrap">
                        <div className="font-bold">{exp.title}</div>
                        <div className="text-sm text-gray-500 whitespace-nowrap">
                          {exp.period}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">{exp.company}</div>
                      <ul className="space-y-1.5 text-gray-800 leading-relaxed pl-5">
                        {exp.bullets.map((b, j) => (
                          <li key={j} className="list-disc">
                            {b}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {cv.skills && cv.skills.length > 0 && (
              <div>
                <h3 className="text-xs font-bold tracking-widest uppercase text-gray-500 mb-3">
                  Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {cv.skills.map((s, i) => (
                    <span
                      key={i}
                      className="bg-amber-50 border border-amber-200 text-gray-900 text-sm font-semibold px-3 py-1.5 rounded-md"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}