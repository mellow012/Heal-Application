import { useAuth } from '@clerk/nextjs'
import { StaffManagement } from '../../../components/hospital/staff-management'
import { AddStaffDialog } from '../../../components/hospital/add-staff'

export default async function StaffManagementPage() {
  const { orgId } = useAuth()

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Staff Management
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage your hospital staff, roles, and permissions
          </p>
        </div>
        <AddStaffDialog hospitalId={orgId!} />
      </div>

      <StaffManagement hospitalId={orgId!} />
    </div>
  )
}
