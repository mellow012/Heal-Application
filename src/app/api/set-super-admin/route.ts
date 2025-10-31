import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

// IMPORTANT: This endpoint should be DELETED or heavily secured after initial setup
// For security, you can add a secret key check

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, secret } = body;

    // Security check - set this in your .env.local
    // Example: SUPER_ADMIN_SECRET=your-random-secret-key-here
    const SUPER_ADMIN_SECRET = process.env.SUPER_ADMIN_SECRET;
    
    if (!SUPER_ADMIN_SECRET) {
      return NextResponse.json(
        { success: false, error: 'Super admin setup is not configured' },
        { status: 500 }
      );
    }

    if (secret !== SUPER_ADMIN_SECRET) {
      console.error('Invalid secret provided');
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Invalid secret' },
        { status: 401 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    console.log('Setting super admin for:', email);

    // Get user by email
    let user;
    try {
      user = await adminAuth.getUserByEmail(email);
      console.log('Found user:', user.uid);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        return NextResponse.json(
          { success: false, error: 'User not found. Please create an account first.' },
          { status: 404 }
        );
      }
      throw error;
    }

    // Set custom claims
    console.log('Setting custom claims...');
    await adminAuth.setCustomUserClaims(user.uid, {
      role: 'super_admin',
    });

    // Update Firestore document
    console.log('Updating Firestore document...');
    await adminDb.collection('users').doc(user.uid).set({
      email: user.email,
      role: 'super_admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    console.log('Super admin set successfully!');

    return NextResponse.json({
      success: true,
      message: 'User has been set as super admin. Please log out and log back in for changes to take effect.',
      userId: user.uid,
    });
  } catch (error: any) {
    console.error('Error setting super admin:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to set super admin' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Use POST request to set super admin',
    info: 'This endpoint should be deleted after initial setup for security'
  });
}