import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

export async function POST(req) {
  const { email, secret } = await req.json();
  const ADMIN_SECRET_TOKEN = process.env.ADMIN_SECRET_TOKEN;
  if (secret !== ADMIN_SECRET_TOKEN) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  if (!email) {
    return new Response(JSON.stringify({ error: 'Email is required' }), { status: 400 });
  }

  try {
    const user = await adminAuth.getUserByEmail(email);
    await adminAuth.setCustomUserClaims(user.uid, { role: 'super_admin' });

    const userDoc = await adminDb.collection('users').doc(user.uid).get();
    if (!userDoc.exists()) {
      await adminDb.collection('users').doc(user.uid).set({
        email,
        role: 'super_admin',
        createdAt: new Date().toISOString(),
      });
    } else if (userDoc.data().role !== 'super_admin') {
      await adminDb.collection('users').doc(user.uid).update({
        role: 'super_admin',
        updatedAt: new Date().toISOString(),
      });
    }

    return new Response(JSON.stringify({ message: `Super admin set for ${email}` }), { status: 200 });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to set super admin' }), { status: 500 });
  }
}