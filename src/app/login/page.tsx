'use client';

import { useState, useEffect } from 'react';
import { useAuth, useUserRole } from '../components/AuthProvide';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

// Skeleton Loader Component
const Skeleton = ({ width = '100%', height = '40px', className = '' }) => (
  <div
    className={`bg-gray-200 animate-pulse rounded ${className}`}
    style={{ width, height }}
  ></div>
);

export default function LoginPage() {
  const { user, loading: authLoading } = useAuth();
  const { userRoleData, loading: roleLoading } = useUserRole();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle redirects based on user role
  useEffect(() => {
    if (authLoading || roleLoading || !user || !userRoleData) {
      console.log('LoginPage: Waiting for auth or role', { authLoading, roleLoading, user: !!user, userRoleData });
      return;
    }

    console.log('LoginPage: Role data', userRoleData);
    const { role } = userRoleData;

    if (role === 'super_admin' || role === 'super-admin') {
      console.log('LoginPage: Redirecting to /admin');
      router.push('/admin');
    } else if (role === 'hospital_admin') {
      console.log('LoginPage: Redirecting to /hospital-admin');
      router.push('/hospital-admin');
    } else if (role === 'patient') {
      console.log('LoginPage: Redirecting to /dashboard');
      router.push('/dashboard');
    } else {
      console.log('LoginPage: Invalid role', role);
      setError('Invalid user role');
    }
  }, [user, userRoleData, authLoading, roleLoading, router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password');
      return;
    }
    setIsSubmitting(true);
    setError(null);

    try {
      console.log('LoginPage: Attempting login for', email);
      await signInWithEmailAndPassword(auth, email, password);
      console.log('LoginPage: Login successful');
    } catch (err) {
      console.error('LoginPage: Login error', err);
      switch (err.code) {
        case 'auth/invalid-email':
          setError('Invalid email format');
          break;
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          setError('Incorrect email or password');
          break;
        case 'auth/too-many-requests':
          setError('Too many attempts, please try again later');
          break;
        default:
          setError('Login failed: ' + err.message);
      }
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
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6 relative">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">Log In to Heal E-Health</h1>
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          {isSubmitting && (
            <div className="absolute inset-0 bg-gray-100 bg-opacity-50 flex items-center justify-center rounded-lg">
              <Skeleton width="80%" height="100%" className="opacity-50" />
            </div>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              required
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
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
            {isSubmitting ? 'Logging In...' : 'Log In'}
          </button>
          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}
        </form>
      </div>
    </div>
  );
}