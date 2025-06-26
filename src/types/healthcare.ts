// types/healthcare.ts
export interface PersonalData {
  nationalId: string;
  fullName: string;
  dateOfBirth: Date;
  phoneNumber: string;
  email: string;
  homeVillage?: string;
  homeAddress?: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phoneNumber: string;
  };
  insuranceInfo?: {
    provider: string;
    policyNumber: string;
  };
}

export interface MedicalProfile {
  patientId: string; // Unique identifier for medical records
  bloodType?: string;
  allergies: string[];
  chronicConditions: string[];
  currentMedications: string[];
}

export interface AppMetadata {
  createdAt: Date;
  lastUpdated: Date;
  profileComplete: boolean;
  onboardingStep: number;
  qrCodeGenerated: boolean;
}

export interface UserDocument {
  clerkUserId: string;
  personalData: PersonalData;
  medicalProfile: MedicalProfile;
  appMetadata: AppMetadata;
}

export interface MedicalRecord {
  recordId: string;
  patientId: string;
  hospitalId: string;
  date: Date;
  recordType: 'consultation' | 'lab_test' | 'prescription' | 'procedure' | 'admission';
  diagnosis?: string;
  treatment?: string;
  medications: {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
  }[];
  vitals?: {
    bloodPressure?: string;
    heartRate?: number;
    temperature?: number;
    weight?: number;
    height?: number;
  };
  labResults?: {
    testName: string;
    result: string;
    normalRange: string;
    unit: string;
  }[];
  notes?: string;
  createdBy: string; // Clerk ID of medical personnel
  createdAt: Date;
  updatedAt: Date;
}

export interface MedicalRecordDocument {
  patientIdentifiers: {
    nationalId: string;
    phoneNumber: string;
    fullName: string;
    patientId: string;
  };
  records: MedicalRecord[];
  linkedToApp: boolean;
  lastSyncAt?: Date;
}

export interface Hospital {
  hospitalId: string;
  clerkOrgId: string;
  name: string;
  location: string;
  contactInfo: {
    phone: string;
    email: string;
    address: string;
  };
  administrators: string[]; // Clerk User IDs
  medicalStaff: {
    userId: string;
    role: 'doctor' | 'nurse' | 'lab_technician' | 'receptionist';
    department?: string;
    licenseNumber?: string;
  }[];
  createdAt: Date;
  isActive: boolean;
}

// Utility types for form handling
export interface OnboardingStepData {
  step1: {
    fullName: string;
    dateOfBirth: string;
    phoneNumber: string;
    nationalId: string;
  };
  step2: {
    homeVillage: string;
    homeAddress: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
    emergencyContactRelationship: string;
  };
  step3: {
    insuranceProvider?: string;
    policyNumber?: string;
    preferredHospital?: string;
  };
}

export interface PatientSearchResult {
  patientId: string;
  nationalId: string;
  fullName: string;
  phoneNumber: string;
  dateOfBirth: Date;
  hasAppAccount: boolean;
  lastVisit?: Date;
  recordCount: number;
}