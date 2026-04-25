'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
  createdAt: string;
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
        if (!response.ok) {
          throw new Error('Failed to fetch interview score');
        }
        const data = await response.json();
        setScore(data);
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
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
          <Link
            href="/interview"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Try Again
          </Link>
        </div>
      </div>
    );
  }

  if (!score) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 text-xl">Interview score not found</div>
        </div>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Interview Readiness Assessment
            </h1>
            <p className="text-gray-600">
              Your comprehensive interview preparation score
            </p>
          </div>

          {/* Overall Score */}
          <div className="text-center mb-8">
            <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full ${getScoreBg(score.overallScore)} mb-4`}>
              <div className={`text-4xl font-bold ${getScoreColor(score.overallScore)}`}>
                {score.overallScore}
              </div>
            </div>
            <div className="text-lg text-gray-600">Overall Score</div>
            <div className="text-sm text-gray-500 mt-1">
              Out of 100 points
            </div>
          </div>

          {/* Category Scores */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {Object.entries(score.categories).map(([category, value]) => (
              <div key={category} className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-gray-900 capitalize">
                    {category.replace(/([A-Z])/g, ' $1').trim()}
                  </h3>
                  <span className={`font-bold ${getScoreColor(value)}`}>
                    {value}/100
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${value >= 80 ? 'bg-green-500' : value >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${value}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          {/* Strengths */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Strengths</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {score.strengths.map((strength, index) => (
                <div key={index} className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="ml-3 text-gray-700">{strength}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Weaknesses */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Areas for Improvement</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {score.weaknesses.map((weakness, index) => (
                <div key={index} className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="ml-3 text-gray-700">{weakness}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Recommendations</h2>
            <div className="space-y-4">
              {score.recommendations.map((recommendation, index) => (
                <div key={index} className="bg-blue-50 border-l-4 border-blue-400 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-700">{recommendation}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/interview"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 text-center"
            >
              Run Another Assessment
            </Link>
            <Link
              href="/cv"
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 text-center"
            >
              Upload New CV
            </Link>
            <Link
              href="/upgrade"
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 text-center"
            >
              Upgrade for More Features
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}