'use client';

import React from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Users, FileText } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function Dashboard() {
  const { isLoaded, userId } = useAuth();
  const { user } = useUser();
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded || !userId) return;

    async function fetchPatients() {
      try {
        const q = query(collection(db, 'users'), where('role', '==', 'patient'));
        const querySnapshot = await getDocs(q);
        const patientList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPatients(patientList);
        console.log('Dashboard: Fetched patients:', patientList);
      } catch (error) {
        console.error('Dashboard: Error fetching patients:', error.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPatients();
  }, [isLoaded, userId]);

  if (!isLoaded || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-100 to-blue-100">
        <div className="text-center">
          <Users className="h-12 w-12 animate-pulse text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-6">
          Welcome, {user?.firstName || 'Admin'}
        </h1>
        <div className="bg-white/95 rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-600" />
            Patient List
          </h2>
          {patients.length === 0 ? (
            <p className="text-slate-600">No patients found.</p>
          ) : (
            <ul className="space-y-4">
              {patients.map(patient => (
                <li key={patient.id} className="p-4 bg-slate-50 rounded-xl flex justify-between items-center">
                  <span className="text-slate-800 font-medium">{patient.id}</span>
                  <Link href={`/e-passport/${patient.id}`}>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-all duration-300 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Manage E-Passport
                    </button>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}