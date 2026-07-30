import React, { useEffect, useState } from 'react';
import { apiClient } from '../../lib/api';
import {
  Calendar,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Repeat,
} from 'lucide-react';

interface HolidayRecord {
  _id: string;
  title: string;
  holidayType: 'NATIONAL' | 'STATE' | 'SCHOOL' | 'OPTIONAL' | 'MANDATORY';
  startDate: string;
  endDate: string;
  description?: string;
  isRecurring?: boolean;
  recurrenceRule?: {
    frequency: string;
    count?: number;
  };
  status: string;
}

export const HolidayManagement: React.FC = () => {
  const [holidays, setHolidays] = useState<HolidayRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    holidayType: 'NATIONAL' as const,
    startDate: '',
    endDate: '',
    description: '',
    academicSessionId: '60d5ecb8b5c9c62b3c7c4b5b',
    isRecurring: false,
    recurrenceRule: {
      frequency: 'YEARLY' as const,
      count: 3,
    },
  });

  const fetchHolidays = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/holidays?status=ACTIVE');
      setHolidays(res.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch school holidays');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await apiClient.post('/holidays', formData);
      setSuccess('Holiday created successfully!');
      setTimeout(() => setSuccess(null), 3000);
      setModalOpen(false);
      fetchHolidays();
    } catch (err: any) {
      setError(
        err.response?.status === 409
          ? 'Date Conflict: A holiday already exists within this date range.'
          : err.response?.data?.message || 'Failed to create holiday'
      );
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await apiClient.patch(`/holidays/${id}/archive`);
      setSuccess('Holiday archived successfully');
      setTimeout(() => setSuccess(null), 3000);
      fetchHolidays();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to archive holiday');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-indigo-600" />
            Holiday Management
          </h1>
          <p className="text-sm text-gray-600">
            Configure national, state, and school holidays with automatic attendance blocking
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Holiday
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3 text-emerald-800">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">{success}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500 text-sm">Loading holidays...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase">
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Start Date</th>
                <th className="py-3 px-4">End Date</th>
                <th className="py-3 px-4">Recurring</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {holidays.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    No active holidays found.
                  </td>
                </tr>
              ) : (
                holidays.map((hol) => (
                  <tr key={hol._id} className="hover:bg-gray-50/50">
                    <td className="py-3 px-4 font-semibold text-gray-900">{hol.title}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700">
                        {hol.holidayType}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{hol.startDate}</td>
                    <td className="py-3 px-4 text-gray-600">{hol.endDate}</td>
                    <td className="py-3 px-4">
                      {hol.isRecurring ? (
                        <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                          <Repeat className="w-3.5 h-3.5" />
                          {hol.recurrenceRule?.frequency}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">No</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleArchive(hol._id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Archive Holiday"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Holiday Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">Configure School Holiday</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-700">Holiday Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Republic Day"
                  className="w-full text-sm border border-gray-200 rounded-lg p-2 mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700">Category</label>
                  <select
                    value={formData.holidayType}
                    onChange={(e) => setFormData({ ...formData, holidayType: e.target.value as any })}
                    className="w-full text-sm border border-gray-200 rounded-lg p-2 mt-1"
                  >
                    <option value="NATIONAL">NATIONAL</option>
                    <option value="STATE">STATE</option>
                    <option value="SCHOOL">SCHOOL</option>
                    <option value="OPTIONAL">OPTIONAL</option>
                    <option value="MANDATORY">MANDATORY</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">Academic Session ID</label>
                  <input
                    type="text"
                    required
                    value={formData.academicSessionId}
                    onChange={(e) => setFormData({ ...formData, academicSessionId: e.target.value })}
                    className="w-full text-sm border border-gray-200 rounded-lg p-2 mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700">Start Date</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full text-sm border border-gray-200 rounded-lg p-2 mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">End Date</label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full text-sm border border-gray-200 rounded-lg p-2 mt-1"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="recCheck"
                  checked={formData.isRecurring}
                  onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                />
                <label htmlFor="recCheck" className="text-xs font-semibold text-gray-700">
                  Recurring Annual Holiday
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Save Holiday
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
