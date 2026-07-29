import React, { useState, useEffect } from 'react';
import { apiClient } from '../../lib/api';
import {
  Plus,
  Search,
  FileText,
  Calendar,
  Archive,
  AlertCircle,
  X,
  UploadCloud,
} from 'lucide-react';

export const HomeworkListPage: React.FC = () => {
  const [homeworkList, setHomeworkList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Modal State for creation
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [formData, setFormData] = useState<any>({
    academicSessionId: '',
    teachingAssignmentId: '',
    classSubjectId: '',
    classId: '',
    sectionId: '',
    subjectId: '',
    title: '',
    description: '',
    instructions: '',
    homeworkType: 'HOMEWORK',
    maxAttempts: 1,
    assignedDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    scheduledPublishAt: '',
    maxMarks: 100,
    status: 'PUBLISHED',
    attachments: [],
  });

  const fetchHomework = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await apiClient.get('/api/v1/homework', {
        params: {
          search: search || undefined,
          status: statusFilter || undefined,
        },
      });
      setHomeworkList(res.data.data || []);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to load homework assignments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomework();
  }, [search, statusFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        maxAttempts: Number(formData.maxAttempts),
        maxMarks: Number(formData.maxMarks),
        assignedDate: new Date(formData.assignedDate).toISOString(),
        dueDate: new Date(formData.dueDate).toISOString(),
        scheduledPublishAt: formData.scheduledPublishAt
          ? new Date(formData.scheduledPublishAt).toISOString()
          : undefined,
      };

      await apiClient.post('/api/v1/homework', payload);
      setShowCreateModal(false);
      fetchHomework();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Error creating homework assignment');
    }
  };

  const handleArchive = async (id: string) => {
    if (!window.confirm('Are you sure you want to archive this homework assignment?')) return;
    try {
      await apiClient.patch(`/api/v1/homework/${id}/archive`);
      fetchHomework();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Error archiving homework');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Homework & Assignments</h1>
          <p className="text-sm text-gray-500">
            Create, schedule, and manage homework assignments for assigned classes and sections
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-md flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" />
          Assign Homework
        </button>
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by title or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="PUBLISHED">Published</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <th className="p-4">Title & Type</th>
              <th className="p-4">Class / Section</th>
              <th className="p-4">Subject</th>
              <th className="p-4">Due Date</th>
              <th className="p-4">Max Marks</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {loading ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-gray-400">
                  Loading homework assignments...
                </td>
              </tr>
            ) : homeworkList.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-gray-400">
                  No homework assignments found.
                </td>
              </tr>
            ) : (
              homeworkList.map((hw) => (
                <tr key={hw._id} className="hover:bg-gray-50/60 transition">
                  <td className="p-4 font-medium text-gray-900">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-600" />
                      <div>
                        <div>{hw.title}</div>
                        <span className="text-xs text-gray-400 font-normal uppercase">
                          {hw.homeworkType} | Max attempts: {hw.maxAttempts}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-gray-600">
                    {hw.classId?.name || hw.classId} — {hw.sectionId?.name || hw.sectionId}
                  </td>
                  <td className="p-4 text-gray-600">
                    <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-medium">
                      {hw.subjectId?.code || hw.subjectId?.name || 'SUB'}
                    </span>
                  </td>
                  <td className="p-4 text-gray-600 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    {new Date(hw.dueDate).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-gray-600 font-semibold">{hw.maxMarks || 'N/A'}</td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                        hw.status === 'PUBLISHED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : hw.status === 'SCHEDULED'
                          ? 'bg-blue-100 text-blue-800'
                          : hw.status === 'DRAFT'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {hw.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleArchive(hw._id)}
                      className="text-gray-400 hover:text-red-600 p-1 rounded transition"
                      title="Archive Homework"
                    >
                      <Archive className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 border border-gray-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-emerald-600" />
                Assign New Homework
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Academic Session ID
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.academicSessionId}
                    onChange={(e) =>
                      setFormData({ ...formData, academicSessionId: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Teaching Assignment ID
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.teachingAssignmentId}
                    onChange={(e) =>
                      setFormData({ ...formData, teachingAssignmentId: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Class ID
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.classId}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Section ID
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.sectionId}
                    onChange={(e) => setFormData({ ...formData, sectionId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Subject ID
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.subjectId}
                    onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Class Subject ID
                </label>
                <input
                  type="text"
                  required
                  value={formData.classSubjectId}
                  onChange={(e) =>
                    setFormData({ ...formData, classSubjectId: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Description / Instructions
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Homework Type
                  </label>
                  <select
                    value={formData.homeworkType}
                    onChange={(e) => setFormData({ ...formData, homeworkType: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-white"
                  >
                    <option value="HOMEWORK">HOMEWORK</option>
                    <option value="ASSIGNMENT">ASSIGNMENT</option>
                    <option value="PROJECT">PROJECT</option>
                    <option value="ACTIVITY">ACTIVITY</option>
                    <option value="READING">READING</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Max Attempts
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={formData.maxAttempts}
                    onChange={(e) => setFormData({ ...formData, maxAttempts: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Max Marks
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.maxMarks}
                    onChange={(e) => setFormData({ ...formData, maxMarks: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Due Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Scheduled Publish At (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.scheduledPublishAt}
                    onChange={(e) =>
                      setFormData({ ...formData, scheduledPublishAt: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow"
                >
                  Create Homework
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeworkListPage;
