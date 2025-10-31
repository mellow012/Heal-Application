import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

// GET: Fetch hospital data
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ hospitalId: string }> }
) {
  try {
    // IMPORTANT: In Next.js 15, params is a Promise and must be awaited
    const params = await props.params;
    const hospitalId = params.hospitalId;

    console.log('=== GET Hospital API Called ===');
    console.log('Hospital ID:', hospitalId);

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
    console.log('Token received:', token.substring(0, 20) + '...');
    
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
      console.log('Token verified for user:', decodedToken.uid);
      console.log('User role:', decodedToken.role);
      console.log('User hospitalId:', decodedToken.hospitalId);
    } catch (error: any) {
      console.error('Token verification failed:', error.code, error.message);
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const userId = decodedToken.uid;

    if (!hospitalId) {
      console.error('Hospital ID is missing');
      return NextResponse.json(
        { success: false, error: 'Hospital ID is required' },
        { status: 400 }
      );
    }

    console.log('Fetching hospital from Firestore:', hospitalId);

    // Get hospital document
    const hospitalDoc = await adminDb.collection('hospitals').doc(hospitalId).get();

    if (!hospitalDoc.exists) {
      console.error('Hospital not found in Firestore:', hospitalId);
      return NextResponse.json(
        { success: false, error: 'Hospital not found' },
        { status: 404 }
      );
    }

    const hospitalData = hospitalDoc.data();
    console.log('Hospital data retrieved:', {
      name: hospitalData?.name,
      adminUserId: hospitalData?.adminUserId,
      setupCompleted: hospitalData?.setupCompleted,
    });

    // Check if user has access to this hospital
    const userRole = decodedToken.role;
    const userHospitalId = decodedToken.hospitalId;

    const hasAccess = 
      userRole === 'super_admin' ||
      (userRole === 'hospital_admin' && hospitalData?.adminUserId === userId) ||
      (userHospitalId === hospitalId);

    if (!hasAccess) {
      console.error('Access denied. User:', userId, 'Role:', userRole, 'Hospital Admin:', hospitalData?.adminUserId);
      return NextResponse.json(
        { success: false, error: 'Unauthorized - You do not have access to this hospital' },
        { status: 403 }
      );
    }

    console.log('Access granted. Returning hospital data');

    return NextResponse.json({
      success: true,
      id: hospitalId,
      name: hospitalData?.name || '',
      email: hospitalData?.email || '',
      phone: hospitalData?.phone || '',
      address: hospitalData?.address || '',
      city: hospitalData?.city || '',
      country: hospitalData?.country || '',
      postalCode: hospitalData?.postalCode || '',
      website: hospitalData?.website || '',
      description: hospitalData?.description || '',
      departments: hospitalData?.departments || [],
      status: hospitalData?.status || 'pending',
      setupCompleted: hospitalData?.setupCompleted || false,
      adminUserId: hospitalData?.adminUserId,
      createdAt: hospitalData?.createdAt,
      updatedAt: hospitalData?.updatedAt,
    });
  } catch (error: any) {
    console.error('=== Error in GET Hospital API ===');
    console.error('Error:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Stack:', error.stack);

    let errorMessage = 'Failed to fetch hospital data';
    let statusCode = 500;

    if (error.code === 'auth/id-token-expired') {
      errorMessage = 'Your session has expired. Please log in again.';
      statusCode = 401;
    } else if (error.code === 'auth/argument-error') {
      errorMessage = 'Invalid authentication token';
      statusCode = 401;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: statusCode }
    );
  }
}

// PUT: Update hospital data
export async function PUT(
  request: NextRequest,
  { params }: { params: { hospitalId: string } }
) {
  try {
    // Get hospitalId from params
    const hospitalId = params.hospitalId;

    console.log('=== PUT Hospital API Called ===');
    console.log('Hospital ID:', hospitalId);

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

    if (!hospitalId) {
      console.error('Hospital ID is missing');
      return NextResponse.json(
        { success: false, error: 'Hospital ID is required' },
        { status: 400 }
      );
    }

    console.log('Updating hospital:', hospitalId);

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

    // Verify user is the hospital admin or super admin
    const userRole = decodedToken.role;
    const isAuthorized = 
      userRole === 'super_admin' ||
      (userRole === 'hospital_admin' && hospitalData?.adminUserId === userId);

    if (!isAuthorized) {
      console.error('Update unauthorized for user:', userId);
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Only hospital admin can update this hospital' },
        { status: 403 }
      );
    }

    const body = await request.json();
    console.log('Update body:', body);

    const {
      name,
      phone,
      address,
      city,
      country,
      postalCode,
      website,
      description,
      departments,
      setupCompleted,
    } = body;

    // Validate required fields for setup completion
    if (setupCompleted && (!name?.trim() || !address?.trim() || !city?.trim() || !departments || departments.length === 0)) {
      return NextResponse.json(
        { success: false, error: 'Name, address, city, and at least one department are required' },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name.trim();
    if (phone !== undefined) updateData.phone = phone.trim();
    if (address !== undefined) updateData.address = address.trim();
    if (city !== undefined) updateData.city = city.trim();
    if (country !== undefined) updateData.country = country.trim();
    if (postalCode !== undefined) updateData.postalCode = postalCode.trim();
    if (website !== undefined) updateData.website = website.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (departments !== undefined) updateData.departments = departments;
    
    if (setupCompleted !== undefined) {
      updateData.setupCompleted = setupCompleted;
      if (setupCompleted) {
        updateData.status = 'active';
      }
    }

    console.log('Updating with data:', updateData);

    // Update hospital document
    await adminDb.collection('hospitals').doc(hospitalId).update(updateData);

    console.log('Hospital updated successfully:', hospitalId);

    return NextResponse.json({
      success: true,
      message: 'Hospital information updated successfully',
      hospitalId,
    });
  } catch (error: any) {
    console.error('=== Error in PUT Hospital API ===');
    console.error('Error:', error);
    console.error('Error message:', error.message);

    let errorMessage = 'Failed to update hospital data';
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