'use client';

import { useAuth } from '../components/AuthProvide';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, AlertCircle, Calendar,Clock,User, ArrowLeft, CalendarPlus, CheckCircle, XCircle, Users } from 'lucide-react';

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
    <div className="text-center">
      <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
      <p className="text-slate-600 text-lg">Loading appointments...</p>
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
        Failed to load appointments: {error}
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

const AppointmentCard = ({ appt }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'pending': return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'completed': return <CheckCircle className="w-5 h-5 text-blue-500" />;
      default: return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  return (
    <li className="p-4 bg-yellow-50 rounded-lg flex justify-between items-center">
      <div>
        <p className="font-medium text-slate-800">
          {appt.doctorName} at {appt.hospitalName}
        </p>
        <p className="text-sm text-slate-600">
          {appt.slot.date} at {appt.slot.time} ({appt.status})
        </p>
        <p className="text-sm text-slate-600">
          Need: {appt.need} | Problem: {appt.problem || 'N/A'}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          appt.status === 'confirmed' ? 'bg-green-100 text-green-700' :
          appt.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
          appt.status === 'completed' ? 'bg-blue-100 text-blue-700' :
          'bg-red-100 text-red-700'
        }`}>
          {appt.status}
        </span>
      </div>
    </li>
  );
};

export default function Appointments() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [role, setRole] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (authLoading || !user) return;

    const userId = user.uid;
    const fetchData = async () => {
      try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          router.push('/profile-setup');
          return;
        }

        setRole(userSnap.data().role || 'patient');

        const q = query(
          collection(db, 'appointments'),
          where('userId', '==', userId),
          where('status', '!=', 'cancelled')
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const appointmentsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate?.() || new Date()
          }));
          setAppointments(appointmentsData);
        });

        setLoading(false);
        return () => unsubscribe();
      } catch (error) {
        console.error('Appointments: Data fetch error:', error.message);
        setError(error.message);
        setLoading(false);
      }
    };

    fetchData();
  }, [user, authLoading, router]);

  const today = new Date().toISOString().split('T')[0];
  const upcomingAppointments = appointments.filter(
    appt => (appt.status === 'pending' || appt.status === 'confirmed') && appt.slot.date >= today
  );
  const pastAppointments = appointments.filter(
    appt => appt.status === 'completed' || appt.slot.date < today
  );

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Book New Appointment</h2>
            <p className="text-blue-100 mb-4">Find the right doctor for your needs</p>
            <Link
              href="/appointments/book"
              className="bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-colors flex items-center gap-2"
            >
              <CalendarPlus className="w-5 h-5" />
              Book Appointment
            </Link>
          </div>
          <Calendar className="w-24 h-24 text-blue-200 hidden md:block" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm">Upcoming</p>
              <p className="text-2xl font-bold text-slate-800">{upcomingAppointments.length}</p>
            </div>
            <Clock className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm">This Month</p>
              <p className="text-2xl font-bold text-slate-800">
                {appointments.filter(appt => {
                  const aptDate = new Date(appt.slot.date);
                  const now = new Date();
                  return aptDate.getMonth() === now.getMonth() && aptDate.getFullYear() === now.getFullYear();
                }).length}
              </p>
            </div>
            <User className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm">Total Visits</p>
              <p className="text-2xl font-bold text-slate-800">{appointments.length}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Recent Activity</h3>
        {appointments.length > 0 ? (
          <ul className="space-y-4">
            {appointments.slice(0, 3).map(appt => (
              <AppointmentCard key={appt.id} appt={appt} />
            ))}
          </ul>
        ) : (
          <p className="text-slate-600 text-center py-4">No recent appointments</p>
        )}
      </div>
    </div>
  );

  const renderUpcoming = () => (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      <h2 className="text-2xl font-semibold text-slate-800 mb-4">Upcoming Appointments</h2>
      {upcomingAppointments.length > 0 ? (
        <ul className="space-y-4">
          {upcomingAppointments.map(appt => (
            <AppointmentCard key={appt.id} appt={appt} />
          ))}
        </ul>
      ) : (
        <p className="text-slate-600 text-center py-4">No upcoming appointments</p>
      )}
    </div>
  );

  const renderPast = () => (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      <h2 className="text-2xl font-semibold text-slate-800 mb-4">Past Appointments</h2>
      {pastAppointments.length > 0 ? (
        <ul className="space-y-4">
          {pastAppointments.map(appt => (
            <AppointmentCard key={appt.id} appt={appt} />
          ))}
        </ul>
      ) : (
        <p className="text-slate-600 text-center py-4">No past appointments</p>
      )}
    </div>
  );

  if (authLoading || loading) return <LoadingSpinner />;
  if (error) return <ErrorState error={error} />;
  if (!user) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Link 
          href="/dashboard" 
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors mb-4 group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </Link>
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-yellow-100 rounded-2xl">
            <Calendar className="h-8 w-8 text-yellow-600" />
          </div>
          <h1 className="text-4xl font-bold text-slate-800">Appointments</h1>
        </div>
        {role !== 'patient' ? (
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <p className="text-red-600">Only patients can view appointments.</p>
          </div>
        ) : (
          <div className="grid gap-8">
            <div className="border-b border-slate-200 mb-4">
              <nav className="flex space-x-8">
                {[
                  { id: 'overview', label: 'Overview' },
                  { id: 'upcoming', label: 'Upcoming' },
                  { id: 'past', label: 'Past Appointments' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-2 px-1 text-sm font-medium ${
                      activeTab === tab.id
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-slate-600 hover:text-blue-600'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'upcoming' && renderUpcoming()}
            {activeTab === 'past' && renderPast()}
          </div>
        )}
      </div>
    </div>
  );
}