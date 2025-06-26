'use client';
import { useAuth } from '@clerk/nextjs';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Loader2, Calendar, Pill, User, BarChart2, Siren } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const { userId, isLoaded } = useAuth();
  const [role, setRole] = useState('patient');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    console.log('Dashboard: Clerk userId:', userId, 'isLoaded:', isLoaded); // Debug
    if (!isLoaded) return;

    if (!userId) {
      console.log('Dashboard: No user, redirecting to sign-in');
      router.push('/sign-in');
      return;
    }

    const fetchRole = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        console.log('Dashboard: User doc exists:', userDoc.exists()); // Debug
        if (userDoc.exists()) {
          setRole(userDoc.data().role || 'patient');
        } else {
          console.log('Dashboard: User doc missing, defaulting to patient');
        }
      } catch (error) {
        console.error('Dashboard: Error fetching role:', error.message);
        // Default to patient role instead of redirecting
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, [userId, isLoaded, router]);

  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!userId) {
    return null; // Handled by router.push
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Link key={feature.href} href={feature.href} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
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
      </div>
    </div>
  );
}