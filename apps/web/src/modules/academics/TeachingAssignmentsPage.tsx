import React, { useEffect, useState } from 'react';
import { apiClient } from '../../lib/api';
import {
  Plus,
  Archive,
  AlertCircle,
  CheckCircle2,
  Calendar,
  UserCheck,
} from 'lucide-react';

interface TeachingAssignmentRecord {
  id: string;
  teacherId?: {
    _id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    email: string;
    designation: string;
  };
  academicSessionId?: {
    _id: string;
    name: string;
  };
  classId?: {
    _id: string;
    name: string;
    code: string;
  };
  sectionId?: {
    _id: string;
    name: string;
    roomNumber?: string;
  };
  subjectId?: {
    _id: string;
    name: string;
    code: string;
    shortName: string;
  };
  isClassTeacher: boolean;
  effectiveFrom: string;
  effectiveTo?: string;
  status: 'ACTIVE' | 'ARCHIVED';
}

interface OptionItem {
  id: string;
  name: string;
  code?: string;
  employeeId?: string;
  firstName?: string;
  lastName?: string;
}

export const TeachingAssignmentsPage: React.FC = () => {
  const [assignments, setAssignments] = useState<TeachingAssignmentRecord[]>([]);
  const [teachers, setTeachers] = useState<OptionItem[]>([]);
  const [sessions, setSessions] = useState<OptionItem[]>([]);
  const [classes, setClasses] = useState<OptionItem[]>([]);
  const [sections, setSections] = useState<OptionItem[]>([]);
  const [subjects, setSubjects] = useState<OptionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [teacherId, setTeacherId] = useState('');
  const [academicSessionId, setAcademicSessionId] = useState('');
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [isClassTeacher, setIsClassTeacher] = useState(false);
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [effectiveTo, setEffectiveTo] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [assRes, tRes, sesRes, clsRes, secRes, subRes] = await Promise.all([
        apiClient.get('/teaching-assignments'),
        apiClient.get('/teachers'),
        apiClient.get('/academic-sessions'),
        apiClient.get('/classes'),
        apiClient.get('/sections'),
        apiClient.get('/subjects'),
      ]);

      setAssignments(assRes.data.data || []);
      setTeachers(tRes.data.data || []);
      setSessions(sesRes.data.data || []);
      setClasses(clsRes.data.data || []);
      setSections(secRes.data.data || []);
      setSubjects(subRes.data.data || []);

      if (sesRes.data.data?.length > 0 && !academicSessionId) {
        setAcademicSessionId(sesRes.data.data[0].id);
      }
      if (tRes.data.data?.length > 0 && !teacherId) {
        setTeacherId(tRes.data.data[0].id);
      }
      if (clsRes.data.data?.length > 0 && !classId) {
        setClassId(clsRes.data.data[0].id);
      }
      if (secRes.data.data?.length > 0 && !sectionId) {
        setSectionId(secRes.data.data[0].id);
      }
      if (subRes.data.data?.length > 0 && !subjectId) {
        setSubjectId(subRes.data.data[0].id);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Failed to fetch teaching assignments';
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
      await apiClient.post('/teaching-assignments', {
        teacherId,
        academicSessionId,
        classId,
        sectionId,
        subjectId,
        isClassTeacher,
        effectiveFrom: new Date(effectiveFrom).toISOString(),
        effectiveTo: effectiveTo ? new Date(effectiveTo).toISOString() : undefined,
      });
      setShowModal(false);
      setEffectiveFrom('');
      setEffectiveTo('');
      setIsClassTeacher(false);
      await fetchData();
    } catch (err: any) {
      setFormError(
        err.response?.data?.message ||
          err.message ||
          'Error creating teaching assignment',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchive = async (id: string) => {
    if (
      !window.confirm('Are you sure you want to archive this teaching assignment?')
    )
      return;
    try {
      await apiClient.patch(`/teaching-assignments/${id}/archive`);
      await fetchData();
    } catch (err: any) {
      alert(
        err.response?.data?.message ||
          err.message ||
          'Failed to archive teaching assignment',
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Teaching Assignments</h1>
          <p className="text-sm text-slate-500 mt-1">
            Map Teachers to Academic Sessions, Classes, Sections, and Global Subjects with effective dates.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-sm shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Assignment</span>
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
          Loading teaching assignments...
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-6">Teacher</th>
                <th className="py-3 px-6">Session</th>
                <th className="py-3 px-6">Class & Section</th>
                <th className="py-3 px-6">Subject</th>
                <th className="py-3 px-6">Effective Dates</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {assignments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No teaching assignments found. Create one to get started.
                  </td>
                </tr>
              ) : (
                assignments.map((ass) => (
                  <tr key={ass.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-indigo-500" />
                        <div>
                          <p className="font-bold">
                            {ass.teacherId?.firstName} {ass.teacherId?.lastName}
                          </p>
                          <p className="text-xs text-indigo-600 font-mono">
                            {ass.teacherId?.employeeId}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-600">
                      {ass.academicSessionId?.name}
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-bold text-slate-900">
                        {ass.classId?.name} - {ass.sectionId?.name}
                      </p>
                      {ass.isClassTeacher && (
                        <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800">
                          Class Teacher
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-semibold text-slate-900">
                        {ass.subjectId?.name}
                      </p>
                      <p className="text-xs font-mono text-slate-500">
                        {ass.subjectId?.code}
                      </p>
                    </td>
                    <td className="py-4 px-6 text-slate-600 text-xs">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>
                          {new Date(ass.effectiveFrom).toLocaleDateString()} —{' '}
                          {ass.effectiveTo
                            ? new Date(ass.effectiveTo).toLocaleDateString()
                            : 'Present'}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          ass.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        {ass.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      {ass.status !== 'ARCHIVED' && (
                        <button
                          onClick={() => handleArchive(ass.id)}
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
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-900">
              Create Teaching Assignment
            </h2>
            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium">
                {formError}
              </div>
            )}
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Teacher
                  </label>
                  <select
                    required
                    value={teacherId}
                    onChange={(e) => setTeacherId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="">Select Teacher</option>
                    {teachers.map((t: any) => (
                      <option key={t.id} value={t.id}>
                        {t.firstName} {t.lastName} ({t.employeeId})
                      </option>
                    ))}
                  </select>
                </div>
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
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Section
                  </label>
                  <select
                    required
                    value={sectionId}
                    onChange={(e) => setSectionId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="">Select Section</option>
                    {sections.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        Section {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Global Master Subject
                </label>
                <select
                  required
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="">Select Subject</option>
                  {subjects.map((sub: any) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name} ({sub.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Effective From
                  </label>
                  <input
                    type="date"
                    required
                    value={effectiveFrom}
                    onChange={(e) => setEffectiveFrom(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Effective To (Optional)
                  </label>
                  <input
                    type="date"
                    value={effectiveTo}
                    onChange={(e) => setEffectiveTo(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center pt-2">
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isClassTeacher}
                    onChange={(e) => setIsClassTeacher(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="font-semibold">Designate as Class Teacher for this Section</span>
                </label>
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
                  {submitting ? 'Creating...' : 'Create Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
