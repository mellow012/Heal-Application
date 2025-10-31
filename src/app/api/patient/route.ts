import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

interface AddPatientRequest {
  firstName: string;
  lastName: string;
  nationalId: string;  // Primary unique identifier
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  email?: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  bloodGroup?: string;
  allergies?: string[];
  chronicConditions?: string[];
  currentMedications?: string[];
  registeredAtHospitalId: string;
}

// Generate unique patient ID (national/system-wide)
function generatePatientId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 7);
  return `PT-${timestamp}-${random}`.toUpperCase();
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== Add Patient API Called ===');

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
    const userRole = decodedToken.role;
    const userHospitalId = decodedToken.hospitalId;

    // ONLY receptionists, hospital admins, and super admins can register new patients
    const canRegisterPatients = ['receptionist', 'hospital_admin', 'super_admin'];
    if (!canRegisterPatients.includes(userRole)) {
      console.error('User role not authorized to register patients:', userRole);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Unauthorized - Only receptionists and administrators can register new patients. Please contact your receptionist.' 
        },
        { status: 403 }
      );
    }

    const body: AddPatientRequest = await request.json();
    console.log('Request body received');

    const {
      firstName,
      lastName,
      dateOfBirth,
      gender,
      email,
      phone,
      address,
      city,
      country,
      emergencyContactName,
      emergencyContactPhone,
      emergencyContactRelation,
      bloodGroup,
      allergies,
      chronicConditions,
      currentMedications,
      registeredAtHospitalId,
    } = body;

    // Validate required fields
    if (!firstName?.trim() || !lastName?.trim() || !dateOfBirth || !gender || !phone?.trim() || 
        !address?.trim() || !city?.trim() || !country?.trim() || 
        !emergencyContactName?.trim() || !emergencyContactPhone?.trim() || !emergencyContactRelation?.trim()) {
      console.error('Missing required fields');
      return NextResponse.json(
        { success: false, error: 'All required fields must be filled' },
        { status: 400 }
      );
    }

    // Validate email if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return NextResponse.json(
          { success: false, error: 'Invalid email address format' },
          { status: 400 }
        );
      }
    }

    // Check for duplicate patient by phone number
    console.log('Checking for existing patient...');
    const existingPatients = await adminDb
      .collection('patients')
      .where('phone', '==', phone.trim())
      .where('dateOfBirth', '==', dateOfBirth)
      .limit(1)
      .get();

    if (!existingPatients.empty) {
      console.log('Patient already exists');
      return NextResponse.json(
        { success: false, error: 'A patient with this phone number and date of birth already exists in the system' },
        { status: 400 }
      );
    }

    // Generate unique patient ID (system-wide)
    const patientId = generatePatientId();
    console.log('Generated patient ID:', patientId);

    const trimmedEmail = email?.trim().toLowerCase();
    const now = new Date().toISOString();

    // Create global patient record
    const patientData = {
      patientId,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      fullName: `${firstName.trim()} ${lastName.trim()}`,
      dateOfBirth,
      gender,
      email: trimmedEmail || null,
      phone: phone.trim(),
      address: address.trim(),
      city: city.trim(),
      country: country.trim(),
      emergencyContact: {
        name: emergencyContactName.trim(),
        phone: emergencyContactPhone.trim(),
        relation: emergencyContactRelation.trim(),
      },
      medicalInfo: {
        bloodGroup: bloodGroup || null,
        allergies: allergies || [],
        chronicConditions: chronicConditions || [],
        currentMedications: currentMedications || [],
      },
      // Tracking info
      registeredAt: now,
      registeredBy: userId,
      registeredAtHospital: registeredAtHospitalId,
      updatedAt: now,
      status: 'active',
      
      // Visit tracking (for quick stats)
      totalVisits: 1, // First registration counts as first visit
      lastVisitDate: now,
      lastVisitHospital: registeredAtHospitalId,
      visitedHospitals: [registeredAtHospitalId], // Array of hospital IDs
    };

    console.log('Creating patient document...');

    // Create patient document (global)
    const patientRef = adminDb.collection('patients').doc();
    await patientRef.set(patientData);

    console.log('Patient document created with ID:', patientRef.id);

    // Create initial visit record
    console.log('Creating initial visit record...');
    await adminDb.collection('visits').add({
      patientId: patientRef.id,
      patientNumber: patientId,
      patientName: patientData.fullName,
      hospitalId: registeredAtHospitalId,
      visitType: 'registration',
      visitDate: now,
      registeredBy: userId,
      status: 'active',
      notes: 'Initial patient registration',
    });

    // Create patient-hospital relationship (for access control)
    console.log('Creating patient-hospital relationship...');
    await adminDb.collection('patientHospitals').add({
      patientId: patientRef.id,
      hospitalId: registeredAtHospitalId,
      firstVisit: now,
      lastVisit: now,
      totalVisits: 1,
      status: 'active',
    });

    console.log('✅ Patient added successfully');

    return NextResponse.json({
      success: true,
      message: `Patient ${patientData.fullName} registered successfully!`,
      patientId: patientRef.id,
      patientNumber: patientId,
    });
  } catch (error: any) {
    console.error('=== Error Adding Patient ===');
    console.error('Error:', error);
    console.error('Error message:', error.message);

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to add patient' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    success: false,
    error: 'Method not allowed. Use POST to add patient.' 
  }, { status: 405 });
}