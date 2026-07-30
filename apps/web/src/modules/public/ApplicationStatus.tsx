import React, { useEffect, useState } from 'react';
import { apiClient } from '../../lib/api';
import { useLocation } from 'react-router-dom';
import { CheckCircle, AlertCircle } from 'lucide-react';

export const ApplicationStatus: React.FC = () => {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const successMessage = location.state?.success;

  useEffect(() => {
    apiClient.get('/v1/admissions/me')
      .then((res: any) => {
        setApplications(res.data.data);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED': return <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold">Approved</span>;
      case 'REJECTED': return <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-bold">Rejected</span>;
      case 'WAITLISTED': return <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold">Waitlisted</span>;
      case 'DOCUMENTS_PENDING': return <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-xs font-bold">Documents Pending</span>;
      case 'UNDER_REVIEW': return <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold">Under Review</span>;
      default: return <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-xs font-bold">{status}</span>;
    }
  };

  if (loading) return <div className="p-12 text-center text-lg text-gray-500">Loading your applications...</div>;

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6">
      {successMessage && (
        <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center text-green-700">
          <CheckCircle className="w-5 h-5 mr-3" />
          Application submitted successfully! Our team will review it shortly.
        </div>
      )}

      <h1 className="text-3xl font-extrabold text-gray-900 mb-8">My Applications</h1>

      {applications.length === 0 ? (
        <div className="text-center p-12 bg-white rounded-xl shadow-sm border border-gray-100">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No applications found</h3>
          <p className="mt-2 text-gray-500">You have not submitted any admission applications yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {applications.map((app) => (
            <div key={app._id} className="bg-white p-6 rounded-xl shadow-md border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-xl font-bold text-gray-900">{app.studentInfo.firstName} {app.studentInfo.lastName}</h3>
                  {getStatusBadge(app.status)}
                </div>
                <div className="text-gray-600 text-sm grid grid-cols-2 gap-x-8 gap-y-1 mt-3">
                  <p><span className="font-medium text-gray-900">Application No:</span> {app.applicationNumber}</p>
                  <p><span className="font-medium text-gray-900">Class:</span> {app.appliedClassId?.name}</p>
                  <p><span className="font-medium text-gray-900">Cycle:</span> {app.admissionCycleId?.name}</p>
                  <p><span className="font-medium text-gray-900">Submitted:</span> {new Date(app.submissionDate).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div className="mt-4 md:mt-0">
                <button className="bg-indigo-50 border border-indigo-200 text-indigo-700 px-4 py-2 rounded-lg font-medium hover:bg-indigo-100 transition-colors">
                  View Details & Documents
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
