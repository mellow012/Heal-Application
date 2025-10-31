// lib/types/hospital.ts
export interface HospitalInfo {
  name: string
  address: string
  phone: string
  email: string
  licenseNumber: string
  adminId: string
  createdAt: Date
  updatedAt: Date
}

export interface StaffMember {
  id: string
  clerkUserId: string
  name: string
  email: string
  role: 'admin' | 'doctor' | 'nurse' | 'receptionist'
  permissions: string[]
  joinedAt: Date
  isActive: boolean
  hospitalId: string
}

export interface HospitalRole {
  id: string
  name: string
  permissions: string[]
  description: string
}

export interface ActivityLog {
  id: string
  staffId: string
  staffName: string
  action: string
  patientId?: string
  patientName?: string
  timestamp: Date
  details: Record<string, any>
  hospitalId: string
}

export interface Patient {
  id: string
  name: string
  email: string
  phone?: string
  address?: string
  dateOfBirth?: Date
  status: 'dormant' | 'medical'
  createdAt: Date
  updatedAt: Date
}

export interface VerificationRequest {
  id: string
  patientId: string
  hospitalId: string
  requestedBy: string
  status: 'pending' | 'approved' | 'rejected'
  requestedAt: Date
  processedAt?: Date
  processingStaffId?: string
  notes?: string
}