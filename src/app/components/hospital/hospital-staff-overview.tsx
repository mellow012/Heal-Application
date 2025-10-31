'use client'

import { useEffect, useState } from 'react'
import { Crown, UserCheck, User, MoreHorizontal } from 'lucide-react'
import { getHospitalStaff } from '../../../lib/hospital'

interface StaffMember {
  id: string
  name: string
  email: string
  role: 'admin' | 'doctor' | 'nurse' | 'receptionist'
  isActive: boolean
  joinedAt: Date
}

export function StaffOverview({ hospitalId }: { hospitalId: string }) {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const hospitalStaff = await getHospitalStaff(hospitalId, 5)
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

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Staff Overview
        </h3>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse flex items-center space-x-4">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Staff Overview
        </h3>
        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
          Manage Staff
        </button>
      </div>

      <div className="space-y-4">
        {staff.map((member) => {
          const RoleIcon = getRoleIcon(member.role)
          return (
            <div
              key={member.id}
              className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <RoleIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {member.name}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {member.email}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(member.role)}`}>
                      {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                    </span>
                    {member.isActive && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                        Active
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
