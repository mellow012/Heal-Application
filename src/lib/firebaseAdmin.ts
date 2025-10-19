// src/lib/firebase-admin.ts
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Helper function to properly format the private key
const formatPrivateKey = (key: string | undefined): string => {
  if (!key) {
    throw new Error('FIREBASE_PRIVATE_KEY environment variable is not set');
  }
  
  // Handle different key formats
  return key
    .replace(/\\n/g, '\n')  // Replace literal \n with actual newlines
    .replace(/"/g, '')      // Remove any quotes
    .trim();                // Remove extra whitespace
};

if (!admin.apps.length) {
  try {
    // Validate all required environment variables
    if (!process.env.FIREBASE_PROJECT_ID) {
      throw new Error('FIREBASE_PROJECT_ID environment variable is not set');
    }
    if (!process.env.FIREBASE_CLIENT_EMAIL) {
      throw new Error('FIREBASE_CLIENT_EMAIL environment variable is not set');
    }
    if (!process.env.FIREBASE_PRIVATE_KEY) {
      throw new Error('FIREBASE_PRIVATE_KEY environment variable is not set');
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY),
      }),
    });
    
    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Firebase Admin initialization failed:', error);
    throw error;
  }
}
const adminApp = initializeApp(adminConfig, 'admin');
export const adminAuth = getAuth(adminApp);
export const adminDb = admin.firestore();
export default adminDb;