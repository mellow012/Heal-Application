'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../app/components/AuthProvide';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function useHospital() {
  const { user, loading: authLoading } = useAuth();
  const [hospitalData, setHospitalData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) {
      setLoading(false);
      return;
    }

    if (user.customClaims?.role === 'hospital_admin') {
      fetchHospitalData();
    } else {
      setLoading(false);
    }
  }, [user, authLoading]);

  const fetchHospitalData = async () => {
    try {
      const hospitalDoc = await getDoc(doc(db, 'hospitals', user.uid));
      if (hospitalDoc.exists()) {
        setHospitalData(hospitalDoc.data());
      }
    } catch (error) {
      console.error('Error fetching hospital data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createHospitalProfile = async (hospitalInfo) => {
    if (!user || user.customClaims?.role !== 'hospital_admin') {
      throw new Error('Only hospital admins can create hospital profiles');
    }

    const hospitalData = {
      name: hospitalInfo.name,
      address: hospitalInfo.address,
      phone: hospitalInfo.phone,
      email: hospitalInfo.email,
      license: hospitalInfo.license,
      specialties: hospitalInfo.specialties || [],
      adminId: user.uid,
      createdAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'hospitals', user.uid), hospitalData);
    setHospitalData(hospitalData);
    return hospitalData;
  };

  const updateHospitalProfile = async (updates) => {
    if (!user || user.customClaims?.role !== 'hospital_admin') {
      throw new Error('Only hospital admins can update hospital profiles');
    }

    await updateDoc(doc(db, 'hospitals', user.uid), {
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    await fetchHospitalData();
  };

  return {
    hospitalData,
    loading,
    createHospitalProfile,
    updateHospitalProfile,
    isAdmin: user?.customClaims?.role === 'hospital_admin',
  };
}