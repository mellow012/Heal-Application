'use client';

import { useState } from 'react';
import { useAuth } from '@/app/components/AuthProvide';
import { useUserRole } from '@/hooks/userRole';
import { useRouter } from 'next/navigation';

export default function ReceptionistRegisterPage() {
  const { user } = useAuth();
  const { userRoleData } = useUserRole();
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [form, setForm] = useState({
    name: '',
    dob: '',
    phone: '',
    nationalId: '',
    emergencyName: '',
    emergencyPhone: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if not receptionist
  if (!userRoleData?.isReceptionist) {
    return <p className="text-center text-red-500">Access denied</p>;
  }

  // Search patient by phone or national ID
  const handleSearch = async () => {
    if (!search.trim()) return;
    setIsSearching(true);
    setError('');
    setSearchResult(null);

    try {
      const response = await fetch('/api/receptionist/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: search.trim() }),
      });
      const data = await response.json();

      if (data.success && data.data) {
        setSearchResult(data.data);
        setSuccess(`Patient found: ${data.data.name}`);
        setForm(prev => ({
          ...prev,
          name: data.data.name || '',
          phone: data.data.phone || '',
          nationalId: data.data.nationalId || '',
        }));
      } else {
        setSearchResult(null);
        setSuccess('No patient found. Fill form to register.');
      }
    } catch (err) {
      setError(err.message || 'Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  // Register new patient
  const handleRegister = async (e :) => {
    e.preventDefault();
    if (!form.name || !form.dob || !form.phone) {
      setError('Name, DOB, and phone are required');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/receptionist/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          hospitalId: userRoleData.hospitalId,
        }),
      });
      const data = await response.json();

      if (data.success) {
        setSuccess(`Patient registered! GPI: ${data.gpi.substring(0, 8)}...`);
        setForm({
          name: '', dob: '', phone: '', nationalId: '',
          emergencyName: '', emergencyPhone: '',
        });
        setSearch('');
        setSearchResult(null);
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Register New Patient
          </h1>

          {/* Search */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search by Phone or National ID
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="+265..."
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {isSearching ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleRegister} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={form.dob}
                  onChange={(e) => setForm({ ...form, dob: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+265..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  National ID
                </label>
                <input
                  type="text"
                  value={form.nationalId}
                  onChange={(e) => setForm({ ...form, nationalId: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Emergency Contact Name
                </label>
                <input
                  type="text"
                  value={form.emergencyName}
                  onChange={(e) => setForm({ ...form, emergencyName: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Emergency Contact Phone
                </label>
                <input
                  type="tel"
                  value={form.emergencyPhone}
                  onChange={(e) => setForm({ ...form, emergencyPhone: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || searchResult !== null}
              className="w-full py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-medium rounded-lg hover:from-green-600 hover:to-green-700 disabled:opacity-50 transition"
            >
              {isSubmitting ? 'Registering...' : 'Register & Check In Patient'}
            </button>
          </form>

          {/* Messages */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm text-center">{error}</p>
            </div>
          )}
          {success && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 text-sm text-center">{success}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}