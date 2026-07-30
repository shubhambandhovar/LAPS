import React, { useEffect, useState } from 'react';
import { apiClient } from '../../lib/api';
import {
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  Archive,
  FileText,
  AlertCircle,
  Paperclip,
} from 'lucide-react';

interface NoticeRecord {
  _id: string;
  title: string;
  content: string;
  type: 'SCHOOL_NOTICE' | 'CIRCULAR' | 'ANNOUNCEMENT' | 'EVENT';
  status: 'DRAFT' | 'PUBLISHED' | 'EXPIRED' | 'ARCHIVED';
  targetRoles: string[];
  publishDate?: string;
  expiryDate?: string;
  createdAt: string;
}

export const NoticeManager: React.FC = () => {
  const [notices, setNotices] = useState<NoticeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<'SCHOOL_NOTICE' | 'CIRCULAR' | 'ANNOUNCEMENT' | 'EVENT'>('SCHOOL_NOTICE');
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED'>('DRAFT');
  const [targetRoles, setTargetRoles] = useState<string[]>(['ALL']);
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchAdminNotices = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/notices/admin');
      setNotices(res.data.data?.notices || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load notices for management');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminNotices();
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    setTitle('');
    setContent('');
    setType('SCHOOL_NOTICE');
    setStatus('DRAFT');
    setTargetRoles(['ALL']);
    setExpiryDate('');
    setFormError(null);
    setShowModal(true);
  };

  const handleOpenEdit = (item: NoticeRecord) => {
    setEditingId(item._id);
    setTitle(item.title);
    setContent(item.content);
    setType(item.type);
    setStatus(item.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT');
    setTargetRoles(item.targetRoles || ['ALL']);
    setExpiryDate(item.expiryDate ? item.expiryDate.split('T')[0] : '');
    setFormError(null);
    setShowModal(true);
  };

  const handleSaveNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      const payload: any = {
        title,
        content,
        type,
        status,
        targetRoles,
        expiryDate: expiryDate ? new Date(expiryDate).toISOString() : undefined,
      };

      if (editingId) {
        await apiClient.put(`/notices/${editingId}`, payload);
      } else {
        await apiClient.post('/notices', payload);
      }

      setShowModal(false);
      fetchAdminNotices();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to save notice');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await apiClient.patch(`/notices/${id}/publish`);
      fetchAdminNotices();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to publish notice');
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await apiClient.patch(`/notices/${id}/archive`);
      fetchAdminNotices();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to archive notice');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this notice?')) return;
    try {
      await apiClient.delete(`/notices/${id}`);
      fetchAdminNotices();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete notice');
    }
  };

  const toggleRole = (role: string) => {
    if (role === 'ALL') {
      setTargetRoles(['ALL']);
      return;
    }
    const filtered = targetRoles.filter((r) => r !== 'ALL');
    if (filtered.includes(role)) {
      const remaining = filtered.filter((r) => r !== role);
      setTargetRoles(remaining.length === 0 ? ['ALL'] : remaining);
    } else {
      setTargetRoles([...filtered, role]);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notice & Circular Manager</h1>
            <p className="text-sm text-gray-500">Author, schedule, publish, and manage school notices and circulars</p>
          </div>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Create Notice</span>
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3 text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading notices...</div>
      ) : notices.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium mb-4">No notices authored yet</p>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
          >
            Create Your First Notice
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold uppercase text-gray-500">
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Target Audience</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Publish Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {notices.map((item) => (
                <tr key={item._id} className="hover:bg-gray-50/50">
                  <td className="py-3 px-4 font-semibold text-gray-900">{item.title}</td>
                  <td className="py-3 px-4 text-gray-600">{item.type}</td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {item.targetRoles.map((role, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded"
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                        item.status === 'PUBLISHED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.status === 'ARCHIVED'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-500">
                    {item.publishDate
                      ? new Date(item.publishDate).toLocaleDateString()
                      : '-'}
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    {item.status === 'DRAFT' && (
                      <button
                        onClick={() => handlePublish(item._id)}
                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded"
                        title="Publish Notice"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                      title="Edit Notice"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {item.status !== 'ARCHIVED' && (
                      <button
                        onClick={() => handleArchive(item._id)}
                        className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                        title="Archive Notice"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(item._id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                      title="Delete Notice"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingId ? 'Edit Notice' : 'Create Notice / Circular'}
            </h2>

            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveNotice} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Notice Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Annual Exam Timetable Circular"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Notice Type *
                  </label>
                  <select
                    value={type}
                    onChange={(e: any) => setType(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="SCHOOL_NOTICE">School Notice</option>
                    <option value="CIRCULAR">Circular</option>
                    <option value="ANNOUNCEMENT">Announcement</option>
                    <option value="EVENT">Event</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Initial Status
                  </label>
                  <select
                    value={status}
                    onChange={(e: any) => setStatus(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Target Roles
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    'ALL',
                    'STUDENT',
                    'GUARDIAN',
                    'TEACHER',
                    'ACCOUNTANT',
                    'SCHOOL_ADMIN',
                  ].map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => toggleRole(role)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                        targetRoles.includes(role)
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Notice Content *
                </label>
                <textarea
                  required
                  rows={5}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Enter detailed notice content or instructions..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Expiry Date (Optional)
                </label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Notice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
