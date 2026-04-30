'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface BulletResult {
  original: string;
  improved: string;
  explanation: string;
}

export default function BulletImproverPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bullets, setBullets] = useState('');
  const [improving, setImproving] = useState(false);
  const [results, setResults] = useState<BulletResult[]>([]);

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  const handleImprove = async () => {
    if (!bullets.trim()) return;

    setImproving(true);
    try {
      const response = await fetch('/api/ai/bullet-improver', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bullets: bullets.split('\n').filter(b => b.trim()) }),
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data.improvedBullets);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to improve bullets');
      }
    } catch (error) {
      console.error('Failed to improve bullets:', error);
      alert('Failed to improve bullets');
    } finally {
      setImproving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Bullet Point Improver</h1>
          <p className="mt-2 text-gray-600">
            Transform your CV bullet points into achievement-focused, ATS-friendly statements
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Your Bullet Points
            </h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="bullets" className="block text-sm font-medium text-gray-700 mb-2">
                  Enter your bullet points (one per line)
                </label>
                <textarea
                  id="bullets"
                  rows={12}
                  value={bullets}
                  onChange={(e) => setBullets(e.target.value)}
                  placeholder="• Managed a team of 5 developers
• Increased sales by 20%
• Implemented new software system"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={handleImprove}
                disabled={!bullets.trim() || improving}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {improving ? 'Improving...' : 'Improve Bullets'}
              </button>
            </div>
          </div>

          {/* Results */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Improved Bullets
            </h2>

            {results.length > 0 ? (
              <div className="space-y-4">
                {results.map((result, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="mb-2">
                      <p className="text-sm text-gray-600 mb-1">Original:</p>
                      <p className="text-gray-800 text-sm">{result.original}</p>
                    </div>
                    <div className="mb-2">
                      <p className="text-sm text-gray-600 mb-1">Improved:</p>
                      <p className="text-green-800 text-sm font-medium">{result.improved}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Why this is better:</p>
                      <p className="text-gray-700 text-sm">{result.explanation}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">
                Your improved bullet points will appear here.
              </p>
            )}
          </div>
        </div>

        {/* Tips */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Tips for Great Bullet Points</h3>
          <ul className="text-blue-800 space-y-1 text-sm">
            <li>• Start with strong action verbs (Led, Developed, Increased, Implemented)</li>
            <li>• Include quantifiable results when possible</li>
            <li>• Focus on achievements rather than responsibilities</li>
            <li>• Keep them concise (1-2 lines each)</li>
            <li>• Use keywords from the job description</li>
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