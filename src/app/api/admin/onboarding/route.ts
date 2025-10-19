import { adminAuth, adminDb } from '../../../lib/firebaseAdmin';

export async function POST(request) {
  try {
    const { email } = await request.json();
    
    // Create user in Firebase Auth
    const userRecord = await adminAuth.createUser({
      email,
      password: Math.random().toString(36).slice(-8), // Temporary password
    });

    // Set custom claim for hospital admin
    await adminAuth.setCustomUserClaims(userRecord.uid, { role: 'hospital_admin' });

    // Store user role in Firestore
    await adminDb.collection('users').doc(userRecord.uid).set({
      email,
      role: 'hospital_admin',
      createdAt: new Date().toISOString(),
    });

    // Generate password reset link
    const resetLink = await adminAuth.generatePasswordResetLink(email, {
      url: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
    });

    // TODO: Send reset link via email (use your email service or Firebase Cloud Functions)
    console.log(`Password reset link for ${email}: ${resetLink}`);

    return new Response(JSON.stringify({ message: 'Hospital admin created and reset link generated' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}