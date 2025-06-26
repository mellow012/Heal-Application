import { useState } from 'react'
import { useOrganization, useUser } from '@clerk/nextjs'
import { doc, getDoc, addDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'




export function usePatientAccess() {
  const { organization, membership } = useOrganization()
  const { user } = useUser()
  const [patientRequests, setPatientRequests] = useState([])
  const [authorizedPatients, setAuthorizedPatients] = useState([])

  const requestPatientAccess = async (patientId, permissions = ['read'], reason = '') => {
    if (!organization) throw new Error('Must be part of an organization')

    const request = {
      patientId,
      hospitalId: organization.id,
      hospitalName: organization.name,
      requestedBy: user.id,
      requestedByName: user.fullName,
      requestedByRole: membership.role,
      permissions,
      reason,
      status: 'pending',
      requestedAt: new Date()
    }

    // Store in global access requests collection
    await addDoc(collection(db, 'accessRequests'), request)
    
    // Also store in hospital's local requests
    await addDoc(collection(db, 'organizations', organization.id, 'patientRequests'), request)

    return request
  }

  const accessPatientData = async (patientId, action = 'read') => {
    if (!organization) throw new Error('Must be part of an organization')

    // Check if hospital has permission
    const accessDoc = await getDoc(
      doc(db, 'organizations', organization.id, 'patientAccess', patientId)
    )

    if (!accessDoc.exists()) {
      throw new Error('No permission to access this patient data')
    }

    const access = accessDoc.data()
    if (!access.permissions.includes(action)) {
      throw new Error(`No permission for ${action} access`)
    }

    // Log the access
    await addDoc(collection(db, 'dataAccess', patientId, 'accessLog'), {
      hospitalId: organization.id,
      hospitalName: organization.name,
      staffId: user.id,
      staffName: user.fullName,
      staffRole: membership.role,
      action,
      timestamp: new Date(),
      ipAddress: '', // You can capture this client-side
      userAgent: navigator.userAgent
    })

    // Return patient data (simplified - you'd fetch actual medical records)
    const patientDoc = await getDoc(doc(db, 'users', patientId))
    return patientDoc.exists() ? patientDoc.data() : null
  }

  const fetchAuthorizedPatients = async () => {
    if (!organization) return

    try {
      const q = query(
        collection(db, 'organizations', organization.id, 'patientAccess'),
        where('permissions', 'array-contains-any', ['read', 'write'])
      )
      
      const snapshot = await getDocs(q)
      const patients = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      
      setAuthorizedPatients(patients)
    } catch (error) {
      console.error('Error fetching authorized patients:', error)
    }
  }

  const fetchPendingRequests = async () => {
    if (!organization) return

    try {
      const q = query(
        collection(db, 'organizations', organization.id, 'patientRequests'),
        where('status', '==', 'pending')
      )
      
      const snapshot = await getDocs(q)
      const requests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      
      setPatientRequests(requests)
    } catch (error) {
      console.error('Error fetching patient requests:', error)
    }
  }

  return {
    patientRequests,
    authorizedPatients,
    requestPatientAccess,
    accessPatientData,
    fetchAuthorizedPatients,
    fetchPendingRequests
  }
}