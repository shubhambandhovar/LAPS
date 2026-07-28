import React, { useEffect, useState } from 'react';
import { apiClient } from '../../lib/api';
import {
  Users,
  Plus,
  Archive,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface SectionRecord {
  id: string;
  name: string;
  roomNumber?: string;
  maxCapacity: number;
  classId?: {
    _id: string;
    name: string;
    code: string;
  };
  academicSessionId?: {
    _id: string;
    name: string;
  };
  status: 'ACTIVE' | 'ARCHIVED';
}

interface OptionItem {
  id: string;
  name: string;
}

export const SectionsPage: React.FC = () => {
  const [sections, setSections] = useState<SectionRecord[]>([]);
  const [classes, setClasses] = useState<OptionItem[]>([]);
  const [sessions, setSessions] = useState<OptionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [academicSessionId, setAcademicSessionId] = useState('');
  const [classId, setClassId] = useState('');
  const [name, setName] = useState('A');
  const [roomNumber, setRoomNumber] = useState('');
  const [maxCapacity, setMaxCapacity] = useState<number>(40);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [secRes, clsRes, sesRes] = await Promise.all([
        apiClient.get('/sections'),
        apiClient.get('/classes'),
        apiClient.get('/academic-sessions'),
      ]);
      setSections(secRes.data.data || []);
      setClasses(clsRes.data.data || []);
      setSessions(sesRes.data.data || []);

      if (sesRes.data.data?.length > 0 && !academicSessionId) {
        setAcademicSessionId(sesRes.data.data[0].id);
      }
      if (clsRes.data.data?.length > 0 && !classId) {
        setClassId(clsRes.data.data[0].id);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch sections';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await apiClient.post('/sections', {
        academicSessionId,
        classId,
        name: name.trim().toUpperCase(),
        roomNumber: roomNumber.trim() ? roomNumber : undefined,
        maxCapacity: Number(maxCapacity),
      });
      setShowModal(false);
      setName('A');
      setRoomNumber('');
      setMaxCapacity(40);
      await fetchData();
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.message || 'Error creating section');
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchive = async (id: string) => {
    if (!window.confirm('Are you sure you want to archive this section?')) return;
    try {
      await apiClient.patch(`/sections/${id}/archive`);
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to archive section');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sections</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage class divisions, room allocations, and student capacities per academic session.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-sm shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Section</span>
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
          Loading sections...
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-6">Class</th>
                <th className="py-3 px-6">Section</th>
                <th className="py-3 px-6">Session</th>
                <th className="py-3 px-6">Room #</th>
                <th className="py-3 px-6">Max Capacity</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {sections.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No sections found. Create one to get started.
                  </td>
                </tr>
              ) : (
                sections.map((sec) => (
                  <tr key={sec.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-semibold text-slate-900">
                      {sec.classId?.name || 'Unknown Class'}
                    </td>
                    <td className="py-4 px-6 font-bold text-indigo-600 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-indigo-500" />
                      <span>Section {sec.name}</span>
                    </td>
                    <td className="py-4 px-6 text-slate-600">
                      {sec.academicSessionId?.name || 'N/A'}
                    </td>
                    <td className="py-4 px-6 text-slate-600">
                      {sec.roomNumber || '—'}
                    </td>
                    <td className="py-4 px-6 text-slate-600">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                        {sec.maxCapacity} students
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          sec.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        {sec.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      {sec.status !== 'ARCHIVED' && (
                        <button
                          onClick={() => handleArchive(sec.id)}
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
            <h2 className="text-lg font-bold text-slate-900">Create New Section</h2>
            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                {formError}
              </div>
            )}
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Academic Session
                </label>
                <select
                  required
                  value={academicSessionId}
                  onChange={(e) => setAcademicSessionId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="">Select Session</option>
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Class
                </label>
                <select
                  required
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="">Select Class</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Section Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="A, B, C"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Room Number
                  </label>
                  <input
                    type="text"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    placeholder="101"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Max Capacity
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={maxCapacity}
                  onChange={(e) => setMaxCapacity(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
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
                  {submitting ? 'Creating...' : 'Create Section'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
