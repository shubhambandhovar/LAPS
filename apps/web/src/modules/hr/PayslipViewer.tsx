import React, { useEffect, useState } from 'react';
import { apiClient } from '../../lib/api';
import { FileText, Download } from 'lucide-react';

export const PayslipViewer: React.FC = () => {
  const [payslips, setPayslips] = useState<any[]>([]);

  useEffect(() => {
    apiClient.get('/hr/payslips/me').then(res => setPayslips(res.data));
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center"><FileText className="mr-2" /> My Payslips</h1>
      
      <div className="space-y-4">
        {payslips.map(ps => (
          <div key={ps.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between">
            <div className="mb-4 sm:mb-0">
              <h3 className="font-bold text-lg text-gray-800">Payslip - {ps.month}/{ps.year}</h3>
              <p className="text-gray-500 text-sm">Generated on: {new Date(ps.createdAt).toLocaleDateString()}</p>
              <div className="mt-2 flex space-x-4 text-sm">
                <div>
                  <span className="text-gray-500 block text-xs">Gross Salary</span>
                  <span className="font-medium">₹{ps.grossSalary.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-xs">Deductions</span>
                  <span className="font-medium text-red-600">-₹{ps.deductions.reduce((acc: number, d: {amount: number}) => acc + d.amount, 0).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-xs">Net Salary</span>
                  <span className="font-bold text-green-700">₹{ps.netSalary.toLocaleString()}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                ps.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
              }`}>
                {ps.status}
              </span>
              <button className="bg-gray-100 text-gray-700 hover:bg-gray-200 p-2 rounded-lg flex items-center justify-center transition-colors">
                <Download size={18} />
              </button>
            </div>
          </div>
        ))}

        {payslips.length === 0 && (
          <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No payslips available yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};
