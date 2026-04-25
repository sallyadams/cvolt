'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Application {
  id: string;
  status: string;
  notes?: string;
  appliedDate: string;
  job: {
    id: string;
    title: string;
    company: string;
  };
  cv: {
    id: string;
    filename: string;
  };
}

const COLUMNS = [
  { id: 'applied', title: 'Applied', color: 'bg-blue-100' },
  { id: 'phone_screen', title: 'Phone Screen', color: 'bg-yellow-100' },
  { id: 'interview', title: 'Interview', color: 'bg-purple-100' },
  { id: 'offer', title: 'Offer', color: 'bg-green-100' },
  { id: 'rejected', title: 'Rejected', color: 'bg-red-100' },
];

export default function ApplicationTrackerPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedApplication, setDraggedApplication] = useState<Application | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      fetchApplications();
    }
  }, [status, router]);

  const fetchApplications = async () => {
    try {
      const response = await fetch('/api/applications');
      if (response.ok) {
        const data = await response.json();
        setApplications(data);
      }
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, application: Application) => {
    setDraggedApplication(application);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    if (!draggedApplication || draggedApplication.status === newStatus) return;

    try {
      const response = await fetch(`/api/applications/${draggedApplication.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setApplications(prev =>
          prev.map(app =>
            app.id === draggedApplication.id
              ? { ...app, status: newStatus }
              : app
          )
        );
      }
    } catch (error) {
      console.error('Failed to update application:', error);
    }

    setDraggedApplication(null);
  };

  const getApplicationsByStatus = (status: string) => {
    return applications.filter(app => app.status === status);
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Application Tracker</h1>
          <p className="mt-2 text-gray-600">
            Track your job applications across different stages
          </p>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {COLUMNS.map((column) => (
            <div
              key={column.id}
              className={`${column.color} rounded-lg p-4 min-h-[600px]`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {column.title} ({getApplicationsByStatus(column.id).length})
              </h2>

              <div className="space-y-3">
                {getApplicationsByStatus(column.id).map((application) => (
                  <div
                    key={application.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, application)}
                    className="bg-white rounded-lg p-4 shadow-sm border cursor-move hover:shadow-md transition-shadow"
                  >
                    <div className="mb-2">
                      <h3 className="font-medium text-gray-900 text-sm">
                        {application.job.title}
                      </h3>
                      <p className="text-xs text-gray-600">{application.job.company}</p>
                    </div>

                    <div className="text-xs text-gray-500 mb-2">
                      Applied: {new Date(application.appliedDate).toLocaleDateString()}
                    </div>

                    {application.notes && (
                      <p className="text-xs text-gray-700 line-clamp-2">
                        {application.notes}
                      </p>
                    )}
                  </div>
                ))}

                {getApplicationsByStatus(column.id).length === 0 && (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    No applications in {column.title.toLowerCase()}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add Application Button */}
        <div className="mt-8 text-center">
          <Link
            href="/tracker/add"
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Add New Application
          </Link>
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