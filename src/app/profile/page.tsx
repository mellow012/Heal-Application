'use client';

import { useAuth } from '@/app/components/AuthProvide';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Loader2, User, Phone, Building2, FileText } from 'lucide-react';

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [isSetup, setIsSetup] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [hospitalId, setHospitalId] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [hospitals, setHospitals] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) return;

    const fetchProfile = async () => {
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          setProfile(data);
          setDisplayName(data.displayName || user.displayName || '');
          setPhone(data.phone || '');
          setHospitalId(data.hospitalId || '');
          setLicenseNumber(data.licenseNumber || '');
          setIsSetup(!!data.displayName); // Profile is complete if displayName exists
        } else {
          setIsSetup(false);
        }

        // Fetch hospitals for hospital_admin and doctor roles
        if (['hospital_admin', 'doctor'].includes(user.customClaims?.role)) {
          const hospitalsRef = collection(db, 'healthcare_providers');
          const hospitalsSnap = await getDocs(hospitalsRef);
          const hospitalsData = hospitalsSnap.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name,
          }));
          setHospitals(hospitalsData);
        }
      } catch (err) {
        console.error('ProfilePage: Error fetching profile:', err.message);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, authLoading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!displayName.trim()) {
      setError('Full name is required');
      return;
    }
    if (['hospital_admin', 'doctor'].includes(user.customClaims?.role) && !hospitalId) {
      setError('Please select a hospital');
      return;
    }
    if (user.customClaims?.role === 'doctor' && !licenseNumber.trim()) {
      setError('License number is required for doctors');
      return;
    }

    try {
      setLoading(true);
      const userRef = doc(db, 'users', user.uid);
      const profileData = {
        displayName: displayName.trim(),
        phone: phone.trim() || '',
        role: user.customClaims?.role || 'patient',
        email: user.email,
        updatedAt: new Date().toISOString(),
      };
      if (['hospital_admin', 'doctor'].includes(user.customClaims?.role)) {
        profileData.hospitalId = hospitalId;
      }
      if (user.customClaims?.role === 'doctor') {
        profileData.licenseNumber = licenseNumber.trim();
      }
      await setDoc(userRef, profileData, { merge: true });
      setIsSetup(true);
      setProfile(profileData);
    } catch (err) {
      console.error('ProfilePage: Error saving profile:', err.message);
      setError('Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    router.push('/sign-in');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-3xl font-bold text-slate-800 mb-6">
          {isSetup ? 'Your Profile' : 'Complete Your Profile'}
        </h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {!isSetup ? (
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-blue-100 rounded-xl">
                <User className="h-8 w-8 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-800">Profile Setup</h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-slate-700">
                  Full Name
                </label>
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your full name"
                  required
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-slate-700">
                  Phone Number (Optional)
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your phone number"
                />
              </div>
              {['hospital_admin', 'doctor'].includes(user.customClaims?.role) && (
                <div>
                  <label htmlFor="hospitalId" className="block text-sm font-medium text-slate-700">
                    Hospital Affiliation
                  </label>
                  <select
                    id="hospitalId"
                    value={hospitalId}
                    onChange={(e) => setHospitalId(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select a hospital</option>
                    {hospitals.map(hospital => (
                      <option key={hospital.id} value={hospital.id}>
                        {hospital.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {user.customClaims?.role === 'doctor' && (
                <div>
                  <label htmlFor="licenseNumber" className="block text-sm font-medium text-slate-700">
                    Medical License Number
                  </label>
                  <input
                    id="licenseNumber"
                    type="text"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your license number"
                    required
                  />
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                ) : (
                  'Save Profile'
                )}
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-blue-100 rounded-xl">
                <User className="h-8 w-8 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-800">Profile Details</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-slate-600" />
                <p className="text-sm text-slate-800">
                  <span className="font-medium">Name:</span> {profile.displayName}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-slate-600" />
                <p className="text-sm text-slate-800">
                  <span className="font-medium">Email:</span> {profile.email}
                </p>
              </div>
              {profile.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-slate-600" />
                  <p className="text-sm text-slate-800">
                    <span className="font-medium">Phone:</span> {profile.phone}
                  </p>
                </div>
              )}
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-slate-600" />
                <p className="text-sm text-slate-800">
                  <span className="font-medium">Role:</span> {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                </p>
              </div>
              {profile.hospitalId && (
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-slate-600" />
                  <p className="text-sm text-slate-800">
                    <span className="font-medium">Hospital:</span> {hospitals.find(h => h.id === profile.hospitalId)?.name || 'Unknown'}
                  </p>
                </div>
              )}
              {profile.licenseNumber && (
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-slate-600" />
                  <p className="text-sm text-slate-800">
                    <span className="font-medium">License Number:</span> {profile.licenseNumber}
                  </p>
                </div>
              )}
              <button
                onClick={() => setIsSetup(false)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Edit Profile
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}