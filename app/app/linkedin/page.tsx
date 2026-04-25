'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface CVDocument {
  id: string;
  filename: string;
}

export default function LinkedInSummaryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [cvs, setCvs] = useState<CVDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedCvId, setSelectedCvId] = useState('');
  const [summary, setSummary] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      fetchCVs();
    }
  }, [status, router]);

  const fetchCVs = async () => {
    try {
      const response = await fetch('/api/cv');
      if (response.ok) {
        const cvsData = await response.json();
        setCvs(cvsData);
      }
    } catch (error) {
      console.error('Failed to fetch CVs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedCvId) return;

    setGenerating(true);
    try {
      const response = await fetch('/api/ai/linkedin-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cvId: selectedCvId }),
      });

      if (response.ok) {
        const data = await response.json();
        setSummary(data.summary);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to generate LinkedIn summary');
      }
    } catch (error) {
      console.error('Failed to generate summary:', error);
      alert('Failed to generate LinkedIn summary');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(summary);
    alert('Summary copied to clipboard!');
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
          <h1 className="text-3xl font-bold text-gray-900">LinkedIn Summary Generator</h1>
          <p className="mt-2 text-gray-600">
            Create an engaging, professional LinkedIn summary that showcases your expertise
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Generate Summary
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

              <button
                onClick={handleGenerate}
                disabled={!selectedCvId || generating}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {generating ? 'Generating...' : 'Generate LinkedIn Summary'}
              </button>
            </div>
          </div>

          {/* Results */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Your LinkedIn Summary</h2>
              {summary && (
                <button
                  onClick={handleCopy}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm"
                >
                  Copy
                </button>
              )}
            </div>

            {summary ? (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-800 leading-relaxed">
                  {summary}
                </p>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">
                  Select your CV and click "Generate LinkedIn Summary" to create an optimized profile summary.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Tips */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">LinkedIn Summary Tips</h3>
          <ul className="text-blue-800 space-y-1 text-sm">
            <li>• Keep it between 40-60 words for optimal engagement</li>
            <li>• Start with a hook that grabs attention</li>
            <li>• Highlight your unique value proposition</li>
            <li>• Include relevant keywords for searchability</li>
            <li>• End with a call to action or connection invitation</li>
            <li>• Use first person and conversational tone</li>
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