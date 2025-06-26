"use client";

import React, { useState } from 'react';
import { useUser, useOrganizationList } from '@clerk/nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Building2, MapPin, Phone, Mail, Users, Shield, CheckCircle } from 'lucide-react';

interface OrganizationData {
  name: string;
  type: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  description: string;
  licenseNumber: string;
  accreditation: string;
}

export default function OrganizationSetup() {
  const { user } = useUser();
  const { createOrganization } = useOrganizationList();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [orgData, setOrgData] = useState<OrganizationData>({
    name: '',
    type: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
    email: user?.primaryEmailAddress?.emailAddress || '',
    description: '',
    licenseNumber: '',
    accreditation: ''
  });

  const handleInputChange = (field: keyof OrganizationData, value: string) => {
    setOrgData(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateOrganization = async () => {
    setIsLoading(true);
    try {
      const organization = await createOrganization({ name: orgData.name });
      
      // Store additional organization data
      await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: organization.id,
          ...orgData
        })
      });
      
      setStep(4); // Success step
    } catch (error) {
      console.error('Error creating organization:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building2 className="h-6 w-6 mr-2 text-blue-600" />
                Hospital/Clinic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Organization Name *</Label>
                  <Input
                    id="name"
                    value={orgData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="St. Mary's Hospital"
                  />
                </div>
                <div>
                  <Label htmlFor="type">Organization Type *</Label>
                  <Select value={orgData.type} onValueChange={(value) => handleInputChange('type', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hospital">Hospital</SelectItem>
                      <SelectItem value="clinic">Clinic</SelectItem>
                      <SelectItem value="urgent-care">Urgent Care</SelectItem>
                      <SelectItem value="specialty">Specialty Center</SelectItem>
                      <SelectItem value="laboratory">Laboratory</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={orgData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Brief description of your medical facility..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="licenseNumber">Medical License Number *</Label>
                  <Input
                    id="licenseNumber"
                    value={orgData.licenseNumber}
                    onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                    placeholder="ML-123456789"
                  />
                </div>
                <div>
                  <Label htmlFor="accreditation">Accreditation</Label>
                  <Select value={orgData.accreditation} onValueChange={(value) => handleInputChange('accreditation', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select accreditation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="jcaho">JCAHO</SelectItem>
                      <SelectItem value="cms">CMS</SelectItem>
                      <SelectItem value="aaahc">AAAHC</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="h-6 w-6 mr-2 text-blue-600" />
                Location & Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="address">Street Address *</Label>
                <Input
                  id="address"
                  value={orgData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="123 Medical Drive"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={orgData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="New York"
                  />
                </div>
                <div>
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    value={orgData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    placeholder="NY"
                  />
                </div>
                <div>
                  <Label htmlFor="zipCode">ZIP Code *</Label>
                  <Input
                    id="zipCode"
                    value={orgData.zipCode}
                    onChange={(e) => handleInputChange('zipCode', e.target.value)}
                    placeholder="10001"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={orgData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    value={orgData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="admin@hospital.com"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-6 w-6 mr-2 text-blue-600" />
                Review & Confirm
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3">Organization Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Name:</span>
                    <p className="font-medium">{orgData.name}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Type:</span>
                    <p className="font-medium capitalize">{orgData.type}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">License:</span>
                    <p className="font-medium">{orgData.licenseNumber}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Accreditation:</span>
                    <p className="font-medium uppercase">{orgData.accreditation}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-3">Contact Information</h3>
                <div className="text-sm space-y-2">
                  <p><span className="text-gray-600">Address:</span> {orgData.address}, {orgData.city}, {orgData.state} {orgData.zipCode}</p>
                  <p><span className="text-gray-600">Phone:</span> {orgData.phone}</p>
                  <p><span className="text-gray-600">Email:</span> {orgData.email}</p>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2 text-blue-900">Administrator Privileges</h3>
                <p className="text-sm text-blue-800 mb-3">As the organization creator, you will have:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <Badge variant="secondary" className="justify-start">
                    <Users className="h-3 w-3 mr-1" />
                    Staff Management
                  </Badge>
                  <Badge variant="secondary" className="justify-start">
                    <Shield className="h-3 w-3 mr-1" />
                    Role Assignment
                  </Badge>
                  <Badge variant="secondary" className="justify-start">
                    <Building2 className="h-3 w-3 mr-1" />
                    Organization Settings
                  </Badge>
                  <Badge variant="secondary" className="justify-start">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verification Oversight
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card className="w-full max-w-2xl">
            <CardContent className="text-center py-12">
              <div className="mb-6">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Organization Created Successfully!</h2>
                <p className="text-gray-600">Welcome to your medical verification platform.</p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg mb-6">
                <h3 className="font-semibold text-green-900 mb-2">Next Steps:</h3>
                <div className="text-sm text-green-800 space-y-1">
                  <p>• Invite your medical staff to join the organization</p>
                  <p>• Set up departments and assign roles</p>
                  <p>• Configure verification workflows</p>
                  <p>• Start processing patient verifications</p>
                </div>
              </div>

              <Button className="w-full" onClick={() => window.location.href = '/dashboard'}>
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Progress Steps */}
        {step < 4 && (
          <div className="mb-8">
                          <div className="flex items-center justify-center space-x-4 mb-4">
                {[1, 2, 3].map((stepNumber) => (
                  <div key={stepNumber} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step >= stepNumber ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {step > stepNumber ? <CheckCircle className="h-4 w-4" /> : stepNumber}
                    </div>
                    {stepNumber < 3 && (
                      <div className={`w-16 h-1 mx-2 ${step > stepNumber ? 'bg-blue-600' : 'bg-gray-200'}`} />
                    )}
                  </div>
                ))}
              </div>
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {step === 1 && 'Organization Setup'}
                  {step === 2 && 'Contact Information'}
                  {step === 3 && 'Review & Confirm'}
                </h1>
                <p className="text-gray-600">
                  Step {step} of 3 - Set up your medical organization
                </p>
              </div>
            </div>
          )}

          {renderStep()}

          {/* Navigation Buttons */}
          {step < 4 && (
            <div className="flex justify-between mt-6">
              <Button 
                variant="outline" 
                onClick={() => setStep(step - 1)} 
                disabled={step === 1}
              >
                Previous
              </Button>
              
              {step < 3 ? (
                <Button 
                  onClick={() => setStep(step + 1)}
                  disabled={
                    (step === 1 && (!orgData.name || !orgData.type || !orgData.licenseNumber)) ||
                    (step === 2 && (!orgData.address || !orgData.city || !orgData.state || !orgData.zipCode || !orgData.phone))
                  }
                >
                  Next
                </Button>
              ) : (
                <Button 
                  onClick={handleCreateOrganization}
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? 'Creating...' : 'Create Organization'}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
