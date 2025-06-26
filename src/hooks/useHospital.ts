
import { useState, useEffect } from 'react'
import { useOrganization, useUser } from '@clerk/nextjs'
import { doc, getDoc, setDoc, updateDoc, collection, addDoc, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export function useHospital() {
  const { organization, membership } = useOrganization()
  const { user } = useUser()
  const [hospitalData, setHospitalData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (organization) {
      fetchHospitalData()
    }
  }, [organization])

  const fetchHospitalData = async () => {
    try {
      const hospitalDoc = await getDoc(doc(db, 'organizations', organization.id))
      if (hospitalDoc.exists()) {
        setHospitalData(hospitalDoc.data())
      }
    } catch (error) {
      console.error('Error fetching hospital data:', error)
    } finally {
      setLoading(false)
    }
  }

  const createHospitalProfile = async (hospitalInfo) => {
    if (!organization || membership?.role !== 'admin') {
      throw new Error('Only admins can create hospital profiles')
    }

    const hospitalData = {
      name: hospitalInfo.name,
      address: hospitalInfo.address,
      phone: hospitalInfo.phone,
      email: hospitalInfo.email,
      license: hospitalInfo.license,
      specialties: hospitalInfo.specialties || [],
      adminId: user.id,
      createdAt: new Date(),
      orgId: organization.id
    }

    await setDoc(doc(db, 'organizations', organization.id), hospitalData)
    setHospitalData(hospitalData)
    return hospitalData
  }

  const updateHospitalProfile = async (updates) => {
    if (!organization || membership?.role !== 'admin') {
      throw new Error('Only admins can update hospital profiles')
    }

    await updateDoc(doc(db, 'organizations', organization.id), {
      ...updates,
      updatedAt: new Date()
    })
    
    await fetchHospitalData()
  }

  return {
    hospitalData,
    loading,
    createHospitalProfile,
    updateHospitalProfile,
    isAdmin: membership?.role === 'admin'
  }
}
