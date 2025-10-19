import { adminAuth, adminDb } from './lib/firebaseAdmin.ts';

async function checkAndSetClaims() {
  try {
    const email = 'mellow@gmail.com';
    // Check claims
    const user = await adminAuth.getUserByEmail(email);
    console.log('Current claims for', email, ':', user.customClaims);

    // Set super_admin role if not present
    if (!user.customClaims || user.customClaims.role !== 'super-admin') {
      await adminAuth.setCustomUserClaims(user.uid, { role: 'super-admin' });
      console.log('Set super_admin role for', email);
    } else {
      console.log('User already has super_admin role');
    }

    // Ensure Firestore user doc exists
    const userDoc = await adminDb.collection('users').doc(user.uid).get();
    if (!userDoc.exists()) {
      await adminDb.collection('users').doc(user.uid).set({
        email,
        role: 'super_admin',
        createdAt: new Date().toISOString(),
      });
      console.log('Created Firestore user doc for', email);
    } else if (userDoc.data().role !== 'super-admin') {
      await adminDb.collection('users').doc(user.uid).update({
        role: 'super_admin',
        updatedAt: new Date().toISOString(),
      });
      console.log('Updated Firestore user doc for', email);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkAndSetClaims();