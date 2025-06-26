import { NextResponse } from 'next/server';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: Request) {
  const { userId: clerkUserId } = auth();
  if (!clerkUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { verificationCode, hospitalStaffId, hospitalId } = await request.json();

    if (!verificationCode || !hospitalStaffId || !hospitalId) {
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
    const userData = userDoc.data();

    return NextResponse.json({
      success: true,
      user: {
        personal_data: userData.personal_data || {
          first_name: 'Unknown',
          last_name: 'User',
          phone: 'N/A',
          date_of_birth: 'N/A',
          address: 'N/A',
          emergency_contact: 'N/A',
          medical_conditions: [],
          allergies: [],
        },
        email: userData.email || 'unknown@example.com',
        type: userData.userType || 'basic_user',
        verification_status: 'pending',
        submitted_documents: userData.submitted_documents || ['national_id'],
        risk_score: 'low',
      },
    });
  } catch (error) {
    console.error('Error verifying code:', error);
    return NextResponse.json({ error: 'Failed to verify code' }, { status: 500 });
  }
}