// src/hooks/useUserRole.ts
import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

interface UserRoleData {
  role: string;
  organizationId?: string;
  organizationRole?: string;
  canAccessMedicalData: boolean;
  canEditMedicalData: boolean;
  isPatient: boolean;
  isMedicalPersonnel: boolean;
  isHospitalAdmin: boolean;
}

export function useUserRole() {
  const { user, isLoaded } = useUser();
  const [userRoleData, setUserRoleData] = useState<UserRoleData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserRole() {
      if (!isLoaded || !user) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/user/role');
        if (response.ok) {
          const data = await response.json();
          
          const roleData: UserRoleData = {
            role: data.role,
            organizationId: data.organizationId,
            organizationRole: data.organizationRole,
            canAccessMedicalData: ['patient', 'doctor', 'nurse', 'medical_staff', 'hospital_admin'].includes(data.role),
            canEditMedicalData: ['doctor', 'nurse', 'medical_staff', 'hospital_admin'].includes(data.role),
            isPatient: data.role === 'patient',
            isMedicalPersonnel: ['doctor', 'nurse', 'medical_staff'].includes(data.role),
            isHospitalAdmin: data.role === 'hospital_admin'
          };
          
          setUserRoleData(roleData);
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchUserRole();
  }, [user, isLoaded]);

  return { userRoleData, loading };
}
