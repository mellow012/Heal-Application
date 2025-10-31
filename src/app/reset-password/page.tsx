'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { auth } from '@/lib/firebase';

// Skeleton Loader Component
const Skeleton = ({ width = '100%', height = '40px', className = '' }) => (
  <div
    className={`bg-gray-200 animate-pulse rounded ${className}`}
    style={{ width, height }}
  ></div>
);

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [oobCode, setOobCode] = useState('');
  const [hospitalId, setHospitalId] = useState('');

  // Password strength indicator
  const [passwordStrength, setPasswordStrength] = useState({
    strength: 0,
    message: '',
    color: 'gray'
  });

  useEffect(() => {
    const code = searchParams.get('oobCode');
    const hospitalIdParam = searchParams.get('hospitalId');
    const mode = searchParams.get('mode');

    console.log('Reset Password Page: Query params', { code, hospitalIdParam, mode });

    if (!code || mode !== 'resetPassword') {
      setError('Invalid or missing password reset link');
      setIsVerifying(false);
      return;
    }

    setOobCode(code);
    if (hospitalIdParam) {
      setHospitalId(hospitalIdParam);
    }

    // Verify the reset code
    verifyPasswordResetCode(auth, code)
      .then((emailAddress) => {
        console.log('Reset code verified for email:', emailAddress);
        setEmail(emailAddress);
        setIsVerifying(false);
      })
      .catch((err) => {
        console.error('Error verifying reset code:', err);
        let errorMsg = 'Invalid or expired password reset link';
        
        if (err.code === 'auth/expired-action-code') {
          errorMsg = 'This password reset link has expired. Please request a new one.';
        } else if (err.code === 'auth/invalid-action-code') {
          errorMsg = 'This password reset link is invalid or has already been used.';
        }
        
        setError(errorMsg);
        setIsVerifying(false);
      });
  }, [searchParams]);

  // Check password strength
  useEffect(() => {
    if (!password) {
      setPasswordStrength({ strength: 0, message: '', color: 'gray' });
      return;
    }

    let strength = 0;
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    strength = Object.values(checks).filter(Boolean).length;

    const strengthMap = [
      { message: '', color: 'gray' },
      { message: 'Very Weak', color: 'red' },
      { message: 'Weak', color: 'orange' },
      { message: 'Fair', color: 'yellow' },
      { message: 'Good', color: 'blue' },
      { message: 'Strong', color: 'green' },
    ];

    setPasswordStrength({
      strength,
      message: strengthMap[strength].message,
      color: strengthMap[strength].color,
    });
  }, [password]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (passwordStrength.strength < 3) {
      setError('Please choose a stronger password');
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('Resetting password for:', email);
      
      // Confirm the password reset
      await confirmPasswordReset(auth, oobCode, password);
      
      console.log('Password reset successful');
      setSuccess('Password set successfully! Redirecting to login...');

      // Redirect to login page after 2 seconds
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: any) {
      console.error('Error resetting password:', err);
      
      let errorMsg = 'Failed to reset password. Please try again.';
      
      if (err.code === 'auth/weak-password') {
        errorMsg = 'Password is too weak. Please choose a stronger password.';
      } else if (err.code === 'auth/expired-action-code') {
        errorMsg = 'This password reset link has expired. Please request a new one.';
      } else if (err.code === 'auth/invalid-action-code') {
        errorMsg = 'This password reset link is invalid or has already been used.';
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      setError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6">
          <Skeleton width="250px" height="28px" className="mb-4 mx-auto" />
          <Skeleton width="100%" height="20px" className="mb-6 mx-auto" />
          <div className="flex flex-col gap-4">
            <Skeleton height="48px" className="rounded-md" />
            <Skeleton height="48px" className="rounded-md" />
            <Skeleton height="48px" className="rounded-md" />
          </div>
        </div>
      </div>
    );
  }

  if (error && !email) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6">
          <div className="text-center">
            <div className="mb-4 text-red-500">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Invalid Link</h1>
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6 relative">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">
          Set Your Password
        </h1>
        <p className="text-sm text-gray-600 text-center mb-6">
          Setting password for: <strong>{email}</strong>
        </p>

        <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
          {isSubmitting && (
            <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center rounded-lg z-10">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                <p className="text-sm text-gray-600">Setting your password...</p>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              New Password <span className="text-red-500">*</span>
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your new password"
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              required
              disabled={isSubmitting}
              minLength={8}
            />
            {password && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded ${
                        level <= passwordStrength.strength
                          ? passwordStrength.color === 'red' ? 'bg-red-500' :
                            passwordStrength.color === 'orange' ? 'bg-orange-500' :
                            passwordStrength.color === 'yellow' ? 'bg-yellow-500' :
                            passwordStrength.color === 'blue' ? 'bg-blue-500' :
                            'bg-green-500'
                          : 'bg-gray-200'
                      }`}
                    ></div>
                  ))}
                </div>
                <p className={`text-xs ${
                  passwordStrength.color === 'red' ? 'text-red-600' :
                  passwordStrength.color === 'orange' ? 'text-orange-600' :
                  passwordStrength.color === 'yellow' ? 'text-yellow-600' :
                  passwordStrength.color === 'blue' ? 'text-blue-600' :
                  'text-green-600'
                }`}>
                  {passwordStrength.message}
                </p>
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Must be at least 8 characters with uppercase, lowercase, number, and special character
            </p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              required
              disabled={isSubmitting}
              minLength={8}
            />
            {confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-red-600 mt-1">Passwords do not match</p>
            )}
            {confirmPassword && password === confirmPassword && (
              <p className="text-xs text-green-600 mt-1">Passwords match ✓</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full p-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-md hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            disabled={isSubmitting || passwordStrength.strength < 3 || password !== confirmPassword}
          >
            {isSubmitting ? 'Setting Password...' : 'Set Password & Continue'}
          </button>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm text-center">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-600 text-sm text-center">{success}</p>
            </div>
          )}
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            After setting your password, you'll be redirected to login and complete your hospital setup.
          </p>
        </div>
      </div>
    </div>
  );
}