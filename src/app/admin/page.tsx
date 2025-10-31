'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthProvide';
import { useUserRole } from '@/hooks/userRole';
import { useRouter } from 'next/navigation';

// Skeleton Loader Component
const Skeleton = ({ width = '100%', height = '40px', className = '' }) => (
  <div
    className={`bg-gray-200 animate-pulse rounded ${className}`}
    style={{ width, height }}
  ></div>
);

type TabType = 'create-hospital' | 'set-super-admin';

export default function SuperAdminPage() {
  const { user, loading: authLoading } = useAuth();
  const { userRoleData, loading: roleLoading } = useUserRole();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('create-hospital');

  // Create Hospital state
  const [hospitalName, setHospitalName] = useState('');
  const [hospitalEmail, setHospitalEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [hospitalError, setHospitalError] = useState('');
  const [hospitalSuccess, setHospitalSuccess] = useState('');
  const [isCreatingHospital, setIsCreatingHospital] = useState(false);

  // Set Super Admin state
  const [superAdminEmail, setSuperAdminEmail] = useState('');
  const [secret, setSecret] = useState('');
  const [superAdminError, setSuperAdminError] = useState('');
  const [superAdminSuccess, setSuperAdminSuccess] = useState('');
  const [isSettingSuperAdmin, setIsSettingSuperAdmin] = useState(false);

  useEffect(() => {
    if (authLoading || roleLoading || !user || !userRoleData) {
      console.log('SuperAdminPage: Waiting for auth or role', { authLoading, roleLoading, user: !!user });
      return;
    }

    if (!userRoleData.isSuperAdmin) {
      console.log('SuperAdminPage: Redirecting to login, role:', userRoleData.role);
      router.push('/login');
    } else {
      console.log('SuperAdminPage: User is super_admin');
    }
  }, [user, userRoleData, authLoading, roleLoading, router]);

  // Create Hospital Handler
  const handleCreateHospitalAndAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hospitalName || !hospitalEmail || !phoneNumber) {
      setHospitalError('Please provide hospital name, admin email, and phone number');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(hospitalEmail)) {
      setHospitalError('Please enter a valid email address');
      return;
    }

    if (phoneNumber.length < 10) {
      setHospitalError('Please enter a valid phone number');
      return;
    }

    setIsCreatingHospital(true);
    setHospitalError('');
    setHospitalSuccess('');

    try {
      console.log('SuperAdminPage: Creating hospital and admin', { hospitalName, hospitalEmail, phoneNumber });
      
      const token = await user!.getIdToken();

      const response = await fetch('/api/admin/onboarding', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          hospitalName,
          email: hospitalEmail,
          phoneNumber,
        }),
      });

      let result;
      const text = await response.text();
      console.log('SuperAdminPage: Raw response', text);

      try {
        result = JSON.parse(text);
      } catch (parseError) {
        console.error('SuperAdminPage: Failed to parse response as JSON', parseError);
        throw new Error('Invalid server response');
      }

      if (response.ok && result.success) {
        setHospitalSuccess(result.message || `Hospital ${hospitalName} and admin ${hospitalEmail} created! Setup email sent.`);
        setHospitalName('');
        setHospitalEmail('');
        setPhoneNumber('');
        console.log('SuperAdminPage: Success', result.message);
      } else {
        setHospitalError(result.error || 'Failed to create hospital and admin');
        console.log('SuperAdminPage: Error', result.error);
      }
    } catch (err: any) {
      setHospitalError(err.message || 'Failed to create hospital and admin');
      console.error('SuperAdminPage: Fetch error', err);
    } finally {
      setIsCreatingHospital(false);
    }
  };

  // Set Super Admin Handler
  const handleSetSuperAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSettingSuperAdmin(true);
    setSuperAdminError('');
    setSuperAdminSuccess('');

    try {
      const response = await fetch('/api/set-super-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: superAdminEmail, secret }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setSuperAdminSuccess(data.message || 'User has been set as super admin successfully!');
        setSuperAdminEmail('');
        setSecret('');
      } else {
        setSuperAdminError(data.error || 'Failed to set super admin');
      }
    } catch (error: any) {
      setSuperAdminError(error.message || 'Failed to set super admin');
    } finally {
      setIsSettingSuperAdmin(false);
    }
  };

  if (authLoading || roleLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="w-full max-w-2xl bg-white rounded-lg shadow-lg p-6">
          <Skeleton width="300px" height="32px" className="mb-6 mx-auto" />
          <div className="flex gap-2 mb-6">
            <Skeleton width="150px" height="40px" className="rounded-md" />
            <Skeleton width="150px" height="40px" className="rounded-md" />
          </div>
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

  if (!user || !userRoleData?.isSuperAdmin) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4">
          <h1 className="text-2xl font-bold text-white text-center">
            Super Admin Dashboard
          </h1>
          <p className="text-purple-100 text-sm text-center mt-1">
            Manage hospitals and administrators
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('create-hospital')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition ${
              activeTab === 'create-hospital'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Create Hospital
            </div>
          </button>
          <button
            onClick={() => setActiveTab('set-super-admin')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition ${
              activeTab === 'set-super-admin'
                ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Set Super Admin
            </div>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Create Hospital Tab */}
          {activeTab === 'create-hospital' && (
            <div className="relative">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Create New Hospital & Admin
              </h2>
              <form onSubmit={handleCreateHospitalAndAdmin} className="flex flex-col gap-4">
                {isCreatingHospital && (
                  <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center rounded-lg z-10">
                    <div className="text-center">
                      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-2"></div>
                      <p className="text-gray-600 font-medium">Creating hospital...</p>
                    </div>
                  </div>
                )}
                <div>
                  <label htmlFor="hospitalName" className="block text-sm font-medium text-gray-700 mb-1">
                    Hospital Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="hospitalName"
                    type="text"
                    value={hospitalName}
                    onChange={(e) => setHospitalName(e.target.value)}
                    placeholder="e.g., Queen Elizabeth Central Hospital"
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    required
                    disabled={isCreatingHospital}
                  />
                </div>
                <div>
                  <label htmlFor="hospitalEmail" className="block text-sm font-medium text-gray-700 mb-1">
                    Admin Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="hospitalEmail"
                    type="email"
                    value={hospitalEmail}
                    onChange={(e) => setHospitalEmail(e.target.value)}
                    placeholder="admin@hospital.com"
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    required
                    disabled={isCreatingHospital}
                  />
                </div>
                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                    Admin Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="phoneNumber"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+265123456789"
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    required
                    disabled={isCreatingHospital}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full p-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-md hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  disabled={isCreatingHospital}
                >
                  {isCreatingHospital ? 'Creating...' : 'Create Hospital & Send Setup Link'}
                </button>
                {hospitalError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-600 text-sm text-center">{hospitalError}</p>
                  </div>
                )}
                {hospitalSuccess && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-green-600 text-sm text-center">{hospitalSuccess}</p>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* Set Super Admin Tab */}
          {activeTab === 'set-super-admin' && (
            <div className="relative">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-800 mb-2">
                  Set Super Admin Role
                </h2>
                <p className="text-sm text-gray-600">
                  Promote an existing user to super administrator
                </p>
              </div>

              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-yellow-800 mb-1">Security Warning</p>
                    <p className="text-xs text-yellow-700">
                      This grants full system access. Only use for trusted administrators. The user must log out and back in after this change.
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSetSuperAdmin} className="flex flex-col gap-4">
                {isSettingSuperAdmin && (
                  <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center rounded-lg z-10">
                    <div className="text-center">
                      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-2"></div>
                      <p className="text-gray-600 font-medium">Setting super admin...</p>
                    </div>
                  </div>
                )}
                <div>
                  <label htmlFor="superAdminEmail" className="block text-sm font-medium text-gray-700 mb-1">
                    User Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="superAdminEmail"
                    type="email"
                    value={superAdminEmail}
                    onChange={(e) => setSuperAdminEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                    required
                    disabled={isSettingSuperAdmin}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    The user must already exist in Firebase Auth
                  </p>
                </div>

                <div>
                  <label htmlFor="secret" className="block text-sm font-medium text-gray-700 mb-1">
                    Secret Key <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="secret"
                    type="password"
                    value={secret}
                    onChange={(e) => setSecret(e.target.value)}
                    placeholder="Enter SUPER_ADMIN_SECRET"
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                    required
                    disabled={isSettingSuperAdmin}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    From your .env.local file
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSettingSuperAdmin}
                  className="w-full p-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-md hover:from-purple-600 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {isSettingSuperAdmin ? 'Setting Super Admin...' : 'Set as Super Admin'}
                </button>

                {superAdminError && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{superAdminError}</p>
                  </div>
                )}

                {superAdminSuccess && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-600 mb-3">{superAdminSuccess}</p>
                    <div className="pt-3 border-t border-green-200">
                      <p className="text-xs text-green-700 font-semibold mb-2">Next Steps:</p>
                      <ol className="text-xs text-green-700 space-y-1 list-decimal list-inside">
                        <li>The user must log out completely</li>
                        <li>Close all browser tabs</li>
                        <li>Log back in to activate super admin privileges</li>
                      </ol>
                    </div>
                  </div>
                )}
              </form>

              <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
                <p className="text-xs text-gray-600">
                  <strong className="block mb-1">Required Environment Variable:</strong>
                  <code className="bg-gray-100 px-2 py-1 rounded">SUPER_ADMIN_SECRET=your_secret_key</code>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}