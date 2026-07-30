import React, { useEffect, useState } from 'react';
import { apiClient } from '../../lib/api';
import { Users, Plus, Mail, Phone, } from 'lucide-react';

export const EmployeeDirectory: React.FC = () => {
  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => {
    apiClient.get('/hr/employees').then(res => setEmployees(res.data));
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center"><Users className="mr-2" /> Employee Directory</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700">
          <Plus size={18} className="mr-2" /> Add Employee
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {employees.map(emp => (
          <div key={emp.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-lg">{emp.userId?.firstName} {emp.userId?.lastName}</h3>
                <p className="text-sm text-gray-500 font-mono">{emp.employeeId}</p>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                emp.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                emp.status === 'ON_LEAVE' ? 'bg-orange-100 text-orange-700' :
                'bg-red-100 text-red-700'
              }`}>
                {emp.status}
              </span>
            </div>
            
            <div className="space-y-2 mb-4">
              <p className="text-sm text-gray-600 flex items-center"><BriefcaseIcon className="mr-2 h-4 w-4" /> {emp.designationId?.name} ({emp.departmentId?.name})</p>
              <p className="text-sm text-gray-600 flex items-center"><Mail className="mr-2 h-4 w-4" /> {emp.userId?.email || 'No email'}</p>
              <p className="text-sm text-gray-600 flex items-center"><Phone className="mr-2 h-4 w-4" /> {emp.emergencyContact?.phone || 'No phone'}</p>
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
              <span className="text-xs text-gray-500">Joined: {new Date(emp.joiningDate).toLocaleDateString()}</span>
              <button className="text-blue-600 text-sm font-medium hover:underline">View Profile</button>
            </div>
          </div>
        ))}
      </div>
      {employees.length === 0 && (
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
          <p className="text-gray-500">No employees found.</p>
        </div>
      )}
    </div>
  );
};

const BriefcaseIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);
