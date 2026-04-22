import type { ReactNode } from "react";

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

type Props = {
  name: string;
  jobTitle: string;
  cv: CV;
};

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <span className="w-[3px] h-4 bg-amber-500 rounded-full shrink-0" />
      <h2 className="text-[10.5px] font-bold tracking-[0.18em] uppercase text-gray-400 leading-none">
        {children}
      </h2>
    </div>
  );
}

export default function CVPreview({ name, jobTitle, cv }: Props) {
  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 print:shadow-none print:rounded-none print:border-none">
      {/* Premium amber gradient accent bar */}
      <div className="h-[5px] bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300" />

      <div className="px-8 pt-8 pb-10 sm:px-12 sm:pt-10">

        {/* ── Header ── */}
        <header className="pb-7 mb-7 border-b border-gray-100">
          <h1 className="text-[30px] font-bold text-gray-900 tracking-tight leading-tight">
            {name}
          </h1>
          <p className="text-[15px] font-semibold text-amber-600 mt-1.5 tracking-wide">
            {jobTitle}
          </p>
        </header>

        {/* ── Profile ── */}
        {cv.summary && (
          <section className="mb-8">
            <SectionLabel>Profile</SectionLabel>
            <p className="text-[14.5px] text-gray-700 leading-[1.75] max-w-prose">
              {cv.summary}
            </p>
          </section>
        )}

        {/* ── Experience ── */}
        {cv.experience && cv.experience.length > 0 && (
          <section className="mb-8">
            <SectionLabel>Experience</SectionLabel>
            <div className="space-y-7">
              {cv.experience.map((exp, i) => (
                <div key={i}>
                  <div className="flex items-start justify-between gap-4 mb-0.5">
                    <h3 className="font-bold text-gray-900 text-[15px] leading-snug">
                      {exp.title}
                    </h3>
                    <span className="text-[12px] text-gray-400 whitespace-nowrap pt-[2px] shrink-0 tabular-nums">
                      {exp.period}
                    </span>
                  </div>
                  <p className="text-[13px] font-medium text-gray-500 mb-3">
                    {exp.company}
                  </p>
                  <ul className="space-y-2">
                    {exp.bullets.map((b, j) => (
                      <li
                        key={j}
                        className="flex gap-2.5 text-[13.5px] text-gray-700 leading-relaxed"
                      >
                        <span className="text-amber-400 mt-[5px] shrink-0 text-[10px] leading-none">
                          ▸
                        </span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Skills ── */}
        {cv.skills && cv.skills.length > 0 && (
          <section>
            <SectionLabel>Skills</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {cv.skills.map((s, i) => (
                <span
                  key={i}
                  className="bg-gray-50 border border-gray-200 text-gray-800 text-[12.5px] font-semibold px-3 py-1.5 rounded-md leading-none"
                >
                  {s}
                </span>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
