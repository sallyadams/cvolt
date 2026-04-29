"use client";

import { PDFDownloadLink } from "@react-pdf/renderer";
import CVDocument from "./CVDocument";

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

export default function DownloadPDF({ name, jobTitle, cv }: Props) {
  const fileName = `${name.replace(/\s+/g, "_")}_CV.pdf`;

  return (
    <PDFDownloadLink
      document={<CVDocument name={name} jobTitle={jobTitle} cv={cv} />}
      fileName={fileName}
      className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold px-5 py-2.5 rounded-lg transition-colors text-sm shadow-sm"
    >
      {({ loading }) =>
        loading ? (
          <>
            <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Preparing PDF…
          </>
        ) : (
          <>
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
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Download PDF
          </>
        )
      }
    </PDFDownloadLink>
  );
}
