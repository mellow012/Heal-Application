export interface User {
      id: string;
      email: string;
      role: 'user' | 'patient';
      createdAt: Date;
    }

    export interface EHealthPassport {
      personalData: {
        fullName: string;
        dateOfBirth: Date;
        gender: string;
        bloodGroup: string;
      };
      medicalData: {
        allergies?: string[];
        conditions?: string[];
        bloodPressure?: { systolic: number; diastolic: number; date: Date }[];
      };
      hospitalRecords: {
        visits: { id: string; date: Date; diagnosis: string; prescription?: string }[];
      };
      healthAnalytics: {
        heartRateTrends: { value: number; date: Date }[];
        weightTrends: { value: number; date: Date }[];
      };
    }

    export interface DosageSchedule {
      prescriptionId: string;
      medicationName: string;
      dosage: string;
      frequency: string;
      startDate: Date;
      endDate: Date;
      reminders: { time: Date; enabled: boolean }[];
    }