'use client';

import { useAuth } from '@/app/components/AuthProvide';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, setDoc, doc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Hospital, Stethoscope, Calendar, AlertCircle, ArrowLeft } from 'lucide-react';

const SkeletonLoader = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Back link skeleton */}
      <div className="mb-4">
        <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
      </div>
      {/* Header skeleton */}
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-blue-100 rounded-xl">
          <div className="h-8 w-8 bg-slate-200 rounded animate-pulse" />
        </div>
        <div className="h-8 w-64 bg-slate-200 rounded animate-pulse" />
      </div>
      {/* Hospital details skeleton */}
      <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
        <div className="h-6 w-48 bg-slate-200 rounded mb-4 animate-pulse" />
        <div className="space-y-2">
          <div className="h-4 w-40 bg-slate-200 rounded animate-pulse" />
          <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
          <div className="h-4 w-36 bg-slate-200 rounded animate-pulse" />
        </div>
      </div>
      {/* Doctors section skeleton */}
      <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
        <div className="h-6 w-48 bg-slate-200 rounded mb-4 animate-pulse" />
        <div className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="p-4 bg-blue-50 rounded-lg flex justify-between items-center">
              <div className="space-y-2">
                <div className="h-4 w-40 bg-slate-200 rounded animate-pulse" />
                <div className="h-3 w-32 bg-slate-200 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Appointments section skeleton */}
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <div className="h-6 w-48 bg-slate-200 rounded mb-4 animate-pulse" />
        <div className="space-y-4">
          {[...Array(2)].map((_, index) => (
            <div key={index} className="p-4 bg-blue-50 rounded-lg flex justify-between items-center">
              <div className="space-y-2">
                <div className="h-4 w-40 bg-slate-200 rounded animate-pulse" />
                <div className="h-3 w-32 bg-slate-200 rounded animate-pulse" />
                <div className="h-3 w-28 bg-slate-200 rounded animate-pulse" />
              </div>
              <div className="h-10 w-24 bg-slate-200 rounded-lg animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const ErrorState = ({ error }) => (
  <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center">
    <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
      <div className="p-3 bg-red-100 rounded-full w-fit mx-auto mb-6">
        <AlertCircle className="h-8 w-8 text-red-600" />
      </div>
      <h1 className="text-2xl font-bold text-slate-800 mb-4">Something went wrong</h1>
      <p className="text-slate-600 mb-6">Failed to load hospital page: {error}</p>
      <Link href="/sign-in" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
        Sign In Again
      </Link>
    </div>
  </div>
);

export default function HospitalPage() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hospital, setHospital] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [role, setRole] = useState(null);
  const [hospitalData, setHospitalData] = useState({
    name: '',
    location: '',
    contact: '',
  });
  const [specialtyFilter, setSpecialtyFilter] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (authLoading || !user) return;

        console.log('HospitalPage: Fetching user document for', user.uid);
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          console.log('HospitalPage: No user document, redirecting to profile-setup');
          router.push('/profile-setup');
          return;
        }
        setRole(userSnap.data().role || 'none');

        // Fetch hospitals (assuming user is linked to a hospital if hospital_staff or doctor)
        const providersSnap = await getDocs(collection(db, 'healthcare_providers'));
        const providers = providersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const hospitals = providers.filter(p => p.type === 'hospital');
        const userHospital = hospitals.find(h => h.id === user.hospitalId || userSnap.data().hospitalId === h.id);
        
        if (!userHospital && role !== 'patient') {
          setError('No hospital associated with this user');
          setLoading(false);
          return;
        }
        setHospital(userHospital || hospitals[0]); // Fallback to first hospital for patients

        // Fetch doctors for the hospital
        const hospitalDoctors = providers.filter(p => p.type === 'doctor' && p.hospitalId === (userHospital?.id || hospitals[0].id));
        setDoctors(hospitalDoctors);

        // Fetch appointments for the hospital
        const apptQuery = query(
          collection(db, 'appointments'),
          where('hospitalId', '==', userHospital?.id || hospitals[0].id)
        );
        const apptSnap = await getDocs(apptQuery);
        const appts = apptSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAppointments(appts);

        setHospitalData({
          name: userHospital?.name || '',
          location: userHospital?.location || '',
          contact: userHospital?.contact || '',
        });

        setLoading(false);
      } catch (error) {
        console.error('HospitalPage: Data fetch error:', error.message);
        setError(error.message);
        setLoading(false);
      }
    };

    fetchData();
  }, [user, authLoading]);

  const handleHospitalUpdate = async (e) => {
    e.preventDefault();
    if (role !== 'hospital_staff') {
      alert('Only hospital staff can update hospital details.');
      return;
    }

    try {
      await setDoc(doc(db, 'healthcare_providers', hospital.id), hospitalData, { merge: true });
      setHospital({ ...hospital, ...hospitalData });
      alert('Hospital details updated successfully.');
    } catch (error) {
      console.error('HospitalPage: Update error:', error.message);
      setError(error.message);
    }
  };

  const handleConfirmAppointment = async (apptId) => {
    if (role !== 'doctor' && role !== 'hospital_staff') {
      alert('Only doctors or hospital staff can confirm appointments.');
      return;
    }

    try {
      await setDoc(doc(db, 'appointments', apptId), { status: 'confirmed' }, { merge: true });
      setAppointments(appointments.map(appt => 
        appt.id === apptId ? { ...appt, status: 'confirmed' } : appt
      ));
      alert('Appointment confirmed.');
    } catch (error) {
      console.error('HospitalPage: Confirm appointment error:', error.message);
      setError(error.message);
    }
  };

  const handleSpecialtyFilter = (e) => {
    setSpecialtyFilter(e.target.value);
  };

  const filteredDoctors = specialtyFilter
    ? doctors.filter(d => d.specialty.toLowerCase().includes(specialtyFilter.toLowerCase()))
    : doctors;

  if (loading || authLoading) return <SkeletonLoader />;
  if (error) return <ErrorState error={error} />;
  if (!user) return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
        <h1 className="text-2xl font-bold text-slate-800 mb-4">Please Sign In</h1>
        <Link href="/sign-in" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
          Sign In
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-4 group">
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </Link>
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-blue-100 rounded-xl">
            <Hospital className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-slate-800">{hospital?.name || 'Hospital'}</h1>
        </div>

        {/* Hospital Details */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          <h2 className="text-2xl font-semibold text-slate-800 mb-4">Hospital Details</h2>
          {role === 'hospital_staff' ? (
            <form onSubmit={handleHospitalUpdate} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-600 mb-1">Name</label>
                <input
                  type="text"
                  value={hospitalData.name}
                  onChange={(e) => setHospitalData({ ...hospitalData, name: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Location</label>
                <input
                  type="text"
                  value={hospitalData.location}
                  onChange={(e) => setHospitalData({ ...hospitalData, location: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Contact</label>
                <input
                  type="text"
                  value={hospitalData.contact}
                  onChange={(e) => setHospitalData({ ...hospitalData, contact: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                  required
                />
              </div>
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Update Details
              </button>
            </form>
          ) : (
            <div className="space-y-2">
              <p className="text-slate-800"><strong>Name:</strong> {hospital?.name}</p>
              <p className="text-slate-800"><strong>Location:</strong> {hospital?.location}</p>
              <p className="text-slate-800"><strong>Contact:</strong> {hospital?.contact}</p>
            </div>
          )}
        </div>

        {/* Doctors List */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          <h2 className="text-2xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Stethoscope className="h-6 w-6 text-blue-600" />
            Doctors
          </h2>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Filter by specialty"
              value={specialtyFilter}
              onChange={handleSpecialtyFilter}
              className="w-full p-2 border border-slate-300 rounded-lg"
            />
          </div>
          {filteredDoctors.length > 0 ? (
            <ul className="space-y-4">
              {filteredDoctors.map(doctor => (
                <li key={doctor.id} className="p-4 bg-blue-50 rounded-lg">
                  <p className="font-medium text-slate-800">{doctor.name}</p>
                  <p className="text-sm text-slate-600">Specialty: {doctor.specialty}</p>
                  <p className="text-sm text-slate-600">Rating: ⭐ {doctor.rating}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-600 text-center py-4">No doctors found</p>
          )}
        </div>

        {/* Appointments List */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h2 className="text-2xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Calendar className="h-6 w-6 text-blue-600" />
            Appointments
          </h2>
          {appointments.length > 0 ? (
            <ul className="space-y-4">
              {appointments.map(appt => (
                <li key={appt.id} className="p-4 bg-blue-50 rounded-lg flex justify-between items-center">
                  <div>
                    <p className="font-medium text-slate-800">Patient: {appt.userName}</p>
                    <p className="text-sm text-slate-600">Doctor: {appt.doctorName}</p>
                    <p className="text-sm text-slate-600">Date: {appt.slot.date} at {appt.slot.time}</p>
                    <p className="text-sm text-slate-600">Status: {appt.status}</p>
                  </div>
                  {(role === 'doctor' || role === 'hospital_staff') && appt.status === 'pending' && (
                    <button
                      onClick={() => handleConfirmAppointment(appt.id)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Confirm
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-600 text-center py-4">No appointments found</p>
          )}
        </div>
      </div>
    </div>
  );
}