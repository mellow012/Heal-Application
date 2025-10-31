import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

export async function GET(request: NextRequest) {
  try {
    console.log('=== Get User Profile API Called ===');

    // Get authorization token
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
    } catch (error: any) {
      console.error('Token verification failed:', error);
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const userId = decodedToken.uid;

    // Get user document from Firestore
    console.log('Fetching user profile from Firestore...');
    const userDoc = await adminDb.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      console.error('User document not found:', userId);
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    console.log('User profile found:', userData?.name);

    return NextResponse.json({
      success: true,
      id: userId,
      name: userData?.name || '',
      email: userData?.email || '',
      phone: userData?.phone || '',
      role: userData?.role || '',
      department: userData?.department || '',
      hospitalId: userData?.hospitalId || '',
      status: userData?.status || 'active',
      createdAt: userData?.createdAt,
      updatedAt: userData?.updatedAt,
    });
  } catch (error: any) {
    console.error('=== Error in Get User Profile API ===');
    console.error('Error:', error);
    console.error('Error message:', error.message);

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}

// PUT: Update user profile
export async function PUT(request: NextRequest) {
  try {
    console.log('=== Update User Profile API Called ===');

    // Get authorization token
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
    } catch (error: any) {
      console.error('Token verification failed:', error);
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const userId = decodedToken.uid;

    const body = await request.json();
    console.log('Update body received');

    const { name, phone } = body;

    // Prepare update data (only allow updating certain fields)
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name.trim();
    if (phone !== undefined) updateData.phone = phone.trim();

    console.log('Updating user profile with fields:', Object.keys(updateData));

    // Update user document
    await adminDb.collection('users').doc(userId).update(updateData);

    console.log('✅ User profile updated successfully');

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
    });
  } catch (error: any) {
    console.error('=== Error in Update User Profile API ===');
    console.error('Error:', error);
    console.error('Error message:', error.message);

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update profile' },
      { status: 500 }
    );
  }
}

export async function POST() {
  return NextResponse.json({ 
    success: false, 
    error: 'Method not allowed. Use GET to fetch or PUT to update.' 
  }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ 
    success: false, 
    error: 'Method not allowed.' 
  }, { status: 405 });
}