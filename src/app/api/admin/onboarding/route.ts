import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';
import { sendPasswordResetEmail } from '@/lib/email-services';
import { FieldValue } from 'firebase-admin/firestore';

interface CreateHospitalRequest {
  hospitalName: string;
  email: string;
  phoneNumber: string;
}

interface ApiResponse {
  success: boolean;
  message: string;
  hospitalId?: string;
  adminUserId?: string;
  error?: string;
}

// Verify that the request is from a super admin
async function verifySuperAdmin(authToken: string): Promise<boolean> {
  try {
    const decodedToken = await adminAuth.verifyIdToken(authToken);
    const customClaims = decodedToken;
    
    // Check if user has super_admin role
    if (customClaims.role === 'super_admin') {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error verifying token:', error);
    return false;
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    console.log('API: /api/admin/onboarding called');
    
    // Get authorization token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('API: No authorization token provided');
      return NextResponse.json(
        { success: false, error: 'Unauthorized - No token provided', message: '' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Verify super admin
    const isSuperAdmin = await verifySuperAdmin(token);
    if (!isSuperAdmin) {
      console.error('API: User is not a super admin');
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Super admin access required', message: '' },
        { status: 403 }
      );
    }

    const body: CreateHospitalRequest = await request.json();
    const { hospitalName, email, phoneNumber } = body;
    console.log('API: Request body', { hospitalName, email, phoneNumber });

    // Validate required fields
    if (!hospitalName?.trim() || !email?.trim() || !phoneNumber?.trim()) {
      console.error('API: Missing required fields');
      return NextResponse.json(
        { success: false, error: 'Hospital name, email, and phone number are required', message: '' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      console.error('API: Invalid email address');
      return NextResponse.json(
        { success: false, error: 'Invalid email address format', message: '' },
        { status: 400 }
      );
    }

    // Validate phone number (basic validation)
    const phoneRegex = /^\+?[\d\s\-()]{10,}$/;
    if (!phoneRegex.test(phoneNumber.trim())) {
      console.error('API: Invalid phone number');
      return NextResponse.json(
        { success: false, error: 'Invalid phone number format', message: '' },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPhone = phoneNumber.trim();
    const trimmedHospitalName = hospitalName.trim();

    // Check if email already exists in Firebase Auth
    let existingUser = null;
    try {
      existingUser = await adminAuth.getUserByEmail(trimmedEmail);
    } catch (error: any) {
      if (error.code !== 'auth/user-not-found') {
        throw error;
      }
    }

    if (existingUser) {
      console.error('API: Email already in use by a user');
      return NextResponse.json(
        { success: false, error: 'This email is already registered in the system', message: '' },
        { status: 400 }
      );
    }

    // Check if email already exists in hospitals collection
    const existingHospitals = await adminDb
      .collection('hospitals')
      .where('email', '==', trimmedEmail)
      .limit(1)
      .get();

    if (!existingHospitals.empty) {
      console.error('API: Email already in use by a hospital');
      return NextResponse.json(
        { success: false, error: 'This email is already associated with another hospital', message: '' },
        { status: 400 }
      );
    }

    // Create hospital document reference
    console.log('API: Creating hospital', trimmedHospitalName);
    const hospitalRef = adminDb.collection('hospitals').doc();
    const hospitalId = hospitalRef.id;

    // Create user in Firebase Auth
    console.log('API: Creating user', trimmedEmail);
    const userRecord = await adminAuth.createUser({
      email: trimmedEmail,
      emailVerified: false,
      disabled: false,
    });

    // Set custom claims for hospital admin
    console.log('API: Setting custom claims for user', userRecord.uid);
    await adminAuth.setCustomUserClaims(userRecord.uid, { 
      role: 'hospital_admin', 
      hospitalId 
    });

    // Create hospital and user documents in Firestore using batch
    console.log('API: Starting Firestore batch');
    const batch = adminDb.batch();

    batch.set(hospitalRef, {
      name: trimmedHospitalName,
      email: trimmedEmail,
      phone: trimmedPhone,
      adminUserId: userRecord.uid,
      status: 'pending',
      setupCompleted: false,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      departments: [],
      address: '',
    });

    const userRef = adminDb.collection('users').doc(userRecord.uid);
    batch.set(userRef, {
      email: trimmedEmail,
      phone: trimmedPhone,
      role: 'hospital_admin',
      hospitalId,
      passwordSet: false,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    await batch.commit();
    console.log('API: Firestore batch committed');

    // Generate password reset link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    if (!baseUrl || baseUrl === 'http://localhost:3000') {
      console.warn('API: NEXT_PUBLIC_APP_URL not set or using default. This should be set in production.');
    }

    const redirectUrl = new URL('/hospital/setup', baseUrl);
    redirectUrl.searchParams.append('hospitalId', hospitalId);

    const actionCodeSettings = {
      url: redirectUrl.toString(),
      handleCodeInApp: true,
    };

    console.log('API: Generating password reset link for', trimmedEmail);
    const passwordResetLink = await adminAuth.generatePasswordResetLink(
      trimmedEmail, 
      actionCodeSettings
    );

    // Send setup email
    console.log('API: Sending password reset email to', trimmedEmail);
    try {
      await sendPasswordResetEmail(
        trimmedEmail, 
        trimmedHospitalName, 
        passwordResetLink, 
        hospitalId
      );
      console.log('API: Email sent successfully');
    } catch (emailError) {
      console.error('API: Email sending failed, but hospital was created', emailError);
      // Hospital is created, but email failed - inform the user
      return NextResponse.json({
        success: true,
        message: `Hospital ${trimmedHospitalName} created successfully, but setup email failed to send. Please contact the admin manually.`,
        hospitalId,
        adminUserId: userRecord.uid,
      });
    }

    console.log('API: Hospital and admin created successfully');
    return NextResponse.json({
      success: true,
      message: `Hospital "${trimmedHospitalName}" created successfully! Setup email sent to ${trimmedEmail}.`,
      hospitalId,
      adminUserId: userRecord.uid,
    });
  } catch (error: any) {
    console.error('API: Error creating hospital:', error);
    
    let errorMessage = 'Failed to create hospital. Please try again.';
    
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'This email is already in use';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address';
    } else if (error.code === 'auth/operation-not-allowed') {
      errorMessage = 'Email/password accounts are not enabled. Please contact support.';
    } else if (error.message && error.message.includes('continue URL must be a valid URL string')) {
      errorMessage = 'Invalid NEXT_PUBLIC_APP_URL configuration. Please check environment variables.';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { success: false, error: errorMessage, message: '' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}