'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../components/AuthProvide';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

export default function DashboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [hospitalData, setHospitalData] = useState(null);
  const [staff, setStaff] = useState([]);
  const [authorizedPatients, setAuthorizedPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    const fetchData = async () => {
      if (!user || !user.customClaims?.role) {
        setError('Unauthorized access');
        setLoading(false);
        return;
      }

      try {
        // Fetch hospital data
        const hospitalRef = doc(db, 'hospitals', user.uid);
        const hospitalSnap = await getDoc(hospitalRef);
        if (hospitalSnap.exists()) {
          setHospitalData(hospitalSnap.data());
        } else if (user.customClaims.role === 'hospital_admin') {
          router.push('/hospital-admin'); // Redirect to setup hospital if not exists
          return;
        } else {
          setError('No hospital found');
        }

        // Fetch staff (users with hospitalId matching user's hospital)
        const staffQuery = query(
          collection(db, 'users'),
          where('hospitalId', '==', user.uid),
          where('role', 'in', ['doctor', 'nurse', 'receptionist'])
        );
        const staffSnapshot = await getDocs(staffQuery);
        const staffList = staffSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setStaff(staffList);

        // Fetch authorized patients (consents for this hospital)
        const consentsQuery = query(
          collection(db, 'consents'),
          where('hospitalId', '==', user.uid)
        );
        const consentsSnapshot = await getDocs(consentsQuery);
        const patientList = consentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAuthorizedPatients(patientList);

        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    if (user && user.customClaims?.role === 'hospital_admin') {
      fetchData();
    }
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !hospitalData) {
    return (
      <div className="text-center py-12">
        <p>{error || 'No hospital found. Please complete hospital setup.'}</p>
        <Link href="/hospital-admin" className="text-indigo-600 hover:text-indigo-800">
          Go to Hospital Setup
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {hospitalData.name}
              </h1>
              <p className="text-gray-600">
                Welcome back, {user.email} ({user.customClaims.role})
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/hospital-admin"
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                {user.customClaims.role === 'hospital_admin' ? 'Admin Panel' : 'Staff Panel'}
              </Link>
              <button
                onClick={logout}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Staff Members"
            value={staff.length}
            icon="👥"
            color="bg-blue-500"
          />
          <StatCard
            title="Authorized Patients"
            value={authorizedPatients.length}
            icon="🏥"
            color="bg-green-500"
          />
          <StatCard
            title="Pending Requests"
            value="0" // Placeholder, fetch from consents if needed
            icon="⏳"
            color="bg-yellow-500"
          />
          <StatCard
            title="Specialties"
            value={hospitalData.specialties?.length || 0}
            icon="🔬"
            color="bg-purple-500"
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <QuickAction
              href="/staff/patients"
              title="View Patients"
              description="Access authorized patient data"
              icon="📋"
            />
            <QuickAction
              href="/staff/appointments"
              title="Appointments"
              description="Manage patient appointments"
              icon="📅"
            />
            <QuickAction
              href="/staff/requests"
              title="Access Requests"
              description="Request patient data access"
              icon="🔐"
            />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-4">
            <ActivityItem
              action="New staff member invited"
              time="2 hours ago"
              user="Dr. Smith"
            />
            <ActivityItem
              action="Patient access granted"
              time="4 hours ago"
              user="Patient #12345"
            />
            <ActivityItem
              action="Medical record accessed"
              time="6 hours ago"
              user="Nurse Johnson"
            />
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`${color} text-white p-3 rounded-lg text-2xl mr-4`}>
          {icon}
        </div>
        <div>
          <p className="text-gray-600 text-sm">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

function QuickAction({ href, title, description, icon }) {
  return (
    <Link href={href} className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex items-center mb-2">
        <span className="text-2xl mr-3">{icon}</span>
        <h3 className="font-semibold text-gray-900">{title}</h3>
      </div>
      <p className="text-gray-600 text-sm">{description}</p>
    </Link>
  );
}

function ActivityItem({ action, time, user }) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-b-0">
      <div>
        <p className="text-gray-900">{action}</p>
        <p className="text-gray-500 text-sm">{user}</p>
      </div>
      <span className="text-gray-400 text-sm">{time}</span>
    </div>
  );
}