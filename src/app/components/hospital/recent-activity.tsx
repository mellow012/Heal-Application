'use client'

import { useEffect, useState } from 'react'
import { Activity, User, FileText, UserCheck, Calendar } from 'lucide-react'
import { getRecentActivity } from '../../../lib/hospital'

interface ActivityItem {
  id: string
  type: 'patient_verified' | 'record_created' | 'appointment_scheduled' | 'staff_added'
  description: string
  timestamp: Date
  staffName: string
  patientName?: string
}

export function RecentActivity({ hospitalId }: { hospitalId: string }) {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const recentActivity = await getRecentActivity(hospitalId, 10)
        setActivities(recentActivity)
      } catch (error) {
        console.error('Error fetching recent activity:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchActivity()
  }, [hospitalId])

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'patient_verified':
        return UserCheck
      case 'record_created':
        return FileText
      case 'appointment_scheduled':
        return Calendar
      case 'staff_added':
        return User
      default:
        return Activity
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'patient_verified':
        return 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
      case 'record_created':
        return 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
      case 'appointment_scheduled':
        return 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400'
      case 'staff_added':
        return 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400'
      default:
        return 'bg-gray-100 text-gray-600 dark:bg-gray-900 dark:text-gray-400'
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recent Activity
        </h3>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse flex items-center space-x-4">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
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
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Recent Activity
      </h3>

      <div className="space-y-4">
        {activities.map((activity) => {
          const ActivityIcon = getActivityIcon(activity.type)
          return (
            <div key={activity.id} className="flex items-start space-x-4">
              <div className={`p-2 rounded-full ${getActivityColor(activity.type)}`}>
                <ActivityIcon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 dark:text-white">
                  {activity.description}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {activity.staffName} • {activity.timestamp.toLocaleString()}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}