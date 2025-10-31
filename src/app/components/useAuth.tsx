'use client';

import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('useAuth: Initializing auth listener');
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          console.log('useAuth: User detected', firebaseUser.uid);
          // Force token refresh to ensure latest custom claims
          const tokenResult = await firebaseUser.getIdTokenResult(true);
          const customClaims = tokenResult.claims || {};
          console.log('useAuth: Custom claims fetched', customClaims);
          setUser({ ...firebaseUser, customClaims });
        } catch (error) {
          console.error('useAuth: Error fetching custom claims', error);
          setUser({ ...firebaseUser, customClaims: {} });
        }
      } else {
        console.log('useAuth: No user');
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      console.log('useAuth: Cleaning up listener');
      unsubscribe();
    };
  }, []);

  return { user, loading };
}