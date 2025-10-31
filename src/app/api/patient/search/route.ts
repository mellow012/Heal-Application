import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

export async function GET(request: NextRequest) {
  try {
    console.log('=== Search Patients API Called ===');

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

    const userRole = decodedToken.role;

    // All hospital staff can search for patients
    const allowedRoles = ['doctor', 'nurse', 'receptionist', 'hospital_admin', 'super_admin'];
    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - You do not have permission to search patients' },
        { status: 403 }
      );
    }

    // Get search parameters
    const searchParams = request.nextUrl.searchParams;
    const nationalId = searchParams.get('nationalId');
    const phone = searchParams.get('phone');
    const patientId = searchParams.get('patientId');
    const name = searchParams.get('name')?.toLowerCase();

    if (!nationalId && !phone && !patientId && !name) {
      return NextResponse.json(
        { success: false, error: 'Please provide at least one search parameter (nationalId, phone, patientId, or name)' },
        { status: 400 }
      );
    }

    console.log('Search parameters:', { nationalId, phone, patientId, name });

    let patients: any[] = [];

    // Search by National ID (most accurate and preferred)
    if (nationalId) {
      console.log('Searching by National ID:', nationalId);
      const nationalIdSnapshot = await adminDb
        .collection('patients')
        .where('nationalId', '==', nationalId.trim().toUpperCase())
        .get();

      patients = nationalIdSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    }
    // Search by phone (secondary option)
    else if (phone) {
      console.log('Searching by phone:', phone);
      const phoneSnapshot = await adminDb
        .collection('patients')
        .where('phone', '==', phone.trim())
        .get();

      patients = phoneSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    }
    // Search by patient ID
    else if (patientId) {
      console.log('Searching by patient ID:', patientId);
      const idSnapshot = await adminDb
        .collection('patients')
        .where('patientId', '==', patientId.trim().toUpperCase())
        .get();

      patients = idSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    }
    // Search by name (less accurate, returns all patients for client-side filtering)
    else if (name) {
      console.log('Searching by name:', name);
      // Get all patients and filter client-side (Firestore doesn't support partial text search)
      const allPatientsSnapshot = await adminDb
        .collection('patients')
        .limit(100) // Limit for performance
        .get();

      const allPatients = allPatientsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Filter by name
      patients = allPatients.filter((p: any) => 
        p.fullName?.toLowerCase().includes(name) ||
        p.firstName?.toLowerCase().includes(name) ||
        p.lastName?.toLowerCase().includes(name)
      );
    }

    console.log('Found', patients.length, 'patients');

    // Return only essential info for search results
    const searchResults = patients.map(p => ({
      id: p.id,
      patientId: p.patientId,
      fullName: p.fullName,
      dateOfBirth: p.dateOfBirth,
      gender: p.gender,
      phone: p.phone,
      email: p.email,
      address: p.address,
      city: p.city,
      registeredAt: p.registeredAt,
      lastVisitDate: p.lastVisitDate,
      totalVisits: p.totalVisits,
      status: p.status,
    }));

    return NextResponse.json({
      success: true,
      patients: searchResults,
      count: searchResults.length,
    });
  } catch (error: any) {
    console.error('=== Error Searching Patients ===');
    console.error('Error:', error);

    return NextResponse.json(
      { success: false, error: error.message || 'Failed to search patients' },
      { status: 500 }
    );
  }
}

export async function POST() {
  return NextResponse.json({ 
    success: false,
    error: 'Method not allowed. Use GET with query parameters.' 
  }, { status: 405 });
}