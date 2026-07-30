import React, { useEffect, useState } from 'react';
import { apiClient } from '../../lib/api';
import { Plus, Edit2, Settings } from 'lucide-react';

export const AdmissionCycleManager: React.FC = () => {
  const [cycles, setCycles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/v1/admission-cycles')
      .then((res: any) => setCycles(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  const toggleCycleStatus = async (cycle: any) => {
    try {
      const newStatus = cycle.status === 'OPEN' ? 'CLOSED' : 'OPEN';
      await apiClient.patch(`/v1/admission-cycles/${cycle._id}`, { status: newStatus });
      setCycles(cycles.map(c => c._id === cycle._id ? { ...c, status: newStatus } : (newStatus === 'OPEN' ? { ...c, status: 'CLOSED' } : c)));
    } catch (err) {
      console.error('Failed to update cycle', err);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading cycles...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Admission Cycles</h1>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center">
          <Plus className="w-4 h-4 mr-2" />
          Create Cycle
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {cycles.map((cycle) => (
              <tr key={cycle._id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{cycle.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{cycle.academicSessionId?.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(cycle.startDate).toLocaleDateString()} - {new Date(cycle.endDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    cycle.status === 'OPEN' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {cycle.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => toggleCycleStatus(cycle)} className="text-indigo-600 hover:text-indigo-900 mr-4">
                    {cycle.status === 'OPEN' ? 'Close' : 'Open'}
                  </button>
                  <button className="text-gray-500 hover:text-gray-900 mr-4">
                    <Settings className="w-5 h-5 inline" />
                  </button>
                  <button className="text-gray-500 hover:text-gray-900">
                    <Edit2 className="w-5 h-5 inline" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {cycles.length === 0 && (
          <div className="p-8 text-center text-gray-500">No admission cycles found.</div>
        )}
      </div>
    </div>
  );
};
