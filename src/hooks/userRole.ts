'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../app/components/AuthProvide';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function useUserRole() {
  const { user, loading: authLoading } = useAuth();
  const [userRoleData, setUserRoleData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserRole() {
      if (authLoading || !user) {
        setLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const role = user.customClaims?.role || (userDoc.exists() ? userDoc.data().role : 'patient');

        const roleData = {
          role,
          hospitalId: user.customClaims?.hospitalId,
          hospitalRole: user.customClaims?.hospitalRole,
          canAccessMedicalData: ['patient', 'doctor', 'nurse', 'receptionist', 'hospital_admin'].includes(role),
          canEditMedicalData: ['doctor', 'nurse', 'hospital_admin'].includes(role),
          isPatient: role === 'patient',
          isMedicalPersonnel: ['doctor', 'nurse', 'receptionist'].includes(role),
          isHospitalAdmin: role === 'hospital_admin',
        };

        setUserRoleData(roleData);
      } catch (error) {
        console.error('Error fetching user role:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchUserRole();
  }, [user, authLoading]);

  return { userRoleData, loading };
}