import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  limit 
} from 'firebase/firestore'
import { db } from './firebase'
import type { Patient } from '../types/hospital'

export async function getRecentPatients(hospitalId: string, limitCount: number = 5): Promise<Patient[]> {
  try {
    // Get patients who have granted access to this hospital
    const q = query(
      collection(db, 'patients'),
      where(`accessPermissions.${hospitalId}`, '!=', null),
      orderBy('updatedAt', 'desc'),
      limit(limitCount)
    )
    
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
      dateOfBirth: doc.data().dateOfBirth?.toDate()
    })) as Patient[]
  } catch (error) {
    console.error('Error getting recent patients:', error)
    return []
  }
}

export async function getPatientById(patientId: string): Promise<Patient | null> {
  try {
    const patientDoc = await getDoc(doc(db, 'patients', patientId))
    if (patientDoc.exists()) {
      const data = patientDoc.data()
      return {
        id: patientDoc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        dateOfBirth: data.dateOfBirth?.toDate()
      } as Patient
    }
    return null
  } catch (error) {
    console.error('Error getting patient by ID:', error)
    throw error
  }
}

export async function searchPatients(hospitalId: string, searchTerm: string): Promise<Patient[]> {
  try {
    // Note: This is a simplified search. In production, you'd want to use 
    // a proper search solution like Algolia or implement more sophisticated querying
    const q = query(
      collection(db, 'patients'),
      where(`accessPermissions.${hospitalId}`, '!=', null),
      orderBy('name')
    )
    
    const snapshot = await getDocs(q)
    const patients = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
      dateOfBirth: doc.data().dateOfBirth?.toDate()
    })) as Patient[]
    
    // Filter by search term (case-insensitive)
    return patients.filter(patient => 
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
  } catch (error) {
    console.error('Error searching patients:', error)
    return []
  }
}