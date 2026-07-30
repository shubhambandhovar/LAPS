import React, { useEffect, useState } from 'react';
import { apiClient } from '../../lib/api';
import { FileSpreadsheet } from 'lucide-react';

export const PayrollDashboard: React.FC = () => {
  const [payrolls, setPayrolls] = useState<any[]>([]);

  useEffect(() => {
    loadPayrolls();
  }, []);

  const loadPayrolls = () => {
    apiClient.get('/hr/payroll').then(res => setPayrolls(res.data));
  };

  const handleGenerate = async () => {
    const d = new Date();
    try {
      await apiClient.post('/hr/payroll/generate', { month: d.getMonth() + 1, year: d.getFullYear() });
      loadPayrolls();
      alert('Payroll generated successfully.');
    } catch (error: unknown) {
      alert((error as {response?: {data?: {message?: string}}}).response?.data?.message || 'Failed to generate payroll.');
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await apiClient.patch(`/hr/payroll/${id}/status`, { status });
      loadPayrolls();
    } catch (error: unknown) {
      alert('Failed to update status');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center"><FileSpreadsheet className="mr-2" /> Payroll Batches</h1>
        <button onClick={handleGenerate} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700">
          Generate Current Month
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="p-4 font-medium text-gray-600">Period</th>
              <th className="p-4 font-medium text-gray-600">Employees</th>
              <th className="p-4 font-medium text-gray-600">Total Gross</th>
              <th className="p-4 font-medium text-gray-600">Total Net</th>
              <th className="p-4 font-medium text-gray-600">Status</th>
              <th className="p-4 font-medium text-gray-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {payrolls.map(p => (
              <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="p-4 font-medium">{p.month}/{p.year}</td>
                <td className="p-4 text-gray-600">{p.totalEmployees}</td>
                <td className="p-4 text-gray-600 font-mono">₹{p.totalGross.toLocaleString()}</td>
                <td className="p-4 text-gray-800 font-semibold font-mono">₹{p.totalNet.toLocaleString()}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    p.status === 'PAID' ? 'bg-green-100 text-green-700' :
                    p.status === 'APPROVED' ? 'bg-blue-100 text-blue-700' :
                    'bg-orange-100 text-orange-700'
                  }`}>
                    {p.status}
                  </span>
                </td>
                <td className="p-4 text-right space-x-2">
                  {p.status === 'DRAFT' && (
                    <button onClick={() => handleUpdateStatus(p.id, 'APPROVED')} className="text-blue-600 hover:underline text-sm font-medium">Approve</button>
                  )}
                  {p.status === 'APPROVED' && (
                    <button onClick={() => handleUpdateStatus(p.id, 'PAID')} className="text-green-600 hover:underline text-sm font-medium">Mark Paid</button>
                  )}
                  <button className="text-gray-500 hover:underline text-sm ml-2">View Payslips</button>
                </td>
              </tr>
            ))}
            {payrolls.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">No payroll batches generated</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
