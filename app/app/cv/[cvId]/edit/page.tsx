'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface CVDocument {
  id: string;
  filename: string;
  content: string;
  version: number;
  createdAt: string;
}

interface CVVersion {
  id: string;
  version: number;
  content: string;
  filename: string;
  createdAt: string;
}

export default function CVEditorPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const cvId = params.cvId as string;

  const [cv, setCv] = useState<CVDocument | null>(null);
  const [versions, setVersions] = useState<CVVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [showVersions, setShowVersions] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated' && cvId) {
      fetchCV();
      fetchVersions();
    }
  }, [status, router, cvId]);

  const fetchCV = async () => {
    try {
      const response = await fetch(`/api/cv/${cvId}`);
      if (response.ok) {
        const cvData = await response.json();
        setCv(cvData);
        setEditedContent(cvData.content);
      } else {
        router.push('/cv');
      }
    } catch (error) {
      console.error('Failed to fetch CV:', error);
      router.push('/cv');
    } finally {
      setLoading(false);
    }
  };

  const fetchVersions = async () => {
    try {
      const response = await fetch(`/api/cv/${cvId}/versions`);
      if (response.ok) {
        const versionsData = await response.json();
        setVersions(versionsData);
      }
    } catch (error) {
      console.error('Failed to fetch versions:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/cv/${cvId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: editedContent }),
      });

      if (response.ok) {
        const updatedCv = await response.json();
        setCv(updatedCv);
        fetchVersions(); // Refresh versions
        alert('CV saved successfully!');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save CV');
      }
    } catch (error) {
      console.error('Failed to save CV:', error);
      alert('Failed to save CV');
    } finally {
      setSaving(false);
    }
  };

  const loadVersion = (version: CVVersion) => {
    setEditedContent(version.content);
    setShowVersions(false);
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

  if (!cv) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">CV Not Found</h1>
          <p className="mt-2 text-gray-600">The CV you're looking for doesn't exist.</p>
          <Link href="/cv" className="mt-4 text-blue-600 hover:text-blue-500">
            ← Back to CVs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link href="/cv" className="text-blue-600 hover:text-blue-500">
            ← Back to CVs
          </Link>
          <div className="mt-4 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit CV</h1>
              <p className="mt-2 text-gray-600">
                {cv.filename} (Version {cv.version})
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowVersions(!showVersions)}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Version History ({versions.length})
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Editor */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                CV Content
              </h2>
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                rows={30}
                className="w-full font-mono text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Edit your CV content here..."
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Version History */}
            {showVersions && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Version History
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {versions.map((version) => (
                    <div key={version.id} className="border rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-sm">
                          Version {version.version}
                        </span>
                        <button
                          onClick={() => loadVersion(version)}
                          className="text-blue-600 hover:text-blue-500 text-sm"
                        >
                          Load
                        </button>
                      </div>
                      <p className="text-xs text-gray-500">
                        {new Date(version.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                  {versions.length === 0 && (
                    <p className="text-gray-500 text-sm">No previous versions</p>
                  )}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <Link
                  href={`/scan/${cvId}`}
                  className="block w-full bg-green-600 text-white text-center py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  Run ATS Scan
                </Link>
                <Link
                  href="/match"
                  className="block w-full bg-purple-600 text-white text-center py-2 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                >
                  Match Jobs
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}