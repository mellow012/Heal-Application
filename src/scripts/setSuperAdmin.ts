// scripts/setSuperAdmin.ts
// Run this script once to set a user as super admin

import * as admin from 'firebase-admin';

// Initialize Firebase Admin (if not already initialized)
if (!admin.apps.length) {
  const serviceAccount = require('../serviceAccountKey.json');
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

async function setSuperAdmin(email: string) {
  try {
    console.log('🔍 Looking up user with email:', email);
    
    // Get user by email
    const user = await admin.auth().getUserByEmail(email);
    console.log('✅ Found user:', user.uid);
    
    // Set custom claims
    console.log('🔧 Setting super_admin custom claims...');
    await admin.auth().setCustomUserClaims(user.uid, {
      role: 'super_admin',
    });
    
    console.log('✅ Custom claims set successfully!');
    
    // Update Firestore document
    console.log('📝 Updating Firestore user document...');
    await admin.firestore().collection('users').doc(user.uid).set({
      email: user.email,
      role: 'super_admin',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    
    console.log('✅ Firestore document updated!');
    console.log('');
    console.log('🎉 SUCCESS! User is now a super admin.');
    console.log('⚠️  IMPORTANT: The user must log out and log back in for changes to take effect.');
    console.log('');
    
    // Verify the claims
    const updatedUser = await admin.auth().getUser(user.uid);
    console.log('✅ Verified custom claims:', updatedUser.customClaims);
    
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error setting super admin:', error.message);
    
    if (error.code === 'auth/user-not-found') {
      console.error('');
      console.error('User not found! Please check:');
      console.error('1. The email address is correct');
      console.error('2. The user has been created in Firebase Auth');
      console.error('3. You are using the correct Firebase project');
    }
    
    process.exit(1);
  }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.error('❌ Please provide an email address');
  console.error('Usage: npm run set-super-admin youremail@example.com');
  process.exit(1);
}

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  console.error('❌ Invalid email format');
  process.exit(1);
}

console.log('🚀 Setting super admin for:', email);
console.log('');

setSuperAdmin(email);