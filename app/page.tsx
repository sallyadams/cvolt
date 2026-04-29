import { redirect } from 'next/navigation';

export default function RootPage() {
  redirect('/en');
}

  return (
    <main className="relative bg-[#f8f6f1] text-[#19181e] overflow-x-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ─── Noise texture overlay (fixed, decorative) ─── */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.04] mix-blend-multiply"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* ═══════════════════════════════════════════════════
          NAV
      ═══════════════════════════════════════════════════ */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[rgba(248,246,241,0.85)] backdrop-blur-xl border-b border-[#e3dfd8]'
          : 'bg-transparent'
      }`}>
        <div className="max-w-6xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-0.5 text-[1.35rem] font-bold tracking-[-0.03em]" style={{ fontFamily: "'Fraunces', serif" }}>
            CV<em className="text-[#d4922a] not-italic">olt</em>
            <span className="text-[1.1rem] ml-0.5">⚡</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a href="#how" className="text-[0.88rem] font-medium text-[#6b6779] hover:text-[#19181e] transition-colors">How it works</a>
            <a href="#features" className="text-[0.88rem] font-medium text-[#6b6779] hover:text-[#19181e] transition-colors">Features</a>
            <a href="#pricing" className="text-[0.88rem] font-medium text-[#6b6779] hover:text-[#19181e] transition-colors">Pricing</a>
            <a href="#faq" className="text-[0.88rem] font-medium text-[#6b6779] hover:text-[#19181e] transition-colors">FAQ</a>
          </div>

          <Link
            href="/build"
            className="bg-[#19181e] text-white text-[0.82rem] font-semibold px-4 py-2.5 rounded-full hover:bg-[#2c2b34] transition-all duration-200 hover:-translate-y-0.5 shadow-[0_1px_3px_rgba(25,24,30,.08)]"
          >
            Build my CV →
          </Link>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════
          HERO
      ═══════════════════════════════════════════════════ */}
      <section className="relative pt-32 md:pt-40 pb-20 md:pb-32 px-5 md:px-8">

        {/* Decorative blur orb */}
        <div aria-hidden className="absolute top-32 right-[-10%] w-[500px] h-[500px] rounded-full opacity-40 blur-3xl"
          style={{ background: 'radial-gradient(circle, #fef3dc 0%, transparent 70%)' }}
        />
        <div aria-hidden className="absolute bottom-20 left-[-15%] w-[400px] h-[400px] rounded-full opacity-30 blur-3xl"
          style={{ background: 'radial-gradient(circle, #d5f5e8 0%, transparent 70%)' }}
        />

        <div className="relative max-w-6xl mx-auto grid lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-16 items-center">

          {/* Left — copy */}
          <div className="relative z-10">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 bg-white border border-[#e3dfd8] px-3 py-1.5 rounded-full mb-7 shadow-[0_1px_3px_rgba(25,24,30,.04)]">
              <span className="w-1.5 h-1.5 bg-[#1f8a5e] rounded-full animate-pulse" />
              <span className="text-[0.72rem] font-semibold tracking-wide text-[#2c2b34]">Now launching · From €1</span>
            </div>

            {/* Headline */}
            <h1 className="text-[2.75rem] sm:text-[3.5rem] lg:text-[4.5rem] font-bold leading-[0.95] tracking-[-0.04em] text-[#19181e] mb-6" style={{ fontFamily: "'Fraunces', serif" }}>
              Your CV.{' '}
              <em className="italic font-semibold text-[#d4922a]">Optimised</em>
              <br />
              in 60 seconds.
            </h1>

            {/* Sub */}
            <p className="text-[1.05rem] md:text-[1.18rem] text-[#6b6779] leading-[1.55] mb-9 max-w-[540px]">
              Paste a job description. Our AI rewrites your CV to match it —
              with the exact keywords recruiters search for. Pass ATS filters,
              land interviews.{' '}
              <strong className="text-[#19181e] font-semibold">One-time payment from €1.</strong>
            </p>

            {/* CTA row */}
            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <Link
                href="/build"
                className="group inline-flex items-center justify-center gap-2 bg-[#d4922a] text-white font-bold text-[1rem] px-7 py-4 rounded-full hover:brightness-105 hover:-translate-y-0.5 transition-all duration-200 shadow-[0_8px_24px_rgba(212,146,42,.35)]"
              >
                Build my CV — free preview
                <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">→</span>
              </Link>
              <a
                href="#how"
                className="inline-flex items-center justify-center gap-2 bg-white border border-[#e3dfd8] text-[#19181e] font-semibold text-[1rem] px-6 py-4 rounded-full hover:border-[#d4cfc6] transition-all duration-200"
              >
                See how it works
              </a>
            </div>

            {/* Trust bar */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-[0.8rem] text-[#6b6779]">
              <span className="flex items-center gap-1.5">
                <span className="text-[#1f8a5e]">✓</span> No subscription
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-[#1f8a5e]">✓</span> Takes 60 seconds
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-[#1f8a5e]">✓</span> ATS 85+ guaranteed
              </span>
            </div>
          </div>

          {/* Right — hero visual (CV card mockup) */}
          <div className="relative z-10">
            <HeroCVMockup />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          SOCIAL PROOF STRIP
      ═══════════════════════════════════════════════════ */}
      <section className="relative py-10 border-y border-[#e3dfd8] bg-white/40">
        <div className="max-w-6xl mx-auto px-5 md:px-8">
          <p className="text-center text-[0.68rem] font-bold tracking-[0.15em] uppercase text-[#a09cb2] mb-5">
            Built by job-seekers, for job-seekers
          </p>
          <div className="flex flex-wrap justify-center items-center gap-x-10 gap-y-4">
            {[
              { k: '1,247', v: 'CVs optimised' },
              { k: '87%', v: 'pass ATS first try' },
              { k: '3.2×', v: 'more interviews' },
              { k: '4.8★', v: 'avg rating' },
              { k: '15', v: 'countries' },
            ].map(stat => (
              <div key={stat.v} className="flex items-baseline gap-2">
                <span className="text-[1.3rem] font-bold text-[#19181e]" style={{ fontFamily: "'Fraunces', serif" }}>
                  {stat.k}
                </span>
                <span className="text-[0.78rem] text-[#6b6779]">{stat.v}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          PROBLEM SECTION
      ═══════════════════════════════════════════════════ */}
      <section className="relative py-20 md:py-28 px-5 md:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block text-[0.68rem] font-bold tracking-[0.15em] uppercase text-[#d94040] mb-4">
            The hidden problem
          </div>
          <h2 className="text-[2rem] md:text-[2.75rem] font-bold leading-[1.1] tracking-[-0.03em] text-[#19181e] mb-5" style={{ fontFamily: "'Fraunces', serif" }}>
            <span className="italic text-[#d94040]">75%</span> of CVs never reach a human.
          </h2>
          <p className="text-[1.05rem] md:text-[1.15rem] text-[#6b6779] leading-[1.6] max-w-2xl mx-auto">
            Before a recruiter sees your CV, it's filtered by{' '}
            <strong className="text-[#19181e] font-semibold">ATS software</strong>
            {' '}— Applicant Tracking Systems that scan for specific keywords from the job posting.
            Miss them, get rejected. It doesn't matter how qualified you are.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          HOW IT WORKS — 3 steps
      ═══════════════════════════════════════════════════ */}
      <section id="how" className="relative py-20 md:py-28 px-5 md:px-8 bg-white border-y border-[#e3dfd8]">
        <div className="max-w-6xl mx-auto">

          <div className="max-w-2xl mb-16">
            <div className="text-[0.68rem] font-bold tracking-[0.15em] uppercase text-[#d4922a] mb-4">
              How it works
            </div>
            <h2 className="text-[2rem] md:text-[2.75rem] font-bold leading-[1.05] tracking-[-0.03em] text-[#19181e]" style={{ fontFamily: "'Fraunces', serif" }}>
              Three steps. Sixty seconds.{' '}
              <em className="italic text-[#d4922a]">No fluff.</em>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                n: '01',
                title: 'Tell us about you',
                desc: 'Name, role, and a rough draft of your experience. Skip what you don\'t know — AI fills gaps.',
                icon: '✍️',
              },
              {
                n: '02',
                title: 'Paste the job ad',
                desc: 'Copy any job description. Our AI extracts every keyword recruiters care about and weaves them in naturally.',
                icon: '🎯',
              },
              {
                n: '03',
                title: 'Download your CV',
                desc: 'Pick a template, pay once (from €1), get a print-ready PDF. ATS 85+ guaranteed or full refund.',
                icon: '⬇️',
              },
            ].map((step, i) => (
              <div key={step.n} className="relative group">
                {/* Card */}
                <div className="bg-[#f8f6f1] border border-[#e3dfd8] rounded-[18px] p-7 h-full transition-all duration-300 hover:border-[#d4922a] hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(25,24,30,.08)]">
                  <div className="flex items-start justify-between mb-5">
                    <div className="text-[0.72rem] font-bold tracking-[0.1em] text-[#a09cb2]">
                      {step.n}
                    </div>
                    <div className="text-[1.75rem] opacity-80 group-hover:scale-110 transition-transform duration-300">
                      {step.icon}
                    </div>
                  </div>
                  <h3 className="text-[1.35rem] font-bold tracking-[-0.02em] text-[#19181e] mb-2.5 leading-[1.15]" style={{ fontFamily: "'Fraunces', serif" }}>
                    {step.title}
                  </h3>
                  <p className="text-[0.92rem] text-[#6b6779] leading-[1.6]">
                    {step.desc}
                  </p>
                </div>

                {/* Connector arrow (desktop only) */}
                {i < 2 && (
                  <div aria-hidden className="hidden md:block absolute top-1/2 -right-5 w-10 h-[1px] bg-[#e3dfd8] z-0">
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 text-[#d4cfc6] text-sm">→</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          ATS DEMO — before/after visual
      ═══════════════════════════════════════════════════ */}
      <section className="relative py-20 md:py-28 px-5 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">

            {/* Left — visual */}
            <div className="order-2 lg:order-1">
              <ATSScoreVisual />
            </div>

            {/* Right — copy */}
            <div className="order-1 lg:order-2">
              <div className="text-[0.68rem] font-bold tracking-[0.15em] uppercase text-[#1f8a5e] mb-4">
                The AI advantage
              </div>
              <h2 className="text-[2rem] md:text-[2.75rem] font-bold leading-[1.05] tracking-[-0.03em] text-[#19181e] mb-6" style={{ fontFamily: "'Fraunces', serif" }}>
                From{' '}
                <em className="italic text-[#d94040] not-italic relative inline-block">
                  <s>38/100</s>
                </em>
                {' '}to{' '}
                <em className="italic text-[#1f8a5e]">92/100</em>
                {' '}— in a minute.
              </h2>
              <p className="text-[1rem] md:text-[1.08rem] text-[#6b6779] leading-[1.65] mb-7">
                We don't just reformat your CV. Our AI reads the job description,
                identifies the exact keywords ATS software is scanning for, then
                rewrites your experience to surface them naturally — using the{' '}
                <strong className="text-[#19181e] font-semibold">Action Verb + Result</strong>
                {' '}formula recruiters love.
              </p>
              <ul className="space-y-3">
                {[
                  'Keywords added exactly where they matter',
                  'Bullet points rewritten with quantified results',
                  'ATS-safe formatting (parses cleanly every time)',
                  'All 3 templates optimised for scanners',
                ].map(pt => (
                  <li key={pt} className="flex items-start gap-3 text-[0.92rem] text-[#2c2b34]">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#d5f5e8] flex items-center justify-center text-[0.7rem] text-[#1f8a5e] font-bold mt-0.5">
                      ✓
                    </span>
                    {pt}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          FEATURES GRID
      ═══════════════════════════════════════════════════ */}
      <section id="features" className="relative py-20 md:py-28 px-5 md:px-8 bg-[#19181e] text-white">
        <div className="max-w-6xl mx-auto">

          <div className="max-w-2xl mb-14">
            <div className="text-[0.68rem] font-bold tracking-[0.15em] uppercase text-[#d4922a] mb-4">
              Features
            </div>
            <h2 className="text-[2rem] md:text-[2.75rem] font-bold leading-[1.05] tracking-[-0.03em] mb-4" style={{ fontFamily: "'Fraunces', serif" }}>
              Everything you need.{' '}
              <em className="italic text-[#d4922a]">Nothing you don't.</em>
            </h2>
            <p className="text-[1rem] text-white/60 leading-[1.6]">
              Built around what actually gets you hired — not fluff, not features for features' sake.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-[1px] bg-white/10 rounded-[18px] overflow-hidden border border-white/10">
            {[
              { icon: '🎯', title: 'AI job matcher', desc: 'Paste any job description. AI rewrites your CV to match it exactly, weaving in keywords naturally.' },
              { icon: '📊', title: 'Live ATS score', desc: 'Watch your score jump from 38 to 92 as AI optimises. See exactly what changed and why.' },
              { icon: '📄', title: '3 premium templates', desc: 'Modern (dark header), Classic (centered), Minimal (editorial). Switch instantly with one click.' },
              { icon: '⚡', title: '60-second builder', desc: 'Six screens, no friction. Start with a name, finish with a print-ready PDF.' },
              { icon: '🔒', title: 'Print-ready PDF', desc: 'Pixel-perfect A4 output with proper page breaks. No awkward splits, no broken fonts.' },
              { icon: '💎', title: 'One-time payment', desc: 'From €1. No subscription. No hidden fees. Lifetime downloads on the AI plan.' },
            ].map(f => (
              <div key={f.title} className="bg-[#19181e] p-7 lg:p-8 hover:bg-[#2c2b34] transition-colors duration-300 group">
                <div className="text-[1.75rem] mb-4 group-hover:scale-110 transition-transform duration-300 origin-left">
                  {f.icon}
                </div>
                <h3 className="text-[1.2rem] font-bold tracking-[-0.02em] mb-2" style={{ fontFamily: "'Fraunces', serif" }}>
                  {f.title}
                </h3>
                <p className="text-[0.88rem] text-white/60 leading-[1.6]">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          PRICING
      ═══════════════════════════════════════════════════ */}
      <section id="pricing" className="relative py-20 md:py-28 px-5 md:px-8">
        <div className="max-w-6xl mx-auto">

          <div className="text-center mb-14 max-w-2xl mx-auto">
            <div className="text-[0.68rem] font-bold tracking-[0.15em] uppercase text-[#d4922a] mb-4">
              Pricing
            </div>
            <h2 className="text-[2rem] md:text-[2.75rem] font-bold leading-[1.05] tracking-[-0.03em] text-[#19181e] mb-4" style={{ fontFamily: "'Fraunces', serif" }}>
              Pay once.{' '}
              <em className="italic text-[#d4922a]">Yours forever.</em>
            </h2>
            <p className="text-[1rem] text-[#6b6779] leading-[1.6]">
              No subscription. No free trial tricks. Just a one-time payment to unlock your CV.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5 lg:gap-6">
            {[
              {
                tier: 'Starter',
                name: 'Quick CV',
                price: 1,
                was: 3,
                desc: 'Perfect for a single application',
                features: ['1 PDF download', 'Modern template', 'ATS optimised', 'Instant delivery'],
                cta: 'Get started',
                highlight: false,
              },
              {
                tier: 'Best value',
                name: 'Pro CV',
                price: 7,
                was: 12,
                desc: 'For active job seekers',
                features: ['Unlimited downloads', 'All 3 templates', 'ATS score checker', 'Cover letter template', '30-day edits'],
                cta: 'Choose Pro',
                highlight: true,
              },
              {
                tier: 'AI-powered',
                name: 'AI CV',
                price: 15,
                was: 25,
                desc: 'Tailor to every job you apply for',
                features: ['Everything in Pro', 'AI job matcher', 'ATS 85+ guaranteed', 'Keyword gap analysis', 'Lifetime access'],
                cta: 'Go AI',
                highlight: false,
              },
            ].map(plan => (
              <div
                key={plan.name}
                className={`relative rounded-[22px] p-7 lg:p-8 transition-all duration-300 ${
                  plan.highlight
                    ? 'bg-[#19181e] text-white border-2 border-[#d4922a] shadow-[0_20px_60px_rgba(25,24,30,.15)] md:-translate-y-3'
                    : 'bg-white border border-[#e3dfd8] hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(25,24,30,.08)]'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#d4922a] text-white text-[0.62rem] font-bold tracking-[0.08em] uppercase px-3 py-1 rounded-full whitespace-nowrap shadow-[0_4px_12px_rgba(212,146,42,.4)]">
                    ⚡ Most popular
                  </div>
                )}

                <div className={`text-[0.62rem] font-bold tracking-[0.1em] uppercase mb-2 ${plan.highlight ? 'text-[#d4922a]' : 'text-[#a09cb2]'}`}>
                  {plan.tier}
                </div>
                <h3 className="text-[1.6rem] font-bold tracking-[-0.02em] mb-1.5" style={{ fontFamily: "'Fraunces', serif" }}>
                  {plan.name}
                </h3>
                <p className={`text-[0.85rem] mb-6 ${plan.highlight ? 'text-white/70' : 'text-[#6b6779]'}`}>
                  {plan.desc}
                </p>

                <div className="flex items-baseline gap-2 mb-6 pb-6 border-b border-current/10">
                  <span className={`text-[0.9rem] ${plan.highlight ? 'text-[#d4922a]' : 'text-[#d4922a]'}`}>€</span>
                  <span className="text-[3rem] font-bold tracking-[-0.05em] leading-none" style={{ fontFamily: "'Fraunces', serif" }}>
                    {plan.price}
                  </span>
                  <span className={`text-[0.85rem] line-through ml-1 ${plan.highlight ? 'text-white/40' : 'text-[#a09cb2]'}`}>
                    €{plan.was}
                  </span>
                  <span className={`text-[0.68rem] ml-2 ${plan.highlight ? 'text-[#d4922a]' : 'text-[#d4922a]'}`}>
                    one-time
                  </span>
                </div>

                <ul className="space-y-2.5 mb-8">
                  {plan.features.map(f => (
                    <li key={f} className={`flex items-start gap-2.5 text-[0.88rem] ${plan.highlight ? 'text-white/90' : 'text-[#2c2b34]'}`}>
                      <span className={`flex-shrink-0 text-[0.78rem] mt-0.5 font-bold ${plan.highlight ? 'text-[#d4922a]' : 'text-[#1f8a5e]'}`}>
                        ✓
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/build"
                  className={`block w-full text-center py-3.5 rounded-full font-bold text-[0.92rem] transition-all duration-200 ${
                    plan.highlight
                      ? 'bg-[#d4922a] text-white hover:brightness-110 hover:-translate-y-0.5 shadow-[0_4px_18px_rgba(212,146,42,.4)]'
                      : 'bg-[#19181e] text-white hover:bg-[#2c2b34] hover:-translate-y-0.5'
                  }`}
                >
                  {plan.cta} →
                </Link>
              </div>
            ))}
          </div>

          {/* Guarantee banner */}
          <div className="mt-10 max-w-2xl mx-auto bg-[#d5f5e8] border border-[rgba(31,138,94,.2)] rounded-[16px] px-6 py-4 flex items-center gap-3 text-center justify-center">
            <span className="text-[1.2rem]">🛡</span>
            <span className="text-[0.9rem] font-semibold text-[#1f8a5e]">
              ATS score 85+ guaranteed — or 100% refund, no questions asked.
            </span>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          TESTIMONIALS
      ═══════════════════════════════════════════════════ */}
      <section className="relative py-20 md:py-28 px-5 md:px-8 bg-white border-y border-[#e3dfd8]">
        <div className="max-w-6xl mx-auto">

          <div className="max-w-2xl mb-14">
            <div className="text-[0.68rem] font-bold tracking-[0.15em] uppercase text-[#2c6ef2] mb-4">
              What people say
            </div>
            <h2 className="text-[2rem] md:text-[2.75rem] font-bold leading-[1.05] tracking-[-0.03em] text-[#19181e]" style={{ fontFamily: "'Fraunces', serif" }}>
              CVs that actually{' '}
              <em className="italic text-[#d4922a]">land interviews.</em>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                quote: 'Applied to 4 jobs after CVolt. Got interviews for 3. My old CV got zero in two months.',
                name: 'Amélie L.',
                role: 'Marketing graduate · Paris',
                score: '94/100',
              },
              {
                quote: 'Paid €7 at 11pm, had my CV by 11:02. Best seven euros I\'ve ever spent.',
                name: 'Marcus K.',
                role: 'Junior developer · Berlin',
                score: '91/100',
              },
              {
                quote: 'The keyword matching is genuinely clever. I finally got past the ATS wall at big tech companies.',
                name: 'Priya N.',
                role: 'Data analyst · London',
                score: '96/100',
              },
            ].map((t, i) => (
              <figure key={i} className="bg-[#f8f6f1] border border-[#e3dfd8] rounded-[18px] p-7 flex flex-col">
                <div className="flex gap-0.5 mb-4 text-[#d4922a]">
                  {'★★★★★'}
                </div>
                <blockquote className="text-[1rem] text-[#2c2b34] leading-[1.6] mb-6 flex-1" style={{ fontFamily: "'Fraunces', serif" }}>
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <figcaption className="flex items-center justify-between pt-4 border-t border-[#ebe7e0]">
                  <div>
                    <div className="text-[0.88rem] font-bold text-[#19181e]">{t.name}</div>
                    <div className="text-[0.76rem] text-[#6b6779]">{t.role}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[0.62rem] font-bold tracking-[0.08em] uppercase text-[#1f8a5e]">ATS</div>
                    <div className="text-[1.05rem] font-bold text-[#1f8a5e]" style={{ fontFamily: "'Fraunces', serif" }}>
                      {t.score}
                    </div>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          FAQ
      ═══════════════════════════════════════════════════ */}
      <section id="faq" className="relative py-20 md:py-28 px-5 md:px-8">
        <div className="max-w-3xl mx-auto">

          <div className="text-center mb-12">
            <div className="text-[0.68rem] font-bold tracking-[0.15em] uppercase text-[#d4922a] mb-4">
              Questions
            </div>
            <h2 className="text-[2rem] md:text-[2.75rem] font-bold leading-[1.05] tracking-[-0.03em] text-[#19181e]" style={{ fontFamily: "'Fraunces', serif" }}>
              Things people ask.
            </h2>
          </div>

          <div className="space-y-3">
            {[
              { q: 'How is this different from ChatGPT?', a: 'ChatGPT gives you text. CVolt gives you a print-ready PDF with pixel-perfect formatting, ATS-safe layout, real page break handling, and an ATS score you can trust. Plus the AI is specifically trained for CV optimisation — not general conversation.' },
              { q: 'What if my ATS score is below 85?', a: 'Full refund, no questions asked. Email us within 14 days with your CV and the job you applied for, and we\'ll process the refund within 24 hours.' },
              { q: 'Do I need an account?', a: 'No. Your progress saves automatically in your browser. Close the tab, come back later, pick up where you left off. We only ask for your email at checkout.' },
              { q: 'Can I edit my CV after downloading?', a: 'Yes. The Pro and AI plans include 30 days of unlimited edits. You can tweak wording, swap templates, or regenerate for a new job — all included.' },
              { q: 'Is my data private?', a: 'Yes. Your CV data is stored locally in your browser (not on our servers). We only process it through Anthropic\'s API when you click "Generate," and we don\'t retain it afterward.' },
              { q: 'What payment methods do you accept?', a: 'All major cards through Stripe: Visa, Mastercard, Amex. Apple Pay and Google Pay on supported devices. All payments are SSL-encrypted and PCI-compliant.' },
            ].map((item, i) => (
              <FAQItem key={i} q={item.q} a={item.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          FINAL CTA
      ═══════════════════════════════════════════════════ */}
      <section className="relative py-20 md:py-28 px-5 md:px-8">
        <div className="max-w-4xl mx-auto relative">
          <div className="relative bg-gradient-to-br from-[#19181e] via-[#2c2b34] to-[#19181e] rounded-[28px] p-10 md:p-16 overflow-hidden">

            {/* Decorative glow */}
            <div aria-hidden className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full opacity-30 blur-3xl"
              style={{ background: 'radial-gradient(circle, #d4922a 0%, transparent 70%)' }}
            />

            <div className="relative text-center">
              <div className="text-[0.68rem] font-bold tracking-[0.15em] uppercase text-[#d4922a] mb-5">
                Ready when you are
              </div>
              <h2 className="text-[2.25rem] md:text-[3.25rem] font-bold leading-[1.05] tracking-[-0.03em] text-white mb-5" style={{ fontFamily: "'Fraunces', serif" }}>
                Your next job{' '}
                <em className="italic text-[#d4922a]">starts here.</em>
              </h2>
              <p className="text-[1rem] md:text-[1.1rem] text-white/70 leading-[1.6] mb-9 max-w-xl mx-auto">
                Build your CV, see your ATS score, preview three templates — all before you pay a cent.
              </p>
              <Link
                href="/build"
                className="group inline-flex items-center justify-center gap-2 bg-[#d4922a] text-white font-bold text-[1.05rem] px-8 py-4 rounded-full hover:brightness-110 hover:-translate-y-0.5 transition-all duration-200 shadow-[0_8px_32px_rgba(212,146,42,.5)]"
              >
                Start building now — free preview
                <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">→</span>
              </Link>
              <p className="text-[0.75rem] text-white/40 mt-5">
                Pay only when you download · From €1 · No subscription
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════════════ */}
      <footer className="relative border-t border-[#e3dfd8] py-12 px-5 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2">
              <div className="flex items-center gap-0.5 text-[1.35rem] font-bold tracking-[-0.03em] mb-3" style={{ fontFamily: "'Fraunces', serif" }}>
                CV<em className="text-[#d4922a] not-italic">olt</em>
                <span className="text-[1.1rem] ml-0.5">⚡</span>
              </div>
              <p className="text-[0.88rem] text-[#6b6779] leading-[1.6] max-w-sm">
                AI-optimised CVs that pass ATS filters and land interviews. Built for job-seekers, priced for everyone.
              </p>
            </div>

            <div>
              <div className="text-[0.7rem] font-bold tracking-[0.1em] uppercase text-[#a09cb2] mb-3">Product</div>
              <ul className="space-y-2">
                <li><Link href="/build" className="text-[0.85rem] text-[#2c2b34] hover:text-[#d4922a] transition-colors">Build CV</Link></li>
                <li><a href="#features" className="text-[0.85rem] text-[#2c2b34] hover:text-[#d4922a] transition-colors">Features</a></li>
                <li><a href="#pricing" className="text-[0.85rem] text-[#2c2b34] hover:text-[#d4922a] transition-colors">Pricing</a></li>
              </ul>
            </div>

            <div>
              <div className="text-[0.7rem] font-bold tracking-[0.1em] uppercase text-[#a09cb2] mb-3">Legal</div>
              <ul className="space-y-2">
                <li><a href="/privacy" className="text-[0.85rem] text-[#2c2b34] hover:text-[#d4922a] transition-colors">Privacy</a></li>
                <li><a href="/terms" className="text-[0.85rem] text-[#2c2b34] hover:text-[#d4922a] transition-colors">Terms</a></li>
                <li><a href="mailto:hello@cvolt.app" className="text-[0.85rem] text-[#2c2b34] hover:text-[#d4922a] transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-[#e3dfd8] flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-[0.78rem] text-[#a09cb2]">
              © {new Date().getFullYear()} CVolt. Built with care in Paris.
            </p>
            <div className="flex items-center gap-4 text-[0.78rem] text-[#a09cb2]">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-[#1f8a5e] rounded-full" />
                All systems operational
              </span>
            </div>
          </div>
        </div>
      </footer>

    </main>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   SUB-COMPONENTS
═══════════════════════════════════════════════════════════════════════ */

function HeroCVMockup() {
  return (
    <div className="relative" aria-hidden>
      {/* Main CV card */}
      <div className="relative bg-white rounded-[20px] shadow-[0_30px_80px_rgba(25,24,30,.18)] overflow-hidden transform rotate-[1.5deg] hover:rotate-0 transition-transform duration-500">
        {/* Dark header */}
        <div className="bg-[#19181e] px-6 py-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#d4922a] flex items-center justify-center text-[#19181e] font-bold text-sm">
            JD
          </div>
          <div>
            <div className="text-white font-bold text-sm tracking-[-0.02em]">Jamie Dupont</div>
            <div className="text-[#d4922a] text-[0.7rem] mt-0.5">Marketing Manager</div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="text-[0.58rem] font-bold tracking-[0.12em] uppercase text-[#d94040] mb-2 flex items-center gap-1.5">
            Profile
            <span className="flex-1 h-[1px] bg-[#f2efe9]" />
          </div>
          <div className="space-y-1 mb-4">
            <div className="h-[6px] bg-[#f2efe9] rounded-[3px] w-[95%]" />
            <div className="h-[6px] bg-[#f2efe9] rounded-[3px] w-[82%]" />
            <div className="h-[6px] bg-[#f2efe9] rounded-[3px] w-[70%]" />
          </div>

          <div className="text-[0.58rem] font-bold tracking-[0.12em] uppercase text-[#d94040] mb-2 flex items-center gap-1.5">
            Experience
            <span className="flex-1 h-[1px] bg-[#f2efe9]" />
          </div>
          <div className="mb-3">
            <div className="text-[0.7rem] font-bold text-[#19181e] mb-0.5">Growth Marketer @ Stripe</div>
            <div className="space-y-1">
              <div className="h-[5px] bg-[#f2efe9] rounded-[3px] w-[92%]" />
              <div className="h-[5px] bg-[#f2efe9] rounded-[3px] w-[85%]" />
            </div>
          </div>

          <div className="text-[0.58rem] font-bold tracking-[0.12em] uppercase text-[#d94040] mb-2 flex items-center gap-1.5">
            Skills
            <span className="flex-1 h-[1px] bg-[#f2efe9]" />
          </div>
          <div className="flex flex-wrap gap-1">
            {['SEO', 'Python', 'Analytics', 'Figma', 'A/B testing'].map(s => (
              <span key={s} className="bg-[#f2efe9] text-[#19181e] text-[0.58rem] font-bold px-1.5 py-0.5 rounded-[3px]">
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Floating ATS score badge */}
      <div className="absolute -top-4 -right-4 md:-right-6 bg-white rounded-2xl shadow-[0_12px_32px_rgba(31,138,94,.25)] border border-[#d5f5e8] p-4 z-10 transform rotate-[4deg] hover:rotate-0 transition-transform duration-300">
        <div className="text-[0.58rem] font-bold tracking-[0.08em] uppercase text-[#1f8a5e] mb-1">ATS Score</div>
        <div className="flex items-baseline gap-1">
          <span className="text-[2rem] font-bold text-[#1f8a5e] leading-none" style={{ fontFamily: "'Fraunces', serif" }}>
            92
          </span>
          <span className="text-[0.78rem] text-[#1f8a5e]/60">/100</span>
        </div>
        <div className="mt-1 inline-flex items-center gap-1 bg-[#1f8a5e] text-white text-[0.58rem] font-bold px-1.5 py-0.5 rounded">
          ▲ +54 pts
        </div>
      </div>

      {/* Floating keyword badge */}
      <div className="absolute -bottom-3 -left-3 md:-left-5 bg-white rounded-xl shadow-[0_12px_32px_rgba(212,146,42,.2)] border border-[#fef3dc] px-3 py-2.5 z-10 transform -rotate-[3deg] hover:rotate-0 transition-transform duration-300">
        <div className="flex items-center gap-2">
          <span className="text-base">🎯</span>
          <div>
            <div className="text-[0.68rem] font-bold text-[#19181e]">8 keywords matched</div>
            <div className="text-[0.6rem] text-[#6b6779]">from job description</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ATSScoreVisual() {
  return (
    <div className="relative bg-white border border-[#e3dfd8] rounded-[22px] p-6 md:p-8 shadow-[0_20px_50px_rgba(25,24,30,.08)]">
      <div className="text-[0.68rem] font-bold tracking-[0.12em] uppercase text-[#a09cb2] mb-5">
        ATS compatibility score
      </div>

      {/* Before */}
      <div className="mb-6">
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-[0.85rem] font-semibold text-[#6b6779]">Your original CV</span>
          <div className="flex items-baseline gap-1">
            <span className="text-[1.75rem] font-bold text-[#d94040]" style={{ fontFamily: "'Fraunces', serif" }}>38</span>
            <span className="text-[0.8rem] text-[#a09cb2]">/100</span>
          </div>
        </div>
        <div className="h-2 bg-[#fde8e8] rounded-full overflow-hidden">
          <div className="h-full bg-[#d94040] rounded-full" style={{ width: '38%' }} />
        </div>
        <div className="text-[0.72rem] text-[#d94040] mt-1.5 flex items-center gap-1">
          ⚠ Likely rejected by ATS
        </div>
      </div>

      {/* Arrow */}
      <div className="flex justify-center mb-5">
        <div className="bg-[#fef3dc] text-[#d4922a] w-10 h-10 rounded-full flex items-center justify-center font-bold">
          ↓
        </div>
      </div>

      {/* After */}
      <div className="mb-6">
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-[0.85rem] font-semibold text-[#1f8a5e]">After CVolt AI</span>
          <div className="flex items-baseline gap-1">
            <span className="text-[1.75rem] font-bold text-[#1f8a5e]" style={{ fontFamily: "'Fraunces', serif" }}>92</span>
            <span className="text-[0.8rem] text-[#a09cb2]">/100</span>
          </div>
        </div>
        <div className="h-2 bg-[#d5f5e8] rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#1f8a5e] to-[#2ca876] rounded-full" style={{ width: '92%' }} />
        </div>
        <div className="text-[0.72rem] text-[#1f8a5e] mt-1.5 flex items-center gap-1 font-semibold">
          ✓ Passes all major ATS systems
        </div>
      </div>

      {/* What changed */}
      <div className="pt-5 border-t border-[#ebe7e0]">
        <div className="text-[0.68rem] font-bold tracking-[0.08em] uppercase text-[#a09cb2] mb-3">
          What changed
        </div>
        <div className="space-y-2">
          {[
            { label: 'Summary rewritten', delta: '+12 pts' },
            { label: '8 keywords added', delta: '+24 pts' },
            { label: 'Bullets restructured', delta: '+18 pts' },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between text-[0.82rem]">
              <span className="text-[#2c2b34] flex items-center gap-2">
                <span className="text-[#1f8a5e]">✓</span>
                {item.label}
              </span>
              <span className="text-[#1f8a5e] font-bold">{item.delta}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`border rounded-[14px] transition-all duration-200 ${
      open ? 'bg-white border-[#d4922a] shadow-[0_4px_16px_rgba(212,146,42,.08)]' : 'bg-white border-[#e3dfd8] hover:border-[#d4cfc6]'
    }`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
        aria-expanded={open}
      >
        <span className={`text-[0.95rem] font-semibold ${open ? 'text-[#19181e]' : 'text-[#2c2b34]'}`}>
          {q}
        </span>
        <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[0.85rem] transition-all duration-200 ${
          open ? 'bg-[#d4922a] text-white rotate-45' : 'bg-[#f2efe9] text-[#6b6779]'
        }`}>
          +
        </span>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ease-out ${open ? 'max-h-96' : 'max-h-0'}`}>
        <p className="px-5 pb-5 text-[0.88rem] text-[#6b6779] leading-[1.65]">
          {a}
        </p>
      </div>
    </div>
  );
}