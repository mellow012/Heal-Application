'use client';

import { useAuth } from '@clerk/nextjs';
import { db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc,
  serverTimestamp 
} from 'firebase/firestore';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  Loader2, 
  Siren, 
  Phone, 
  Mail, 
  Trash2, 
  Plus, 
  ArrowLeft,
  AlertTriangle,
  MapPin,
  Clock
} from 'lucide-react';
import Link from 'next/link';

// Constants
const MALAWI_EMERGENCY_NUMBERS = [
  { 
    id: 'ambulance',
    name: 'Ambulance', 
    phone: '998', 
    email: '',
    description: '24/7 Emergency Medical Services'
  },
  { 
    id: 'police',
    name: 'Police', 
    phone: '997', 
    email: '',
    description: 'Law Enforcement Emergency'
  },
  { 
    id: 'fire',
    name: 'Fire Brigade', 
    phone: '999', 
    email: '',
    description: 'Fire and Rescue Services'
  },
  { 
    id: 'qech',
    name: 'Queen Elizabeth Central Hospital', 
    phone: '+265 1 874 333', 
    email: 'qech@health.gov.mw',
    description: 'Major Referral Hospital'
  }
];

// Custom hooks
const useEmergencyContacts = (userId, isLoaded) => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isLoaded || !userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const contactsRef = collection(db, `e-passports/${userId}/emergency-contacts`);
    
    const unsubscribe = onSnapshot(
      contactsRef,
      (snapshot) => {
        try {
          const contactsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.() || new Date()
          }));
          
          // Sort by creation date (newest first)
          contactsData.sort((a, b) => b.createdAt - a.createdAt);
          
          setContacts(contactsData);
          setError(null);
        } catch (err) {
          console.error('Error processing contacts:', err);
          setError('Failed to process contacts data');
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error('Error fetching contacts:', err);
        setError(`Failed to load contacts: ${err.message}`);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId, isLoaded]);

  return { contacts, loading, error };
};

const useHealthcareProviders = () => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const providersRef = collection(db, 'healthcare_providers');
    const providersQuery = query(providersRef);

    const unsubscribe = onSnapshot(
      providersQuery,
      (snapshot) => {
        try {
          const providersData = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(provider => provider.type === 'hospital' || provider.type === 'clinic');
          
          setProviders(providersData);
          setError(null);
        } catch (err) {
          console.error('Error processing providers:', err);
          setError('Failed to process providers data');
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error('Error fetching providers:', err);
        setError(`Failed to load healthcare providers: ${err.message}`);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { providers, loading, error };
};

// Components
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
    <div className="text-center">
      <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
      <p className="text-slate-600">Loading emergency services...</p>
    </div>
  </div>
);

const SignInPrompt = () => (
  <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center">
    <div className="bg-white rounded-2xl p-8 shadow-xl text-center max-w-md mx-4">
      <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
      <h1 className="text-2xl font-bold text-slate-800 mb-4">Authentication Required</h1>
      <p className="text-slate-600 mb-6">Please sign in to access your emergency contacts and services.</p>
      <Link 
        href="/sign-in" 
        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 inline-block"
      >
        Sign In
      </Link>
    </div>
  </div>
);

const ErrorAlert = ({ error, onDismiss }) => (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
    <div className="flex items-center gap-3">
      <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-red-800 font-medium">Error</p>
        <p className="text-red-700 text-sm">{error}</p>
      </div>
      {onDismiss && (
        <button 
          onClick={onDismiss}
          className="text-red-500 hover:text-red-700"
          aria-label="Dismiss error"
        >
          ×
        </button>
      )}
    </div>
  </div>
);

const ContactCard = ({ contact, onDelete, isEmergency = false }) => (
  <div className={`p-4 rounded-lg flex justify-between items-center transition-all duration-200 ${
    isEmergency 
      ? 'bg-red-50 border border-red-200 hover:bg-red-100' 
      : 'bg-blue-50 border border-blue-200 hover:bg-blue-100'
  }`}>
    <div className="flex-1">
      <h3 className="font-semibold text-slate-800 mb-1">{contact.name}</h3>
      {contact.description && (
        <p className="text-sm text-slate-600 mb-2">{contact.description}</p>
      )}
      
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-slate-500" />
          <a 
            href={`tel:${contact.phone}`}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            {contact.phone}
          </a>
        </div>
        
        {contact.email && (
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-slate-500" />
            <a 
              href={`mailto:${contact.email}`}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {contact.email}
            </a>
          </div>
        )}
        
        {contact.address && (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-slate-500" />
            <span className="text-sm text-slate-600">{contact.address}</span>
          </div>
        )}
        
        {contact.createdAt && !isEmergency && (
          <div className="flex items-center gap-2 mt-2">
            <Clock className="h-3 w-3 text-slate-400" />
            <span className="text-xs text-slate-500">
              Added {contact.createdAt.toLocaleDateString()}
            </span>
          </div>
        )}
      </div>
    </div>
    
    {onDelete && (
      <button
        onClick={() => onDelete(contact.id)}
        className="p-2 hover:bg-red-100 rounded-full transition-colors duration-200 ml-4"
        title="Delete contact"
        aria-label={`Delete ${contact.name}`}
      >
        <Trash2 className="h-5 w-5 text-red-600" />
      </button>
    )}
  </div>
);

const ContactForm = ({ onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: ''
  });
  const [errors, setErrors] = useState({});

  const validateForm = useCallback(() => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[\+]?[\d\s\-\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
      setFormData({ name: '', phone: '', email: '' });
      setErrors({});
    }
  }, [formData, validateForm, onSubmit]);

  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <input
            type="text"
            placeholder="Contact name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className={`w-full p-3 border rounded-lg transition-colors duration-200 ${
              errors.name ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-blue-500'
            } focus:outline-none focus:ring-2 focus:ring-blue-200`}
            disabled={loading}
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
        </div>
        
        <div>
          <input
            type="tel"
            placeholder="Phone (e.g., +265 9XX XXX XXX)"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            className={`w-full p-3 border rounded-lg transition-colors duration-200 ${
              errors.phone ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-blue-500'
            } focus:outline-none focus:ring-2 focus:ring-blue-200`}
            disabled={loading}
          />
          {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
        </div>
        
        <div>
          <input
            type="email"
            placeholder="Email (optional)"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className={`w-full p-3 border rounded-lg transition-colors duration-200 ${
              errors.email ? 'border-red-300 focus:border-red-500' : 'border-slate-300 focus:border-blue-500'
            } focus:outline-none focus:ring-2 focus:ring-blue-200`}
            disabled={loading}
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
        </div>
      </div>
      
      <button
        type="submit"
        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors duration-200"
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Plus className="h-5 w-5" />
        )}
        {loading ? 'Adding...' : 'Add Contact'}
      </button>
    </form>
  );
};

// Main component
export default function EmergencyServices() {
  const { userId, isLoaded } = useAuth();
  const { contacts, loading: contactsLoading, error: contactsError } = useEmergencyContacts(userId, isLoaded);
  const { providers, loading: providersLoading, error: providersError } = useHealthcareProviders();
  
  const [adding, setAdding] = useState(false);
  const [generalError, setGeneralError] = useState(null);

  // Memoized values
  const isLoading = useMemo(() => 
    !isLoaded || contactsLoading || providersLoading, 
    [isLoaded, contactsLoading, providersLoading]
  );

  // Handlers
  const handleAddContact = useCallback(async (contactData) => {
    if (!userId) return;
    
    setAdding(true);
    setGeneralError(null);
    
    try {
      const contactsRef = collection(db, `e-passports/${userId}/emergency-contacts`);
      await addDoc(contactsRef, {
        ...contactData,
        userId,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error adding contact:', error);
      setGeneralError(`Failed to add contact: ${error.message}`);
    } finally {
      setAdding(false);
    }
  }, [userId]);

  const handleDeleteContact = useCallback(async (contactId) => {
    if (!userId || !contactId) return;
    
    if (!confirm('Are you sure you want to delete this contact?')) return;
    
    try {
      const contactRef = doc(db, `e-passports/${userId}/emergency-contacts`, contactId);
      await deleteDoc(contactRef);
    } catch (error) {
      console.error('Error deleting contact:', error);
      setGeneralError(`Failed to delete contact: ${error.message}`);
    }
  }, [userId]);

  // Render conditions
  if (isLoading) return <LoadingSpinner />;
  if (!userId) return <SignInPrompt />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/dashboard" 
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-6 transition-colors duration-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-xl">
              <Siren className="h-8 w-8 text-red-600" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-slate-800">Emergency Services</h1>
              <p className="text-slate-600 mt-2">Quick access to emergency contacts and services</p>
            </div>
          </div>
        </div>

        {/* Error Alerts */}
        {generalError && (
          <ErrorAlert 
            error={generalError} 
            onDismiss={() => setGeneralError(null)} 
          />
        )}
        {contactsError && <ErrorAlert error={contactsError} />}
        {providersError && <ErrorAlert error={providersError} />}

        {/* Malawi Emergency Numbers */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-8">
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            <h2 className="text-2xl font-semibold text-slate-800">Malawi Emergency Numbers</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MALAWI_EMERGENCY_NUMBERS.map((contact) => (
              <ContactCard 
                key={contact.id}
                contact={contact} 
                isEmergency={true}
              />
            ))}
          </div>
        </div>

        {/* Personal Emergency Contacts */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-8">
          <h2 className="text-2xl font-semibold text-slate-800 mb-6">Your Emergency Contacts</h2>
          
          <ContactForm onSubmit={handleAddContact} loading={adding} />
          
          <div className="mt-8">
            {contacts.length > 0 ? (
              <div className="space-y-4">
                {contacts.map((contact) => (
                  <ContactCard
                    key={contact.id}
                    contact={contact}
                    onDelete={handleDeleteContact}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Phone className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600">No personal emergency contacts added yet</p>
                <p className="text-slate-500 text-sm">Add your family members, friends, or trusted contacts above</p>
              </div>
            )}
          </div>
        </div>

        {/* Healthcare Providers */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <MapPin className="h-6 w-6 text-blue-600" />
            <h2 className="text-2xl font-semibold text-slate-800">Healthcare Facilities</h2>
          </div>
          
          {providers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {providers.map((provider) => (
                <ContactCard
                  key={provider.id}
                  contact={provider}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <MapPin className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">No healthcare facilities found</p>
              <p className="text-slate-500 text-sm">Healthcare providers will appear here when available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}