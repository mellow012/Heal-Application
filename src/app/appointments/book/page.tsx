'use client';
import { useAuth, useUser } from '@clerk/nextjs';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, collection, getDocs, addDoc } from 'firebase/firestore';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, AlertCircle, ArrowLeft, Search, Calendar } from 'lucide-react';

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
    <div className="text-center">
      <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
      <p className="text-slate-600 text-lg">Loading booking form...</p>
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
        Failed to load booking form: {error}
      </p>
      <Link 
        href="/sign-in" 
        className="bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors"
      >
        Sign In Again
      </Link>
    </div>
  </div>
);

export default function BookAppointment() {
  const { userId, isLoaded: authLoaded } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editApptId = searchParams.get('edit');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [role, setRole] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [formData, setFormData] = useState({
    need: '',
    problem: '',
    urgency: '',
    preferredTime: '',
    hospitalId: '',
    slot: null,
  });

  const needs = [
    'General Consultation',
    'Physical Therapy',
    'X-Ray Scan',
    'Blood Test',
    'Cardiology',
    'Dermatology',
    'Orthopedic',
    'Mental Health',
    'Pediatrics',
    'Gynecology'
  ];

  const specialtyMap = {
    'General Consultation': ['General Practitioner'],
    'Physical Therapy': ['Physiotherapy'],
    'X-Ray Scan': ['Radiology'],
    'Blood Test': ['Pathology'],
    'Cardiology': ['Cardiology'],
    'Dermatology': ['Dermatology'],
    'Orthopedic': ['Orthopedics'],
    'Mental Health': ['Psychiatry', 'Counseling'],
    'Pediatrics': ['Pediatrics'],
    'Gynecology': ['Gynecology']
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!authLoaded || !userLoaded) return;

        if (!userId) {
          console.log('BookAppointment: No user, redirecting to sign-in');
          router.push('/sign-in');
          return;
        }

        console.log('BookAppointment: Fetching user document for', userId);
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          console.log('BookAppointment: No user document, redirecting to profile-setup');
          router.push('/profile-setup');
          return;
        }

        setRole(userSnap.data().role || 'none');

        console.log('BookAppointment: Fetching providers');
        const providersSnap = await getDocs(collection(db, 'healthcare_providers'));
        const providers = providersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setDoctors(providers.filter(p => p.type === 'doctor'));
        setHospitals(providers.filter(p => p.type === 'hospital'));

        if (editApptId) {
          const apptSnap = await getDoc(doc(db, 'appointments', editApptId));
          if (apptSnap.exists()) {
            const appt = apptSnap.data();
            setFormData({
              need: appt.need,
              problem: appt.problem || '',
              urgency: appt.urgency || '',
              preferredTime: appt.preferredTime || '',
              hospitalId: appt.hospitalId,
              slot: appt.slot,
            });
            setSelectedDoctor(appt.doctorId);
          }
        }

        setLoading(false);
      } catch (error) {
        console.error('BookAppointment: Data fetch error:', error.message);
        setError(error.message);
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, authLoaded, userLoaded, router, editApptId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === 'need') {
      const specialties = specialtyMap[value] || [];
      const matchingDoctors = doctors.filter(d => specialties.includes(d.specialty));
      setFilteredDoctors(matchingDoctors);
      setSelectedDoctor(null);
      setFormData(prev => ({ ...prev, doctorId: '', slot: null }));
    }
  };

  const handleDoctorSelect = (doctorId) => {
    setSelectedDoctor(doctorId);
    setFormData({ ...formData, doctorId, slot: null });
  };

  const handleSlotSelect = (slot) => {
    setFormData({ ...formData, slot });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (role !== 'patient') {
      alert('Only patients can book appointments.');
      return;
    }

    if (!formData.slot || !formData.doctorId || !formData.hospitalId) {
      alert('Please select a doctor, hospital, and time slot.');
      return;
    }

    try {
      console.log('BookAppointment: Saving appointment for user', userId);
      const doctor = doctors.find(d => d.id === formData.doctorId);
      const hospital = hospitals.find(h => h.id === formData.hospitalId);

      const appointmentData = {
        userId,
        userEmail: user.emailAddresses[0].emailAddress,
        userName: user.fullName || `${user.firstName} ${user.lastName}`,
        doctorId: formData.doctorId,
        doctorName: doctor?.name || 'Unknown',
        hospitalId: formData.hospitalId,
        hospitalName: hospital?.name || 'Unknown',
        need: formData.need,
        problem: formData.problem,
        urgency: formData.urgency,
        preferredTime: formData.preferredTime,
        status: 'pending',
        slot: formData.slot,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      let apptId;
      if (editApptId) {
        await setDoc(doc(db, 'appointments', editApptId), appointmentData);
        apptId = editApptId;
      } else {
        const docRef = await addDoc(collection(db, 'appointments'), appointmentData);
        apptId = docRef.id;
      }

      // Update doctor's availableSlots
      const doctorRef = doc(db, 'healthcare_providers', formData.doctorId);
      const doctorSnap = await getDoc(doctorRef);
      if (doctorSnap.exists()) {
        const doctorData = doctorSnap.data();
        const updatedSlots = doctorData.availableSlots.map(slot =>
          slot.date === formData.slot.date && slot.time === formData.slot.time
            ? { ...slot, status: 'booked' }
            : slot
        );
        await setDoc(doctorRef, { availableSlots: updatedSlots }, { merge: true });
      }

      router.push('/appointments');
      console.log('BookAppointment: Appointment saved successfully', apptId);
    } catch (error) {
      console.error('BookAppointment: Save error:', error.message);
      alert(`Failed to save appointment: ${error.message}`);
    }
  };

  if (!authLoaded || !userLoaded || loading) return <LoadingSpinner />;
  if (error) return <ErrorState error={error} />;
  if (!user) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Link 
          href="/appointments" 
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors mb-4 group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Back to Appointments
        </Link>
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-blue-100 rounded-2xl">
            <Calendar className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-slate-800">
            {editApptId ? 'Edit Appointment' : 'Book an Appointment'}
          </h1>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm text-slate-600 mb-1">What do you need?</label>
              <select
                name="need"
                value={formData.need}
                onChange={handleInputChange}
                className="w-full p-2 border border-slate-300 rounded-lg"
                required
              >
                <option value="">Select Need</option>
                {needs.map(need => (
                  <option key={need} value={need}>{need}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Describe your problem (optional)</label>
              <textarea
                name="problem"
                value={formData.problem}
                onChange={handleInputChange}
                className="w-full p-2 border border-slate-300 rounded-lg"
                rows={4}
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Urgency Level</label>
              <div className="grid grid-cols-3 gap-3">
                {['Low', 'Medium', 'High'].map(level => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setFormData({ ...formData, urgency: level })}
                    className={`p-3 border rounded-lg text-center transition-colors ${
                      formData.urgency === level
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Preferred Time</label>
              <select
                name="preferredTime"
                value={formData.preferredTime}
                onChange={handleInputChange}
                className="w-full p-2 border border-slate-300 rounded-lg"
              >
                <option value="">Any time</option>
                <option value="morning">Morning (8AM - 12PM)</option>
                <option value="afternoon">Afternoon (12PM - 5PM)</option>
                <option value="evening">Evening (5PM - 8PM)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Hospital</label>
              <select
                name="hospitalId"
                value={formData.hospitalId}
                onChange={handleInputChange}
                className="w-full p-2 border border-slate-300 rounded-lg"
                required
              >
                <option value="">Select Hospital</option>
                {hospitals.map(hospital => (
                  <option key={hospital.id} value={hospital.id}>{hospital.name}</option>
                ))}
              </select>
            </div>
            {formData.need && (
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <Search className="h-5 w-5 text-blue-600" />
                  Available Doctors
                </h3>
                {filteredDoctors.length > 0 ? (
                  <div className="grid gap-4">
                    {filteredDoctors.map(doctor => (
                      <div
                        key={doctor.id}
                        onClick={() => handleDoctorSelect(doctor.id)}
                        className={`p-4 rounded-lg cursor-pointer ${selectedDoctor === doctor.id ? 'bg-blue-100 border-blue-600' : 'bg-slate-50 hover:bg-blue-50'} border`}
                      >
                        <p className="font-medium text-slate-800">{doctor.name}</p>
                        <p className="text-sm text-slate-600">Specialty: {doctor.specialty}</p>
                        <p className="text-sm text-slate-600">Location: {doctor.location}</p>
                        <p className="text-sm text-slate-600">Rating: ⭐ {doctor.rating}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-600">No doctors available for this need.</p>
                )}
              </div>
            )}
            {selectedDoctor && (
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  Available Slots
                </h3>
                <div className="grid gap-4">
                  {doctors.find(d => d.id === selectedDoctor)?.availableSlots
                    ?.filter(slot => slot.status === 'open')
                    .map(slot => (
                      <button
                        key={`${slot.date}-${slot.time}`}
                        onClick={() => handleSlotSelect(slot)}
                        type="button"
                        className={`p-4 rounded-lg ${formData.slot?.date === slot.date && formData.slot?.time === slot.time ? 'bg-blue-600 text-white' : 'bg-slate-50 hover:bg-blue-50'} border`}
                      >
                        {slot.date} at {slot.time}
                      </button>
                    )) || <p className="text-slate-600">No slots available.</p>}
                </div>
              </div>
            )}
            <div className="flex gap-4">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                disabled={!formData.slot}
              >
                {editApptId ? 'Save Changes' : 'Book Appointment'}
              </button>
              <Link
                href="/appointments"
                className="flex-1 bg-slate-100 text-slate-700 px-6 py-3 rounded-lg hover:bg-slate-200 transition-colors text-center"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}