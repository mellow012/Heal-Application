'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthProvide';
import { useUserRole } from '@/hooks/userRole';
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
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle redirects based on user role
  useEffect(() => {
    const handleRedirect = async () => {
      if (authLoading || roleLoading || !user || !userRoleData) {
        console.log('LoginPage: Waiting for auth or role', { 
          authLoading, 
          roleLoading, 
          user: !!user, 
          userRoleData 
        });
        return;
      }

      console.log('LoginPage: Role data', userRoleData);
      const { role, hospitalId } = userRoleData;

      if (role === 'super_admin') {
        console.log('LoginPage: Redirecting to /admin');
        router.push('/admin');
      } else if (role === 'hospital_admin') {
        // Check if hospital setup is completed
        try {
          const token = await user.getIdToken();
          const response = await fetch(`/api/hospital/${hospitalId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const hospitalData = await response.json();
            
            if (!hospitalData.setupCompleted) {
              console.log('LoginPage: Hospital setup not completed, redirecting to setup');
              router.push(`/hospital/setup?hospitalId=${hospitalId}`);
            } else {
              console.log('LoginPage: Redirecting to /hospital');
              router.push('/hospital');
            }
          } else {
            console.log('LoginPage: Could not fetch hospital data, redirecting to setup');
            router.push(`/hospital/setup?hospitalId=${hospitalId}`);
          }
        } catch (err) {
          console.error('LoginPage: Error checking hospital setup status', err);
          router.push('/hospital');
        }
      } else if (role === 'doctor' || role === 'nurse' || role === 'receptionist' || role === 'staff') {
        console.log('LoginPage: Redirecting hospital personnel to /hospital/staff');
        router.push('/hospital/staff');
      } else if (role === 'patient') {
        console.log('LoginPage: Redirecting to /dashboard');
        router.push('/dashboard');
      } else {
        console.log('LoginPage: Unknown role', role);
        setError('Unable to determine user role');
      }
    };

    handleRedirect();
  }, [user, userRoleData, authLoading, roleLoading, router]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    setSuccess('Authenticating...');

    try {
      console.log('LoginPage: Attempting login for', email);
      await signInWithEmailAndPassword(auth, email, password);
      console.log('LoginPage: Login successful');
      setSuccess('Login successful! Redirecting...');
    } catch (err: any) {
      console.error('LoginPage: Login error', err);
      setSuccess('');
      
      // Fixed: Use err.code instead of err directly
      switch (err.code) {
        case 'auth/invalid-email':
          setError('Invalid email format');
          break;
        case 'auth/user-not-found':
          setError('No account found with this email');
          break;
        case 'auth/wrong-password':
          setError('Incorrect password');
          break;
        case 'auth/invalid-credential':
          setError('Incorrect email or password');
          break;
        case 'auth/too-many-requests':
          setError('Too many failed attempts. Please try again later');
          break;
        case 'auth/user-disabled':
          setError('This account has been disabled');
          break;
        case 'auth/network-request-failed':
          setError('Network error. Please check your connection');
          break;
        default:
          setError(err.message || 'Login failed. Please try again');
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
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Log In to Heal E-Health
        </h1>
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          {isSubmitting && (
            <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center rounded-lg z-10">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                <p className="text-sm text-gray-600">{success || 'Logging in...'}</p>
              </div>
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
            className="w-full p-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-md hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Logging In...' : 'Log In'}
          </button>
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm text-center">{error}</p>
            </div>
          )}
          {success && !error && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-600 text-sm text-center">{success}</p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}