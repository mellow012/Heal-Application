import { useState, useEffect } from 'react'
import { useOrganization } from '@clerk/nextjs' 
import { doc, getDoc, setDoc, updateDoc, collection, addDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'



export function useStaffManagement() {
  const { organization, membership } = useOrganization()
  const [staff, setStaff] = useState([])
  const [invitations, setInvitations] = useState([])

  const customRoles = [
    'admin',
    'doctor', 
    'nurse',
    'receptionist',
    'lab_technician',
    'pharmacist',
    'radiologist'
  ]

  const inviteStaffMember = async (email, role, metadata = {}) => {
    if (!organization || membership?.role !== 'admin') {
      throw new Error('Only admins can invite staff')
    }

    try {
      // Create invitation in Clerk
      const invitation = await organization.inviteMember({
        emailAddress: email,
        role: role
      })

      // Store additional metadata in Firestore
      await addDoc(collection(db, 'organizations', organization.id, 'staff_invitations'), {
        email,
        role,
        metadata,
        invitedBy: membership.userId,
        invitedAt: new Date(),
        status: 'pending',
        clerkInvitationId: invitation.id
      })

      return invitation
    } catch (error) {
      console.error('Error inviting staff member:', error)
      throw error
    }
  }

  const updateStaffRole = async (userId, newRole) => {
    if (!organization || membership?.role !== 'admin') {
      throw new Error('Only admins can update staff roles')
    }

    try {
      await organization.updateMember({
        userId,
        role: newRole
      })

      // Update in Firestore as well
      await updateDoc(doc(db, 'organizations', organization.id, 'staff', userId), {
        role: newRole,
        updatedAt: new Date(),
        updatedBy: membership.userId
      })
    } catch (error) {
      console.error('Error updating staff role:', error)
      throw error
    }
  }

  const removeStaffMember = async (userId) => {
    if (!organization || membership?.role !== 'admin') {
      throw new Error('Only admins can remove staff')
    }

    try {
      await organization.removeMember({ userId })
      
      // Archive in Firestore instead of deleting
      await updateDoc(doc(db, 'organizations', organization.id, 'staff', userId), {
        status: 'removed',
        removedAt: new Date(),
        removedBy: membership.userId
      })
    } catch (error) {
      console.error('Error removing staff member:', error)
      throw error
    }
  }

  const fetchStaffList = async () => {
    if (!organization) return

    try {
      const members = await organization.getMembershipList()
      setStaff(members)
    } catch (error) {
      console.error('Error fetching staff:', error)
    }
  }

  return {
    staff,
    invitations,
    customRoles,
    inviteStaffMember,
    updateStaffRole,
    removeStaffMember,
    fetchStaffList,
    isAdmin: membership?.role === 'admin'
  }
}
