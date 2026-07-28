import React, { useEffect, useState } from 'react';
import { apiClient } from '../../lib/api';
import {
  BookOpen,
  Plus,
  Archive,
  AlertCircle,
  Hash,
  CheckCircle2,
} from 'lucide-react';

interface ClassRecord {
  id: string;
  name: string;
  code: string;
  level: 'PRE_PRIMARY' | 'PRIMARY' | 'MIDDLE' | 'SECONDARY';
  orderSequence: number;
  status: 'ACTIVE' | 'ARCHIVED';
}

export const ClassesPage: React.FC = () => {
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [level, setLevel] = useState<'PRE_PRIMARY' | 'PRIMARY' | 'MIDDLE' | 'SECONDARY'>('PRIMARY');
  const [orderSequence, setOrderSequence] = useState<number>(1);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchClasses = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/classes');
      setClasses(res.data.data || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch classes';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await apiClient.post('/classes', {
        name,
        code: code.trim() ? code : undefined, // Let backend auto-generate if empty
        level,
        orderSequence: Number(orderSequence),
      });
      setShowModal(false);
      setName('');
      setCode('');
      setLevel('PRIMARY');
      setOrderSequence(1);
      await fetchClasses();
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.message || 'Error creating class');
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchive = async (id: string) => {
    if (!window.confirm('Are you sure you want to archive this class?')) return;
    try {
      await apiClient.patch(`/classes/${id}/archive`);
      await fetchClasses();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to archive class');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Classes</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage grade levels, order sequence, and auto-generated display codes.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-sm shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Class</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-48 text-slate-500">
          Loading classes...
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-6">Class Name</th>
                <th className="py-3 px-6">Code</th>
                <th className="py-3 px-6">Level</th>
                <th className="py-3 px-6">Order</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {classes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No classes found. Create one to get started.
                  </td>
                </tr>
              ) : (
                classes.map((cls) => (
                  <tr key={cls.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-semibold text-slate-900 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-indigo-500" />
                      <span>{cls.name}</span>
                    </td>
                    <td className="py-4 px-6 font-mono text-xs text-indigo-600 font-bold">
                      {cls.code}
                    </td>
                    <td className="py-4 px-6 text-slate-600">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                        {cls.level}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-600 font-medium">
                      <Hash className="w-3.5 h-3.5 inline mr-1 text-slate-400" />
                      {cls.orderSequence}
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          cls.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        {cls.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      {cls.status !== 'ARCHIVED' && (
                        <button
                          onClick={() => handleArchive(cls.id)}
                          className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-700 font-medium rounded-md text-xs transition-colors"
                        >
                          <Archive className="w-3 h-3 inline mr-1" />
                          Archive
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Create New Class</h2>
            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                {formError}
              </div>
            )}
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Class Name (e.g. Nursery, Class 1)
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Class 10"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Code (Optional - Auto-generated if empty)
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. CLS-10"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Level
                  </label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="PRE_PRIMARY">PRE_PRIMARY</option>
                    <option value="PRIMARY">PRIMARY</option>
                    <option value="MIDDLE">MIDDLE</option>
                    <option value="SECONDARY">SECONDARY</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Order Sequence
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={orderSequence}
                    onChange={(e) => setOrderSequence(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
