'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface JobDescription {
  id: string;
  title: string;
  company: string;
}

interface CVDocument {
  id: string;
  filename: string;
}

export default function AddApplicationPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [jobs, setJobs] = useState<JobDescription[]>([]);
  const [cvs, setCvs] = useState<CVDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    jobId: '',
    cvId: '',
    status: 'applied',
    notes: '',
    appliedDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      fetchJobsAndCvs();
    }
  }, [status, router]);

  const fetchJobsAndCvs = async () => {
    try {
      const [jobsResponse, cvsResponse] = await Promise.all([
        fetch('/api/jobs'),
        fetch('/api/cv'),
      ]);

      if (jobsResponse.ok) {
        const jobsData = await jobsResponse.json();
        setJobs(jobsData);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push('/tracker');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create application');
      }
    } catch (error) {
      console.error('Failed to create application:', error);
      alert('Failed to create application');
    } finally {
      setSubmitting(false);
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
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link href="/tracker" className="text-blue-600 hover:text-blue-500">
            ← Back to Application Tracker
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Add New Application</h1>
          <p className="mt-2 text-gray-600">
            Track a new job application in your pipeline
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Job Selection */}
            <div>
              <label htmlFor="jobId" className="block text-sm font-medium text-gray-700">
                Job Position *
              </label>
              <select
                id="jobId"
                value={formData.jobId}
                onChange={(e) => setFormData({ ...formData, jobId: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              >
                <option value="">Select a job...</option>
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title} at {job.company}
                  </option>
                ))}
              </select>
              {jobs.length === 0 && (
                <p className="mt-1 text-sm text-gray-500">
                  No jobs found. <Link href="/match" className="text-blue-600">Add a job first</Link>
                </p>
              )}
            </div>

            {/* CV Selection */}
            <div>
              <label htmlFor="cvId" className="block text-sm font-medium text-gray-700">
                CV Used *
              </label>
              <select
                id="cvId"
                value={formData.cvId}
                onChange={(e) => setFormData({ ...formData, cvId: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              >
                <option value="">Select a CV...</option>
                {cvs.map((cv) => (
                  <option key={cv.id} value={cv.id}>
                    {cv.filename}
                  </option>
                ))}
              </select>
              {cvs.length === 0 && (
                <p className="mt-1 text-sm text-gray-500">
                  No CVs found. <Link href="/cv" className="text-blue-600">Upload a CV first</Link>
                </p>
              )}
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Current Status
              </label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="applied">Applied</option>
                <option value="phone_screen">Phone Screen</option>
                <option value="interview">Interview</option>
                <option value="offer">Offer</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Applied Date */}
            <div>
              <label htmlFor="appliedDate" className="block text-sm font-medium text-gray-700">
                Application Date
              </label>
              <input
                type="date"
                id="appliedDate"
                value={formData.appliedDate}
                onChange={(e) => setFormData({ ...formData, appliedDate: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                Notes
              </label>
              <textarea
                id="notes"
                rows={4}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Add any notes about this application..."
              />
            </div>

            <div className="flex justify-end space-x-3">
              <Link
                href="/tracker"
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {submitting ? 'Creating...' : 'Create Application'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}