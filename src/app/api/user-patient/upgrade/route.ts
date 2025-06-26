// src/app/api/user/upgrade-to-patient/route.ts
import { auth } from '@clerk/nextjs/server';
import { adminDb } from '../../../../lib/firebaseAdmin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
   
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get current user data
    const userDoc = await adminDb.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();

    // Only allow upgrade if user is currently 'user' role
    if (userData.role !== 'user') {
      return NextResponse.json(
        { error: 'User cannot be upgraded to patient' },
        { status: 400 }
      );
    }

    // Update user role to patient
    await adminDb.collection('users').doc(userId).update({
      role: 'patient',
      updatedAt: new Date()
    });

    // Update e-health passport permissions
    await adminDb.collection('e_health_passports').doc(userId).update({
      'permissions.canViewMedicalData': true,
      updatedAt: new Date()
    });

    return NextResponse.json({
      success: true,
      message: 'Successfully upgraded to patient status'
    });

  } catch (error) {
    console.error('Error upgrading user to patient:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}