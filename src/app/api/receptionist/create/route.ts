import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    console.log('API: /api/receptionist/create called');
    const { name, dob, phone, nationalId, emergencyName, emergencyPhone, hospitalId } = await request.json();
    console.log('API: Create data', { name, phone, hospitalId });

    if (!name || !dob || !phone || !hospitalId) {
      console.error('API: Missing required fields');
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    // Create Auth user with phone
    const authUser = await adminAuth.createUser({
      phoneNumber: phone,
      displayName: name,
      disabled: false,
    });
    console.log('API: Auth user created', authUser.uid);

    // Generate Global Patient Identifier
    const gpi = uuidv4();
    const patientId = authUser.uid;

    // Create global patient record
    await adminDb.collection('patients').doc(patientId).set({
      uid: patientId,
      gpi,
      name,
      dob: new Date(dob),
      phone,
      nationalId: nationalId || '',
      emergencyContact: emergencyName ? { name: emergencyName, phone: emergencyPhone || '' } : null,
      createdByHospitalId: hospitalId,
      createdAt: new Date(),
      consentGlobalShare: false,  // Patient must opt-in
    });
    console.log('API: Patient record created', patientId);

    // Auto-create first visit (check-in)
    const visitId = uuidv4();
    await adminDb.collection('patients').doc(patientId).collection('visits').doc(visitId).set({
      visitId,
      hospitalId,
      checkInAt: new Date(),
      reason: 'Registration check-in',
      status: 'checked-in',
      enteredByUid: '',  // Receptionist UID from context if needed
    });
    console.log('API: First visit created', visitId);

    return NextResponse.json({
      success: true,
      message: `Patient registered! GPI: ${gpi.substring(0, 8)}...`,
      gpi,
      patientId,
      visitId,
    });
  } catch (error) {
    console.error('API: Create patient error', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}