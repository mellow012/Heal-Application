'use client';
import { useState, useEffect } from 'react';


interface Patient {
  id: string;
  patientId: string;
  nationalId: string;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  email?: string;
  status: string;
  registeredAt: string;
  lastVisitDate?: string;
  totalVisits: number;
  city: string;
}

interface PatientManagementProps {
  user: any;
  hospitalId: string;
  userRole: string; // Add user role for permissions
}

export default function PatientManagement({ user, hospitalId, userRole }: PatientManagementProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showRecordVisitModal, setShowRecordVisitModal] = useState(false);
  
  // States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Search results
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [searchPhone, setSearchPhone] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Patient Form State
  const [patientForm, setPatientForm] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'male' as 'male' | 'female' | 'other',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: 'Malawi',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: '',
    bloodGroup: '',
    registeredAtHospitalId: hospitalId,
  });

  // Visit Form State
  const [visitForm, setVisitForm] = useState({
    visitType: 'consultation' as 'consultation' | 'emergency' | 'followup' | 'checkup' | 'surgery' | 'other',
    chiefComplaint: '',
    notes: '',
  });

  // Check if user can register patients
  const canRegisterPatients = ['receptionist', 'hospital_admin', 'super_admin'].includes(userRole);

  // Fetch patients
  const fetchPatients = async () => {
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/hospital/${hospitalId}/patients`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPatients(data.patients || []);
        setFilteredPatients(data.patients || []);
      }
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching patients:', err);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && hospitalId) {
      fetchPatients();
    }
  }, [user, hospitalId]);

  // Filter patients
  useEffect(() => {
    let filtered = patients;

    if (searchQuery) {
      filtered = filtered.filter(p =>
        p.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.patientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.phone.includes(searchQuery)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    setFilteredPatients(filtered);
  }, [searchQuery, statusFilter, patients]);

  // Search existing patients
  const handleSearchPatients = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchPhone.trim()) return;

    setIsSearching(true);
    setSearchResults([]);
    setError('');

    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/patients/search?phone=${searchPhone.trim()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSearchResults(result.patients || []);
        if (result.patients.length === 0) {
          setError('No patient found with this phone number. You can register a new patient.');
        }
      } else {
        setError(result.error || 'Search failed');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to search patients');
    } finally {
      setIsSearching(false);
    }
  };

  // Record visit for existing patient
  const handleRecordVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/visits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          patientId: selectedPatient.id,
          hospitalId,
          ...visitForm,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccess('Visit recorded successfully!');
        await fetchPatients(); // Refresh list
        
        setTimeout(() => {
          setShowRecordVisitModal(false);
          setSelectedPatient(null);
          setSuccess('');
          setVisitForm({
            visitType: 'consultation',
            chiefComplaint: '',
            notes: '',
          });
        }, 2000);
      } else {
        setError(result.error || 'Failed to record visit');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to record visit');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add new patient
  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(patientForm),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccess(result.message);
        setPatientForm({
          firstName: '',
          lastName: '',
          dateOfBirth: '',
          gender: 'male',
          email: '',
          phone: '',
          address: '',
          city: '',
          country: 'Malawi',
          emergencyContactName: '',
          emergencyContactPhone: '',
          emergencyContactRelation: '',
          bloodGroup: '',
          registeredAtHospitalId: hospitalId,
        });
        
        await fetchPatients();
        
        setTimeout(() => {
          setShowAddModal(false);
          setSuccess('');
        }, 2000);
      } else {
        setError(result.error || 'Failed to add patient');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to add patient');
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Patients</h2>
            <p className="text-sm text-gray-600 mt-1">Manage patient records and visits</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowSearchModal(true)}
              className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search Patient
            </button>
            {canRegisterPatients && (
              <button
                onClick={() => setShowAddModal(true)}
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Register Patient
              </button>
            )}
          </div>
        </div>

        {!canRegisterPatients && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Only receptionists and administrators can register new patients. You can search for existing patients and record visits.
            </p>
          </div>
        )}

        {/* Search and Filter */}
        <div className="mt-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, ID, or phone..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Patients List */}
      {filteredPatients.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery || statusFilter !== 'all' ? 'No patients found' : 'No patients yet'}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchQuery || statusFilter !== 'all' 
              ? 'Try adjusting your search or filter' 
              : 'Search for existing patients or register new ones'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age/Gender</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visits</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPatients.map((patient) => (
                <tr key={patient.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold">
                          {patient.fullName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{patient.fullName}</div>
                        <div className="text-sm text-gray-500">{patient.city}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-mono text-gray-900">{patient.patientId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{calculateAge(patient.dateOfBirth)} years</div>
                    <div className="text-sm text-gray-500 capitalize">{patient.gender}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{patient.phone}</div>
                    {patient.email && <div className="text-sm text-gray-500">{patient.email}</div>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{patient.totalVisits || 0}</div>
                    {patient.lastVisitDate && (
                      <div className="text-sm text-gray-500">Last: {new Date(patient.lastVisitDate).toLocaleDateString()}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      patient.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {patient.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 mr-4">View</button>
                    <button 
                      onClick={() => {
                        setSelectedPatient(patient);
                        setShowRecordVisitModal(true);
                      }}
                      className="text-green-600 hover:text-green-900"
                    >
                      Record Visit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Search Patient Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-gray-900">Search for Existing Patient</h3>
                <button
                  onClick={() => {
                    setShowSearchModal(false);
                    setSearchResults([]);
                    setSearchPhone('');
                    setError('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleSearchPatients} className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Patient Phone Number
                </label>
                <div className="flex gap-3">
                  <input
                    type="tel"
                    value={searchPhone}
                    onChange={(e) => setSearchPhone(e.target.value)}
                    placeholder="+265 123 456 789"
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <button
                    type="submit"
                    disabled={isSearching}
                    className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {isSearching ? 'Searching...' : 'Search'}
                  </button>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 text-sm">{error}</p>
                </div>
              )}

              {searchResults.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">Found {searchResults.length} patient(s):</h4>
                  {searchResults.map((patient) => (
                    <div key={patient.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">{patient.fullName}</p>
                          <p className="text-sm text-gray-600">ID: {patient.patientId}</p>
                          <p className="text-sm text-gray-600">Phone: {patient.phone}</p>
                          <p className="text-sm text-gray-600">Age: {calculateAge(patient.dateOfBirth)} • {patient.gender}</p>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedPatient(patient);
                            setShowSearchModal(false);
                            setShowRecordVisitModal(true);
                          }}
                          className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition"
                        >
                          Record Visit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Record Visit Modal */}
      {showRecordVisitModal && selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Record Visit</h3>
                  <p className="text-sm text-gray-600 mt-1">Patient: {selectedPatient.fullName} ({selectedPatient.patientId})</p>
                </div>
                <button
                  onClick={() => {
                    setShowRecordVisitModal(false);
                    setSelectedPatient(null);
                    setError('');
                    setSuccess('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleRecordVisit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Visit Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={visitForm.visitType}
                    onChange={(e) => setVisitForm({ ...visitForm, visitType: e.target.value as any })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="consultation">Consultation</option>
                    <option value="emergency">Emergency</option>
                    <option value="followup">Follow-up</option>
                    <option value="checkup">Check-up</option>
                    <option value="surgery">Surgery</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chief Complaint
                  </label>
                  <input
                    type="text"
                    value={visitForm.chiefComplaint}
                    onChange={(e) => setVisitForm({ ...visitForm, chiefComplaint: e.target.value })}
                    placeholder="e.g., Fever, headache"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={visitForm.notes}
                    onChange={(e) => setVisitForm({ ...visitForm, notes: e.target.value })}
                    placeholder="Additional notes..."
                    rows={3}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
              </div>

              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {success && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-600 text-sm">{success}</p>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowRecordVisitModal(false);
                    setSelectedPatient(null);
                  }}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 font-medium"
                >
                  {isSubmitting ? 'Recording...' : 'Record Visit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Patient Modal - Same as before but only shown if canRegisterPatients */}
      {showAddModal && canRegisterPatients && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full my-8">
            {/* ... (Keep existing Add Patient modal code) ... */}
            <div className="p-6">
              <p className="text-gray-600">Add Patient Form (Use previous artifact code)</p>
              <button
                onClick={() => setShowAddModal(false)}
                className="mt-4 px-4 py-2 bg-gray-500 text-white rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}