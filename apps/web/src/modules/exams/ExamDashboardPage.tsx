import React, { useState, useEffect } from 'react';

interface ExamItem {
  _id: string;
  name: string;
  academicSessionId: string;
  academicTermId: string;
  examType: 'UNIT_TEST' | 'MID_TERM' | 'FINAL' | 'PRACTICAL' | 'QUIZ' | 'MOCK';
  status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'COMPLETED' | 'ARCHIVED';
  startDate?: string;
  endDate?: string;
  description?: string;
  createdAt: string;
}

export const ExamDashboardPage: React.FC = () => {
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [examType, setExamType] = useState<ExamItem['examType']>('UNIT_TEST');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');

  const fetchExams = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/exams', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setExams(data.data || []);
      } else {
        setError(data.message || 'Failed to fetch examinations');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching examinations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        name,
        examType,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
        description,
        academicSessionId: '000000000000000000000001', // Default active session fallback
        academicTermId: '000000000000000000000001',
      };

      const res = await fetch('/api/v1/exams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsCreateModalOpen(false);
        setName('');
        setDescription('');
        fetchExams();
      } else {
        setError(data.message || 'Failed to create examination');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    }
  };

  const handlePublishExam = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/v1/exams/${id}/publish`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        fetchExams();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLockExam = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/v1/exams/${id}/lock`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        fetchExams();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredExams = exams.filter((ex) => {
    if (selectedStatus !== 'ALL' && ex.status !== selectedStatus) return false;
    if (selectedType !== 'ALL' && ex.examType !== selectedType) return false;
    return true;
  });

  const getStatusBadge = (status: ExamItem['status']) => {
    switch (status) {
      case 'PUBLISHED':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">PUBLISHED</span>;
      case 'SCHEDULED':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">SCHEDULED</span>;
      case 'COMPLETED':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">COMPLETED</span>;
      case 'ARCHIVED':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">ARCHIVED</span>;
      default:
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">DRAFT</span>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Examination Dashboard</h1>
          <p className="text-sm text-gray-500">
            Manage school examinations, academic terms, and lifecycle states.
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
        >
          + Create Examination
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 font-medium">TOTAL EXAMS</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{exams.length}</p>
        </div>
        <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 font-medium">PUBLISHED</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {exams.filter((e) => e.status === 'PUBLISHED').length}
          </p>
        </div>
        <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 font-medium">SCHEDULED</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {exams.filter((e) => e.status === 'SCHEDULED').length}
          </p>
        </div>
        <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 font-medium">COMPLETED</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">
            {exams.filter((e) => e.status === 'COMPLETED').length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Status Filter</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="PUBLISHED">Published</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Type Filter</label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Types</option>
            <option value="UNIT_TEST">Unit Test</option>
            <option value="MID_TERM">Mid Term</option>
            <option value="FINAL">Final</option>
            <option value="PRACTICAL">Practical</option>
            <option value="QUIZ">Quiz</option>
            <option value="MOCK">Mock</option>
          </select>
        </div>
      </div>

      {/* Examinations Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="p-4 text-xs font-semibold text-gray-600 uppercase">Exam Name</th>
              <th className="p-4 text-xs font-semibold text-gray-600 uppercase">Type</th>
              <th className="p-4 text-xs font-semibold text-gray-600 uppercase">Start Date</th>
              <th className="p-4 text-xs font-semibold text-gray-600 uppercase">End Date</th>
              <th className="p-4 text-xs font-semibold text-gray-600 uppercase">Status</th>
              <th className="p-4 text-xs font-semibold text-gray-600 uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-sm text-gray-500">
                  Loading examinations...
                </td>
              </tr>
            ) : filteredExams.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-sm text-gray-500">
                  No examinations match your filter criteria.
                </td>
              </tr>
            ) : (
              filteredExams.map((exam) => (
                <tr key={exam._id} className="hover:bg-gray-50 transition">
                  <td className="p-4">
                    <p className="text-sm font-medium text-gray-900">{exam.name}</p>
                    {exam.description && (
                      <p className="text-xs text-gray-500">{exam.description}</p>
                    )}
                  </td>
                  <td className="p-4 text-sm text-gray-700 font-medium">{exam.examType}</td>
                  <td className="p-4 text-sm text-gray-600">
                    {exam.startDate ? new Date(exam.startDate).toLocaleDateString() : '—'}
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    {exam.endDate ? new Date(exam.endDate).toLocaleDateString() : '—'}
                  </td>
                  <td className="p-4">{getStatusBadge(exam.status)}</td>
                  <td className="p-4 text-right space-x-2">
                    {exam.status === 'DRAFT' && (
                      <button
                        onClick={() => handlePublishExam(exam._id)}
                        className="px-3 py-1 bg-green-50 text-green-700 hover:bg-green-100 text-xs font-medium rounded-lg transition"
                      >
                        Publish
                      </button>
                    )}
                    {(exam.status === 'PUBLISHED' || exam.status === 'SCHEDULED') && (
                      <button
                        onClick={() => handleLockExam(exam._id)}
                        className="px-3 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-medium rounded-lg transition"
                      >
                        Lock Marks
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Create New Examination</h2>
            <form onSubmit={handleCreateExam} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Exam Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Mid-Term Assessment 2026"
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Exam Type</label>
                <select
                  value={examType}
                  onChange={(e) => setExamType(e.target.value as any)}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="UNIT_TEST">Unit Test</option>
                  <option value="MID_TERM">Mid Term</option>
                  <option value="FINAL">Final</option>
                  <option value="PRACTICAL">Practical</option>
                  <option value="QUIZ">Quiz</option>
                  <option value="MOCK">Mock</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description / Instructions</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional details..."
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
