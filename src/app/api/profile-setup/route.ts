'use client'
// src/app/api/profile/setup/route.ts
import { auth, clerkClient } from '@clerk/nextjs/server';
import { adminDb } from '../../../lib/firebaseAdmin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Fix: Use await auth() for App Router
    const { userId } = await auth();
   
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - no user ID found' },
        { status: 401 }
      );
    }

    // Parse the request body
    const body = await request.json();
    const { fullName, dateOfBirth, gender, bloodGroup, email } = body;

    // Validate required fields
    if (!fullName || !dateOfBirth || !gender || !bloodGroup || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('Creating profile for user:', userId);

    // Use Firebase Admin SDK to create documents (bypasses all security rules)
    const batch = adminDb.batch();

    // Get user's organization info from Clerk (if any)
    const clerkUser = await clerkClient.users.getUser(userId);
    const organizationMemberships = await clerkClient.users.getOrganizationMembershipList({
      userId: userId
    });

    // Determine user role and organization
    let userRole = 'user'; // Default role
    let organizationId = null;
    let organizationRole = null;

    if (organizationMemberships.length > 0) {
      // User belongs to an organization (hospital)
      const membership = organizationMemberships[0];
      organizationId = membership.organization.id;
      organizationRole = membership.role;
      
      // Map Clerk organization roles to our system roles
      if (organizationRole === 'admin') {
        userRole = 'hospital_admin';
      } else if (organizationRole === 'basic_member') {
        userRole = 'medical_staff'; // Default for organization members
      }
    }

    // Create user document
    const userRef = adminDb.collection('users').doc(userId);
    batch.set(userRef, {
      id: userId,
      email: email,
      role: userRole,
      organizationId: organizationId,
      organizationRole: organizationRole,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Only create e-health passport if user wants to become a patient
    // For now, we'll create it for all users, but you might want to make this conditional
    const healthPassportRef = adminDb.collection('e_health_passports').doc(userId);
    batch.set(healthPassportRef, {
      userId: userId,
      personalData: {
        fullName,
        dateOfBirth: new Date(dateOfBirth),
        gender,
        bloodGroup,
        email
      },
      medicalData: {
        allergies: [],
        medications: [],
        conditions: [],
        emergencyContacts: []
      },
      hospitalRecords: { 
        visits: [],
        admissions: [],
        discharges: []
      },
      healthAnalytics: { 
        heartRateTrends: [], 
        weightTrends: [],
        bloodPressureTrends: []
      },
      permissions: {
        canViewMedicalData: userRole === 'patient' || userRole === 'user',
        canEditPersonalData: true,
        canEditMedicalData: false // Only medical personnel can edit this
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Execute the batch write
    await batch.commit();

    console.log('Profile setup completed successfully for user:', userId);

    return NextResponse.json(
      {
        success: true,
        message: 'Profile setup completed successfully',
        userId: userId
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error in profile setup API:', error);
   
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}