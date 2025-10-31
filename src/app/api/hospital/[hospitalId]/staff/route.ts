import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ hospitalId: string }> }
) {
  try {
    // IMPORTANT: In Next.js 15, params is a Promise and must be awaited
    const params = await props.params;
    const { hospitalId } = params;

    // Get authorization token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userRole = decodedToken.role;
    const userHospitalId = decodedToken.hospitalId;

    if (!hospitalId) {
      return NextResponse.json(
        { success: false, error: 'Hospital ID is required' },
        { status: 400 }
      );
    }

    // Check authorization
    const hasAccess =
      userRole === 'super_admin' ||
      (userRole === 'hospital_admin' && userHospitalId === hospitalId) ||
      userHospitalId === hospitalId;

    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - You do not have access to this hospital staff' },
        { status: 403 }
      );
    }

    // Fetch staff members from hospital's staff subcollection
    const staffSnapshot = await adminDb
      .collection('hospitals')
      .doc(hospitalId)
      .collection('staff')
      .get();

    const staffMembers = staffSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({
      success: true,
      staff: staffMembers,
      count: staffMembers.length,
    });
  } catch (error: any) {
    console.error('Error fetching staff members:', error);

    let errorMessage = 'Failed to fetch staff members';
    if (error.code === 'auth/id-token-expired') {
      errorMessage = 'Your session has expired. Please log in again.';
    } else if (error.code === 'auth/argument-error') {
      errorMessage = 'Invalid authentication token';
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}