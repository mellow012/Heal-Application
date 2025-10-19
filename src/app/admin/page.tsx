'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthProvide';
import { useRouter } from 'next/navigation';

export default function SuperAdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [hospitalName, setHospitalName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.customClaims?.role !== 'super_admin')) {
      router.push('/login');
    }
  }, [user, loading, router]);

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
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to create hospital and admin');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl mb-4">Super Admin: Create Hospital & Admin</h1>
      <form onSubmit={handleCreateHospitalAndAdmin} className="flex flex-col gap-4 w-full max-w-md">
        <input
          type="text"
          value={hospitalName}
          onChange={(e) => setHospitalName(e.target.value)}
          placeholder="Hospital Name (e.g., Queen Elizabeth Central)"
          className="p-2 border rounded"
          required
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Hospital Admin Email"
          className="p-2 border rounded"
          required
        />
        <input
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="Hospital Admin Phone (e.g., +265123456789)"
          className="p-2 border rounded"
          required
        />
        <button
          type="submit"
          className="p-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating...' : 'Create Hospital & Send Reset Link'}
        </button>
        {error && <p className="text-red-500">{error}</p>}
        {success && <p className="text-green-500">{success}</p>}
      </form>
    </div>
  );
}