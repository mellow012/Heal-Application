import { NextResponse } from 'next/server';
import { collection, query, where, getDocs, doc, setDoc, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: Request) {
  const { userId: clerkUserId } = auth();
  if (!clerkUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { verificationCode, hospitalStaffId, hospitalId, rejectionReason } = await request.json();

    if (!verificationCode || !hospitalStaffId || !hospitalId || !rejectionReason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (hospitalStaffId !== clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized hospital staff' }, { status: 403 });
    }

    const q = query(
      collection(db, 'users'),
      where('request.verification_code', '==', verificationCode),
      where('hasActiveRequest', '==', true),
      where('request.expires_at', '>=', new Date().toISOString())
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return NextResponse.json({ error: 'Invalid or expired verification code' }, { status: 404 });
    }

    const userDoc = querySnapshot.docs[0];
    const userId = userDoc.id;
    const userData = userDoc.data();

    await setDoc(doc(db, 'users', userId), {
      hasActiveRequest: false,
      request: null,
    }, { merge: true });

    await addDoc(collection(db, 'patient_verifications'), {
      patientId: userId,
      patientName: `${userData.personal_data?.first_name} ${userData.personal_data?.last_name}`,
      email: userData.email,
      verificationCode,
      status: 'rejected',
      rejectedBy: hospitalStaffId,
      rejectionReason,
      hospitalId,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error rejecting passport:', error);
    return NextResponse.json({ error: 'Failed to reject medical passport' }, { status: 500 });
  }
}