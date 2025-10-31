'use client'

import { useEffect, useState } from 'react'
import { Eye, Edit, MoreHorizontal } from 'lucide-react'
import { getRecentPatients } from '../../../lib/patient'

interface Patient {
  id: string
  name: string
  email: string
  status: 'dormant' | 'medical'
  lastVisit: Date
  condition?: string
}

export function PatientOverview({ hospitalId }: { hospitalId: string }) {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const recentPatients = await getRecentPatients(hospitalId, 5)
        setPatients(recentPatients)
      } catch (error) {
        console.error('Error fetching recent patients:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPatients()
  }, [hospitalId])

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recent Patients
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
          Recent Patients
        </h3>
        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
          View All
        </button>
      </div>

      <div className="space-y-4">
        {patients.map((patient) => (
          <div
            key={patient.id}
            className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-300 font-medium">
                  {patient.name.charAt(0)}
                </span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {patient.name}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {patient.email}
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    patient.status === 'medical'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                  }`}>
                    {patient.status === 'medical' ? 'Medical User' : 'Dormant User'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <Eye className="h-4 w-4" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <Edit className="h-4 w-4" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
