// components/PatientRegistrationForm.jsx

'use client';

import { useState } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/lib/roles';

export default function PatientRegistrationForm({ 
  hospitalId, 
  userId, 
  userRole 
}) {
  const permissions = usePermissions(userRole);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    bloodType: '',
    nationalId: '',
    email: '',
    phone: '',
    address: '',
    emergencyContact: {
      name: '',
      relationship: '',
      phone: ''
    }
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check if user can register patients
  if (!permissions.can(PERMISSIONS.REGISTER_PATIENT)) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded">
        <h3 className="text-lg font-semibold text-red-800 mb-2">
          Access Denied
        </h3>
        <p className="text-red-600">
          You do not have permission to register patients. 
          Please contact your administrator.
        </p>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Get Firebase auth token
      const token = await getUserToken(); // Your auth token function
      
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          hospitalId,
          patientData: {
            personalInfo: {
              firstName: formData.firstName,
              lastName: formData.lastName,
              dateOfBirth: formData.dateOfBirth,
              gender: formData.gender,
              bloodType: formData.bloodType
            },
            contactInfo: {
              email: formData.email,
              phone: formData.phone,
              address: formData.address
            },
            emergencyContact: formData.emergencyContact,
            nationalId: formData.nationalId
          }
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Registration failed');
      }

      alert('Patient registered successfully!');
      // Reset or redirect
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200">
          {error}
        </div>
      )}
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              First Name *
            </label>
            <input
              type="text"
              required
              value={formData.firstName}
              onChange={(e) => setFormData({...formData, firstName: e.target.value})}
              className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              Last Name *
            </label>
            <input
              type="text"
              required
              value={formData.lastName}
              onChange={(e) => setFormData({...formData, lastName: e.target.value})}
              className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              National ID / SSN *
            </label>
            <input
              type="text"
              required
              value={formData.nationalId}
              onChange={(e) => setFormData({...formData, nationalId: e.target.value})}
              className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Date of Birth *
            </label>
            <input
              type="date"
              required
              value={formData.dateOfBirth}
              onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
              className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Gender *
            </label>
            <select
              required
              value={formData.gender}
              onChange={(e) => setFormData({...formData, gender: e.target.value})}
              className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Blood Type
            </label>
            <select
              value={formData.bloodType}
              onChange={(e) => setFormData({...formData, bloodType: e.target.value})}
              className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Blood Type</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Email *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Phone *
            </label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">
              Address
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              rows={3}
              className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Emergency Contact</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Name *
            </label>
            <input
              type="text"
              required
              value={formData.emergencyContact.name}
              onChange={(e) => setFormData({
                ...formData, 
                emergencyContact: {...formData.emergencyContact, name: e.target.value}
              })}
              className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Relationship *
            </label>
            <input
              type="text"
              required
              value={formData.emergencyContact.relationship}
              onChange={(e) => setFormData({
                ...formData, 
                emergencyContact: {...formData.emergencyContact, relationship: e.target.value}
              })}
              className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Phone *
            </label>
            <input
              type="tel"
              required
              value={formData.emergencyContact.phone}
              onChange={(e) => setFormData({
                ...formData, 
                emergencyContact: {...formData.emergencyContact, phone: e.target.value}
              })}
              className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed transition"
      >
        {loading ? 'Registering Patient...' : 'Register Patient'}
      </button>
    </form>
  );
}