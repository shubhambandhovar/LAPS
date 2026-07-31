import React, { useState, useEffect } from 'react';
import { apiClient as api } from '../../lib/api';

export const FineDashboard: React.FC = () => {
  const [fines, setFines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFines();
  }, []);

  const fetchFines = async () => {
    try {
      const res = await api.get('/library/fines');
      setFines(res.data.data.fines);
    } catch (error) {
      console.error('Failed to fetch fines', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fine Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage library fines and collections</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
         <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
          <div className="text-red-800 text-sm font-medium">Total Outstanding</div>
          <div className="text-3xl font-bold text-red-600 mt-2">
            ₹{fines.reduce((sum, f) => sum + f.outstandingAmount, 0)}
          </div>
         </div>
         <div className="bg-green-50 p-6 rounded-2xl border border-green-100">
          <div className="text-green-800 text-sm font-medium">Total Collected</div>
          <div className="text-3xl font-bold text-green-600 mt-2">
            ₹{fines.reduce((sum, f) => sum + f.paidAmount, 0)}
          </div>
         </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-sm font-medium text-gray-500">
              <th className="p-4">Issue ID</th>
              <th className="p-4">Total Fine</th>
              <th className="p-4">Paid</th>
              <th className="p-4">Outstanding</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {fines.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">
                  No fines found.
                </td>
              </tr>
            ) : (
              fines.map(fine => (
                <tr key={fine._id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="p-4 font-medium text-sm text-gray-600">{fine.bookIssueId?.toString().substring(0,8)}...</td>
                  <td className="p-4">₹{fine.fineAmount}</td>
                  <td className="p-4 text-green-600">₹{fine.paidAmount}</td>
                  <td className="p-4 text-red-600 font-medium">₹{fine.outstandingAmount}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        fine.status === 'PAID' ? 'bg-green-100 text-green-800' :
                        fine.status === 'WAIVED' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                    }`}>
                      {fine.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {fine.outstandingAmount > 0 && (
                        <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">Collect</button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
