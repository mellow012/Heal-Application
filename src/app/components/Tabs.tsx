'use client';
import { useState } from 'react';
import { Activity, FileText, TrendingUp, Heart, Weight, Calendar, Circle, AlertTriangle } from 'lucide-react';

export default function Tabs({ 
  personalData = {}, 
  medicalData = {}, 
  hospitalRecords = { visits: [] }, 
  healthAnalytics = { heartRateTrends: [], weightTrends: [] } 
}) {
  const [activeTab, setActiveTab] = useState('medical');

  const tabs = [
    { 
      id: 'medical', 
      label: 'Medical Data', 
      icon: Activity,
      color: 'emerald'
    },
    { 
      id: 'hospital', 
      label: 'Hospital Records', 
      icon: FileText,
      color: 'blue'
    },
    { 
      id: 'analytics', 
      label: 'Health Analytics', 
      icon: TrendingUp,
      color: 'purple'
    },
  ];

  const getTabStyles = (tabId, color) => {
    const isActive = activeTab === tabId;
    return `
      relative flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all duration-200 
      rounded-t-lg border-b-2 
      ${isActive 
        ? `border-${color}-500 text-${color}-600 bg-${color}-50 shadow-sm` 
        : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
      }
    `;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderMedicalData = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-emerald-100 rounded-lg">
          <Activity className="h-6 w-6 text-emerald-600" />
        </div>
        <h3 className="text-xl font-semibold text-slate-800">Medical Information</h3>
      </div>

      {medicalData && Object.keys(medicalData).length > 0 ? (
        <div className="grid gap-4">
          {medicalData.allergies && medicalData.allergies.length > 0 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <h4 className="font-medium text-red-800">Allergies</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {medicalData.allergies.map((allergy, index) => (
                  <span key={index} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                    {allergy}
                  </span>
                ))}
              </div>
            </div>
          )}

          {medicalData.conditions && medicalData.conditions.length > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Heart className="h-5 w-5 text-amber-600" />
                <h4 className="font-medium text-amber-800">Medical Conditions</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {medicalData.conditions.map((condition, index) => (
                  <span key={index} className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                    {condition}
                  </span>
                ))}
              </div>
            </div>
          )}

          {medicalData.medications && medicalData.medications.length > 0 && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Circle className="h-5 w-5 text-blue-600" />
                <h4 className="font-medium text-blue-800">Current Medications</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {medicalData.medications.map((medication, index) => (
                  <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    {medication}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12">
          <Activity className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 text-lg">No medical data available</p>
        </div>
      )}
    </div>
  );

  const renderHospitalRecords = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <FileText className="h-6 w-6 text-blue-600" />
        </div>
        <h3 className="text-xl font-semibold text-slate-800">Hospital Records</h3>
      </div>

      {hospitalRecords?.visits?.length > 0 ? (
        <div className="space-y-4">
          {hospitalRecords.visits.map((visit, index) => (
            <div key={visit.id || index} className="p-6 bg-gradient-to-r from-slate-50 to-blue-50 border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold text-slate-800">{formatDate(visit.date)}</span>
                </div>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                  Visit #{index + 1}
                </span>
              </div>
              
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-slate-700 mb-1">Diagnosis</h4>
                  <p className="text-slate-600 bg-white p-3 rounded-lg border">{visit.diagnosis}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-slate-700 mb-1">Prescription</h4>
                  <p className="text-slate-600 bg-white p-3 rounded-lg border">
                    {visit.prescription || 'No prescription provided'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 text-lg">No hospital records available</p>
        </div>
      )}
    </div>
  );

  const renderHealthAnalytics = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-100 rounded-lg">
          <TrendingUp className="h-6 w-6 text-purple-600" />
        </div>
        <h3 className="text-xl font-semibold text-slate-800">Health Analytics</h3>
      </div>

      {(healthAnalytics?.heartRateTrends?.length > 0 || healthAnalytics?.weightTrends?.length > 0) ? (
        <div className="grid md:grid-cols-2 gap-6">
          {healthAnalytics.heartRateTrends?.length > 0 && (
            <div className="p-6 bg-gradient-to-br from-red-50 to-pink-50 border border-red-200 rounded-xl">
              <div className="flex items-center gap-2 mb-4">
                <Heart className="h-6 w-6 text-red-600" />
                <h4 className="font-semibold text-red-800">Heart Rate Trends</h4>
              </div>
              <div className="space-y-2">
                {healthAnalytics.heartRateTrends.map((trend, index) => (
                  <div key={index} className="p-3 bg-white rounded-lg border border-red-100">
                    <span className="text-red-700 font-medium">{trend} BPM</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {healthAnalytics.weightTrends?.length > 0 && (
            <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl">
              <div className="flex items-center gap-2 mb-4">
                <Weight className="h-6 w-6 text-green-600" />
                <h4 className="font-semibold text-green-800">Weight Trends</h4>
              </div>
              <div className="space-y-2">
                {healthAnalytics.weightTrends.map((trend, index) => (
                  <div key={index} className="p-3 bg-white rounded-lg border border-green-100">
                    <span className="text-green-700 font-medium">{trend} kg</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12">
          <TrendingUp className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 text-lg">No health analytics available</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex border-b border-slate-200 bg-slate-50">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={getTabStyles(tab.id, tab.color)}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-8 min-h-[400px]">
          {activeTab === 'medical' && renderMedicalData()}
          {activeTab === 'hospital' && renderHospitalRecords()}
          {activeTab === 'analytics' && renderHealthAnalytics()}
        </div>
      </div>
    </div>
  );
}