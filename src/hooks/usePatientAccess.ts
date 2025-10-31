'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../app/components/AuthProvide';
import { doc, getDoc, addDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function usePatientAccess() {
  const { user, loading: authLoading } = useAuth();
  const [patientRequests, setPatientRequests] = useState([]);
  const [authorizedPatients, setAuthorizedPatients] = useState([]);

  const requestPatientAccess = async (patientId, permissions = ['read'], reason = '') => {
    if (!user || !user.customClaims?.hospitalId) {
      throw new Error('Must be part of a hospital');
    }

    const request = {
      patientId,
      hospitalId: user.customClaims.hospitalId,
      hospitalName: user.customClaims.hospitalName || 'Unknown Hospital',
      requestedBy: user.uid,
      requestedByName: user.email.split('@')[0],
      requestedByRole: user.customClaims.role,
      permissions,
      reason,
      status: 'pending',
      requestedAt: new Date().toISOString(),
    };

    await addDoc(collection(db, 'accessRequests'), request);
    await addDoc(collection(db, 'hospitals', user.customClaims.hospitalId, 'patientRequests'), request);

    return request;
  };

  const accessPatientData = async (patientId, action = 'read') => {
    if (!user || !user.customClaims?.hospitalId) {
      throw new Error('Must be part of a hospital');
    }

    const consentDoc = await getDoc(
      doc(db, 'consents', `${patientId}_${user.customClaims.hospitalId}`)
    );

    if (!consentDoc.exists()) {
      throw new Error('No permission to access this patient data');
    }

    const consent = consentDoc.data();
    if (!consent.permissions.includes(action)) {
      throw new Error(`No permission for ${action} access`);
    }

    await addDoc(collection(db, 'patientData', patientId, 'accessLog'), {
      hospitalId: user.customClaims.hospitalId,
      hospitalName: user.customClaims.hospitalName || 'Unknown Hospital',
      staffId: user.uid,
      staffName: user.email.split('@')[0],
      staffRole: user.customClaims.role,
      action,
      timestamp: new Date().toISOString(),
      ipAddress: '',
      userAgent: navigator.userAgent,
    });

    const patientDoc = await getDoc(doc(db, 'users', patientId));
    return patientDoc.exists() ? patientDoc.data() : null;
  };

  const fetchAuthorizedPatients = async () => {
    if (!user || !user.customClaims?.hospitalId) return;

    try {
      const q = query(
        collection(db, 'consents'),
        where('hospitalId', '==', user.customClaims.hospitalId),
        where('permissions', 'array-contains-any', ['read', 'write'])
      );

      const snapshot = await getDocs(q);
      const patients = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      setAuthorizedPatients(patients);
    } catch (error) {
      console.error('Error fetching authorized patients:', error);
    }
  };

  const fetchPendingRequests = async () => {
    if (!user || !user.customClaims?.hospitalId) return;

    try {
      const q = query(
        collection(db, 'hospitals', user.customClaims.hospitalId, 'patientRequests'),
        where('status', '==', 'pending')
      );

      const snapshot = await getDocs(q);
      const requests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      setPatientRequests(requests);
    } catch (error) {
      console.error('Error fetching patient requests:', error);
    }
  };

  useEffect(() => {
    if (!authLoading && user && user.customClaims?.hospitalId) {
      fetchAuthorizedPatients();
      fetchPendingRequests();
    }
  }, [user, authLoading]);

  return {
    patientRequests,
    authorizedPatients,
    requestPatientAccess,
    accessPatientData,
    fetchAuthorizedPatients,
    fetchPendingRequests,
  };
}