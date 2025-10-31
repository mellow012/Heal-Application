import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

type RouteContext = {
  params: Promise<{ hospitalId: string }>;
};

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // Await params (Next.js 15)
    const params = await context.params;
    const { hospitalId } = params;

    console.log('=== Get Patients API Called ===');
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

    const userRole = decodedToken.role;
    const userHospitalId = decodedToken.hospitalId;

    // Check authorization
    const hasAccess =
      userRole === 'super_admin' ||
      userHospitalId === hospitalId;

    if (!hasAccess) {
      console.error('Access denied for user');
      return NextResponse.json(
        { success: false, error: 'Unauthorized - You do not have access to these patients' },
        { status: 403 }
      );
    }

    if (!hospitalId) {
      return NextResponse.json(
        { success: false, error: 'Hospital ID is required' },
        { status: 400 }
      );
    }

    console.log('Fetching patients who have visited hospital:', hospitalId);

    // Get search query parameter
    const searchParams = request.nextUrl.searchParams;
    const searchQuery = searchParams.get('search')?.toLowerCase();
    const statusFilter = searchParams.get('status');

    // Fetch patient-hospital relationships for this hospital
    console.log('Fetching patient-hospital relationships...');
    const patientHospitalSnapshot = await adminDb
      .collection('patientHospitals')
      .where('hospitalId', '==', hospitalId)
      .get();

    const patientIds = patientHospitalSnapshot.docs.map(doc => doc.data().patientId);
    
    console.log('Found', patientIds.length, 'patients associated with hospital');

    if (patientIds.length === 0) {
      return NextResponse.json({
        success: true,
        patients: [],
        count: 0,
      });
    }

    // Fetch patient details in batches (Firestore 'in' query limit is 10)
    const batchSize = 10;
    let allPatients: any[] = [];

    for (let i = 0; i < patientIds.length; i += batchSize) {
      const batch = patientIds.slice(i, i + batchSize);
      const patientsSnapshot = await adminDb
        .collection('patients')
        .where(adminDb.FieldPath.documentId(), 'in', batch)
        .get();

      const batchPatients = patientsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      allPatients = [...allPatients, ...batchPatients];
    }

    // Filter by status if provided
    if (statusFilter && statusFilter !== 'all') {
      allPatients = allPatients.filter((p: any) => p.status === statusFilter);
    }

    // Client-side filtering for search (Firestore doesn't support partial text search)
    if (searchQuery) {
      allPatients = allPatients.filter((patient: any) => 
        patient.fullName?.toLowerCase().includes(searchQuery) ||
        patient.patientId?.toLowerCase().includes(searchQuery) ||
        patient.phone?.includes(searchQuery) ||
        patient.email?.toLowerCase().includes(searchQuery)
      );
    }

    console.log('Returning', allPatients.length, 'patients after filtering');

    return NextResponse.json({
      success: true,
      patients: allPatients,
      count: allPatients.length,
    });
  } catch (error: any) {
    console.error('=== Error Fetching Patients ===');
    console.error('Error:', error);
    console.error('Error message:', error.message);

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch patients' },
      { status: 500 }
    );
  }
}

export async function POST() {
  return NextResponse.json({ 
    success: false,
    error: 'Method not allowed. Use GET to fetch patients.' 
  }, { status: 405 });
}