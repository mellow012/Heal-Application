import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

type RouteContext = {
  params: Promise<{ patientId: string }>;
};

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // Await params (Next.js 15)
    const params = await context.params;
    const { patientId } = params;

    console.log('=== Get Patient Visits API Called ===');
    console.log('Patient ID:', patientId);

    // Get authorization token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    if (!patientId) {
      return NextResponse.json(
        { success: false, error: 'Patient ID is required' },
        { status: 400 }
      );
    }

    const userRole = decodedToken.role;
    const userHospitalId = decodedToken.hospitalId;

    // Check if patient exists
    const patientDoc = await adminDb.collection('patients').doc(patientId).get();
    
    if (!patientDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Patient not found' },
        { status: 404 }
      );
    }

    const patientData = patientDoc.data();

    // Check access permissions
    // Super admin can see all visits
    // Hospital staff can only see visits to their hospital OR if patient has visited their hospital
    let visitsQuery = adminDb.collection('visits').where('patientId', '==', patientId);

    if (userRole !== 'super_admin') {
      // Check if patient has visited user's hospital
      const patientHospitalQuery = await adminDb
        .collection('patientHospitals')
        .where('patientId', '==', patientId)
        .where('hospitalId', '==', userHospitalId)
        .limit(1)
        .get();

      if (patientHospitalQuery.empty) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Unauthorized - This patient has not visited your hospital' 
          },
          { status: 403 }
        );
      }

      // Filter to show only visits to user's hospital (for privacy)
      const showAllVisits = request.nextUrl.searchParams.get('showAll') === 'true';
      
      if (!showAllVisits) {
        visitsQuery = visitsQuery.where('hospitalId', '==', userHospitalId);
      }
    }

    // Get visits sorted by date (newest first)
    const visitsSnapshot = await visitsQuery.orderBy('visitDate', 'desc').get();

    const visits = await Promise.all(
      visitsSnapshot.docs.map(async (doc) => {
        const visitData = doc.data();
        
        // Get hospital name
        let hospitalName = 'Unknown Hospital';
        try {
          const hospitalDoc = await adminDb.collection('hospitals').doc(visitData.hospitalId).get();
          if (hospitalDoc.exists) {
            hospitalName = hospitalDoc.data()?.name || 'Unknown Hospital';
          }
        } catch (err) {
          console.error('Error fetching hospital:', err);
        }

        // Get doctor name if assigned
        let doctorName = null;
        if (visitData.assignedDoctor) {
          try {
            const doctorDoc = await adminDb.collection('users').doc(visitData.assignedDoctor).get();
            if (doctorDoc.exists) {
              doctorName = doctorDoc.data()?.name || 'Unknown Doctor';
            }
          } catch (err) {
            console.error('Error fetching doctor:', err);
          }
        }

        return {
          id: doc.id,
          ...visitData,
          hospitalName,
          doctorName,
        };
      })
    );

    console.log('Found', visits.length, 'visits');

    return NextResponse.json({
      success: true,
      visits,
      count: visits.length,
      patient: {
        id: patientId,
        patientId: patientData?.patientId,
        fullName: patientData?.fullName,
        totalVisits: patientData?.totalVisits || 0,
      },
    });
  } catch (error: any) {
    console.error('=== Error Fetching Patient Visits ===');
    console.error('Error:', error);

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch patient visits' },
      { status: 500 }
    );
  }
}

export async function POST() {
  return NextResponse.json({ 
    success: false,
    error: 'Method not allowed. Use GET to fetch visits.' 
  }, { status: 405 });
}