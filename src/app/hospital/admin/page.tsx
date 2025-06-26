'use client'
import { useState, useEffect } from 'react'
import { useOrganization } from '@clerk/nextjs'
import { useStaffManagement } from '../../../hooks/useStaffManagement'
import { useHospital } from '../../../hooks/useHospital'

export default function HospitalAdminPage() {
  const { organization, membership } = useOrganization()
  const { hospitalData, updateHospitalProfile, isAdmin } = useHospital()
  const { 
    staff, 
    customRoles, 
    inviteStaffMember, 
    updateStaffRole, 
    removeStaffMember, 
    fetchStaffList 
  } = useStaffManagement()

  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (organization) {
      fetchStaffList()
    }
  }, [organization])

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">Only hospital administrators can access this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Hospital Administration</h1>
          <p className="text-gray-600">{hospitalData?.name}</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', name: 'Overview' },
              { id: 'staff', name: 'Staff Management' },
              { id: 'settings', name: 'Hospital Settings' },
              { id: 'patients', name: 'Patient Access' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && <OverviewTab hospitalData={hospitalData} staff={staff} />}
        {activeTab === 'staff' && (
          <StaffManagementTab
            staff={staff}
            customRoles={customRoles}
            onInviteStaff={inviteStaffMember}
            onUpdateRole={updateStaffRole}
            onRemoveStaff={removeStaffMember}
            loading={loading}
            setLoading={setLoading}
          />
        )}
        {activeTab === 'settings' && (
          <HospitalSettingsTab
            hospitalData={hospitalData}
            onUpdateProfile={updateHospitalProfile}
            loading={loading}
            setLoading={setLoading}
          />
        )}
        {activeTab === 'patients' && <PatientAccessTab />}
      </div>
    </div>
  )
}

// ================================
// 3. TAB COMPONENTS
// ================================

function OverviewTab({ hospitalData, staff }) {
  return (
    <div className="space-y-6">
      {/* Hospital Info Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Hospital Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Address</p>
            <p className="font-medium">{hospitalData?.address}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Phone</p>
            <p className="font-medium">{hospitalData?.phone}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Email</p>
            <p className="font-medium">{hospitalData?.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">License</p>
            <p className="font-medium">{hospitalData?.license}</p>
          </div>
        </div>
        {hospitalData?.specialties && (
          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-2">Specialties</p>
            <div className="flex flex-wrap gap-2">
              {hospitalData.specialties.map((specialty) => (
                <span
                  key={specialty}
                  className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-sm"
                >
                  {specialty}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Staff Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Staff Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {getRoleStats(staff).map((stat) => (
            <div key={stat.role} className="text-center">
              <div className="text-2xl font-bold text-indigo-600">{stat.count}</div>
              <div className="text-sm text-gray-600 capitalize">{stat.role}s</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StaffManagementTab({ 
  staff, 
  customRoles, 
  onInviteStaff, 
  onUpdateRole, 
  onRemoveStaff, 
  loading, 
  setLoading 
}) {
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [inviteData, setInviteData] = useState({ email: '', role: 'doctor' })

  const handleInviteSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onInviteStaff(inviteData.email, inviteData.role)
      setInviteData({ email: '', role: 'doctor' })
      setShowInviteForm(false)
      alert('Staff member invited successfully!')
    } catch (error) {
      alert('Error inviting staff member: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRoleUpdate = async (userId, newRole) => {
    if (confirm('Are you sure you want to update this staff member\'s role?')) {
      setLoading(true)
      try {
        await onUpdateRole(userId, newRole)
        alert('Role updated successfully!')
      } catch (error) {
        alert('Error updating role: ' + error.message)
      } finally {
        setLoading(false)
      }
    }
  }

  const handleRemoveStaff = async (userId) => {
    if (confirm('Are you sure you want to remove this staff member?')) {
      setLoading(true)
      try {
        await onRemoveStaff(userId)
        alert('Staff member removed successfully!')
      } catch (error) {
        alert('Error removing staff member: ' + error.message)
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Invite Staff Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Staff Members</h3>
          <button
            onClick={() => setShowInviteForm(!showInviteForm)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Invite Staff Member
          </button>
        </div>

        {showInviteForm && (
          <form onSubmit={handleInviteSubmit} className="mb-6 p-4 border rounded-lg bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  required
                  value={inviteData.email}
                  onChange={(e) => setInviteData(prev => ({ ...prev, email: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <select
                  value={inviteData.role}
                  onChange={(e) => setInviteData(prev => ({ ...prev, role: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  {customRoles.filter(role => role !== 'admin').map(role => (
                    <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4 flex space-x-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Invitation'}
              </button>
              <button
                type="button"
                onClick={() => setShowInviteForm(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Staff List */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {staff.map((member) => (
                <tr key={member.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img
                        className="h-10 w-10 rounded-full"
                        src={member.publicUserData?.imageUrl || '/default-avatar.png'}
                        alt=""
                      />
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {member.publicUserData?.firstName} {member.publicUserData?.lastName}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {member.publicUserData?.identifier}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleUpdate(member.userId, e.target.value)}
                      className="text-sm border-gray-300 rounded-md focus:border-indigo-500 focus:ring-indigo-500"
                      disabled={loading}
                    >
                      {customRoles.map(role => (
                        <option key={role} value={role}>
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Active
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleRemoveStaff(member.userId)}
                      className="text-red-600 hover:text-red-900"
                      disabled={loading}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function HospitalSettingsTab({ hospitalData, onUpdateProfile, loading, setLoading }) {
  const [formData, setFormData] = useState({
    name: hospitalData?.name || '',
    address: hospitalData?.address || '',
    phone: hospitalData?.phone || '',
    email: hospitalData?.email || '',
    license: hospitalData?.license || '',
    specialties: hospitalData?.specialties || []
  })

  const specialtyOptions = [
    'Cardiology', 'Emergency Medicine', 'General Surgery', 'Internal Medicine',
    'Orthopedics', 'Pediatrics', 'Radiology', 'Oncology', 'Neurology',
    'Dermatology', 'Psychiatry', 'Anesthesiology', 'Pathology'
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onUpdateProfile(formData)
      alert('Hospital profile updated successfully!')
    } catch (error) {
      alert('Error updating profile: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-6">Hospital Settings</h3>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Hospital Name</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Address</label>
          <textarea
            required
            value={formData.address}
            onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            rows="3"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Medical License Number</label>
          <input
            type="text"
            required
            value={formData.license}
            onChange={(e) => setFormData(prev => ({ ...prev, license: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Specialties</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {specialtyOptions.map(specialty => (
              <label key={specialty} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.specialties.includes(specialty)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData(prev => ({
                        ...prev,
                        specialties: [...prev.specialties, specialty]
                      }))
                    } else {
                      setFormData(prev => ({
                        ...prev,
                        specialties: prev.specialties.filter(s => s !== specialty)
                      }))
                    }
                  }}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-700">{specialty}</span>
              </label>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full md:w-auto flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {loading ? 'Updating...' : 'Update Hospital Profile'}
        </button>
      </form>
    </div>
  )
}

function PatientAccessTab() {
  const { patientRequests, authorizedPatients, fetchPendingRequests, fetchAuthorizedPatients } = usePatientAccess()
  const [activeSubTab, setActiveSubTab] = useState('authorized')

  useEffect(() => {
    fetchPendingRequests()
    fetchAuthorizedPatients()
  }, [])

  return (
    <div className="space-y-6">
      {/* Sub-tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'authorized', name: 'Authorized Patients' },
            { id: 'requests', name: 'Pending Requests' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`${
                activeSubTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {activeSubTab === 'authorized' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Authorized Patients</h3>
          {authorizedPatients.length === 0 ? (
            <p className="text-gray-500">No authorized patients yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Permissions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Granted Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {authorizedPatients.map((patient) => (
                    <tr key={patient.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {patient.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-1">
                          {patient.permissions?.map(permission => (
                            <span
                              key={permission}
                              className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full"
                            >
                              {permission}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {patient.grantedAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-indigo-600 hover:text-indigo-900 mr-3">
                          View Records
                        </button>
                        <button className="text-red-600 hover:text-red-900">
                          Revoke Access
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'requests' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Pending Access Requests</h3>
          {patientRequests.length === 0 ? (
            <p className="text-gray-500">No pending requests.</p>
          ) : (
            <div className="space-y-4">
              {patientRequests.map((request) => (
                <div key={request.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">Patient ID: {request.patientId}</p>
                      <p className="text-sm text-gray-600">
                        Requested by: {request.requestedByName} ({request.requestedByRole})
                      </p>
                      <p className="text-sm text-gray-600">
                        Permissions: {request.permissions?.join(', ')}
                      </p>
                      {request.reason && (
                        <p className="text-sm text-gray-600 mt-2">
                          Reason: {request.reason}
                        </p>
                      )}
                    </div>
                    <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                      Pending
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ================================
// 4. UTILITY FUNCTIONS
// ================================

function getRoleStats(staff) {
  const roleCount = {}
  staff.forEach(member => {
    roleCount[member.role] = (roleCount[member.role] || 0) + 1
  })
  
  return Object.entries(roleCount).map(([role, count]) => ({
    role,
    count
  }))
}
