import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

interface VerifyAdminRequest {
  hospitalId: string;
}

export async function POST(request: NextRequest) {
  try {
    console.log('Verify admin API called');

    // Get and verify auth token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('No authorization header');
      return NextResponse.json(
        { success: false, error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
      console.log('Token verified for user:', decodedToken.uid);
    } catch (error) {
      console.error('Token verification failed:', error);
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const userId = decodedToken.uid;

    const body: VerifyAdminRequest = await request.json();
    const { hospitalId } = body;

    if (!hospitalId) {
      console.error('No hospital ID provided');
      return NextResponse.json(
        { success: false, error: 'Hospital ID is required' },
        { status: 400 }
      );
    }

    console.log('Verifying admin for hospital:', hospitalId);

    // Get hospital document
    const hospitalDoc = await adminDb.collection('hospitals').doc(hospitalId).get();

    if (!hospitalDoc.exists) {
      console.error('Hospital not found:', hospitalId);
      return NextResponse.json(
        { success: false, error: 'Hospital not found' },
        { status: 404 }
      );
    }

    const hospitalData = hospitalDoc.data();

    // Verify user is the hospital admin
    if (hospitalData?.adminUserId !== userId) {
      console.error('User is not hospital admin. Expected:', hospitalData?.adminUserId, 'Got:', userId);
      return NextResponse.json(
        { success: false, error: 'Unauthorized - You are not the admin of this hospital' },
        { status: 403 }
      );
    }

    console.log('User verified as hospital admin');

    return NextResponse.json({
      success: true,
      message: 'User verified as hospital admin',
      hospitalId,
    });
  } catch (error: any) {
    console.error('Error verifying hospital admin:', error);

    let errorMessage = 'Failed to verify hospital admin';
    if (error.code === 'auth/id-token-expired') {
      errorMessage = 'Your session has expired. Please log in again.';
    } else if (error.code === 'auth/argument-error') {
      errorMessage = 'Invalid authentication token';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    success: false,
    error: 'Method not allowed. Use POST request.' 
  }, { status: 405 });
}