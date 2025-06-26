
// API route to get user role
// src/app/api/user/role/route.ts
import { auth } from '@clerk/nextjs/server';
import { adminDb } from '../../../../lib/firebaseAdmin';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { userId } = await auth();
   
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userDoc = await adminDb.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    
    return NextResponse.json({
      role: userData.role,
      organizationId: userData.organizationId,
      organizationRole: userData.organizationRole
    });

  } catch (error) {
    console.error('Error fetching user role:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}