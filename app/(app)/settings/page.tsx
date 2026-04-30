'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
  id: string;
  email: string;
  name?: string;
  tier: string;
  creditsUsed: number;
  createdAt: string;
}

interface UsageStats {
  totalScans: number;
  totalImprovements: number;
  totalGenerations: number;
  totalMatches: number;
}

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      fetchUserData();
      fetchStats();
    }
  }, [status, router]);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/user');
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats');
      if (response.ok) {
        const statsData = await response.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = () => {
    router.push('/upgrade');
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
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
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="mt-2 text-gray-600">
            Manage your account, billing, and usage
          </p>
        </div>

        <div className="space-y-8">
          {/* Account Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="mt-1 text-gray-900">{user?.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <p className="mt-1 text-gray-900">{user?.name || 'Not set'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Member Since</label>
                <p className="mt-1 text-gray-900">
                  {user ? new Date(user.createdAt).toLocaleDateString() : ''}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Current Plan</label>
                <div className="mt-1 flex items-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user?.tier === 'premium'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user?.tier === 'premium' ? 'Premium' : 'Free'}
                  </span>
                  {user?.tier !== 'premium' && (
                    <button
                      onClick={handleUpgrade}
                      className="ml-2 text-blue-600 hover:text-blue-500 text-sm"
                    >
                      Upgrade
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Usage Statistics */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Usage Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats?.totalScans || 0}</div>
                <p className="text-sm text-gray-600">ATS Scans</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats?.totalImprovements || 0}</div>
                <p className="text-sm text-gray-600">Bullet Improvements</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{stats?.totalGenerations || 0}</div>
                <p className="text-sm text-gray-600">Documents Generated</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{stats?.totalMatches || 0}</div>
                <p className="text-sm text-gray-600">Job Matches</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-600">
                Credits Used: <span className="font-medium">{user?.creditsUsed || 0}</span>
              </p>
            </div>
          </div>

          {/* Billing */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Billing & Subscription</h2>
            {user?.tier === 'premium' ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-900">Premium Plan - Active</span>
                  <span className="text-green-600 font-medium">✓ Active</span>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  You have unlimited access to all premium features.
                </p>
                <button className="text-blue-600 hover:text-blue-500 text-sm">
                  Manage Subscription →
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-900">Free Plan</span>
                  <span className="text-gray-600">Limited features</span>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Upgrade to Premium for unlimited access to all features.
                </p>
                <button
                  onClick={handleUpgrade}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Upgrade to Premium
                </button>
              </div>
            )}
          </div>

          {/* Account Actions */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Actions</h2>
            <div className="space-y-3">
              <button
                onClick={handleSignOut}
                className="w-full md:w-auto bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Sign Out
              </button>
            </div>
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