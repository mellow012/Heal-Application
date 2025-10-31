'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../app/components/AuthProvide';
import { doc, getDocs, setDoc, updateDoc, collection, addDoc, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function useStaffManagement() {
  const { user, loading: authLoading } = useAuth();
  const [staff, setStaff] = useState([]);
  const [invitations, setInvitations] = useState([]);

  const customRoles = [
    'doctor',
    'nurse',
    'receptionist',
    'lab_technician',
    'pharmacist',
    'radiologist',
  ];

  const inviteStaffMember = async (email, role, metadata = {}) => {
    if (!user || user.customClaims?.role !== 'hospital_admin') {
      throw new Error('Only hospital admins can invite staff');
    }

    try {
      const response = await fetch('/api/invite-staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          role,
          hospitalId: user.uid,
          hospitalName: user.customClaims?.hospitalName || 'Unknown Hospital',
          metadata,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error);
      }

      await addDoc(collection(db, 'hospitals', user.uid, 'staff_invitations'), {
        email,
        role,
        metadata,
        invitedBy: user.uid,
        invitedAt: new Date().toISOString(),
        status: 'pending',
        invitationId: result.invitationId,
      });

      return result;
    } catch (error) {
      console.error('Error inviting staff member:', error);
      throw error;
    }
  };

  const updateStaffRole = async (userId, newRole) => {
    if (!user || user.customClaims?.role !== 'hospital_admin') {
      throw new Error('Only hospital admins can update staff roles');
    }

    try {
      await fetch('/api/update-staff-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      });

      await updateDoc(doc(db, 'users', userId), {
        role: newRole,
        updatedAt: new Date().toISOString(),
        updatedBy: user.uid,
      });
    } catch (error) {
      console.error('Error updating staff role:', error);
      throw error;
    }
  };

  const removeStaffMember = async (userId) => {
    if (!user || user.customClaims?.role !== 'hospital_admin') {
      throw new Error('Only hospital admins can remove staff');
    }

    try {
      await updateDoc(doc(db, 'users', userId), {
        status: 'removed',
        removedAt: new Date().toISOString(),
        removedBy: user.uid,
      });
    } catch (error) {
      console.error('Error removing staff member:', error);
      throw error;
    }
  };

  const fetchStaffList = async () => {
    if (!user || !user.customClaims?.hospitalId) return;

    try {
      const q = query(
        collection(db, 'users'),
        where('hospitalId', '==', user.customClaims.hospitalId),
        where('role', 'in', customRoles),
        where('status', '!=', 'removed')
      );

      const snapshot = await getDocs(q);
      const staffList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setStaff(staffList);
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  };

  const fetchInvitations = async () => {
    if (!user || !user.customClaims?.hospitalId) return;

    try {
      const q = query(
        collection(db, 'hospitals', user.customClaims.hospitalId, 'staff_invitations'),
        where('status', '==', 'pending')
      );

      const snapshot = await getDocs(q);
      const invitationList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setInvitations(invitationList);
    } catch (error) {
      console.error('Error fetching invitations:', error);
    }
  };

  useEffect(() => {
    if (!authLoading && user && user.customClaims?.hospitalId) {
      fetchStaffList();
      fetchInvitations();
    }
  }, [user, authLoading]);

  return {
    staff,
    invitations,
    customRoles,
    inviteStaffMember,
    updateStaffRole,
    removeStaffMember,
    fetchStaffList,
    isAdmin: user?.customClaims?.role === 'hospital_admin',
  };
}