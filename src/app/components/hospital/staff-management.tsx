use client'

import { useEffect, useState } from 'react'
import { 
  Users, 
  Crown, 
  UserCheck, 
  User, 
  MoreHorizontal, 
  Edit, 
  Trash2,
  Shield,
  Mail
} from 'lucide-react'
import { getHospitalStaff, updateStaffMember, deactivateStaffMember } from '@/lib/firebase/hospital'
import type { StaffMember } from '@/lib/types/hospital'
import { formatDate } from '@/lib/utils'
import { EditStaffDialog } from './edit-staff-dialog'

export function StaffManagement({ hospitalId }: { hospitalId: string }) {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null)
  const [showActions, setShowActions] = useState<string | null>(null)

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const hospitalStaff = await getHospitalStaff(hospitalId)
        setStaff(hospitalStaff)
      } catch (error) {
        console.error('Error fetching hospital staff:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStaff()
  }, [hospitalId])

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return Crown
      case 'doctor':
        return UserCheck
      default:
        return User
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
      case 'doctor':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'nurse':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  const handleDeactivateStaff = async (staffId: string) => {
    if (!confirm('Are you sure you want to deactivate this staff member?')) {
      return
    }

    try {
      await deactivateStaffMember(hospitalId, staffId)
      setStaff(staff.filter(member => member.id !== staffId))
      setShowActions(null)
    } catch (error) {
      console.error('Error deactivating staff member:', error)
      alert('Failed to deactivate staff member. Please try again.')
    }
  }

  const refreshStaff = async () => {
    try {
      const hospitalStaff = await getHospitalStaff(hospitalId)
      setStaff(hospitalStaff)
    } catch (error) {
      console.error('Error refreshing staff:', error)
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Staff Members ({staff.length})
            </h3>
          </div>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {staff.map((member) => {
            const RoleIcon = getRoleIcon(member.role)
            return (
              <div key={member.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-600 rounded-full flex items-center justify-center">
                      <RoleIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                    </div>
                    
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                        {member.name}
                      </h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {member.email}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3 mt-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(member.role)}`}>
                          {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Joined {formatDate(member.joinedAt)}
                        </span>
                        {member.isActive && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                            Active
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button 
                      className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
                      title="Manage Permissions"
                    >
                      <Shield className="h-4 w-4" />
                    </button>
                    
                    <div className="relative">
                      <button
                        onClick={() => setShowActions(showActions === member.id ? null : member.id)}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                      
                      {showActions === member.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                          <div className="py-1">
                            <button
                              onClick={() => {
                                setSelectedStaff(member)
                                setShowActions(null)
                              }}
                              className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 w-full text-left"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Details
                            </button>
                            <button
                              onClick={() => handleDeactivateStaff(member.id)}
                              className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 w-full text-left"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Deactivate
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {staff.length === 0 && (
          <div className="p-12 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No staff members yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Add your first staff member to get started with your hospital management.
            </p>
          </div>
        )}
      </div>

      {/* Edit Staff Dialog */}
      {selectedStaff && (
        <EditStaffDialog
          staff={selectedStaff}
          hospitalId={hospitalId}
          onClose={() => setSelectedStaff(null)}
          onUpdate={refreshStaff}
        />
      )}
    </>
  )
}