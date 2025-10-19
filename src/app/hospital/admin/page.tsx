'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../components/AuthProvider';
import { useRouter } from 'next/navigation';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebaseConfig';

export default function HospitalAdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [hospitalName, setHospitalName] = useState('');
  const [hospitalLocation, setHospitalLocation] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (!loading && (!user || user.customClaims?.role !== 'hospital_admin')) {
      router.push('/login');
    }
    // Load existing hospital data
    const fetchHospital = async () => {
      if (user) {
        const hospitalRef = doc(db, 'hospitals', user.uid);
        const hospitalSnap = await getDoc(hospitalRef);
        if (hospitalSnap.exists()) {
          const data = hospitalSnap.data();
          setHospitalName(data.name || '');
          setHospitalLocation(data.location || '');
        }
      }
    };
    fetchHospital();
  }, [user, loading, router]);

  const handleUpdateHospital = async (e) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, 'hospitals', user.uid), {
        name: hospitalName,
        location: hospitalLocation,
        adminId: user.uid,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      setSuccess('Hospital instance updated!');
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl mb-4">Hospital Admin: Manage Hospital</h1>
      <form onSubmit={handleUpdateHospital} className="flex flex-col gap-4 w-full max-w-md">
        <input
          type="text"
          value={hospitalName}
          onChange={(e) => setHospitalName(e.target.value)}
          placeholder="Hospital Name"
          className="p-2 border rounded"
        />
        <input
          type="text"
          value={hospitalLocation}
          onChange={(e) => setHospitalLocation(e.target.value)}
          placeholder="Hospital Location"
          className="p-2 border rounded"
        />
        <button type="submit" className="p-2 bg-blue-500 text-white rounded">
          Save Hospital
        </button>
        {error && <p className="text-red-500">{error}</p>}
        {success && <p className="text-green-500">{success}</p>}
      </form>
    </div>
  );
}