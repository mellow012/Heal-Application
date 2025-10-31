import { adminAuth, adminDb } from '../../../lib/firebaseAdmin';

export async function POST(request) {
  try {
    const { userId, verificationCode, hospitalId } = await request.json();

    const hospitalAdmin = await adminAuth.getUser(hospitalId);
    if (hospitalAdmin.customClaims?.role !== 'hospital_admin') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const requestDoc = await adminDb.collection('medicalPassportRequests').doc(userId).get();
    if (!requestDoc.exists()) {
      return new Response(JSON.stringify({ error: 'No pending request found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const requestData = requestDoc.data();
    if (requestData.verificationCode !== verificationCode || requestData.status !== 'pending') {
      return new Response(JSON.stringify({ error: 'Invalid or expired verification code' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await adminAuth.setCustomUserClaims(userId, {
      ...requestData.customClaims,
      role: 'medical_user',
    });

    await adminDb.collection('medicalPassportRequests').doc(userId).update({
      status: 'approved',
      approvedAt: new Date().toISOString(),
      approvedBy: hospitalId,
    });

    await adminDb.collection('users').doc(userId).update({
      role: 'medical_user',
      updatedAt: new Date().toISOString(),
    });

    return new Response(JSON.stringify({ message: 'Medical passport approved' }), {
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