// lib/firebase/hospital.ts
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore'
import { db } from './firebase'
import type { HospitalInfo, StaffMember, ActivityLog, Patient, VerificationRequest } from '../types/hospital'

// Hospital Management Functions
export async function createHospital(hospitalData: Omit<HospitalInfo, 'createdAt' | 'updatedAt'>) {
  try {
    const hospitalRef = await addDoc(collection(db, 'hospitals'), {
      ...hospitalData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    return hospitalRef.id
  } catch (error) {
    console.error('Error creating hospital:', error)
    throw error
  }
}

export async function getHospitalInfo(hospitalId: string): Promise<HospitalInfo | null> {
  try {
    const hospitalDoc = await getDoc(doc(db, 'hospitals', hospitalId))
    if (hospitalDoc.exists()) {
      const data = hospitalDoc.data()
      return {
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      } as HospitalInfo
    }
    return null
  } catch (error) {
    console.error('Error getting hospital info:', error)
    throw error
  }
}

export async function updateHospitalInfo(hospitalId: string, updates: Partial<HospitalInfo>) {
  try {
    await updateDoc(doc(db, 'hospitals', hospitalId), {
      ...updates,
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Error updating hospital info:', error)
    throw error
  }
}

// Staff Management Functions
export async function addStaffMember(hospitalId: string, staffData: Omit<StaffMember, 'id' | 'joinedAt' | 'hospitalId'>) {
  try {
    const staffRef = await addDoc(collection(db, 'hospitals', hospitalId, 'staff'), {
      ...staffData,
      hospitalId,
      joinedAt: serverTimestamp(),
      isActive: true
    })
    
    // Log the activity
    await logActivity(hospitalId, {
      staffId: staffData.clerkUserId,
      staffName: staffData.name,
      action: 'staff_added',
      details: { role: staffData.role, newStaffName: staffData.name }
    })
    
    return staffRef.id
  } catch (error) {
    console.error('Error adding staff member:', error)
    throw error
  }
}

export async function getHospitalStaff(hospitalId: string, limitCount?: number): Promise<StaffMember[]> {
  try {
    let q = query(
      collection(db, 'hospitals', hospitalId, 'staff'),
      where('isActive', '==', true),
      orderBy('joinedAt', 'desc')
    )
    
    if (limitCount) {
      q = query(q, limit(limitCount))
    }
    
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      joinedAt: doc.data().joinedAt?.toDate()
    })) as StaffMember[]
  } catch (error) {
    console.error('Error getting hospital staff:', error)
    throw error
  }
}

export async function getStaffMember(hospitalId: string, clerkUserId: string): Promise<StaffMember | null> {
  try {
    const q = query(
      collection(db, 'hospitals', hospitalId, 'staff'),
      where('clerkUserId', '==', clerkUserId),
      where('isActive', '==', true)
    )
    
    const snapshot = await getDocs(q)
    if (!snapshot.empty) {
      const doc = snapshot.docs[0]
      return {
        id: doc.id,
        ...doc.data(),
        joinedAt: doc.data().joinedAt?.toDate()
      } as StaffMember
    }
    return null
  } catch (error) {
    console.error('Error getting staff member:', error)
    throw error
  }
}

export async function updateStaffMember(hospitalId: string, staffId: string, updates: Partial<StaffMember>) {
  try {
    await updateDoc(doc(db, 'hospitals', hospitalId, 'staff', staffId), updates)
  } catch (error) {
    console.error('Error updating staff member:', error)
    throw error
  }
}

export async function deactivateStaffMember(hospitalId: string, staffId: string) {
  try {
    await updateDoc(doc(db, 'hospitals', hospitalId, 'staff', staffId), {
      isActive: false
    })
  } catch (error) {
    console.error('Error deactivating staff member:', error)
    throw error
  }
}

// Activity Logging
export async function logActivity(hospitalId: string, activityData: Omit<ActivityLog, 'id' | 'timestamp' | 'hospitalId'>) {
  try {
    await addDoc(collection(db, 'hospitals', hospitalId, 'activityLogs'), {
      ...activityData,
      hospitalId,
      timestamp: serverTimestamp()
    })
  } catch (error) {
    console.error('Error logging activity:', error)
    throw error
  }
}

export async function getRecentActivity(hospitalId: string, limitCount: number = 10): Promise<ActivityLog[]> {
  try {
    const q = query(
      collection(db, 'hospitals', hospitalId, 'activityLogs'),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    )
    
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate()
    })) as ActivityLog[]
  } catch (error) {
    console.error('Error getting recent activity:', error)
    throw error
  }
}

// Statistics Functions
export async function getHospitalStats(hospitalId: string) {
  try {
    // Get staff count
    const staffQuery = query(
      collection(db, 'hospitals', hospitalId, 'staff'),
      where('isActive', '==', true)
    )
    const staffSnapshot = await getDocs(staffQuery)
    const activeStaff = staffSnapshot.size

    // Get total patients with access to this hospital
    const patientsQuery = query(
      collection(db, 'patients'),
      where(`accessPermissions.${hospitalId}`, '!=', null)
    )
    const patientsSnapshot = await getDocs(patientsQuery)
    const totalPatients = patientsSnapshot.size

    // Get today's appointments (you'll implement this when you add appointments)
    const todayAppointments = 0 // Placeholder

    // Get pending verifications
    const verificationsQuery = query(
      collection(db, 'system', 'verificationRequests'),
      where('hospitalId', '==', hospitalId),
      where('status', '==', 'pending')
    )
    const verificationsSnapshot = await getDocs(verificationsQuery)
    const pendingVerifications = verificationsSnapshot.size

    return {
      totalPatients,
      activeStaff,
      todayAppointments,
      pendingVerifications
    }
  } catch (error) {
    console.error('Error getting hospital stats:', error)
    return {
      totalPatients: 0,
      activeStaff: 0,
      todayAppointments: 0,
      pendingVerifications: 0
    }
  }
}

// Patient Access Functions
export async function getAccessiblePatients(hospitalId: string, limitCount?: number): Promise<Patient[]> {
  try {
    // This is a simplified version - in reality you'd need to query patients 
    // who have granted access to this hospital
    let q = query(
      collection(db, 'patients'),
      where(`accessPermissions.${hospitalId}`, '!=', null),
      orderBy('updatedAt', 'desc')
    )
    
    if (limitCount) {
      q = query(q, limit(limitCount))
    }
    
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
      dateOfBirth: doc.data().dateOfBirth?.toDate()
    })) as Patient[]
  } catch (error) {
    console.error('Error getting accessible patients:', error)
    return []
  }
}

// Verification Functions
export async function createVerificationRequest(patientId: string, hospitalId: string, requestedBy: string) {
  try {
    const verificationRef = await addDoc(collection(db, 'system', 'verificationRequests'), {
      patientId,
      hospitalId,
      requestedBy,
      status: 'pending',
      requestedAt: serverTimestamp()
    })
    return verificationRef.id
  } catch (error) {
    console.error('Error creating verification request:', error)
    throw error
  }
}

export async function processVerificationRequest(
  requestId: string, 
  staffId: string, 
  status: 'approved' | 'rejected',
  notes?: string
) {
  try {
    await updateDoc(doc(db, 'system', 'verificationRequests', requestId), {
      status,
      processedAt: serverTimestamp(),
      processingStaffId: staffId,
      notes: notes || ''
    })

    if (status === 'approved') {
      // Get the verification request to update patient status
      const verificationDoc = await getDoc(doc(db, 'system', 'verificationRequests', requestId))
      if (verificationDoc.exists()) {
        const { patientId } = verificationDoc.data()
        
        // Update patient status to medical
        await updateDoc(doc(db, 'patients', patientId), {
          status: 'medical',
          updatedAt: serverTimestamp()
        })
      }
    }
  } catch (error) {
    console.error('Error processing verification request:', error)
    throw error
  }
}

export async function getPendingVerifications(hospitalId: string): Promise<VerificationRequest[]> {
  try {
    const q = query(
      collection(db, 'system', 'verificationRequests'),
      where('hospitalId', '==', hospitalId),
      where('status', '==', 'pending'),
      orderBy('requestedAt', 'desc')
    )
    
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      requestedAt: doc.data().requestedAt?.toDate(),
      processedAt: doc.data().processedAt?.toDate()
    })) as VerificationRequest[]
  } catch (error) {
    console.error('Error getting pending verifications:', error)
    throw error
  }
}