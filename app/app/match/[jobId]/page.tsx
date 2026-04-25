'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface CVDocument {
  id: string;
  filename: string;
  createdAt: string;
}

interface JobDescription {
  id: string;
  title: string;
  company: string;
  description: string;
}

interface MatchResult {
  matchScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  skillsAnalysis: string;
  experienceAssessment: string;
  recommendations: string[];
  interviewLikelihood: string;
}

export default function JobMatchPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const jobId = params.jobId as string;

  const [job, setJob] = useState<JobDescription | null>(null);
  const [cvs, setCvs] = useState<CVDocument[]>([]);
  const [selectedCvId, setSelectedCvId] = useState<string>('');
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated' && jobId) {
      fetchJobAndCvs();
    }
  }, [status, router, jobId]);

  const fetchJobAndCvs = async () => {
    try {
      const [jobResponse, cvsResponse] = await Promise.all([
        fetch(`/api/jobs/${jobId}`),
        fetch('/api/cv'),
      ]);

      if (jobResponse.ok) {
        const jobData = await jobResponse.json();
        setJob(jobData);
      }

      if (cvsResponse.ok) {
        const cvsData = await cvsResponse.json();
        setCvs(cvsData);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMatch = async () => {
    if (!selectedCvId) return;

    setMatching(true);
    try {
      const response = await fetch('/api/jobs/match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jobId, cvId: selectedCvId }),
      });

      if (response.ok) {
        const result = await response.json();
        setMatchResult(result);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to match CV');
      }
    } catch (error) {
      console.error('Failed to match CV:', error);
      alert('Failed to match CV');
    } finally {
      setMatching(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Job Not Found</h1>
          <p className="mt-2 text-gray-600">The job you're looking for doesn't exist.</p>
          <Link href="/match" className="mt-4 text-blue-600 hover:text-blue-500">
            ← Back to Job Matcher
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link href="/match" className="text-blue-600 hover:text-blue-500">
            ← Back to Job Matcher
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">
            Match CV to: {job.title} at {job.company}
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* CV Selection */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Select Your CV
            </h2>
            {cvs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No CVs found. Upload a CV first.</p>
                <Link
                  href="/cv"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Upload CV
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {cvs.map((cv) => (
                  <div key={cv.id} className="border rounded-lg p-4">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id={cv.id}
                        name="cv"
                        value={cv.id}
                        checked={selectedCvId === cv.id}
                        onChange={(e) => setSelectedCvId(e.target.value)}
                        className="mr-3"
                      />
                      <label htmlFor={cv.id} className="flex-1 cursor-pointer">
                        <div className="font-medium text-gray-900">{cv.filename}</div>
                        <div className="text-sm text-gray-500">
                          Uploaded {new Date(cv.createdAt).toLocaleDateString()}
                        </div>
                      </label>
                    </div>
                  </div>
                ))}

                <button
                  onClick={handleMatch}
                  disabled={!selectedCvId || matching}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {matching ? 'Matching...' : 'Match CV'}
                </button>
              </div>
            )}
          </div>

          {/* Match Results */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Match Results
            </h2>
            {matchResult ? (
              <div className="space-y-6">
                {/* Match Score */}
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-600">
                    {matchResult.matchScore}%
                  </div>
                  <p className="text-gray-600">Match Score</p>
                  <div className="mt-2">
                    <span className={`px-2 py-1 rounded-full text-sm ${
                      matchResult.interviewLikelihood === 'High'
                        ? 'bg-green-100 text-green-800'
                        : matchResult.interviewLikelihood === 'Medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {matchResult.interviewLikelihood} Interview Likelihood
                    </span>
                  </div>
                </div>

                {/* Matched Keywords */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Matched Keywords</h3>
                  <div className="flex flex-wrap gap-2">
                    {matchResult.matchedKeywords.map((keyword, index) => (
                      <span key={index} className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Missing Keywords */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Missing Keywords</h3>
                  <div className="flex flex-wrap gap-2">
                    {matchResult.missingKeywords.map((keyword, index) => (
                      <span key={index} className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Skills Analysis */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Skills Analysis</h3>
                  <p className="text-gray-700">{matchResult.skillsAnalysis}</p>
                </div>

                {/* Experience Assessment */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Experience Assessment</h3>
                  <p className="text-gray-700">{matchResult.experienceAssessment}</p>
                </div>

                {/* Recommendations */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Recommendations</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {matchResult.recommendations.map((rec, index) => (
                      <li key={index} className="text-gray-700">{rec}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">
                Select a CV and click "Match CV" to see results.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}