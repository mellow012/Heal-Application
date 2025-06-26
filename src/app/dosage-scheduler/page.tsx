'use client';
import { useAuth } from '@clerk/nextjs';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, setDoc, doc, deleteDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Loader2, Pill, Clock, Trash2, FileText } from 'lucide-react';
import Link from 'next/link';

export default function DosageScheduler() {
  const { userId, isLoaded } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (!isLoaded || !userId) return;

    const scheduleQuery = query(collection(db, 'dosage-schedules'), where('userId', '==', userId));
    const scheduleUnsubscribe = onSnapshot(scheduleQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSchedules(data);
      setRemindersEnabled(data[0]?.remindersEnabled || false);
    }, (error) => {
      console.error('DosageScheduler: Error fetching schedules:', error.message);
      alert(`Failed to load schedules: ${error.message}`);
    });

    const prescriptionQuery = query(
      collection(db, `e-passports/${userId}/prescriptions`),
      where('status', '==', 'active')
    );
    const prescriptionUnsubscribe = onSnapshot(prescriptionQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPrescriptions(data);
      setLoading(false);
    }, (error) => {
      console.error('DosageScheduler: Error fetching prescriptions:', error.message);
      alert(`Failed to load prescriptions: ${error.message}`);
      setLoading(false);
    });

    return () => {
      scheduleUnsubscribe();
      prescriptionUnsubscribe();
    };
  }, [userId, isLoaded]);

  useEffect(() => {
    if (!remindersEnabled || !schedules[0]?.medications) return;

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }

    const interval = setInterval(() => {
      const currentTime = new Date().toTimeString().slice(0, 5);
      const medications = schedules[0]?.medications || [];

      medications.forEach(med => {
        if (med.times.includes(currentTime) && Notification.permission === 'granted') {
          new Notification(`Time for ${med.name}`, {
            body: `Take ${med.dose} now (${med.days})`,
            icon: '/pill-icon.png'
          });
        }
      });
    }, 60000);

    return () => clearInterval(interval);
  }, [remindersEnabled, schedules]);

  const generateSchedule = (prescription) => {
    const { medicationName, dose, frequency, times } = prescription;
    let scheduleTimes = times || [];
    if (!scheduleTimes.length) {
      switch (frequency.toLowerCase()) {
        case 'once daily':
          scheduleTimes = ['08:00'];
          break;
        case 'twice daily':
          scheduleTimes = ['08:00', '20:00'];
          break;
        case 'three times daily':
          scheduleTimes = ['08:00', '14:00', '20:00'];
          break;
        default:
          scheduleTimes = ['08:00'];
      }
    }
    return {
      name: medicationName,
      dose,
      times: scheduleTimes,
      days: 'daily',
      prescriptionId: prescription.id
    };
  };

  const handleImportPrescription = async (prescription) => {
    setImporting(true);
    try {
      const newMed = generateSchedule(prescription);
      const existingSchedule = schedules[0] || { medications: [] };
      await setDoc(doc(db, 'dosage-schedules', userId), {
        userId,
        medications: [...existingSchedule.medications, newMed],
        remindersEnabled,
        updatedAt: new Date()
      }, { merge: true });
    } catch (error) {
      console.error('DosageScheduler: Error importing prescription:', error.message);
      alert('Failed to import prescription');
    } finally {
      setImporting(false);
    }
  };

  const handleDeleteMed = async (index) => {
    try {
      const existingSchedule = schedules[0];
      if (!existingSchedule) return;
      const updatedMeds = existingSchedule.medications.filter((_, i) => i !== index);
      await setDoc(doc(db, 'dosage-schedules', userId), {
        userId,
        medications: updatedMeds,
        remindersEnabled,
        updatedAt: new Date()
      }, { merge: true });
    } catch (error) {
      console.error('DosageScheduler: Error deleting med:', error.message);
      alert('Failed to delete medication');
    }
  };

  const handleToggleReminders = async () => {
    try {
      await setDoc(doc(db, 'dosage-schedules', userId), {
        userId,
        medications: schedules[0]?.medications || [],
        remindersEnabled: !remindersEnabled,
        updatedAt: new Date()
      }, { merge: true });
    } catch (error) {
      console.error('DosageScheduler: Error toggling reminders:', error.message);
      alert('Failed to toggle reminders');
    }
  };

  if (!isLoaded || loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
    </div>
  );

  if (!userId) return (
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
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-4">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-blue-100 rounded-xl">
            <Pill className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-slate-800">Dosage Scheduler</h1>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          <h2 className="text-2xl font-semibold text-slate-800 mb-4">Import Prescriptions</h2>
          {prescriptions.length > 0 ? (
            <ul className="space-y-4">
              {prescriptions.map(prescription => (
                <li key={prescription.id} className="p-4 bg-blue-50 rounded-lg flex justify-between items-center">
                  <div>
                    <p className="font-medium text-slate-800">{prescription.medicationName} ({prescription.dose})</p>
                    <p className="text-sm text-slate-600">Frequency: {prescription.frequency}</p>
                    <p className="text-sm text-slate-600">Expires: {new Date(prescription.expiresAt).toLocaleDateString()}</p>
                  </div>
                  <button
                    onClick={() => handleImportPrescription(prescription)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    disabled={importing}
                  >
                    {importing ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileText className="h-5 w-5" />}
                    Import
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-600 text-center py-4">No active prescriptions found</p>
          )}
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-slate-800">Your Schedule</h2>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={remindersEnabled}
                onChange={handleToggleReminders}
                className="h-5 w-5 text-blue-600"
              />
              <span className="text-slate-600">Enable Reminders</span>
            </label>
          </div>
          {schedules.length > 0 && schedules[0].medications?.length > 0 ? (
            <ul className="space-y-4">
              {schedules[0].medications.map((med, index) => (
                <li key={index} className="p-4 bg-blue-50 rounded-lg flex justify-between items-center">
                  <div>
                    <p className="font-medium text-slate-800">{med.name} ({med.dose})</p>
                    <p className="text-sm text-slate-600">Times: {med.times.join(', ')}</p>
                    <p className="text-sm text-slate-600">Frequency: {med.days}</p>
                  </div>
                  <div className="flex gap-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <button
                      onClick={() => handleDeleteMed(index)}
                      className="p-2 hover:bg-red-100 rounded-full"
                      title="Delete"
                    >
                      <Trash2 className="h-5 w-5 text-red-600" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-600 text-center py-4">No medications scheduled</p>
          )}
        </div>
      </div>
    </div>
  );
}