// lib/roles.js

export const HOSPITAL_ROLES = {
  ADMIN: 'admin',           // Full access - hospital management
  DOCTOR: 'doctor',         // Can view, diagnose, prescribe
  NURSE: 'nurse',           // Can view, update vitals, administer meds
  RECEPTIONIST: 'receptionist', // Can register patients, schedule
  LAB_TECH: 'lab_tech',     // Can view, add lab results
  PHARMACIST: 'pharmacist',  // Can view prescriptions, dispense meds
  RADIOLOGIST: 'radiologist' // Can view, add imaging results
};

export const PERMISSIONS = {
  // Patient Management
  REGISTER_PATIENT: 'register_patient',
  VIEW_PATIENT: 'view_patient',
  EDIT_PATIENT_INFO: 'edit_patient_info',
  DELETE_PATIENT: 'delete_patient',
  
  // Medical Records
  VIEW_MEDICAL_RECORDS: 'view_medical_records',
  ADD_DIAGNOSIS: 'add_diagnosis',
  EDIT_DIAGNOSIS: 'edit_diagnosis',
  
  // Prescriptions
  VIEW_PRESCRIPTIONS: 'view_prescriptions',
  CREATE_PRESCRIPTION: 'create_prescription',
  DISPENSE_MEDICATION: 'dispense_medication',
  
  // Lab & Imaging
  VIEW_LAB_RESULTS: 'view_lab_results',
  ADD_LAB_RESULTS: 'add_lab_results',
  VIEW_IMAGING: 'view_imaging',
  ADD_IMAGING_RESULTS: 'add_imaging_results',
  
  // Vitals
  VIEW_VITALS: 'view_vitals',
  RECORD_VITALS: 'record_vitals',
  
  // Admin
  MANAGE_STAFF: 'manage_staff',
  VIEW_REPORTS: 'view_reports',
  MANAGE_HOSPITAL_SETTINGS: 'manage_hospital_settings',
  GRANT_PATIENT_ACCESS: 'grant_patient_access'
};

// Role-Permission Matrix
export const ROLE_PERMISSIONS = {
  [HOSPITAL_ROLES.ADMIN]: [
    PERMISSIONS.REGISTER_PATIENT,
    PERMISSIONS.VIEW_PATIENT,
    PERMISSIONS.EDIT_PATIENT_INFO,
    PERMISSIONS.DELETE_PATIENT,
    PERMISSIONS.VIEW_MEDICAL_RECORDS,
    PERMISSIONS.VIEW_PRESCRIPTIONS,
    PERMISSIONS.VIEW_LAB_RESULTS,
    PERMISSIONS.VIEW_IMAGING,
    PERMISSIONS.VIEW_VITALS,
    PERMISSIONS.MANAGE_STAFF,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.MANAGE_HOSPITAL_SETTINGS,
    PERMISSIONS.GRANT_PATIENT_ACCESS
  ],
  
  [HOSPITAL_ROLES.DOCTOR]: [
    PERMISSIONS.REGISTER_PATIENT,
    PERMISSIONS.VIEW_PATIENT,
    PERMISSIONS.EDIT_PATIENT_INFO,
    PERMISSIONS.VIEW_MEDICAL_RECORDS,
    PERMISSIONS.ADD_DIAGNOSIS,
    PERMISSIONS.EDIT_DIAGNOSIS,
    PERMISSIONS.VIEW_PRESCRIPTIONS,
    PERMISSIONS.CREATE_PRESCRIPTION,
    PERMISSIONS.VIEW_LAB_RESULTS,
    PERMISSIONS.VIEW_IMAGING,
    PERMISSIONS.VIEW_VITALS,
    PERMISSIONS.RECORD_VITALS
  ],
  
  [HOSPITAL_ROLES.NURSE]: [
    PERMISSIONS.VIEW_PATIENT,
    PERMISSIONS.VIEW_MEDICAL_RECORDS,
    PERMISSIONS.VIEW_PRESCRIPTIONS,
    PERMISSIONS.VIEW_LAB_RESULTS,
    PERMISSIONS.VIEW_VITALS,
    PERMISSIONS.RECORD_VITALS
  ],
  
  [HOSPITAL_ROLES.RECEPTIONIST]: [
    PERMISSIONS.REGISTER_PATIENT,
    PERMISSIONS.VIEW_PATIENT,
    PERMISSIONS.EDIT_PATIENT_INFO
  ],
  
  [HOSPITAL_ROLES.LAB_TECH]: [
    PERMISSIONS.VIEW_PATIENT,
    PERMISSIONS.VIEW_LAB_RESULTS,
    PERMISSIONS.ADD_LAB_RESULTS
  ],
  
  [HOSPITAL_ROLES.PHARMACIST]: [
    PERMISSIONS.VIEW_PATIENT,
    PERMISSIONS.VIEW_PRESCRIPTIONS,
    PERMISSIONS.DISPENSE_MEDICATION
  ],
  
  [HOSPITAL_ROLES.RADIOLOGIST]: [
    PERMISSIONS.VIEW_PATIENT,
    PERMISSIONS.VIEW_IMAGING,
    PERMISSIONS.ADD_IMAGING_RESULTS
  ]
};

// Helper function to check if user has permission
export function hasPermission(userRole, permission) {
  return ROLE_PERMISSIONS[userRole]?.includes(permission) || false;
}

// Helper to check multiple permissions (user needs ALL)
export function hasAllPermissions(userRole, permissions) {
  return permissions.every(permission => hasPermission(userRole, permission));
}

// Helper to check multiple permissions (user needs ANY)
export function hasAnyPermission(userRole, permissions) {
  return permissions.some(permission => hasPermission(userRole, permission));
}

// Get readable role name
export function getRoleName(role) {
  const roleNames = {
    [HOSPITAL_ROLES.ADMIN]: 'Administrator',
    [HOSPITAL_ROLES.DOCTOR]: 'Doctor',
    [HOSPITAL_ROLES.NURSE]: 'Nurse',
    [HOSPITAL_ROLES.RECEPTIONIST]: 'Receptionist',
    [HOSPITAL_ROLES.LAB_TECH]: 'Lab Technician',
    [HOSPITAL_ROLES.PHARMACIST]: 'Pharmacist',
    [HOSPITAL_ROLES.RADIOLOGIST]: 'Radiologist'
  };
  return roleNames[role] || role;
}