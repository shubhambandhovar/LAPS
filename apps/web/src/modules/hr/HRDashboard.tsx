import React, { useEffect, useState } from 'react';
import { apiClient } from '../../lib/api';
import { Users, IndianRupee, Briefcase, Building } from 'lucide-react';

export const HRDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    apiClient.get('/hr/analytics').then((res) => setAnalytics(res.data));
  }, []);

  if (!analytics) return <div className="p-4">Loading HR Analytics...</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">HR & Payroll Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Users size={24} /></div>
          <div>
            <p className="text-sm text-gray-500">Total Employees</p>
            <p className="text-2xl font-bold">{analytics.headcount}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-lg"><Briefcase size={24} /></div>
          <div>
            <p className="text-sm text-gray-500">Teaching Staff</p>
            <p className="text-2xl font-bold">{analytics.byType?.TEACHING || 0}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg"><Building size={24} /></div>
          <div>
            <p className="text-sm text-gray-500">Non-Teaching Staff</p>
            <p className="text-2xl font-bold">{analytics.byType?.NON_TEACHING || 0}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-orange-50 text-orange-600 rounded-lg"><IndianRupee size={24} /></div>
          <div>
            <p className="text-sm text-gray-500">Last Payroll Cost</p>
            <p className="text-2xl font-bold">₹{analytics.payrollCostTrend[0]?.cost?.toLocaleString() || 0}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold mb-4">Employees by Department</h2>
          <div className="space-y-4">
            {analytics.byDepartment.map((d: {department: string, count: number}) => (
              <div key={d.department} className="flex justify-between items-center">
                <span className="text-gray-600">{d.department}</span>
                <span className="font-semibold px-3 py-1 bg-gray-50 rounded-full">{d.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold mb-4">Payroll Cost Trend (Last 6 Months)</h2>
          <div className="space-y-4">
            {analytics.payrollCostTrend.map((p: {label: string, cost: number}) => (
              <div key={p.label} className="flex justify-between items-center">
                <span className="text-gray-600">{p.label}</span>
                <span className="font-semibold text-gray-800">₹{p.cost.toLocaleString()}</span>
              </div>
            ))}
            {analytics.payrollCostTrend.length === 0 && <p className="text-gray-500 text-sm">No recent payrolls found.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};
