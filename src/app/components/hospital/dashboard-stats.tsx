'use client'

import { useEffect, useState } from 'react'
import { Users, UserCheck, Calendar, Activity } from 'lucide-react'
import { getHospitalStats } from '../../../lib/hospital'

interface StatsData {
  totalPatients: number
  activeStaff: number
  todayAppointments: number
  pendingVerifications: number
}

export function HospitalDashboardStats({ hospitalId }: { hospitalId: string }) {
  const [stats, setStats] = useState<StatsData>({
    totalPatients: 0,
    activeStaff: 0,
    todayAppointments: 0,
    pendingVerifications: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const hospitalStats = await getHospitalStats(hospitalId)
        setStats(hospitalStats)
      } catch (error) {
        console.error('Error fetching hospital stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [hospitalId])

  const statCards = [
    {
      title: 'Total Patients',
      value: stats.totalPatients,
      icon: Users,
      color: 'bg-blue-500',
      change: '+12%',
      changeType: 'positive' as const
    },
    {
      title: 'Active Staff',
      value: stats.activeStaff,
      icon: UserCheck,
      color: 'bg-green-500',
      change: '+2',
      changeType: 'positive' as const
    },
    {
      title: 'Today\'s Appointments',
      value: stats.todayAppointments,
      icon: Calendar,
      color: 'bg-purple-500',
      change: '-3%',
      changeType: 'negative' as const
    },
    {
      title: 'Pending Verifications',
      value: stats.pendingVerifications,
      icon: Activity,
      color: 'bg-orange-500',
      change: '+5',
      changeType: 'neutral' as const
    }
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat) => (
        <div
          key={stat.title}
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {stat.title}
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {stat.value.toLocaleString()}
              </p>
              <p className={`text-sm ${
                stat.changeType === 'positive' 
                  ? 'text-green-600' 
                  : stat.changeType === 'negative' 
                  ? 'text-red-600' 
                  : 'text-gray-600'
              }`}>
                {stat.change} from last month
              </p>
            </div>
            <div className={`p-3 rounded-full ${stat.color}`}>
              <stat.icon className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
