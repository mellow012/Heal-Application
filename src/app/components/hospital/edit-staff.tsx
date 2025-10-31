'use client'

import { useState } from 'react'
import { X, Mail, User, Shield, CheckCircle } from 'lucide-react'
import { updateStaffMember } from '@/lib/firebase/hospital'
import type { StaffMember } from '@/lib/types/hospital'

const ROLES = [
  { value: 'admin', label: 'Administrator', description: 'Full system access and management' },
  { value: 'doctor', label: 'Doctor', description: 'Medical records and patient management' },
  { value: 'nurse', label: 'Nurse', description: 'Patient care and basic record access' },
  { value: 'receptionist', label: 'Receptionist', description: 'Appointments and basic patient info' }
]

const ROLE_PERMISSIONS = {
  admin: ['read_all', 'write_all', 'manage_staff', 'manage_hospital'],
  doctor: ['read_medical', 'write_medical', 'prescribe', 'diagnose'],
  nurse: ['read_basic', 'write_basic', 'update_vitals'],
  receptionist: ['read_basic', 'schedule_appointments', 'update_contact']
}

interface EditStaffDialogProps {
  staff: StaffMember
  hospitalId: string
  onClose: () => void
  onUpdate: () => void
}

export function EditStaffDialog({ staff, hospitalId, onClose, onUpdate }: EditStaffDialogProps) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: staff.name,
    email: staff.email,
    role: staff.role as 'admin' | 'doctor' | 'nurse' | 'receptionist'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Validate form data
      if (!formData.name.trim()) {
        throw new Error('Name is required')
      }
      if (!formData.email.trim()) {
        throw new Error('Email is required')
      }
      if (!/\S+@\S+\.\S+/.test(formData.email)) {
        throw new Error('Please enter a valid email address')
      }

      await updateStaffMember(hospitalId, staff.id, {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        role: formData.role,
        permissions: ROLE_PERMISSIONS[formData.role]
      })
      
      setSuccess(true)
      
      // Close dialog after 1.5 seconds and refresh
      setTimeout(() => {
        onUpdate()
        onClose()
      }, 1500)
      
    } catch (error) {
      console.error('Error updating staff member:', error)
      setError(error instanceof Error ? error.message : 'Failed to update staff member. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Edit Staff Member
            </h3>
            <button
              onClick={handleClose}
              disabled={loading}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {success ? (
          <div className="p-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Staff Member Updated Successfully!
            </h4>
            <p className="text-gray-600 dark:text-gray-400">
              Changes have been saved and applied.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <User className="h-4 w-4 inline mr-1" />
                Full Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Enter full name"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Mail className="h-4 w-4 inline mr-1" />
                Email Address
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Enter email address"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Shield className="h-4 w-4 inline mr-1" />
                Role
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                disabled={loading}
              >
                {ROLES.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {ROLES.find(role => role.value === formData.role)?.description}
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Role Permissions:
              </h4>
              <div className="space-y-1">
                {ROLE_PERMISSIONS[formData.role].map((permission) => (
                  <div key={permission} className="text-xs text-gray-600 dark:text-gray-400">
                    • {permission.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Updating...' : 'Update Staff Member'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}