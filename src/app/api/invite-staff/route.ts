import { adminAuth, adminDb } from '../../../lib/firebaseAdmin';

export async function POST(request) {
  try {
    const { email, role, hospitalId, hospitalName, metadata } = await request.json();

    const validRoles = ['doctor', 'nurse', 'receptionist', 'lab_technician', 'pharmacist', 'radiologist'];
    if (!validRoles.includes(role)) {
      return new Response(JSON.stringify({ error: 'Invalid role' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const userRecord = await adminAuth.createUser({
      email,
      password: Math.random().toString(36).slice(-8),
    });

    await adminAuth.setCustomUserClaims(userRecord.uid, {
      role,
      hospitalId,
      hospitalName,
    });

    await adminDb.collection('users').doc(userRecord.uid).set({
      email,
      role,
      hospitalId,
      hospitalName,
      createdAt: new Date().toISOString(),
      status: 'active',
    });

    const resetLink = await adminAuth.generatePasswordResetLink(email, {
      url: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
    });

    // TODO: Send reset link via email (handled by Cloud Function)
    console.log(`Password reset link for ${email}: ${resetLink}`);

    return new Response(JSON.stringify({ invitationId: userRecord.uid, message: 'Staff invited and reset link generated' }), {
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