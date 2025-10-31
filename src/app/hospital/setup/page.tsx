'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/components/AuthProvide';
import { useUserRole } from '@/hooks/userRole';
import { useRouter, useSearchParams } from 'next/navigation';

// Skeleton Loader Component
const Skeleton = ({ width = '100%', height = '40px', className = '' }) => (
  <div
    className={`bg-gray-200 animate-pulse rounded ${className}`}
    style={{ width, height }}
  ></div>
);

interface HospitalData {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  website?: string;
  description?: string;
  departments: string[];
}

type Step = 1 | 2 | 3;

export default function HospitalSetupPage() {
  const { user, loading: authLoading } = useAuth();
  const { userRoleData, loading: roleLoading } = useUserRole();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [isVerifying, setIsVerifying] = useState(true);
  const [hospitalId, setHospitalId] = useState('');
  const [formData, setFormData] = useState<HospitalData>({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: 'Malawi',
    postalCode: '',
    website: '',
    description: '',
    departments: [],
  });
  const [newDepartment, setNewDepartment] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Common departments
  const commonDepartments = [
    'Emergency',
    'Surgery',
    'Pediatrics',
    'Obstetrics & Gynecology',
    'Internal Medicine',
    'Orthopedics',
    'Cardiology',
    'Radiology',
    'Laboratory',
    'Pharmacy',
    'Outpatient',
  ];

  // Step configuration
  const steps = [
    { number: 1, title: 'Basic Information', description: 'Hospital details' },
    { number: 2, title: 'Location & Contact', description: 'Address and contact info' },
    { number: 3, title: 'Departments', description: 'Set up departments' },
  ];

  // Verify user is hospital admin and fetch hospital data
  useEffect(() => {
    const verifyAndFetchHospital = async () => {
      if (authLoading || roleLoading) {
        console.log('HospitalSetup: Waiting for auth/role');
        return;
      }

      if (!user) {
        console.log('HospitalSetup: No user, redirecting to login');
        router.push('/login');
        return;
      }

      if (!userRoleData?.isHospitalAdmin) {
        console.log('HospitalSetup: Not hospital admin, redirecting');
        router.push('/dashboard');
        return;
      }

      const hospitalIdParam = searchParams.get('hospitalId') || userRoleData.hospitalId;
      
      if (!hospitalIdParam) {
        setError('Hospital ID not found');
        setIsVerifying(false);
        return;
      }

      setHospitalId(hospitalIdParam);

      try {
        const token = await user.getIdToken();

        // Verify user is admin of this hospital
        const verifyResponse = await fetch('/api/hospital/verify-admin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ hospitalId: hospitalIdParam }),
        });

        if (!verifyResponse.ok) {
          const errorData = await verifyResponse.json();
          setError(errorData.error || 'You are not authorized to set up this hospital');
          setIsVerifying(false);
          return;
        }

        // Fetch existing hospital data
        const hospitalResponse = await fetch(`/api/hospital/${hospitalIdParam}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (hospitalResponse.ok) {
          const hospitalData = await hospitalResponse.json();
          console.log('HospitalSetup: Fetched hospital data', hospitalData);
          
          setFormData({
            name: hospitalData.name || '',
            email: hospitalData.email || '',
            phone: hospitalData.phone || '',
            address: hospitalData.address || '',
            city: hospitalData.city || '',
            country: hospitalData.country || 'Malawi',
            postalCode: hospitalData.postalCode || '',
            website: hospitalData.website || '',
            description: hospitalData.description || '',
            departments: hospitalData.departments || [],
          });
        }

        setIsVerifying(false);
      } catch (err: any) {
        console.error('HospitalSetup: Error verifying admin', err);
        setError(err.message || 'Failed to verify hospital admin');
        setIsVerifying(false);
      }
    };

    verifyAndFetchHospital();
  }, [user, userRoleData, authLoading, roleLoading, router, searchParams]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(''); // Clear error when user types
  };

  const addDepartment = (dept: string) => {
    if (dept.trim() && !formData.departments.includes(dept.trim())) {
      setFormData(prev => ({
        ...prev,
        departments: [...prev.departments, dept.trim()],
      }));
      setNewDepartment('');
      setError('');
    }
  };

  const removeDepartment = (dept: string) => {
    setFormData(prev => ({
      ...prev,
      departments: prev.departments.filter(d => d !== dept),
    }));
  };

  const validateStep = (step: Step): boolean => {
    setError('');
    
    switch (step) {
      case 1:
        if (!formData.name.trim()) {
          setError('Hospital name is required');
          return false;
        }
        if (!formData.phone.trim()) {
          setError('Phone number is required');
          return false;
        }
        return true;
      
      case 2:
        if (!formData.address.trim()) {
          setError('Street address is required');
          return false;
        }
        if (!formData.city.trim()) {
          setError('City is required');
          return false;
        }
        if (!formData.country.trim()) {
          setError('Country is required');
          return false;
        }
        return true;
      
      case 3:
        if (formData.departments.length === 0) {
          setError('Please add at least one department');
          return false;
        }
        return true;
      
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 3) as Step);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1) as Step);
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const token = await user!.getIdToken();

      const response = await fetch(`/api/hospital/${hospitalId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          setupCompleted: true,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccess('Hospital setup completed successfully! Redirecting...');
        
        setTimeout(() => {
          router.push('/hospital-admin');
        }, 2000);
      } else {
        setError(result.error || 'Failed to complete hospital setup');
      }
    } catch (err: any) {
      console.error('HospitalSetup: Error saving data', err);
      setError(err.message || 'Failed to save hospital information');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || roleLoading || isVerifying) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="w-full max-w-3xl bg-white rounded-lg shadow-lg p-6">
          <Skeleton width="300px" height="32px" className="mb-6 mx-auto" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} height="48px" className="rounded-md" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error && !hospitalId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6">
          <div className="text-center">
            <div className="mb-4 text-red-500">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h1>
            <p className="text-red-600 mb-6">{error}</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Hospital Setup
          </h1>
          <p className="text-gray-600">
            Complete your hospital profile to get started
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
                      currentStep >= step.number
                        ? 'bg-blue-600 text-white shadow-lg scale-110'
                        : 'bg-gray-300 text-gray-600'
                    }`}
                  >
                    {currentStep > step.number ? (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      step.number
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <p className={`text-sm font-medium ${currentStep >= step.number ? 'text-blue-600' : 'text-gray-500'}`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-500 hidden sm:block">{step.description}</p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-1 flex-1 mx-4 mt-[-40px] transition-all duration-300 ${
                      currentStep > step.number ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-xl p-6 md:p-8 relative">
          {isSubmitting && (
            <div className="absolute inset-0 bg-white bg-opacity-95 flex items-center justify-center rounded-lg z-50">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
                <p className="text-lg font-medium text-gray-700">Saving your information...</p>
                <p className="text-sm text-gray-500">Please wait</p>
              </div>
            </div>
          )}

          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Basic Information</h2>
                <p className="text-gray-600 mb-6">Let's start with your hospital's basic details</p>
              </div>

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Hospital Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Queen Elizabeth Central Hospital"
                  className="w-full p-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Hospital Email <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full p-4 border-2 border-gray-200 rounded-lg bg-gray-50 text-gray-600"
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">This email cannot be changed</p>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+265 123 456 789"
                  className="w-full p-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  required
                />
              </div>

              <div>
                <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">
                  Website <span className="text-gray-400">(Optional)</span>
                </label>
                <input
                  id="website"
                  name="website"
                  type="url"
                  value={formData.website}
                  onChange={handleInputChange}
                  placeholder="https://www.yourhospital.com"
                  className="w-full p-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  About Your Hospital <span className="text-gray-400">(Optional)</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Tell us about your hospital, services offered, and mission..."
                  rows={4}
                  className="w-full p-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition"
                />
              </div>
            </div>
          )}

          {/* Step 2: Location & Contact */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Location & Contact</h2>
                <p className="text-gray-600 mb-6">Where is your hospital located?</p>
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                  Street Address <span className="text-red-500">*</span>
                </label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="e.g., 123 Glyn Jones Road"
                  className="w-full p-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="e.g., Blantyre"
                    className="w-full p-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                    Country <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="country"
                    name="country"
                    type="text"
                    value={formData.country}
                    onChange={handleInputChange}
                    placeholder="e.g., Malawi"
                    className="w-full p-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-2">
                  Postal Code <span className="text-gray-400">(Optional)</span>
                </label>
                <input
                  id="postalCode"
                  name="postalCode"
                  type="text"
                  value={formData.postalCode}
                  onChange={handleInputChange}
                  placeholder="e.g., P.O. Box 123"
                  className="w-full p-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-blue-900">Why we need this</p>
                    <p className="text-sm text-blue-700 mt-1">
                      This information helps patients find your hospital and allows emergency services to locate you quickly.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Departments */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Departments</h2>
                <p className="text-gray-600 mb-6">Add the departments available at your hospital</p>
              </div>

              {/* Quick Add Common Departments */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Quick Add Popular Departments:</p>
                <div className="flex flex-wrap gap-2">
                  {commonDepartments.map((dept) => (
                    <button
                      key={dept}
                      type="button"
                      onClick={() => addDepartment(dept)}
                      disabled={formData.departments.includes(dept)}
                      className={`px-4 py-2 text-sm font-medium rounded-full border-2 transition-all duration-200 ${
                        formData.departments.includes(dept)
                          ? 'bg-blue-100 border-blue-500 text-blue-700 cursor-not-allowed'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-blue-50 hover:border-blue-400 hover:scale-105'
                      }`}
                    >
                      {formData.departments.includes(dept) ? (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {dept}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          {dept}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Department Input */}
              <div>
                <label htmlFor="newDepartment" className="block text-sm font-medium text-gray-700 mb-2">
                  Add Custom Department
                </label>
                <div className="flex gap-3">
                  <input
                    id="newDepartment"
                    type="text"
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addDepartment(newDepartment);
                      }
                    }}
                    placeholder="Enter department name"
                    className="flex-1 p-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                  <button
                    type="button"
                    onClick={() => addDepartment(newDepartment)}
                    disabled={!newDepartment.trim()}
                    className="px-6 py-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add
                  </button>
                </div>
              </div>

              {/* Selected Departments */}
              {formData.departments.length > 0 ? (
                <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-semibold text-gray-700">
                      Selected Departments ({formData.departments.length})
                    </p>
                    <span className="text-xs text-gray-500">Click ✕ to remove</span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {formData.departments.map((dept) => (
                      <div
                        key={dept}
                        className="group flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-medium shadow-md hover:shadow-lg transition-all duration-200"
                      >
                        <span>{dept}</span>
                        <button
                          type="button"
                          onClick={() => removeDepartment(dept)}
                          className="hover:bg-blue-700 rounded-full p-1 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-8 bg-yellow-50 border-2 border-yellow-200 rounded-lg text-center">
                  <svg className="w-12 h-12 text-yellow-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-sm font-medium text-yellow-800">
                    No departments added yet
                  </p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Please add at least one department to continue
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg animate-shake">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mt-6 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm font-medium text-green-800">{success}</p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-4 mt-8 pt-6 border-t-2 border-gray-200">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handlePrevious}
                disabled={isSubmitting}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>
            )}
            
            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                Next Step
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || formData.departments.length === 0}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-medium rounded-lg hover:from-green-700 hover:to-green-800 transition shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Completing Setup...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Complete Setup
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Help Card */}
        <div className="mt-6 p-4 bg-white rounded-lg shadow-md">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-gray-900">Need Help?</p>
              <p className="text-sm text-gray-600 mt-1">
                You can always come back and edit this information later from your dashboard settings.
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}