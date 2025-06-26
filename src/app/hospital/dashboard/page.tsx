import { useAuth } from '@clerk/nextjs'
import { HospitalDashboardStats } from '../../components/hospital/dashboard-stats'
import { RecentActivity } from '../../components/hospital/recent-activity'
import { PatientOverview } from '../../components/hospital/patient-overview'
import { StaffOverview } from '../../components/hospital/hospital-staff-overview'

export default async function HospitalDashboard() {
  const { orgId } = useAuth()

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          Hospital Dashboard
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Overview of your hospital's operations and patient care
        </p>
      </div>

      {/* Stats Cards */}
      <HospitalDashboardStats hospitalId={orgId!} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <PatientOverview hospitalId={orgId!} />
        <StaffOverview hospitalId={orgId!} />
      </div>

      {/* Recent Activity */}
      <RecentActivity hospitalId={orgId!} />
    </div>
  )
}