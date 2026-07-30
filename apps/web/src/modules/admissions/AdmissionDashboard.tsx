import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../lib/api';
import { Users, FileText, CheckCircle, XCircle } from 'lucide-react';

export const AdmissionDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [analyticsRes, appsRes] = await Promise.all([
          apiClient.get('/v1/admission-summary/analytics'),
          apiClient.get('/v1/admissions?status=SUBMITTED')
        ]);
        setAnalytics(analyticsRes.data.data);
        setApplications(appsRes.data.data);
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-8 text-center">Loading dashboard...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Admissions Dashboard</h1>
        <div className="space-x-4">
          <Link to="/portal/admissions/cycles" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
            Manage Cycles
          </Link>
          <Link to="/portal/admissions/applications" className="bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
            All Applications
          </Link>
        </div>
      </div>

      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
            <div className="bg-blue-100 p-3 rounded-lg mr-4">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Applications</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalApplications}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
            <div className="bg-green-100 p-3 rounded-lg mr-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Approved</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.approved}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
            <div className="bg-yellow-100 p-3 rounded-lg mr-4">
              <FileText className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Pending Review</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.pendingReview}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
            <div className="bg-red-100 p-3 rounded-lg mr-4">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Rejected</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.rejected}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Recent Applications Awaiting Review</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {applications.slice(0, 5).map((app) => (
            <div key={app._id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div>
                <h3 className="text-md font-medium text-gray-900">{app.studentInfo.firstName} {app.studentInfo.lastName}</h3>
                <div className="text-sm text-gray-500 flex space-x-4 mt-1">
                  <span>{app.applicationNumber}</span>
                  <span>Class: {app.appliedClassId?.name}</span>
                  <span>Submitted: {new Date(app.submissionDate).toLocaleDateString()}</span>
                </div>
              </div>
              <Link to={`/portal/admissions/review/${app._id}`} className="text-indigo-600 font-medium hover:text-indigo-900 bg-indigo-50 px-4 py-2 rounded-lg">
                Review
              </Link>
            </div>
          ))}
          {applications.length === 0 && (
            <div className="p-8 text-center text-gray-500">No applications currently awaiting review.</div>
          )}
        </div>
      </div>
    </div>
  );
};
