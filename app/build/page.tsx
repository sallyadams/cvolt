'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function BuildPage() {
  const [name, setName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!name.trim() || !jobTitle.trim()) {
      alert('Please fill in your name and job title');
      return;
    }
    setIsGenerating(true);
    await new Promise(r => setTimeout(r, 1500));
    console.log('Generating CV for:', { name, jobTitle, jobDescription });
    setIsGenerating(false);
    alert('CV generated! (Hook up /api/generate-cv to replace this alert)');
  };

  return (
    <main className="min-h-screen bg-[#f8f6f1] text-[#19181e]">
      <style jsx global>{`
        body { font-family: 'DM Sans', sans-serif; }
        .f-serif { font-family: 'Fraunces', serif; }
        @keyframes fade-up { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-up { animation: fade-up 0.6s ease-out both; }
      `}</style>

      <nav className="sticky top-0 z-50 bg-[#f8f6f1]/90 backdrop-blur-xl border-b border-[#e3dfd8]">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1 hover:opacity-80 transition-opacity">
            <span className="f-serif text-[1.5rem] font-bold tracking-[-0.03em]">
              CV<em className="not-italic text-[#d4922a]">olt</em>
            </span>
            <span className="text-[1.1rem]">⚡</span>
          </Link>
          <Link href="/" className="text-[0.86rem] font-medium text-[#6b6779] hover:text-[#19181e] transition-colors">
            ← Back to home
          </Link>
        </div>
      </nav>

      <section className="relative py-16 sm:py-24 overflow-hidden">
        <div className="absolute top-20 -left-40 w-[400px] h-[400px] rounded-full bg-[#fef3dc] blur-3xl opacity-50 pointer-events-none" />
        <div className="absolute top-60 -right-32 w-[350px] h-[350px] rounded-full bg-[#dce8ff] blur-3xl opacity-40 pointer-events-none" />

        <div className="relative max-w-2xl mx-auto px-5 sm:px-8">
          <div className="text-center mb-12 animate-fade-up">
            <div className="text-[0.72rem] font-bold tracking-[0.14em] uppercase text-[#d4922a] mb-4">
              ✦ AI-Powered CV Builder
            </div>
            <h1 className="f-serif text-[2.5rem] sm:text-[3.25rem] font-bold tracking-[-0.04em] leading-[1.05] text-[#19181e] mb-5">
              Build your <span className="italic text-[#d4922a]">CV.</span>
            </h1>
            <p className="text-[1.05rem] text-[#6b6779] leading-[1.6]">
              Tell us about yourself and the job you want. We&apos;ll do the rest.
            </p>
          </div>

          <div className="bg-white border border-[#e3dfd8] rounded-[20px] p-6 sm:p-8 shadow-[0_4px_20px_rgba(25,24,30,0.06)] animate-fade-up" style={{ animationDelay: '0.1s' }}>
            <div className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-[0.82rem] font-semibold text-[#19181e] mb-2">
                  Your name <span className="text-[#d94040]">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jamie Dupont"
                  className="w-full bg-[#f8f6f1] border border-[#e3dfd8] rounded-[12px] px-4 py-3.5 text-[0.95rem] text-[#19181e] placeholder:text-[#a09cb2] outline-none focus:border-[#d4922a] focus:bg-white focus:ring-4 focus:ring-[#d4922a]/10 transition-all"
                />
              </div>

              <div>
                <label htmlFor="jobTitle" className="block text-[0.82rem] font-semibold text-[#19181e] mb-2">
                  Job title <span className="text-[#d94040]">*</span>
                </label>
                <input
                  id="jobTitle"
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Marketing Manager, Software Engineer"
                  className="w-full bg-[#f8f6f1] border border-[#e3dfd8] rounded-[12px] px-4 py-3.5 text-[0.95rem] text-[#19181e] placeholder:text-[#a09cb2] outline-none focus:border-[#d4922a] focus:bg-white focus:ring-4 focus:ring-[#d4922a]/10 transition-all"
                />
                <p className="text-[0.76rem] text-[#a09cb2] mt-1.5">💡 The role recruiters see first</p>
              </div>

              <div>
                <label htmlFor="jobDescription" className="block text-[0.82rem] font-semibold text-[#19181e] mb-2">
                  Job description{' '}
                  <span className="text-[0.7rem] font-semibold uppercase tracking-wider bg-[rgba(44,110,242,0.1)] border border-[rgba(44,110,242,0.2)] text-[#2c6ef2] px-2 py-0.5 rounded ml-1">
                    ⚡ Boosts ATS +40pts
                  </span>
                </label>
                <textarea
                  id="jobDescription"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  rows={6}
                  placeholder="Paste the full job description here..."
                  className="w-full bg-[#f8f6f1] border border-[#e3dfd8] rounded-[12px] px-4 py-3.5 text-[0.92rem] text-[#19181e] placeholder:text-[#a09cb2] leading-[1.6] resize-none outline-none focus:border-[#d4922a] focus:bg-white focus:ring-4 focus:ring-[#d4922a]/10 transition-all"
                />
                <p className="text-[0.76rem] text-[#a09cb2] mt-1.5">🔒 Used only to tailor your CV. Never stored.</p>
              </div>

              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="group w-full bg-[#19181e] hover:bg-[#2c2b34] disabled:bg-[#6b6779] disabled:cursor-not-allowed text-white text-[0.95rem] font-bold px-6 py-4 rounded-[12px] transition-all duration-200 shadow-[0_4px_20px_rgba(25,24,30,0.15)] hover:shadow-[0_8px_30px_rgba(25,24,30,0.2)] hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating your CV...
                  </>
                ) : (
                  <>
                    Generate CV
                    <span className="inline-block group-hover:translate-x-1 transition-transform">→</span>
                  </>
                )}
              </button>

              <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 pt-2 text-[0.78rem] text-[#6b6779]">
                <div className="flex items-center gap-1.5"><span className="text-[#1f8a5e]">✓</span> Free to preview</div>
                <div className="flex items-center gap-1.5"><span className="text-[#1f8a5e]">✓</span> No account needed</div>
                <div className="flex items-center gap-1.5"><span className="text-[#1f8a5e]">✓</span> 60 seconds</div>
              </div>
            </div>
          </div>

          <div className="mt-6 bg-[#d5f5e8] border border-[rgba(31,138,94,0.2)] rounded-[12px] px-4 py-3 flex items-center gap-3 animate-fade-up" style={{ animationDelay: '0.2s' }}>
            <span className="text-[1.25rem]">🛡️</span>
            <div>
              <div className="font-bold text-[#1f8a5e] text-[0.88rem]">ATS score 85+ guarantee</div>
              <div className="text-[0.76rem] text-[#1f8a5e]/80">Below 80? Full refund, no questions asked.</div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}