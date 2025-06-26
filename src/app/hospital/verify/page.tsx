"use client";

import React, { useState, useEffect } from 'react';
import { useUser, useOrganization } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Shield, CheckCircle, XCircle, AlertTriangle, FileText } from 'lucide-react';

export default function PatientVerificationPage() {
  const [verificationCode, setVerificationCode] = useState('');
  const [verifiedUser, setVerifiedUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState('');
  const { organization } = useOrganization();
  const { user } = useUser();
  const [patientVerifications, setPatientVerifications] = useState([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (organization) {
      fetchVerifications();
    }
  }, [organization]);

  const fetchVerifications = async () => {
    try {
      const response = await fetch(`/api/patient-verifications?orgId=${organization?.id}`);
      const data = await response.json();
      if (data.success) {
        setPatientVerifications(data.verifications);
      }
    } catch (error) {
      console.error('Error fetching verifications:', error);
    }
  };

  const verifyCode = async () => {
    const trimmedCode = verificationCode.trim().toUpperCase();
    
    if (!trimmedCode || trimmedCode.length !== 6) {
      setError('Please enter a valid 6-digit verification code');
      toast.error("Invalid verification code", {
        description: "Please enter a valid 6-digit code",
      });
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/medical-passport/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verificationCode: trimmedCode,
          hospitalStaffId: user?.id,
          hospitalId: organization?.id,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setVerifiedUser(data.user);
        toast.success("Patient verified successfully", {
          description: "Patient information retrieved",
        });
      } else {
        setError(data.error || 'Failed to verify code');
        setVerifiedUser(null);
        toast.error("Failed to verify code", {
          description: data.error || "Please try again",
        });
      }
    } catch (error) {
      console.error('Verification error:', error);
      setError('Failed to verify code. Please try again.');
      setVerifiedUser(null);
      toast.error("Failed to verify code", {
        description: "An error occurred, please try again",
      });
    } finally {
      setLoading(false);
    }
  };

  const approvePassport = async () => {
    setApproving(true);
    setError('');
    
    try {
      const response = await fetch('/api/medical-passport/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verificationCode: verificationCode.trim().toUpperCase(),
          hospitalStaffId: user?.id,
          hospitalId: organization?.id,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success("Medical passport approved successfully!", {
          description: "Patient status updated",
        });
        setVerificationCode('');
        setVerifiedUser(null);
        fetchVerifications();
      } else {
        setError(data.error || 'Failed to approve passport');
        toast.error("Failed to approve passport", {
          description: data.error || "Please try again",
        });
      }
    } catch (error) {
      console.error('Approval error:', error);
      setError('Failed to approve medical passport. Please try again.');
      toast.error("Failed to approve medical passport", {
        description: "An error occurred, please try again",
      });
    } finally {
      setApproving(false);
    }
  };

  const rejectPassport = async () => {
    setApproving(true);
    setError('');
    
    try {
      const response = await fetch('/api/medical-passport/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verificationCode: verificationCode.trim().toUpperCase(),
          hospitalStaffId: user?.id,
          hospitalId: organization?.id,
          rejectionReason: 'Invalid documentation',
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success("Medical passport rejected", {
          description: "Patient request declined",
        });
        setVerificationCode('');
        setVerifiedUser(null);
        fetchVerifications();
      } else {
        setError(data.error || 'Failed to reject passport');
        toast.error("Failed to reject passport", {
          description: data.error || "Please try again",
        });
      }
    } catch (error) {
      console.error('Rejection error:', error);
      setError('Failed to reject medical passport. Please try again.');
      toast.error("Failed to reject medical passport", {
        description: "An error occurred, please try again",
      });
    } finally {
      setApproving(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 6) {
      setVerificationCode(value);
    }
  };

  if (!isMounted) return null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" />
            Patient Identity Verification
          </CardTitle>
          <CardDescription>
            Verify patient identity and approve medical passport requests
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Patient Verification Code</label>
              <div className="flex gap-3">
                <Input
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={verificationCode}
                  onChange={handleCodeChange}
                  maxLength={6}
                  className="font-mono text-lg text-center flex-1"
                  disabled={loading}
                />
                <Button 
                  onClick={verifyCode}
                  disabled={loading || verificationCode.length !== 6}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Verifying...
                    </>
                  ) : (
                    'Verify Patient'
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                The patient will provide this code from their mobile app
              </p>
            </div>

            {verifiedUser && (
              <div className="space-y-4">
                <Alert>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription>
                    Patient information retrieved successfully
                  </AlertDescription>
                </Alert>

                <Card className="border-green-200">
                  <CardHeader className="bg-green-50">
                    <CardTitle className="text-lg text-green-800 flex items-center justify-between">
                      Patient Information
                      <Badge variant={verifiedUser.risk_score === 'low' ? 'default' : 'destructive'}>
                        Risk: {verifiedUser.risk_score}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Full Name</p>
                          <p className="text-lg">{verifiedUser.personal_data?.first_name} {verifiedUser.personal_data?.last_name}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Email</p>
                          <p className="text-lg">{verifiedUser.email}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Phone</p>
                          <p className="text-lg">{verifiedUser.personal_data?.phone}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Date of Birth</p>
                          <p className="text-lg">{verifiedUser.personal_data?.date_of_birth}</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Emergency Contact</p>
                          <p className="text-lg">{verifiedUser.personal_data?.emergency_contact}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Medical Conditions</p>
                          <div className="flex flex-wrap gap-1">
                            {verifiedUser.personal_data?.medical_conditions?.map((condition: string, idx: number) => (
                              <Badge key={idx} variant="outline">{condition}</Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Allergies</p>
                          <div className="flex flex-wrap gap-1">
                            {verifiedUser.personal_data?.allergies?.map((allergy: string, idx: number) => (
                              <Badge key={idx} variant="destructive">{allergy}</Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Submitted Documents</p>
                          <div className="flex flex-wrap gap-1">
                            {verifiedUser.submitted_documents?.map((doc: string, idx: number) => (
                              <Badge key={idx} variant="outline">
                                <FileText className="h-3 w-3 mr-1" />
                                {doc.replace('_', ' ')}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-600">Address</p>
                      <p className="text-lg">{verifiedUser.personal_data?.address}</p>
                    </div>
                  </CardContent>
                </Card>

                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    <strong>Identity Verification Required:</strong> Please verify the patient's identity by checking their government-issued photo ID before approving their medical passport.
                  </AlertDescription>
                </Alert>

                <div className="flex gap-3">
                  <Button 
                    onClick={approvePassport}
                    disabled={approving}
                    className="flex-1 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700"
                    size="lg"
                  >
                    {approving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Approving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve Medical Passport
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={rejectPassport}
                    disabled={approving}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setVerificationCode('');
                      setVerifiedUser(null);
                      setError('');
                    }}
                    disabled={approving}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}