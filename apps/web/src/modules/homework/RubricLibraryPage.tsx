import React, { useState, useEffect } from 'react';
import { apiClient } from '../../lib/api';
import {
  Award,
  Plus,
  Share2,
  Lock,
  Archive,
  AlertCircle,
  X,
} from 'lucide-react';

export const RubricLibraryPage: React.FC = () => {
  const [rubricList, setRubricList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [formData, setFormData] = useState<any>({
    academicSessionId: '',
    title: '',
    description: '',
    subjectId: '',
    createdByTeacherId: '',
    isShared: false,
    criteria: [
      { criterion: 'Accuracy & Completeness', maxMarks: 50, description: 'Correct answers' },
      { criterion: 'Presentation & Formatting', maxMarks: 50, description: 'Clean layout' },
    ],
  });

  const fetchRubrics = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await apiClient.get('/api/v1/rubrics');
      setRubricList(res.data.data || []);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to load rubric templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRubrics();
  }, []);

  const handleAddCriterion = () => {
    setFormData({
      ...formData,
      criteria: [
        ...formData.criteria,
        { criterion: '', maxMarks: 10, description: '' },
      ],
    });
  };

  const handleRemoveCriterion = (index: number) => {
    const updated = [...formData.criteria];
    updated.splice(index, 1);
    setFormData({ ...formData, criteria: updated });
  };

  const handleCriterionChange = (index: number, field: string, value: any) => {
    const updated = [...formData.criteria];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, criteria: updated });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        criteria: formData.criteria.map((c: any) => ({
          ...c,
          maxMarks: Number(c.maxMarks),
        })),
        subjectId: formData.subjectId || undefined,
      };

      await apiClient.post('/api/v1/rubrics', payload);
      setShowCreateModal(false);
      fetchRubrics();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Error creating rubric template');
    }
  };

  const handleArchive = async (id: string) => {
    if (!window.confirm('Are you sure you want to archive this rubric template?')) return;
    try {
      await apiClient.patch(`/api/v1/rubrics/${id}/archive`);
      fetchRubrics();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Error archiving rubric template');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">
            Rubric Template Library
          </h1>
          <p className="text-sm text-gray-500">
            Create reusable grading rubrics and share across departmental teachers
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-md flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" />
          Create Rubric Template
        </button>
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Grid of Rubrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 text-center py-12 text-gray-400">
            Loading rubric templates...
          </div>
        ) : rubricList.length === 0 ? (
          <div className="col-span-3 text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100">
            No rubric templates created yet.
          </div>
        ) : (
          rubricList.map((rubric) => (
            <div
              key={rubric._id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition space-y-4"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase flex items-center gap-1 ${
                      rubric.isShared
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {rubric.isShared ? (
                      <>
                        <Share2 className="w-3 h-3" /> Shared Departmental
                      </>
                    ) : (
                      <>
                        <Lock className="w-3 h-3" /> Private Teacher
                      </>
                    )}
                  </span>
                  <button
                    onClick={() => handleArchive(rubric._id)}
                    className="text-gray-400 hover:text-red-600 p-1"
                    title="Archive Rubric"
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="text-lg font-bold text-gray-900 mt-3 flex items-center gap-2">
                  <Award className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  {rubric.title}
                </h3>
                {rubric.description && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {rubric.description}
                  </p>
                )}

                <div className="mt-4 space-y-2">
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Criteria ({rubric.criteria?.length || 0})
                  </div>
                  <div className="space-y-1">
                    {rubric.criteria?.map((c: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded-lg text-gray-700"
                      >
                        <span className="font-medium truncate max-w-[180px]">
                          {c.criterion}
                        </span>
                        <span className="font-bold text-emerald-700">
                          {c.maxMarks} pts
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-gray-800">
                <span>Total Maximum Score</span>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-lg">
                  {rubric.totalMaxMarks} pts
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full p-6 border border-gray-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-600" />
                Create Rubric Template
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
                    Created By Teacher ID
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.createdByTeacherId}
                    onChange={(e) =>
                      setFormData({ ...formData, createdByTeacherId: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Standard Coding Rubric"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Subject ID (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Leave empty for all subjects"
                    value={formData.subjectId}
                    onChange={(e) =>
                      setFormData({ ...formData, subjectId: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="shareDept"
                  checked={formData.isShared}
                  onChange={(e) =>
                    setFormData({ ...formData, isShared: e.target.checked })
                  }
                  className="w-4 h-4 text-emerald-600 rounded"
                />
                <label htmlFor="shareDept" className="text-sm font-medium text-gray-700">
                  Share template with departmental teachers (isShared = true)
                </label>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-gray-500">
                    Rubric Criteria
                  </span>
                  <button
                    type="button"
                    onClick={handleAddCriterion}
                    className="text-xs text-emerald-600 font-semibold hover:underline"
                  >
                    + Add Criterion
                  </button>
                </div>

                {formData.criteria.map((c: any, index: number) => (
                  <div
                    key={index}
                    className="grid grid-cols-12 gap-2 items-center bg-gray-50 p-3 rounded-xl border border-gray-100"
                  >
                    <div className="col-span-7">
                      <input
                        type="text"
                        placeholder="Criterion Name"
                        required
                        value={c.criterion}
                        onChange={(e) =>
                          handleCriterionChange(index, 'criterion', e.target.value)
                        }
                        className="w-full px-2 py-1.5 border rounded-lg text-xs"
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        placeholder="Max Pts"
                        min={1}
                        required
                        value={c.maxMarks}
                        onChange={(e) =>
                          handleCriterionChange(index, 'maxMarks', e.target.value)
                        }
                        className="w-full px-2 py-1.5 border rounded-lg text-xs"
                      />
                    </div>
                    <div className="col-span-2 text-right">
                      {formData.criteria.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCriterion(index)}
                          className="text-red-500 hover:text-red-700 text-xs font-semibold"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
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
                  Save Rubric
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RubricLibraryPage;
