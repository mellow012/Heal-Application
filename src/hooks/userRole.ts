'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/components/AuthProvide';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * Supported user roles in the system
 */
export type UserRole = 
  | 'super_admin' 
  | 'hospital_admin' 
  | 'doctor'
  | 'nurse'
  | 'receptionist'
  | 'staff'
  | 'patient'
  | null;

/**
 * User role data with permissions and metadata
 */
export interface UserRoleData {
  role: UserRole;
  hospitalId: string | null;
  hospitalRole: string | null;
  // Permission flags
  canAccessMedicalData: boolean;
  canEditMedicalData: boolean;
  canManageHospital: boolean;
  canManageStaff: boolean;
  canViewReports: boolean;
  // Role type flags
  isPatient: boolean;
  isMedicalPersonnel: boolean;
  isHospitalAdmin: boolean;
  isSuperAdmin: boolean;
  isDoctor: boolean;
  isNurse: boolean;
  isReceptionist: boolean;
}

/**
 * Return type for useUserRole hook
 */
interface UseUserRoleReturn {
  userRoleData: UserRoleData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook to fetch and manage user role data
 */
export function useUserRole(): UseUserRoleReturn {
  const { user, loading: authLoading } = useAuth();
  const [userRoleData, setUserRoleData] = useState<UserRoleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Normalize role string to handle different formats
   * Returns 'patient' as default for unknown/missing roles
   */
  const normalizeRole = (role: string | undefined | null): UserRole => {
    if (!role) {
      console.log('useUserRole: No role provided, defaulting to patient');
      return 'patient'; // Default to patient if no role
    }
    
    // Handle different role formats
    const normalized = role.toLowerCase().replace('-', '_').trim();
    
    const validRoles: UserRole[] = [
      'super_admin',
      'hospital_admin',
      'doctor',
      'nurse',
      'receptionist',
      'staff',
      'patient'
    ];
    
    if (validRoles.includes(normalized as UserRole)) {
      return normalized as UserRole;
    }
    
    console.log('useUserRole: Invalid role provided, defaulting to patient:', role);
    return 'patient'; // Default to patient if unknown role
  };

  /**
   * Calculate permissions based on role
   */
  const calculatePermissions = (role: UserRole): Partial<UserRoleData> => {
    const isSuperAdmin = role === 'super_admin';
    const isHospitalAdmin = role === 'hospital_admin';
    const isDoctor = role === 'doctor';
    const isNurse = role === 'nurse';
    const isReceptionist = role === 'receptionist';
    const isStaff = role === 'staff';
    const isPatient = role === 'patient';
    const isMedicalPersonnel = isDoctor || isNurse || isReceptionist;

    return {
      // Permission flags
      canAccessMedicalData: isPatient || isMedicalPersonnel || isHospitalAdmin || isSuperAdmin,
      canEditMedicalData: isDoctor || isNurse || isHospitalAdmin || isSuperAdmin,
      canManageHospital: isHospitalAdmin || isSuperAdmin,
      canManageStaff: isHospitalAdmin || isSuperAdmin,
      canViewReports: isMedicalPersonnel || isHospitalAdmin || isSuperAdmin,
      // Role type flags
      isPatient,
      isMedicalPersonnel,
      isHospitalAdmin,
      isSuperAdmin,
      isDoctor,
      isNurse,
      isReceptionist,
    };
  };

  /**
   * Assign default patient role to user in Firestore
   */
  const assignDefaultRole = async (userId: string): Promise<void> => {
    try {
      console.log('useUserRole: Assigning default patient role to user', userId);
      
      await setDoc(doc(db, 'users', userId), {
        role: 'patient',
        hospitalId: null,
        hospitalRole: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }, { merge: true }); // Use merge to preserve existing data
      
      console.log('useUserRole: Successfully assigned patient role');
    } catch (err) {
      console.error('useUserRole: Error assigning default role:', err);
      throw err;
    }
  };

  /**
   * Fetch user role data from custom claims and Firestore
   */
  const fetchUserRole = async (): Promise<void> => {
    try {
      // Reset error state
      setError(null);

      // Wait for auth to finish loading
      if (authLoading) {
        console.log('useUserRole: Auth still loading');
        return;
      }

      // No user logged in
      if (!user) {
        console.log('useUserRole: No user logged in');
        setUserRoleData(null);
        setLoading(false);
        return;
      }

      console.log('useUserRole: Fetching role for user', user.uid);
      console.log('useUserRole: Custom claims', user.customClaims);

      // Try to get role from custom claims first (more reliable)
      let role = user.customClaims?.role as string | undefined;
      let hospitalId = user.customClaims?.hospitalId as string | undefined;
      let hospitalRole = user.customClaims?.hospitalRole as string | undefined;

      // Fallback to Firestore if custom claims not available
      if (!role) {
        console.log('useUserRole: No role in custom claims, checking Firestore');
        
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log('useUserRole: Firestore data', userData);
            
            role = userData.role;
            hospitalId = userData.hospitalId;
            hospitalRole = userData.hospitalRole;
            
            // If still no role, assign default patient role
            if (!role) {
              console.log('useUserRole: No role in Firestore, assigning default patient role');
              await assignDefaultRole(user.uid);
              role = 'patient';
            }
          } else {
            // Document doesn't exist, create it with patient role
            console.log('useUserRole: User document does not exist, creating with patient role');
            await assignDefaultRole(user.uid);
            role = 'patient';
          }
        } catch (firestoreError) {
          console.error('useUserRole: Error fetching Firestore document:', firestoreError);
          
          // Even if Firestore fails, assign patient role locally
          console.log('useUserRole: Firestore error, defaulting to patient role');
          role = 'patient';
        }
      }

      // Normalize the role (will default to patient if invalid)
      const normalizedRole = normalizeRole(role);
      console.log('useUserRole: Normalized role', normalizedRole);

      // Calculate permissions based on role
      const permissions = calculatePermissions(normalizedRole);

      // Create complete role data object
      const roleData: UserRoleData = {
        role: normalizedRole,
        hospitalId: hospitalId || null,
        hospitalRole: hospitalRole || null,
        ...permissions,
      } as UserRoleData;

      console.log('useUserRole: Complete role data', roleData);
      setUserRoleData(roleData);
      setError(null);
    } catch (error: any) {
      console.error('useUserRole: Unexpected error:', error);
      
      // Even on error, provide a fallback patient role
      console.log('useUserRole: Error occurred, providing fallback patient role');
      const fallbackRoleData: UserRoleData = {
        role: 'patient',
        hospitalId: null,
        hospitalRole: null,
        ...calculatePermissions('patient'),
      } as UserRoleData;
      
      setUserRoleData(fallbackRoleData);
      setError('Failed to fetch complete user data, using default patient role');
    } finally {
      setLoading(false);
    }
  };

  // Fetch role when user or auth loading state changes
  useEffect(() => {
    fetchUserRole();
  }, [user, authLoading]);

  // Manual refetch function
  const refetch = async () => {
    setLoading(true);
    await fetchUserRole();
  };

  return {
    userRoleData,
    loading: authLoading || loading,
    error,
    refetch,
  };
}

/**
 * Utility function to check if user has a specific role
 */
export function hasRole(userRoleData: UserRoleData | null, role: UserRole): boolean {
  return userRoleData?.role === role;
}

/**
 * Utility function to check if user has any of the specified roles
 */
export function hasAnyRole(userRoleData: UserRoleData | null, roles: UserRole[]): boolean {
  return roles.some(role => userRoleData?.role === role);
}

/**
 * Utility function to check if user belongs to a specific hospital
 */
export function belongsToHospital(
  userRoleData: UserRoleData | null, 
  hospitalId: string
): boolean {
  return userRoleData?.hospitalId === hospitalId;
}

/**
 * Utility function to check if user can perform an action
 */
export function canPerformAction(
  userRoleData: UserRoleData | null,
  action: 'accessMedical' | 'editMedical' | 'manageHospital' | 'manageStaff' | 'viewReports'
): boolean {
  if (!userRoleData) return false;

  switch (action) {
    case 'accessMedical':
      return userRoleData.canAccessMedicalData;
    case 'editMedical':
      return userRoleData.canEditMedicalData;
    case 'manageHospital':
      return userRoleData.canManageHospital;
    case 'manageStaff':
      return userRoleData.canManageStaff;
    case 'viewReports':
      return userRoleData.canViewReports;
    default:
      return false;
  }
}

/**
 * Utility function to get user role display name
 */
export function getRoleDisplayName(role: UserRole): string {
  const roleNames: Record<NonNullable<UserRole>, string> = {
    super_admin: 'Super Administrator',
    hospital_admin: 'Hospital Administrator',
    doctor: 'Doctor',
    nurse: 'Nurse',
    receptionist: 'Receptionist',
    staff: 'Staff Member',
    patient: 'Patient',
  };

  return role ? roleNames[role] : 'Unknown';
}