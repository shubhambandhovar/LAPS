import React, { useEffect, useState } from 'react';
import { apiClient } from '../../lib/api';
import {
  Plus,
  AlertCircle,
  Filter,
} from 'lucide-react';

interface EnrollmentRecord {
  id: string;
  studentId: string;
  academicSessionId: string;
  classId: string;
  sectionId: string;
  rollNumber: number;
  enrollmentDate: string;
  enrollmentStatus: 'ACTIVE' | 'PROMOTED' | 'TRANSFERRED' | 'WITHDRAWN' | 'COMPLETED' | 'ALUMNI' | 'ARCHIVED';
  student?: {
    id: string;
    admissionNumber: string;
    firstName: string;
    lastName: string;
  };
  sessionName?: string;
  className?: string;
  sectionName?: string;
  classTeacher?: {
    id?: string;
    firstName: string;
    lastName: string;
    employeeId: string;
  };
}

export const EnrollmentsPage: React.FC = () => {
  const [enrollments, setEnrollments] = useState<EnrollmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ACTIVE');
  const [showModal, setShowModal] = useState(false);

  // Modal State
  const [students, setStudents] = useState<Array<{ id: string; admissionNumber: string; firstName: string; lastName: string }>>([]);
  const [sessions, setSessions] = useState<Array<{ id: string; name: string; isCurrent: boolean }>>([]);
  const [classes, setClasses] = useState<Array<{ id: string; name: string }>>([]);
  const [sections, setSections] = useState<Array<{ id: string; name: string; classId: string }>>([]);

  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchEnrollments = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (statusFilter && statusFilter !== 'ALL') {
        params.enrollmentStatus = statusFilter;
      }
      const res = await apiClient.get('/enrollments', { params });
      setEnrollments(res.data.data || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch enrollments';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrollments();
  }, [statusFilter]);

  const handleOpenModal = async () => {
    setShowModal(true);
    try {
      const [stRes, sessRes, clsRes, secRes] = await Promise.all([
        apiClient.get('/students', { params: { status: 'ACTIVE', limit: '100' } }),
        apiClient.get('/academic-sessions'),
        apiClient.get('/classes'),
        apiClient.get('/sections'),
      ]);
      setStudents(stRes.data.data || []);
      const sessList = sessRes.data.data || [];
      setSessions(sessList);
      const cur = sessList.find((s: { isCurrent: boolean }) => s.isCurrent);
      if (cur) setSelectedSessionId(cur.id);

      setClasses(clsRes.data.data || []);
      setSections(secRes.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await apiClient.post('/enrollments', {
        studentId: selectedStudentId,
        academicSessionId: selectedSessionId,
        classId: selectedClassId,
        sectionId: selectedSectionId,
        rollNumber: rollNumber ? parseInt(rollNumber, 10) : undefined,
      });

      setShowModal(false);
      setSelectedStudentId('');
      setRollNumber('');
      fetchEnrollments();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create enrollment';
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredSections = sections.filter(
    (s) => !selectedClassId || s.classId === selectedClassId,
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Academic Enrollment Matrix
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage section rosters, auto-assign roll numbers, and view assigned class teachers.
          </p>
        </div>
        <button
          onClick={handleOpenModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Enroll Student in Section</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-medium text-slate-700">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="PROMOTED">PROMOTED</option>
            <option value="TRANSFERRED">TRANSFERRED</option>
            <option value="WITHDRAWN">WITHDRAWN</option>
            <option value="ALUMNI">ALUMNI</option>
            <option value="ARCHIVED">ARCHIVED</option>
          </select>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Roster Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            Loading enrollment roster...
          </div>
        ) : enrollments.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No enrollment records found.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3.5 px-4">Roll #</th>
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">Admission #</th>
                <th className="py-3.5 px-4">Session</th>
                <th className="py-3.5 px-4">Class / Section</th>
                <th className="py-3.5 px-4">Class Teacher</th>
                <th className="py-3.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {enrollments.map((enr) => (
                <tr key={enr.id} className="hover:bg-slate-50/75 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">
                    #{enr.rollNumber}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900">
                    {enr.student
                      ? `${enr.student.firstName} ${enr.student.lastName}`
                      : 'Unknown Student'}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-600">
                    {enr.student?.admissionNumber || '—'}
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 font-medium">
                    {enr.sessionName || '—'}
                  </td>
                  <td className="py-3.5 px-4 text-slate-800 font-semibold">
                    {enr.className} — {enr.sectionName}
                  </td>
                  <td className="py-3.5 px-4">
                    {enr.classTeacher ? (
                      <div className="text-xs">
                        <span className="font-bold text-slate-800">
                          {enr.classTeacher.firstName} {enr.classTeacher.lastName}
                        </span>
                        <span className="block text-[10px] text-slate-500 font-mono">
                          ID: {enr.classTeacher.employeeId}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Unassigned</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        enr.enrollmentStatus === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : enr.enrollmentStatus === 'PROMOTED'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {enr.enrollmentStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Enroll Student in Section
              </h2>
              <p className="text-xs text-slate-500">
                Roll number will be automatically generated if left blank.
              </p>
            </div>
            {formError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}
            <form onSubmit={handleCreateEnrollment} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Select Student *
                </label>
                <select
                  required
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  <option value="">-- Select Student --</option>
                  {students.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.admissionNumber} — {st.firstName} {st.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Academic Session *
                </label>
                <select
                  required
                  value={selectedSessionId}
                  onChange={(e) => setSelectedSessionId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  <option value="">-- Select Session --</option>
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.isCurrent ? '(Current)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Class *
                  </label>
                  <select
                    required
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                  >
                    <option value="">-- Class --</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Section *
                  </label>
                  <select
                    required
                    value={selectedSectionId}
                    onChange={(e) => setSelectedSectionId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                  >
                    <option value="">-- Section --</option>
                    {filteredSections.map((sec) => (
                      <option key={sec.id} value={sec.id}>
                        {sec.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Roll Number (Optional - auto-assigns if blank)
                </label>
                <input
                  type="number"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  placeholder="e.g. 1"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50"
                >
                  {submitting ? 'Enrolling...' : 'Enroll Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
