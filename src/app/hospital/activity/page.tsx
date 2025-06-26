"use client";

import React, { useState, useEffect } from 'react';
import { useOrganization } from '@clerk/nextjs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';

export default function ActivityLogPage() {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [patientVerifications, setPatientVerifications] = useState([]);
  const { organization } = useOrganization();
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

  const filteredVerifications = patientVerifications.filter((verification) => {
    const matchesFilter = filter === 'all' || verification.status === filter;
    const matchesSearch = verification.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          verification.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (!isMounted) return null;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by patient name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All
              </Button>
              <Button
                variant={filter === 'approved' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('approved')}
              >
                Approved
              </Button>
              <Button
                variant={filter === 'pending' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('pending')}
              >
                Pending
              </Button>
              <Button
                variant={filter === 'rejected' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('rejected')}
              >
                Rejected
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity List */}
      <Card>
        <CardHeader>
          <CardTitle>Patient Verification History</CardTitle>
          <CardDescription>
            Complete log of all patient verification activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredVerifications.map((verification) => (
              <div key={verification.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`h-3 w-3 rounded-full mt-2 ${
                      verification.status === 'approved' ? 'bg-green-500' :
                      verification.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                    <div>
                      <h4 className="font-medium">{verification.patientName}</h4>
                      <p className="text-sm text-gray-600">{verification.email}</p>
                      <p className="text-sm text-gray-600">Code: {verification.verificationCode}</p>
                      {verification.status === 'approved' && verification.approvedBy && (
                        <p className="text-sm text-green-600">Approved by {verification.approvedBy}</p>
                      )}
                      {verification.status === 'rejected' && verification.rejectedBy && (
                        <p className="text-sm text-red-600">
                          Rejected by {verification.rejectedBy}: {verification.rejectionReason}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={verification.status === 'approved' ? 'default' : 
                                  verification.status === 'pending' ? 'secondary' : 'destructive'}>
                      {verification.status}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(verification.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}