'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Question {
  question: string;
  suggested_answer: string;
  tip: string;
}

interface InterviewScore {
  id: string;
  cvId: string;
  overallScore: number;
  categories: {
    technicalSkills: number;
    softSkills: number;
    experience: number;
    communication: number;
    culturalFit: number;
  };
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  likelyQuestions: Question[];
  createdAt: string;
}

function QuestionCard({ q, index }: { q: Question; index: number }) {
  const [open, setOpen] = useState(index === 0);
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="font-medium text-gray-900 text-sm pr-4">
          <span className="text-indigo-600 font-bold mr-2">Q{index + 1}.</span>
          {q.question}
        </span>
        <span className="text-gray-400 text-lg shrink-0">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="px-5 pb-4 space-y-3">
          <div className="bg-indigo-50 rounded-lg p-4">
            <p className="text-xs font-semibold text-indigo-600 mb-1 uppercase tracking-wide">Suggested Answer</p>
            <p className="text-sm text-gray-800 leading-relaxed">{q.suggested_answer}</p>
          </div>
          <div className="bg-amber-50 rounded-lg px-4 py-3">
            <p className="text-xs font-semibold text-amber-700 mb-1 uppercase tracking-wide">Coaching Tip</p>
            <p className="text-sm text-amber-800">{q.tip}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function InterviewResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [score, setScore] = useState<InterviewScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    const fetchScore = async () => {
      try {
        const resolvedParams = await params;
        const response = await fetch(`/api/ai/interview-score/${resolvedParams.id}`);
        if (!response.ok) throw new Error('Failed to fetch interview score');
        const data = await response.json();

        // Also check sessionStorage for questions from this session
        let questions = data.likelyQuestions ?? [];
        if (!questions.length) {
          try {
            const stored = sessionStorage.getItem(`questions_${resolvedParams.id}`);
            if (stored) questions = JSON.parse(stored);
          } catch {
            // sessionStorage unavailable
          }
        }

        setScore({ ...data, likelyQuestions: questions });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchScore();
    }
  }, [status, router, params]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading interview assessment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl font-semibold mb-4">Error</div>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link href="/interview" className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700">
            Try Again
          </Link>
        </div>
      </div>
    );
  }

  if (!score) return null;

  const getScoreColor = (s: number) => s >= 80 ? 'text-green-600' : s >= 60 ? 'text-yellow-600' : 'text-red-600';
  const getScoreBg = (s: number) => s >= 80 ? 'bg-green-100' : s >= 60 ? 'bg-yellow-100' : 'bg-red-100';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* Overall score */}
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Interview Readiness Assessment</h1>
          <p className="text-gray-600 mb-6">Your comprehensive interview preparation score</p>
          <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full ${getScoreBg(score.overallScore)} mb-3`}>
            <span className={`text-4xl font-bold ${getScoreColor(score.overallScore)}`}>{score.overallScore}</span>
          </div>
          <p className="text-gray-500 text-sm">Out of 100 points</p>
        </div>

        {/* Category scores */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Category Breakdown</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(score.categories).map(([category, value]) => (
              <div key={category} className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-gray-900 capitalize text-sm">
                    {category.replace(/([A-Z])/g, ' $1').trim()}
                  </h3>
                  <span className={`font-bold text-sm ${getScoreColor(value)}`}>{value}/100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${value >= 80 ? 'bg-green-500' : value >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Likely questions */}
        {score.likelyQuestions?.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Likely Interview Questions</h2>
            <div className="space-y-3">
              {score.likelyQuestions.map((q, i) => (
                <QuestionCard key={i} q={q} index={i} />
              ))}
            </div>
          </div>
        )}

        {!score.likelyQuestions?.length && (
          <div className="bg-indigo-50 rounded-xl p-5 text-center">
            <p className="text-indigo-700 text-sm">
              Retake the assessment to get AI-generated interview questions and suggested answers.
            </p>
            <Link href="/interview" className="mt-3 inline-block bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700">
              Retake Assessment
            </Link>
          </div>
        )}

        {/* Strengths */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Your Strengths</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {score.strengths.map((strength, index) => (
              <div key={index} className="flex items-start gap-2">
                <span className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
                <p className="text-sm text-gray-700">{strength}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Weaknesses */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Areas for Improvement</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {score.weaknesses.map((weakness, index) => (
              <div key={index} className="flex items-start gap-2">
                <span className="w-5 h-5 bg-yellow-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </span>
                <p className="text-sm text-gray-700">{weakness}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Practice Tips</h2>
          <div className="space-y-3">
            {score.recommendations.map((rec, index) => (
              <div key={index} className="bg-blue-50 border-l-4 border-blue-400 px-4 py-3">
                <p className="text-sm text-blue-700">{rec}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pb-4">
          <Link href="/interview" className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 text-center text-sm font-medium">
            Run Another Assessment
          </Link>
          <Link href="/cv" className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 text-center text-sm font-medium">
            Upload New CV
          </Link>
        </div>

      </div>
    </div>
  );
}
