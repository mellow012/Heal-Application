import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

interface CreateVisitRequest {
  patientId: string;
  hospitalId: string;
  visitType: 'consultation' | 'emergency' | 'followup' | 'checkup' | 'surgery' | 'other';
  chiefComplaint?: string;
  notes?: string;
  assignedDoctor?: string;
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== Create Visit API Called ===');

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

    const userId = decodedToken.uid;
    const userRole = decodedToken.role;

    // Only medical personnel can create visits
    const allowedRoles = ['doctor', 'nurse', 'receptionist', 'hospital_admin', 'super_admin'];
    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - You do not have permission to create visits' },
        { status: 403 }
      );
    }

    const body: CreateVisitRequest = await request.json();
    const { patientId, hospitalId, visitType, chiefComplaint, notes, assignedDoctor } = body;

    if (!patientId || !hospitalId || !visitType) {
      return NextResponse.json(
        { success: false, error: 'Patient ID, Hospital ID, and Visit Type are required' },
        { status: 400 }
      );
    }

    // Get patient data
    const patientDoc = await adminDb.collection('patients').doc(patientId).get();
    
    if (!patientDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Patient not found' },
        { status: 404 }
      );
    }

    const patientData = patientDoc.data();
    const now = new Date().toISOString();

    // Create visit record
    const visitData = {
      patientId,
      patientNumber: patientData?.patientId,
      patientName: patientData?.fullName,
      hospitalId,
      visitType,
      visitDate: now,
      chiefComplaint: chiefComplaint || null,
      notes: notes || null,
      assignedDoctor: assignedDoctor || null,
      createdBy: userId,
      status: 'active',
      completed: false,
    };

    const visitRef = await adminDb.collection('visits').add(visitData);
    console.log('Visit created:', visitRef.id);

    // Update patient's visit tracking
    const visitedHospitals = patientData?.visitedHospitals || [];
    if (!visitedHospitals.includes(hospitalId)) {
      visitedHospitals.push(hospitalId);
    }

    await adminDb.collection('patients').doc(patientId).update({
      totalVisits: (patientData?.totalVisits || 0) + 1,
      lastVisitDate: now,
      lastVisitHospital: hospitalId,
      visitedHospitals,
      updatedAt: now,
    });

    // Update or create patient-hospital relationship
    const patientHospitalQuery = await adminDb
      .collection('patientHospitals')
      .where('patientId', '==', patientId)
      .where('hospitalId', '==', hospitalId)
      .limit(1)
      .get();

    if (patientHospitalQuery.empty) {
      // Create new relationship
      await adminDb.collection('patientHospitals').add({
        patientId,
        hospitalId,
        firstVisit: now,
        lastVisit: now,
        totalVisits: 1,
        status: 'active',
      });
    } else {
      // Update existing relationship
      const relationDoc = patientHospitalQuery.docs[0];
      await relationDoc.ref.update({
        lastVisit: now,
        totalVisits: (relationDoc.data().totalVisits || 0) + 1,
      });
    }

    console.log('✅ Visit created successfully');

    return NextResponse.json({
      success: true,
      message: 'Visit created successfully',
      visitId: visitRef.id,
    });
  } catch (error: any) {
    console.error('=== Error Creating Visit ===');
    console.error('Error:', error);

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create visit' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    success: false,
    error: 'Method not allowed. Use POST to create visit.' 
  }, { status: 405 });
}