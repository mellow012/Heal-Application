import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';

interface AddStaffRequest {
  name: string;
  email: string;
  phone: string;
  role: 'doctor' | 'nurse' | 'receptionist' | 'staff';
  department: string;
  hospitalId: string;
}

// Send staff setup email
async function sendStaffSetupEmail(
  email: string,
  name: string,
  hospitalName: string,
  role: string,
  resetLink: string
): Promise<void> {
  const nodemailer = require('nodemailer');
  
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: true,
      minVersion: 'TLSv1.2',
    },
  });

  const mailOptions = {
    from: `"${hospitalName}" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Welcome to ${hospitalName} - Set Up Your Account`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                <tr>
                  <td style="padding: 40px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                      Welcome to ${hospitalName}!
                    </h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 22px;">
                      Hello ${name},
                    </h2>
                    <p style="margin: 0 0 15px 0; color: #555555; font-size: 16px; line-height: 1.6;">
                      You have been added as a <strong style="color: #667eea; text-transform: capitalize;">${role}</strong> at ${hospitalName}.
                    </p>
                    <p style="margin: 0 0 30px 0; color: #555555; font-size: 16px; line-height: 1.6;">
                      To get started, please click the button below to set your password and access your account:
                    </p>
                    <table role="presentation" style="margin: 0 auto;">
                      <tr>
                        <td style="border-radius: 8px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                          <a href="${resetLink}" 
                             style="display: inline-block; padding: 16px 40px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold; border-radius: 8px;">
                            Set Up Your Account
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin: 30px 0 15px 0; color: #888888; font-size: 14px; line-height: 1.6;">
                      If the button doesn't work, copy and paste this link into your browser:
                    </p>
                    <p style="margin: 0 0 30px 0; word-break: break-all;">
                      <a href="${resetLink}" style="color: #667eea; text-decoration: none; font-size: 13px;">
                        ${resetLink}
                      </a>
                    </p>
                    <div style="margin: 30px 0; padding: 20px; background-color: #f8f9fa; border-left: 4px solid #667eea; border-radius: 4px;">
                      <p style="margin: 0 0 10px 0; color: #333333; font-size: 14px; font-weight: bold;">
                        Important:
                      </p>
                      <ul style="margin: 0; padding-left: 20px; color: #555555; font-size: 14px; line-height: 1.6;">
                        <li style="margin-bottom: 8px;">This link will expire in 24 hours</li>
                        <li style="margin-bottom: 8px;">Keep your password secure</li>
                        <li>Contact your administrator if you need assistance</li>
                      </ul>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 30px; background-color: #f8f9fa; text-align: center; border-top: 1px solid #e9ecef;">
                    <p style="margin: 0; color: #888888; font-size: 12px;">
                      © ${new Date().getFullYear()} ${hospitalName}. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
    text: `
Welcome to ${hospitalName}!

Hello ${name},

You have been added as a ${role} at ${hospitalName}.

To get started, please set your password by visiting this link:
${resetLink}

This link will expire in 24 hours.

If you have any questions, please contact your administrator.

© ${new Date().getFullYear()} ${hospitalName}. All rights reserved.
    `,
  };

  await transporter.sendMail(mailOptions);
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== Add Staff API Called ===');

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

    // Only hospital admins and super admins can add staff
    if (userRole !== 'hospital_admin' && userRole !== 'super_admin') {
      console.error('User role not authorized:', userRole);
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Only hospital administrators can add staff' },
        { status: 403 }
      );
    }

    const body: AddStaffRequest = await request.json();
    console.log('Request body:', { ...body, email: body.email?.substring(0, 10) + '...' });

    const { name, email, phone, role, department, hospitalId } = body;

    // Validate required fields
    if (!name?.trim() || !email?.trim() || !phone?.trim() || !role || !department?.trim() || !hospitalId) {
      console.error('Missing required fields');
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { success: false, error: 'Invalid email address format' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['doctor', 'nurse', 'receptionist', 'staff'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Hospital admin can only add staff to their own hospital
    if (userRole === 'hospital_admin' && userHospitalId !== hospitalId) {
      console.error('Hospital admin trying to add staff to different hospital');
      return NextResponse.json(
        { success: false, error: 'Unauthorized - You can only add staff to your own hospital' },
        { status: 403 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    const trimmedDepartment = department.trim();

    // Check if email already exists
    let existingUser = null;
    try {
      existingUser = await adminAuth.getUserByEmail(trimmedEmail);
    } catch (error: any) {
      if (error.code !== 'auth/user-not-found') {
        throw error;
      }
    }

    if (existingUser) {
      console.error('Email already exists:', trimmedEmail);
      return NextResponse.json(
        { success: false, error: 'This email is already registered in the system' },
        { status: 400 }
      );
    }

    // Get hospital data
    console.log('Fetching hospital:', hospitalId);
    const hospitalDoc = await adminDb.collection('hospitals').doc(hospitalId).get();
    
    if (!hospitalDoc.exists) {
      console.error('Hospital not found:', hospitalId);
      return NextResponse.json(
        { success: false, error: 'Hospital not found' },
        { status: 404 }
      );
    }

    const hospitalData = hospitalDoc.data();
    const hospitalName = hospitalData?.name || 'Hospital';
    console.log('Hospital found:', hospitalName);

    // Create user in Firebase Auth
    console.log('Creating Firebase Auth user...');
    const userRecord = await adminAuth.createUser({
      email: trimmedEmail,
      emailVerified: false,
      disabled: false,
    });
    console.log('User created with UID:', userRecord.uid);

    // Set custom claims
    console.log('Setting custom claims...');
    await adminAuth.setCustomUserClaims(userRecord.uid, {
      role: role,
      hospitalId: hospitalId,
      hospitalRole: role,
    });
    console.log('Custom claims set');

    // Create user document in Firestore
    console.log('Creating Firestore user document...');
    await adminDb.collection('users').doc(userRecord.uid).set({
      email: trimmedEmail,
      name: trimmedName,
      phone: trimmedPhone,
      role: role,
      hospitalId: hospitalId,
      hospitalRole: role,
      department: trimmedDepartment,
      status: 'pending',
      passwordSet: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: userId,
    });
    console.log('User document created');

    // Add staff reference to hospital's staff subcollection
    console.log('Adding to hospital staff subcollection...');
    await adminDb
      .collection('hospitals')
      .doc(hospitalId)
      .collection('staff')
      .doc(userRecord.uid)
      .set({
        userId: userRecord.uid,
        name: trimmedName,
        email: trimmedEmail,
        phone: trimmedPhone,
        role: role,
        department: trimmedDepartment,
        status: 'pending',
        addedAt: new Date().toISOString(),
        addedBy: userId,
      });
    console.log('Staff reference added');

    // Generate password reset link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const redirectUrl = new URL('/reset-password', baseUrl);

    const actionCodeSettings = {
      url: redirectUrl.toString(),
      handleCodeInApp: true,
    };

    console.log('Generating password reset link...');
    const passwordResetLink = await adminAuth.generatePasswordResetLink(
      trimmedEmail,
      actionCodeSettings
    );
    console.log('Password reset link generated');

    // Send setup email
    console.log('Sending setup email...');
    try {
      await sendStaffSetupEmail(
        trimmedEmail,
        trimmedName,
        hospitalName,
        role,
        passwordResetLink
      );
      console.log('✅ Email sent successfully');
    } catch (emailError: any) {
      console.error('❌ Email sending failed:', emailError.message);
      // Staff is created but email failed
      return NextResponse.json({
        success: true,
        message: `Staff member ${trimmedName} added successfully, but setup email failed to send. Please send the credentials manually.`,
        staffId: userRecord.uid,
        warning: 'Email not sent',
      });
    }

    console.log('✅ Staff member created successfully');
    return NextResponse.json({
      success: true,
      message: `Staff member ${trimmedName} added successfully! Setup email sent to ${trimmedEmail}.`,
      staffId: userRecord.uid,
    });
  } catch (error: any) {
    console.error('=== Error Adding Staff ===');
    console.error('Error:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);

    let errorMessage = 'Failed to add staff member. Please try again.';

    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'This email is already in use';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    success: false,
    error: 'Method not allowed. Use POST to add staff.' 
  }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ 
    success: false,
    error: 'Method not allowed. Use POST to add staff.' 
  }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ 
    success: false,
    error: 'Method not allowed.' 
  }, { status: 405 });
}