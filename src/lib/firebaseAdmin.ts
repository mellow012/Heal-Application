/**
 * Firebase Admin SDK Configuration
 * 
 * This file initializes Firebase Admin SDK for server-side operations.
 * It handles authentication, Firestore database access, and provides
 * utility functions for common operations.
 * 
 * @module firebaseAdmin
 */

import admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * Helper function to properly format the private key
 * Handles various key formats from environment variables
 */
function formatPrivateKey(key: string | undefined): string {
  if (!key) {
    throw new Error('FIREBASE_PRIVATE_KEY environment variable is not set');
  }
  
  // Handle different key formats
  return key
    .replace(/\\n/g, '\n')  // Replace literal \n with actual newlines
    .replace(/"/g, '')      // Remove any quotes
    .trim();                // Remove extra whitespace
}

/**
 * Validate all required Firebase Admin environment variables
 */
function validateEnvironmentVariables(): void {
  const requiredVars = {
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
  };

  const missingVars = Object.entries(requiredVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}\n` +
      'Please check your .env.local file.'
    );
  }
}

/**
 * Initialize Firebase Admin SDK
 * Only initializes once, even if imported multiple times
 */
function initializeFirebaseAdmin() {
  // Check if already initialized
  if (admin.apps.length > 0) {
    console.log('Firebase Admin already initialized, using existing instance');
    return admin.apps[0];
  }

  try {
    // Validate environment variables
    validateEnvironmentVariables();

    // Initialize Firebase Admin
    const app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID!,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
        privateKey: formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY),
      }),
    });

    console.log('✅ Firebase Admin initialized successfully');
    console.log('Project ID:', process.env.FIREBASE_PROJECT_ID);
    
    return app;
  } catch (error: any) {
    console.error('❌ Firebase Admin initialization failed:', error.message);
    
    // Provide helpful error messages
    if (error.message.includes('FIREBASE_PRIVATE_KEY')) {
      console.error('\n💡 Tip: Make sure your private key is properly formatted in .env.local');
      console.error('It should look like: FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nYour-Key\\n-----END PRIVATE KEY-----\\n"');
    }
    
    throw error;
  }
}

// Initialize the app
const app = initializeFirebaseAdmin();

// Export Firebase Admin services
export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app);

// Export the app instance (useful for testing or advanced usage)
export const adminApp = app;

// Export default for convenience
export default admin;

/**
 * Type-safe FieldValue export
 * Use this for timestamps and other Firestore field values
 */
export { FieldValue } from 'firebase-admin/firestore';

/**
 * Utility function to check if Firebase Admin is properly initialized
 */
export function isFirebaseAdminInitialized(): boolean {
  return admin.apps.length > 0;
}

/**
 * Utility function to get server timestamp
 */
export function getServerTimestamp() {
  return admin.firestore.FieldValue.serverTimestamp();
}