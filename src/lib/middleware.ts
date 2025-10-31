// lib/permissions.js (Server-side)

import { db } from '@/lib/firebase-admin';
import { ROLE_PERMISSIONS, PERMISSIONS } from './roles';

/**
 * Check if user has permission (server-side)
 */
export async function checkPermission(userId, hospitalId, requiredPermission) {
  try {
    // Get user's staff record
    const staffDoc = await db.collection('hospitalStaff').doc(userId).get();
    
    if (!staffDoc.exists) {
      return { authorized: false, error: 'User not found' };
    }
    
    const staffData = staffDoc.data();
    
    // Check if user belongs to the hospital
    if (staffData.hospitalId !== hospitalId) {
      return { authorized: false, error: 'User does not belong to this hospital' };
    }
    
    // Check verification status
    if (staffData.verificationStatus !== 'verified') {
      return { authorized: false, error: 'User account not verified' };
    }
    
    // Check custom permissions first
    if (staffData.customPermissions?.includes(requiredPermission)) {
      return { authorized: true, role: staffData.role };
    }
    
    // Check role-based permissions
    const rolePermissions = ROLE_PERMISSIONS[staffData.role] || [];
    const hasPermission = rolePermissions.includes(requiredPermission);
    
    if (!hasPermission) {
      return { 
        authorized: false, 
        error: `Insufficient permissions. Required: ${requiredPermission}` 
      };
    }
    
    return { authorized: true, role: staffData.role };
    
  } catch (error) {
    console.error('Permission check error:', error);
    return { authorized: false, error: 'Permission check failed' };
  }
}

/**
 * Middleware for API routes
 */
export function requirePermission(permission) {
  return async (req, userId, hospitalId) => {
    const permissionCheck = await checkPermission(userId, hospitalId, permission);
    
    if (!permissionCheck.authorized) {
      throw new Error(permissionCheck.error);
    }
    
    return permissionCheck;
  };
}