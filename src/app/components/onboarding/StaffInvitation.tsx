"use client";

  import React, { useState } from 'react';
  import { useOrganization } from '@clerk/nextjs';
  import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
  import { Button } from '@/components/ui/button';
  import { Input } from '@/components/ui/input';
  import { Label } from '@/components/ui/label';
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
  import { Badge } from '@/components/ui/badge';
  import { Separator } from '@/components/ui/separator';
  import { UserPlus, Mail, Shield, Users, Trash2, Send } from 'lucide-react';

  interface StaffInvite {
    id: string;
    email: string;
    role: 'administrator' | 'doctor' | 'nurse' | 'technician' | 'receptionist';
    department: string;
    permissions: string[];
  }

  const rolePermissions = {
    administrator: ['manage_staff', 'manage_settings', 'view_all_data', 'approve_verifications', 'manage_departments'],
    doctor: ['approve_verifications', 'view_patient_data', 'create_verifications', 'manage_own_patients'],
    nurse: ['create_verifications', 'view_patient_data', 'update_patient_info'],
    technician: ['create_verifications', 'upload_documents', 'basic_patient_info'],
    receptionist: ['schedule_appointments', 'basic_patient_info', 'contact_patients']
  };

  const departments = [
    'Emergency Medicine',
    'Internal Medicine',
    'Pediatrics',
    'Surgery',
    'Cardiology',
    'Orthopedics',
    'Radiology',
    'Laboratory',
    'Administration',
    'Nursing'
  ];

  export function StaffInvitation() {
    const { organization } = useOrganization();
    const [invites, setInvites] = useState<StaffInvite[]>([]);
    const [currentInvite, setCurrentInvite] = useState({
      email: '',
      role: '' as StaffInvite['role'],
      department: ''
    });
    const [isLoading, setIsLoading] = useState(false);

    const addInvite = () => {
      if (!currentInvite.email || !currentInvite.role || !currentInvite.department) return;

      const newInvite: StaffInvite = {
        id: Date.now().toString(),
        email: currentInvite.email,
        role: currentInvite.role,
        department: currentInvite.department,
        permissions: rolePermissions[currentInvite.role] || []
      };

      setInvites([...invites, newInvite]);
      setCurrentInvite({ email: '', role: '' as StaffInvite['role'], department: '' });
    };

    const removeInvite = (id: string) => {
      setInvites(invites.filter(invite => invite.id !== id));
    };

    const sendInvitations = async () => {
      setIsLoading(true);
      try {
        for (const invite of invites) {
          await organization?.inviteMember({
            emailAddress: invite.email,
            role: invite.role === 'administrator' ? 'admin' : 'basic_member'
          });

          // Store additional staff data
          await fetch('/api/staff-invitations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              organizationId: organization?.id,
              ...invite
            })
          });
        }
        setInvites([]);
      } catch (error) {
        console.error('Error sending invitations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const getRoleBadgeColor = (role: string) => {
      switch (role) {
        case 'administrator': return 'bg-red-100 text-red-800';
        case 'doctor': return 'bg-blue-100 text-blue-800';
        case 'nurse': return 'bg-green-100 text-green-800';
        case 'technician': return 'bg-purple-100 text-purple-800';
        case 'receptionist': return 'bg-yellow-100 text-yellow-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserPlus className="h-5 w-5 mr-2" />
              Invite Medical Staff
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={currentInvite.email}
                  onChange={(e) => setCurrentInvite({...currentInvite, email: e.target.value})}
                  placeholder="doctor@example.com"
                />
              </div>
              
              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={currentInvite.role} onValueChange={(value: StaffInvite['role']) => setCurrentInvite({...currentInvite, role: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="administrator">Administrator</SelectItem>
                    <SelectItem value="doctor">Doctor</SelectItem>
                    <SelectItem value="nurse">Nurse</SelectItem>
                    <SelectItem value="technician">Technician</SelectItem>
                    <SelectItem value="receptionist">Receptionist</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="department">Department</Label>
                <Select value={currentInvite.department} onValueChange={(value) => setCurrentInvite({...currentInvite, department: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {currentInvite.role && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-sm mb-2">Role Permissions:</h4>
                <div className="flex flex-wrap gap-2">
                  {rolePermissions[currentInvite.role]?.map((permission) => (
                    <Badge key={permission} variant="secondary" className="text-xs">
                      {permission.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Button onClick={addInvite} disabled={!currentInvite.email || !currentInvite.role || !currentInvite.department}>
              Add to Invitation List
            </Button>
          </CardContent>
        </Card>

        {invites.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Mail className="h-5 w-5 mr-2" />
                  Pending Invitations ({invites.length})
                </span>
                <Button onClick={sendInvitations} disabled={isLoading}>
                  <Send className="h-4 w-4 mr-2" />
                  {isLoading ? 'Sending...' : 'Send All Invitations'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {invites.map((invite) => (
                  <div key={invite.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div>
                        <p className="font-medium">{invite.email}</p>
                        <p className="text-sm text-gray-600">{invite.department}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge className={getRoleBadgeColor(invite.role)}>
                        {invite.role}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeInvite(invite.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }
              