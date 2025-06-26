'use client'
import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Copy, 
  QrCode, 
  AlertTriangle, 
  Shield,
  FileText,
  Heart,
  Settings,
  Mail,
  Phone,
  Calendar,
  MapPin,
  ArrowUp
} from 'lucide-react';

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const [medicalStatus, setMedicalStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const checkMedicalStatus = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setError('');
      const response = await fetch(`/api/medical-passport/status?userId=${encodeURIComponent(user.id)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setMedicalStatus(data);
    } catch (error) {
      console.error('Error checking medical status:', error);
      setError('Failed to load medical status');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (isLoaded && user) {
      checkMedicalStatus();
    } else if (isLoaded && !user) {
      setLoading(false);
      setError('User not authenticated');
    }
  }, [user, isLoaded, checkMedicalStatus]);

  const requestMedicalPassport = async () => {
    if (!user?.id) {
      setError('User not authenticated');
      return;
    }

    setRequesting(true);
    setError('');
    
    try {
      const response = await fetch('/api/medical-passport/request', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        await checkMedicalStatus(); // Refresh status
      } else {
        setError(data.error || 'Failed to request medical passport');
      }
    } catch (error) {
      console.error('Request error:', error);
      setError('Failed to request medical passport. Please try again.');
    } finally {
      setRequesting(false);
    }
  };

  const copyCode = async (code) => {
    if (!code) return;
    
    try {
      await navigator.clipboard.writeText(code);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      setError('Failed to copy code to clipboard');
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-lg">Loading your profile...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Please log in to access your profile.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isMedicalUser = medicalStatus?.userType === 'medical_user';
  const hasPendingRequest = medicalStatus?.hasActiveRequest;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {user.firstName} {user.lastName}
                </h1>
                <p className="text-gray-600">{user.primaryEmailAddress?.emailAddress}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge 
                variant={isMedicalUser ? "default" : "secondary"}
                className="flex items-center gap-1 px-3 py-1"
              >
                {isMedicalUser ? (
                  <><Shield className="h-3 w-3" /> Medical User</>
                ) : (
                  <><User className="h-3 w-3" /> Basic User</>
                )}
              </Badge>
              
              {hasPendingRequest && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Pending Approval
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Profile Menu</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <nav className="space-y-1">
                  {[
                    { id: 'overview', label: 'Overview', icon: User },
                    { id: 'medical', label: 'Medical Access', icon: Heart },
                    { id: 'settings', label: 'Settings', icon: Settings },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                          activeTab === item.id
                            ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                            : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Your basic profile information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Full Name</label>
                        <p className="text-lg">{user.firstName} {user.lastName}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Email</label>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <p>{user.primaryEmailAddress?.emailAddress}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t">
                      <p className="text-sm text-gray-600 mb-2">Account Created</p>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <p>{new Date(user.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Account Status */}
                <Card>
                  <CardHeader>
                    <CardTitle>Account Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {isMedicalUser ? (
                          <>
                            <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                              <Shield className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <p className="font-medium text-green-700">Medical User</p>
                              <p className="text-sm text-green-600">Full access to medical features</p>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-gray-600" />
                            </div>
                            <div>
                              <p className="font-medium">Basic User</p>
                              <p className="text-sm text-gray-600">Limited access to features</p>
                            </div>
                          </>
                        )}
                      </div>
                      
                      {!isMedicalUser && (
                        <Button 
                          onClick={() => setActiveTab('medical')}
                          variant="outline"
                          size="sm"
                        >
                          <ArrowUp className="h-4 w-4 mr-2" />
                          Upgrade
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Medical Access Tab */}
            {activeTab === 'medical' && (
              <div className="space-y-6">
                {isMedicalUser ? (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-6 w-6 text-green-500" />
                        <div>
                          <CardTitle>Medical Passport Active</CardTitle>
                          <CardDescription>You have full access to medical features</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-green-50 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="h-5 w-5 text-green-600" />
                            <p className="font-medium text-green-700">Medical Records</p>
                          </div>
                          <p className="text-sm text-green-600">Access your complete medical history</p>
                        </div>
                        
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Heart className="h-5 w-5 text-blue-600" />
                            <p className="font-medium text-blue-700">Health Monitoring</p>
                          </div>
                          <p className="text-sm text-blue-600">Track your health metrics and vitals</p>
                        </div>
                      </div>
                      
                      <Button 
                        onClick={() => window.location.href = '/dashboard/medical'}
                        className="w-full"
                      >
                        Access Medical Dashboard
                      </Button>
                    </CardContent>
                  </Card>
                ) : hasPendingRequest ? (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Clock className="h-6 w-6 text-yellow-500" />
                        <div>
                          <CardTitle>Medical Passport Pending</CardTitle>
                          <CardDescription>Your request is awaiting hospital verification</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {medicalStatus?.request?.verification_code && (
                        <div className="bg-yellow-50 p-4 rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <p className="font-medium text-yellow-800">Your Verification Code:</p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyCode(medicalStatus.request.verification_code)}
                            >
                              <Copy className="h-4 w-4 mr-1" />
                              {copySuccess ? 'Copied!' : 'Copy'}
                            </Button>
                          </div>
                          
                          <div className="text-center mb-4">
                            <code className="text-3xl font-mono bg-white px-4 py-2 rounded border-2 border-yellow-200">
                              {medicalStatus.request.verification_code}
                            </code>
                          </div>
                          
                          <div className="space-y-2 text-sm text-yellow-700">
                            <p className="font-medium">Next Steps:</p>
                            <ol className="list-decimal list-inside space-y-1 ml-4">
                              <li>Visit any participating hospital</li>
                              <li>Show this verification code to hospital staff</li>
                              <li>Provide valid ID for identity verification</li>
                              <li>Staff will activate your medical passport</li>
                            </ol>
                          </div>
                          
                          {medicalStatus.request.expires_at && (
                            <div className="mt-3 pt-3 border-t border-yellow-200">
                              <p className="text-xs text-yellow-600">
                                Code expires: {new Date(medicalStatus.request.expires_at).toLocaleString()}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <Button 
                        variant="outline" 
                        onClick={checkMedicalStatus}
                        className="w-full"
                      >
                        Refresh Status
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <QrCode className="h-6 w-6 text-blue-500" />
                        <div>
                          <CardTitle>Upgrade to Medical User</CardTitle>
                          <CardDescription>Get access to your medical records and health data</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="bg-blue-50 p-6 rounded-lg">
                        <h3 className="font-semibold mb-3 text-blue-900">What You'll Get:</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                            <div>
                              <p className="font-medium text-blue-900">Medical Records Access</p>
                              <p className="text-sm text-blue-700">View your complete medical history</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                            <div>
                              <p className="font-medium text-blue-900">Hospital Integration</p>
                              <p className="text-sm text-blue-700">Seamless data sharing with healthcare providers</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                            <div>
                              <p className="font-medium text-blue-900">Health Monitoring</p>
                              <p className="text-sm text-blue-700">Track vitals and health metrics</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                            <div>
                              <p className="font-medium text-blue-900">Emergency Access</p>
                              <p className="text-sm text-blue-700">Quick access to critical health information</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="font-medium mb-2 text-gray-900">How the Verification Process Works:</p>
                        <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                          <li>Click "Request Medical Passport" below</li>
                          <li>Receive a unique 6-digit verification code</li>
                          <li>Visit any participating hospital with valid ID</li>
                          <li>Hospital staff will verify your identity and activate your account</li>
                          <li>Start accessing your medical features immediately</li>
                        </ol>
                      </div>
                      
                      <Button 
                        onClick={requestMedicalPassport}
                        disabled={requesting}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        size="lg"
                      >
                        {requesting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Processing Request...
                          </>
                        ) : (
                          <>
                            <QrCode className="h-5 w-5 mr-2" />
                            Request Medical Passport
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <Card>
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                  <CardDescription>Manage your account preferences</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">Account Management</p>
                        <p className="text-sm text-gray-600">Update your profile information</p>
                      </div>
                      <Button variant="outline" size="sm">
                        Edit Profile
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">Security Settings</p>
                        <p className="text-sm text-gray-600">Manage passwords and security options</p>
                      </div>
                      <Button variant="outline" size="sm">
                        Security
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}