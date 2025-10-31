'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/components/AuthProvide';
import { useUserRole } from '@/hooks/userRole';
import { useRouter } from 'next/navigation';

// Skeleton Loader Component
const Skeleton = ({ width = '100%', height = '40px', className = '' }) => (
  <div
    className={`bg-gray-200 animate-pulse rounded ${className}`}
    style={{ width, height }}
  ></div>
);

type TabType = 'overview' | 'staff' | 'settings';

interface HospitalData {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  departments: string[];
  status: string;
  setupCompleted: boolean;
}

interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  status: string;
  addedAt: string;
}

export default function HospitalAdminDashboard() {
  const { user, loading: authLoading, logout } = useAuth();
  const { userRoleData, loading: roleLoading } = useUserRole();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [hospitalData, setHospitalData] = useState<HospitalData | null>(null);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Add Staff Modal State
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'nurse' as 'doctor' | 'nurse' | 'receptionist' | 'staff',
    department: '',
  });
  const [staffFormError, setStaffFormError] = useState('');
  const [staffFormSuccess, setStaffFormSuccess] = useState('');
  const [isSubmittingStaff, setIsSubmittingStaff] = useState(false);

  // Fetch hospital data
  useEffect(() => {
    const fetchHospitalData = async () => {
      if (authLoading || roleLoading) return;

      if (!user) {
        router.push('/login');
        return;
      }

      if (!userRoleData?.isHospitalAdmin) {
        router.push('/dashboard');
        return;
      }

      const hospitalId = userRoleData.hospitalId;
      if (!hospitalId) {
        setError('Hospital ID not found');
        setIsLoading(false);
        return;
      }

      try {
        const token = await user.getIdToken();
        
        // Fetch hospital data
        const response = await fetch(`/api/hospital/${hospitalId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch hospital data');
        }

        const data = await response.json();
        setHospitalData(data);

        // Check if setup is completed
        if (!data.setupCompleted) {
          router.push(`/hospital/setup?hospitalId=${hospitalId}`);
          return;
        }

        // Fetch staff members
        await fetchStaffMembers(hospitalId, token);

        setIsLoading(false);
      } catch (err: any) {
        console.error('Error fetching hospital data:', err);
        setError(err.message || 'Failed to load hospital data');
        setIsLoading(false);
      }
    };

    fetchHospitalData();
  }, [user, userRoleData, authLoading, roleLoading, router]);

  const fetchStaffMembers = async (hospitalId: string, token: string) => {
    try {
      const response = await fetch(`/api/hospital/${hospitalId}/staff`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStaffMembers(data.staff || []);
      }
    } catch (err) {
      console.error('Error fetching staff:', err);
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setStaffFormError('');
    setStaffFormSuccess('');

    if (!staffForm.name || !staffForm.email || !staffForm.phone || !staffForm.department) {
      setStaffFormError('All fields are required');
      return;
    }

    setIsSubmittingStaff(true);

    try {
      const token = await user!.getIdToken();
      
      const response = await fetch('/api/hospital/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...staffForm,
          hospitalId: hospitalData!.id,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setStaffFormSuccess(result.message);
        setStaffForm({
          name: '',
          email: '',
          phone: '',
          role: 'nurse',
          department: '',
        });
        
        // Refresh staff list
        await fetchStaffMembers(hospitalData!.id, token);
        
        // Close modal after 2 seconds
        setTimeout(() => {
          setShowAddStaffModal(false);
          setStaffFormSuccess('');
        }, 2000);
      } else {
        setStaffFormError(result.error || 'Failed to add staff member');
      }
    } catch (err: any) {
      setStaffFormError(err.message || 'Failed to add staff member');
    } finally {
      setIsSubmittingStaff(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  if (authLoading || roleLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <Skeleton width="200px" height="32px" />
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} height="120px" className="rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error && !hospitalData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md">
          <div className="text-center">
            <div className="mb-4 text-red-500">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Error</h1>
            <p className="text-red-600 mb-6">{error}</p>
            <button
              onClick={() => router.push('/login')}
              className="px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{hospitalData?.name}</h1>
              <p className="text-sm text-gray-600">{hospitalData?.city}, {hospitalData?.country}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.email}</p>
                <p className="text-xs text-gray-500">Hospital Administrator</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('staff')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === 'staff'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Staff Management
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === 'settings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Settings
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Staff</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{staffMembers.length}</p>
                  </div>
                  <div className="bg-blue-100 rounded-full p-3">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Departments</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{hospitalData?.departments.length || 0}</p>
                  </div>
                  <div className="bg-green-100 rounded-full p-3">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Status</p>
                    <p className="text-lg font-bold text-green-600 mt-2 capitalize">{hospitalData?.status || 'Active'}</p>
                  </div>
                  <div className="bg-purple-100 rounded-full p-3">
                    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Hospital Information */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Hospital Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Email</p>
                  <p className="text-base font-medium text-gray-900">{hospitalData?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Phone</p>
                  <p className="text-base font-medium text-gray-900">{hospitalData?.phone}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600 mb-1">Address</p>
                  <p className="text-base font-medium text-gray-900">
                    {hospitalData?.address}, {hospitalData?.city}, {hospitalData?.country}
                  </p>
                </div>
              </div>
            </div>

            {/* Departments */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Departments</h2>
              <div className="flex flex-wrap gap-2">
                {hospitalData?.departments.map((dept) => (
                  <span
                    key={dept}
                    className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full"
                  >
                    {dept}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Staff Management Tab */}
        {activeTab === 'staff' && (
          <div>
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900">Staff Members ({staffMembers.length})</h2>
                  <button
                    onClick={() => setShowAddStaffModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Staff Member
                  </button>
                </div>
              </div>
              
              {staffMembers.length === 0 ? (
                <div className="p-6">
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No staff members yet</h3>
                    <p className="text-gray-600 mb-4">Get started by adding your first staff member</p>
                    <button
                      onClick={() => setShowAddStaffModal(true)}
                      className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition"
                    >
                      Add First Staff Member
                    </button>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {staffMembers.map((staff) => (
                        <tr key={staff.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{staff.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{staff.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                              {staff.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {staff.department}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${
                              staff.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {staff.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button className="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                            <button className="text-red-600 hover:text-red-900">Remove</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Hospital Settings</h2>
              <button
                onClick={() => router.push(`/hospital/setup?hospitalId=${hospitalData?.id}`)}
                className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 transition"
              >
                Edit Hospital Information
              </button>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Notifications
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      defaultChecked
                    />
                    <span className="ml-2 text-sm text-gray-700">Receive email notifications for new staff</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Staff Modal */}
      {showAddStaffModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Add Staff Member</h3>
                <button
                  onClick={() => {
                    setShowAddStaffModal(false);
                    setStaffFormError('');
                    setStaffFormSuccess('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleAddStaff} className="space-y-4">
                <div>
                  <label htmlFor="staffName" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="staffName"
                    type="text"
                    value={staffForm.name}
                    onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                    placeholder="John Doe"
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={isSubmittingStaff}
                  />
                </div>

                <div>
                  <label htmlFor="staffEmail" className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="staffEmail"
                    type="email"
                    value={staffForm.email}
                    onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                    placeholder="john@hospital.com"
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={isSubmittingStaff}
                  />
                </div>

                <div>
                  <label htmlFor="staffPhone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="staffPhone"
                    type="tel"
                    value={staffForm.phone}
                    onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                    placeholder="+265123456789"
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={isSubmittingStaff}
                  />
                </div>

                <div>
                  <label htmlFor="staffRole" className="block text-sm font-medium text-gray-700 mb-1">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="staffRole"
                    value={staffForm.role}
                    onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value as any })}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={isSubmittingStaff}
                  >
                    <option value="doctor">Doctor</option>
                    <option value="nurse">Nurse</option>
                    <option value="receptionist">Receptionist</option>
                    <option value="staff">Other Staff</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="staffDepartment" className="block text-sm font-medium text-gray-700 mb-1">
                    Department <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="staffDepartment"
                    value={staffForm.department}
                    onChange={(e) => setStaffForm({ ...staffForm, department: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={isSubmittingStaff}
                  >
                    <option value="">Select Department</option>
                    {hospitalData?.departments.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                {staffFormError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-600 text-sm">{staffFormError}</p>
                  </div>
                )}

                {staffFormSuccess && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-green-600 text-sm">{staffFormSuccess}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddStaffModal(false);
                      setStaffFormError('');
                      setStaffFormSuccess('');
                    }}
                    disabled={isSubmittingStaff}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingStaff}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmittingStaff ? 'Adding...' : 'Add Staff'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}