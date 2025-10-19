'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthProvide';
import {useUserRole} from './hooks/userRole'
import { useRouter } from 'next/navigation';

// Skeleton Loader Component
const Skeleton = ({ width = '100%', height = '40px', className = '' }) => (
  <div
    className={`bg-gray-200 animate-pulse rounded ${className}`}
    style={{ width, height }}
  ></div>
);

export default function SuperAdminPage() {
  const { user, loading: authLoading } = useAuth();
  const { userRoleData, loading: roleLoading } = useUserRole();
  const router = useRouter();
  const [hospitalName, setHospitalName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (authLoading || roleLoading || !user || !userRoleData) {
      console.log('SuperAdminPage: Waiting for auth or role', { authLoading, roleLoading, user: !!user });
      return;
    }

    if (userRoleData.role !== 'super_admin' && userRoleData.role !== 'super-admin') {
      console.log('SuperAdminPage: Redirecting to login, role:', userRoleData.role);
      router.push('/login');
    } else {
      console.log('SuperAdminPage: User is super_admin');
    }
  }, [user, userRoleData, authLoading, roleLoading, router]);

  const handleCreateHospitalAndAdmin = async (e) => {
    e.preventDefault();
    if (!hospitalName || !email || !phoneNumber) {
      setError('Please provide hospital name, admin email, and phone number');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      console.log('SuperAdminPage: Creating hospital and admin', { hospitalName, email });
      const response = await fetch('/api/admin/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hospitalName, email, phoneNumber }),
      });
      const result = await response.json();
      if (response.ok) {
        setSuccess(`Hospital ${hospitalName} and admin ${email} created! Reset link sent.`);
        setHospitalName('');
        setEmail('');
        setPhoneNumber('');
        console.log('SuperAdminPage: Success', result.message);
      } else {
        setError(result.error);
        console.log('SuperAdminPage: Error', result.error);
      }
    } catch (err) {
      setError('Failed to create hospital and admin');
      console.error('SuperAdminPage: Fetch error', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || roleLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6">
          <Skeleton width="200px" height="24px" className="mb-6 mx-auto" />
          <div className="flex flex-col gap-4">
            <Skeleton height="48px" className="rounded-md" />
            <Skeleton height="48px" className="rounded-md" />
            <Skeleton height="48px" className="rounded-md" />
            <Skeleton height="48px" className="rounded-md" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6 relative">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Create Hospital & Admin
        </h1>
        <form onSubmit={handleCreateHospitalAndAdmin} className="flex flex-col gap-4">
          {isSubmitting && (
            <div className="absolute inset-0 bg-gray-100 bg-opacity-50 flex items-center justify-center rounded-lg">
              <Skeleton width="80%" height="100%" className="opacity-50" />
            </div>
          )}
          <div>
            <label htmlFor="hospitalName" className="block text-sm font-medium text-gray-700 mb-1">
              Hospital Name
            </label>
            <input
              id="hospitalName"
              type="text"
              value={hospitalName}
              onChange={(e) => setHospitalName(e.target.value)}
              placeholder="e.g., Queen Elizabeth Central"
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              required
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Admin Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter admin email"
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              required
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
              Admin Phone Number
            </label>
            <input
              id="phoneNumber"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="e.g., +265123456789"
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              required
              disabled={isSubmitting}
            />
          </div>
          <button
            type="submit"
            className="w-full p-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-md hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition disabled:bg-gray-400"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Hospital & Send Reset Link'}
          </button>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          {success && <p className="text-green-500 text-sm text-center">{success}</p>}
        </form>
      </div>
    </div>
  );
}