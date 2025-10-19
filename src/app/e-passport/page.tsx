'use client';

import { useAuth } from '../components/AuthProvide';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  User, 
  Calendar, 
  Mail, 
  Shield, 
  Heart, 
  ArrowLeft, 
  AlertCircle,
  Loader2,
  UserCheck,
  Droplet,
  Edit2
} from 'lucide-react';
import Tabs from '../components/Tabs';

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
    <div className="text-center">
      <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
      <p className="text-slate-600 text-lg">Loading your health passport...</p>
    </div>
  </div>
);

const ErrorState = ({ error }) => (
  <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center p-4">
    <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
      <div className="p-3 bg-red-100 rounded-full w-fit mx-auto mb-6">
        <AlertCircle className="h-8 w-8 text-red-600" />
      </div>
      <h1 className="text-2xl font-bold text-slate-800 mb-4">Something went wrong</h1>
      <p className="text-slate-600 mb-6">
        Failed to load your E-Health Passport: {error}
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link 
          href="/sign-in" 
          className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors"
        >
          Sign In Again
        </Link>
        <button 
          onClick={() => window.location.reload()} 
          className="flex-1 bg-slate-100 text-slate-700 px-6 py-3 rounded-lg font-medium hover:bg-slate-200 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  </div>
);

const UserInfoCard = ({ user, personalData, role, onEdit }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'Not provided';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getBloodGroupColor = (bloodGroup) => {
    const colors = {
      'A+': 'bg-red-100 text-red-700 border-red-200',
      'A-': 'bg-red-100 text-red-700 border-red-200',
      'B+': 'bg-blue-100 text-blue-700 border-blue-200',
      'B-': 'bg-blue-100 text-blue-700 border-blue-200',
      'AB+': 'bg-purple-100 text-purple-700 border-purple-200',
      'AB-': 'bg-purple-100 text-purple-700 border-purple-200',
      'O+': 'bg-green-100 text-green-700 border-green-200',
      'O-': 'bg-green-100 text-green-700 border-green-200',
    };
    return colors[bloodGroup] || 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-full">
            <UserCheck className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Patient Profile</h2>
            <p className="text-blue-100">Personal & Account Information</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Account Details
          </h3>
          <div className="grid gap-4">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <User className="h-5 w-5 text-slate-500" />
              <div>
                <p className="text-sm text-slate-500">Full Name</p>
                <p className="font-medium text-slate-800">
                  {user.displayName || 'Not specified'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <Mail className="h-5 w-5 text-slate-500" />
              <div>
                <p className="text-sm text-slate-500">Email Address</p>
                <p className="font-medium text-slate-800">
                  {user.email || 'Not available'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-600" />
              Medical Profile
            </h3>
            {role === 'patient' && (
              <button
                onClick={onEdit}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit2 className="h-4 w-4" />
                Edit
              </button>
            )}
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-4 w-4 text-slate-500" />
                <p className="text-sm text-slate-500">Date of Birth</p>
              </div>
              <p className="font-medium text-slate-800">
                {formatDate(personalData.dateOfBirth)}
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <User className="h-4 w-4 text-slate-500" />
                <p className="text-sm text-slate-500">Gender</p>
              </div>
              <p className="font-medium text-slate-800">
                {personalData.gender || 'Not specified'}
              </p>
            </div>
          </div>
          
          {personalData.bloodGroup && (
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-2">
                <Droplet className="h-4 w-4 text-red-500" />
                <p className="text-sm text-slate-500">Blood Group</p>
              </div>
              <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold border ${getBloodGroupColor(personalData.bloodGroup)}`}>
                {personalData.bloodGroup}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const EditModal = ({ isOpen, onClose, personalData, onSave, role }) => {
  const [formData, setFormData] = useState({
    fullName: personalData.fullName || '',
    dateOfBirth: personalData.dateOfBirth ? new Date(personalData.dateOfBirth).toISOString().split('T')[0] : '',
    gender: personalData.gender || '',
    bloodGroup: personalData.bloodGroup || '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (role !== 'patient') {
      alert('Only patients can edit personal data.');
      return;
    }
    setIsSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      alert(`Failed to save: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Edit Personal Data</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-600 mb-1">Full Name</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className="w-full p-2 border border-slate-300 rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Date of Birth</label>
            <input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              className="w-full p-2 border border-slate-300 rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Gender</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full p-2 border border-slate-300 rounded-lg"
              required
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Blood Group</label>
            <select
              name="bloodGroup"
              value={formData.bloodGroup}
              onChange={handleChange}
              className="w-full p-2 border border-slate-300 rounded-lg"
              required
            >
              <option value="">Select Blood Group</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const serializeFirestoreData = (data) => {
  if (!data) return data;
  
  const serialized = { ...data };
  
  Object.keys(serialized).forEach(key => {
    if (serialized[key] && typeof serialized[key] === 'object') {
      if (serialized[key].toDate && typeof serialized[key].toDate === 'function') {
        serialized[key] = serialized[key].toDate().toISOString();
      } else if (Array.isArray(serialized[key])) {
        serialized[key] = serialized[key].map(item => 
          item && typeof item === 'object' && item.toDate 
            ? item.toDate().toISOString() 
            : item
        );
      } else if (typeof serialized[key] === 'object') {
        serialized[key] = serializeFirestoreData(serialized[key]);
      }
    }
  });
  
  return serialized;
};

export default function EHealthPassport() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [personalData, setPersonalData] = useState({});
  const [medicalData, setMedicalData] = useState({});
  const [hospitalRecords, setHospitalRecords] = useState({ visits: [] });
  const [healthAnalytics, setHealthAnalytics] = useState({ heartRateTrends: [], weightTrends: [] });
  const [role, setRole] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (authLoading || !user) {
          return;
        }

        const userId = user.uid;

        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          router.push('/profile-setup');
          return;
        }

        const userData = userSnap.data();
        setRole(userData.role || 'none');

        const passportRef = doc(db, 'e_health_passports', userId);
        const passportSnap = await getDoc(passportRef);
        
        if (passportSnap.exists()) {
          const data = passportSnap.data();
          setPersonalData(serializeFirestoreData(data.personalData || {}));
          setMedicalData(serializeFirestoreData(data.medicalData || {}));
          setHospitalRecords(serializeFirestoreData(data.hospitalRecords || { visits: [] }));
          setHealthAnalytics(serializeFirestoreData(data.healthAnalytics || { heartRateTrends: [], weightTrends: [] }));
        }

        setLoading(false);
      } catch (error) {
        console.error('EHealthPassport: Data fetch error:', error.message);
        setError(error.message);
        setLoading(false);
      }
    };

    fetchData();
  }, [user, authLoading, router]);

  const handleEditSave = async (formData) => {
    if (!user) throw new Error('User not authenticated');
    const userId = user.uid;
    const passportRef = doc(db, 'e_health_passports', userId);
    const passportSnap = await getDoc(passportRef);
    const existingData = passportSnap.exists() ? passportSnap.data() : {};

    await setDoc(passportRef, {
      ...existingData,
      personalData: {
        fullName: formData.fullName,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        bloodGroup: formData.bloodGroup,
      },
    }, { merge: true });

    setPersonalData(formData);
  };

  if (authLoading || loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  if (!user) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <Link 
            href="/dashboard" 
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors mb-4 group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </Link>
          
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-blue-100 rounded-2xl">
              <Heart className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-slate-800">E-Health Passport</h1>
              <p className="text-slate-600 text-lg">Your comprehensive health record</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4">
            <UserInfoCard 
              user={user} 
              personalData={personalData} 
              role={role}
              onEdit={() => setIsEditModalOpen(true)}
            />
          </div>

          <div className="lg:col-span-8">
            <Tabs
              personalData={personalData}
              medicalData={medicalData}
              hospitalRecords={hospitalRecords}
              healthAnalytics={healthAnalytics}
            />
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-slate-500">
            Your health data is encrypted and secure. Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <EditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          personalData={personalData}
          onSave={handleEditSave}
          role={role}
        />
      </div>
    </div>
  );
}