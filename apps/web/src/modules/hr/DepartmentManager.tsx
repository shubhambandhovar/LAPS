import React, { useEffect, useState } from 'react';
import { apiClient } from '../../lib/api';
import { Building2, Plus, Edit2, Trash2 } from 'lucide-react';

export const DepartmentManager: React.FC = () => {
  const [departments, setDepartments] = useState<any[]>([]);

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = () => {
    apiClient.get('/hr/departments').then(res => setDepartments(res.data));
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center"><Building2 className="mr-2" /> Departments</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700">
          <Plus size={18} className="mr-2" /> Add Department
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="p-4 font-medium text-gray-600">Code</th>
              <th className="p-4 font-medium text-gray-600">Name</th>
              <th className="p-4 font-medium text-gray-600">Status</th>
              <th className="p-4 font-medium text-gray-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {departments.map(d => (
              <tr key={d.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="p-4 font-mono text-sm text-gray-600">{d.code}</td>
                <td className="p-4 font-medium">{d.name}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${d.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {d.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="p-4 text-right space-x-2">
                  <button className="text-gray-400 hover:text-blue-600"><Edit2 size={18} /></button>
                  <button className="text-gray-400 hover:text-red-600"><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
            {departments.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500">No departments configured</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
