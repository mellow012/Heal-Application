import { adminAuth, adminDb } from '../../../lib/firebaseAdmin';

export async function POST(request) {
  try {
    const { userId, role } = await request.json();

    const validRoles = ['doctor', 'nurse', 'receptionist', 'lab_technician', 'pharmacist', 'radiologist'];
    if (!validRoles.includes(role)) {
      return new Response(JSON.stringify({ error: 'Invalid role' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const user = await adminAuth.getUser(userId);
    await adminAuth.setCustomUserClaims(userId, {
      role,
      hospitalId: user.customClaims?.hospitalId,
      hospitalName: user.customClaims?.hospitalName,
    });

    await adminDb.collection('users').doc(userId).update({
      role,
      updatedAt: new Date().toISOString(),
    });

    return new Response(JSON.stringify({ message: 'Staff role updated' }), {
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