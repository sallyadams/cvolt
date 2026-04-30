'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface CVDocument {
  id: string;
  filename: string;
}

interface JobDescription {
  id: string;
  title: string;
  company: string;
}

export default function InterviewReadinessPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [cvs, setCvs] = useState<CVDocument[]>([]);
  const [jobs, setJobs] = useState<JobDescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedCvId, setSelectedCvId] = useState('');
  const [selectedJobId, setSelectedJobId] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      fetchData();
    }
  }, [status, router]);

  const fetchData = async () => {
    try {
      const [cvsResponse, jobsResponse] = await Promise.all([
        fetch('/api/cv'),
        fetch('/api/jobs'),
      ]);

      if (cvsResponse.ok) {
        const cvsData = await cvsResponse.json();
        setCvs(cvsData);
      }

      if (jobsResponse.ok) {
        const jobsData = await jobsResponse.json();
        setJobs(jobsData);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedCvId || !selectedJobId) return;

    setAnalyzing(true);
    try {
      const response = await fetch('/api/ai/interview-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cvId: selectedCvId, jobId: selectedJobId }),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/interview/${data.id}`);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to analyze interview readiness');
      }
    } catch (error) {
      console.error('Failed to analyze:', error);
      alert('Failed to analyze interview readiness');
    } finally {
      setAnalyzing(false);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Interview Readiness Score</h1>
          <p className="mt-2 text-gray-600">
            Get a comprehensive assessment of your interview preparedness
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Select Your Materials
          </h2>

          <div className="space-y-4">
            {/* CV Selection */}
            <div>
              <label htmlFor="cv" className="block text-sm font-medium text-gray-700 mb-2">
                Your CV
              </label>
              <select
                id="cv"
                value={selectedCvId}
                onChange={(e) => setSelectedCvId(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Select a CV...</option>
                {cvs.map((cv) => (
                  <option key={cv.id} value={cv.id}>
                    {cv.filename}
                  </option>
                ))}
              </select>
            </div>

            {/* Job Selection */}
            <div>
              <label htmlFor="job" className="block text-sm font-medium text-gray-700 mb-2">
                Target Job
              </label>
              <select
                id="job"
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Select a job...</option>
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title} at {job.company}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={!selectedCvId || !selectedJobId || analyzing}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {analyzing ? 'Analyzing...' : 'Analyze Interview Readiness'}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-8 flex justify-center">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-500"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}