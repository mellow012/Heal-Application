'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { CreateOrganization } from '@clerk/nextjs'

export default function OnboardingPage() {
  const { user } = useUser()
  const router = useRouter()
  const [step, setStep] = useState(1)

  if (!user) return <div>Loading...</div>

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to HealthCare Platform
          </h1>
          <p className="text-gray-600">
            Let's set up your hospital organization
          </p>
        </div>

        {step === 1 && (
          <div>
            <h2 className="text-xl font-semibold mb-6">Create Your Hospital Organization</h2>
            <CreateOrganization 
              afterCreateOrganizationUrl="/onboarding?step=2"
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "shadow-none border-0"
                }
              }}
            />
          </div>
        )}

        {step === 2 && (
          <HospitalProfileSetup 
            onComplete={() => router.push('/dashboard')}
          />
        )}
      </div>
    </div>
  )
}

function HospitalProfileSetup({ onComplete }) {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    license: '',
    specialties: []
  })
  const { createHospitalProfile } = useHospital()
  const [loading, setLoading] = useState(false)

  const specialtyOptions = [
    'Cardiology', 'Emergency Medicine', 'General Surgery', 'Internal Medicine',
    'Orthopedics', 'Pediatrics', 'Radiology', 'Oncology', 'Neurology'
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      await createHospitalProfile(formData)
      onComplete()
    } catch (error) {
      console.error('Error creating hospital profile:', error)
      alert('Error creating hospital profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-xl font-semibold mb-6">Hospital Information</h2>
      
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

      <div className="grid grid-cols-2 gap-4">
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
        <div className="grid grid-cols-3 gap-2">
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
        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
      >
        {loading ? 'Creating...' : 'Complete Setup'}
      </button>
    </form>
  )
}