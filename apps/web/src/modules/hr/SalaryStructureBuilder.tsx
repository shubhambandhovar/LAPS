import React, { useEffect, useState } from 'react';
import { apiClient } from '../../lib/api';
import { IndianRupee, Plus } from 'lucide-react';

export const SalaryStructureBuilder: React.FC = () => {
  const [structures, setStructures] = useState<any[]>([]);

  useEffect(() => {
    apiClient.get('/hr/salary-structures').then(res => setStructures(res.data));
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center"><IndianRupee className="mr-2" /> Salary Structures</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700">
          <Plus size={18} className="mr-2" /> New Structure
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="p-4 font-medium text-gray-600">Employee</th>
              <th className="p-4 font-medium text-gray-600">Basic Salary</th>
              <th className="p-4 font-medium text-gray-600">Effective Date</th>
              <th className="p-4 font-medium text-gray-600">Status</th>
              <th className="p-4 font-medium text-gray-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {structures.map(s => (
              <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="p-4 font-medium">
                  {s.employeeId?.userId?.firstName} {s.employeeId?.userId?.lastName} 
                  <span className="block text-xs text-gray-500 font-mono">{s.employeeId?.employeeId}</span>
                </td>
                <td className="p-4 text-gray-800 font-semibold">₹{s.basicSalary.toLocaleString()}</td>
                <td className="p-4 text-gray-600">{new Date(s.effectiveFrom).toLocaleDateString()}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${s.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {s.isActive ? 'Active' : 'Archived'}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button className="text-blue-600 hover:underline text-sm">View Details</button>
                </td>
              </tr>
            ))}
            {structures.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">No salary structures configured</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
