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

export default function CoverLetterPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [cvs, setCvs] = useState<CVDocument[]>([]);
  const [jobs, setJobs] = useState<JobDescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedCvId, setSelectedCvId] = useState('');
  const [selectedJobId, setSelectedJobId] = useState('');
  const [coverLetter, setCoverLetter] = useState('');

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

  const handleGenerate = async () => {
    if (!selectedCvId || !selectedJobId) return;

    setGenerating(true);
    try {
      const response = await fetch('/api/ai/cover-letter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cvId: selectedCvId, jobId: selectedJobId }),
      });

      if (response.ok) {
        const data = await response.json();
        setCoverLetter(data.coverLetter);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to generate cover letter');
      }
    } catch (error) {
      console.error('Failed to generate cover letter:', error);
      alert('Failed to generate cover letter');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([coverLetter], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cover-letter.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Cover Letter Generator</h1>
          <p className="mt-2 text-gray-600">
            Create personalized, compelling cover letters tailored to specific job applications
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Form */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Generate Cover Letter
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
                onClick={handleGenerate}
                disabled={!selectedCvId || !selectedJobId || generating}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {generating ? 'Generating...' : 'Generate Cover Letter'}
              </button>
            </div>
          </div>

          {/* Cover Letter Display */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Your Cover Letter</h2>
                {coverLetter && (
                  <button
                    onClick={handleDownload}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 text-sm"
                  >
                    Download
                  </button>
                )}
              </div>

              {coverLetter ? (
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="whitespace-pre-wrap text-gray-800 font-sans text-sm leading-relaxed">
                    {coverLetter}
                  </pre>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">
                    Select your CV and target job, then click "Generate Cover Letter" to create a personalized cover letter.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="mt-8 bg-green-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-900 mb-2">Cover Letter Best Practices</h3>
          <ul className="text-green-800 space-y-1 text-sm">
            <li>• Keep it to 3-4 paragraphs (250-400 words)</li>
            <li>• Customize for each job application</li>
            <li>• Highlight relevant achievements and skills</li>
            <li>• Show enthusiasm for the company and role</li>
            <li>• End with a clear call to action</li>
          </ul>
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