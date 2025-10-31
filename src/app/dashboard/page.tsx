'use client';

import { useAuth } from '../components/AuthProvide';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, Calendar, Pill, User, BarChart2, Siren, Building2, Clock } from 'lucide-react';

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [role, setRole] = useState('patient');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('features');
  const [hospitals, setHospitals] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    if (authLoading || !user) return;

    const userId = user.uid;
    const fetchData = async () => {
      try {
        // Fetch user role
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setRole(userSnap.data().role || 'patient');
        }

        // Fetch hospitals
        const hospitalsRef = collection(db, 'healthcare_providers');
        const hospitalsSnap = await getDocs(hospitalsRef);
        const hospitalsData = hospitalsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setHospitals(hospitalsData);

        // Mock recent activities (replace with real data when API is implemented)
        setRecentActivities([
          {
            id: 'act1',
            type: 'appointment',
            description: 'Scheduled appointment with Dr. Smith',
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: 'act2',
            type: 'diagnosis',
            description: 'New diagnosis added: Hypertension',
            timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: 'act3',
            type: 'medication',
            description: 'Updated dosage schedule for Metformin',
            timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ]);
      } catch (error) {
        console.error('Dashboard: Error fetching data:', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, authLoading]);

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

  const features = [
    { href: '/appointments', label: 'Appointments', icon: Calendar, description: 'Book and manage your appointments' },
    { href: '/dosage-scheduler', label: 'Dosage Scheduler', icon: Pill, description: 'Manage your medication schedule' },
    { href: '/e-passport', label: 'E-Health Passport', icon: User, description: 'View your medical history' },
    { href: '/ai-diagnostic', label: 'AI Diagnostic', icon: BarChart2, description: 'Get AI-powered health insights' },
    { href: '/emergency-services', label: 'Emergency Services', icon: Siren, description: 'Access emergency contacts' },
    ...(role === 'doctor' ? [{ href: '/provider-dashboard', label: 'Provider Dashboard', icon: User, description: 'Manage patient appointments' }] : []),
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <h1 className="text-4xl font-bold text-slate-800 mb-6">Dashboard</h1>

        {/* Tab Navigation */}
        <div className="mb-6 flex space-x-4 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('features')}
            className={`pb-2 px-4 text-sm font-medium ${
              activeTab === 'features'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            Features
          </button>
          <button
            onClick={() => setActiveTab('hospitals')}
            className={`pb-2 px-4 text-sm font-medium ${
              activeTab === 'hospitals'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            Hospitals
          </button>
        </div>

        {/* Features Tab */}
        {activeTab === 'features' && (
          <div className="space-y-8">
            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature) => (
                <Link
                  key={feature.href}
                  href={feature.href}
                  className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-xl">
                      <feature.icon className="h-8 w-8 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-slate-800">{feature.label}</h2>
                      <p className="text-sm text-slate-600">{feature.description}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Recent Activity Section */}
            <div>
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">Recent Activity</h2>
              {recentActivities.length > 0 ? (
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <ul className="space-y-4">
                    {recentActivities.map((activity) => (
                      <li key={activity.id} className="flex items-start gap-4 border-b border-slate-100 pb-4 last:border-b-0">
                        <div className="p-2 bg-slate-100 rounded-lg">
                          {activity.type === 'appointment' && <Calendar className="h-5 w-5 text-blue-600" />}
                          {activity.type === 'diagnosis' && <BarChart2 className="h-5 w-5 text-blue-600" />}
                          {activity.type === 'medication' && <Pill className="h-5 w-5 text-blue-600" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-800">{activity.description}</p>
                          <p className="text-xs text-slate-500 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(activity.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-sm text-slate-600">No recent activity available.</p>
              )}
            </div>
          </div>
        )}

        {/* Hospitals Tab */}
        {activeTab === 'hospitals' && (
          <div>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">Registered Hospitals</h2>
            {hospitals.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {hospitals.map((hospital) => (
                  <div
                    key={hospital.id}
                    className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-100 rounded-xl">
                        <Building2 className="h-8 w-8 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800">{hospital.name}</h3>
                        {hospital.address && (
                          <p className="text-sm text-slate-600">{hospital.address}</p>
                        )}
                        {hospital.contact && (
                          <p className="text-sm text-slate-600">{hospital.contact}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-600">No hospitals registered yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}