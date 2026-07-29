import React, { useState, useEffect } from 'react';
import { apiClient } from '../../lib/api';
import {
  Plus,
  Search,
  Upload,
  History,
  ExternalLink,
  Archive,
  AlertCircle,
  X,
  File,
  Video,
  Link as LinkIcon,
} from 'lucide-react';

export const StudyMaterialPage: React.FC = () => {
  const [materialList, setMaterialList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [formData, setFormData] = useState<any>({
    academicSessionId: '',
    teachingAssignmentId: '',
    classSubjectId: '',
    classId: '',
    sectionId: '',
    subjectId: '',
    uploaderTeacherId: '',
    title: '',
    description: '',
    materialType: 'NOTES',
    fileUrl: '',
    fileMimeType: 'application/pdf',
    publishAt: '',
    expireAt: '',
    changelog: 'Initial upload',
  });

  // Version History Modal
  const [selectedHistory, setSelectedHistory] = useState<any | null>(null);

  const fetchMaterials = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await apiClient.get('/api/v1/study-material', {
        params: { search: search || undefined },
      });
      setMaterialList(res.data.data || []);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to load study materials');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, [search]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        publishAt: formData.publishAt ? new Date(formData.publishAt).toISOString() : undefined,
        expireAt: formData.expireAt ? new Date(formData.expireAt).toISOString() : undefined,
      };
      await apiClient.post('/api/v1/study-material', payload);
      setShowCreateModal(false);
      fetchMaterials();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Error creating study material');
    }
  };

  const handleArchive = async (id: string) => {
    if (!window.confirm('Are you sure you want to archive this study material?')) return;
    try {
      await apiClient.patch(`/api/v1/study-material/${id}/archive`);
      fetchMaterials();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Error archiving study material');
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'VIDEO':
        return <Video className="w-5 h-5 text-purple-600" />;
      case 'LINK':
        return <LinkIcon className="w-5 h-5 text-blue-600" />;
      default:
        return <File className="w-5 h-5 text-emerald-600" />;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">
            Study Material Repository
          </h1>
          <p className="text-sm text-gray-500">
            Upload notes, presentations, videos, and reference links with immutable version history
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-md flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" />
          Upload Material
        </button>
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search study material title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
          />
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
              <th className="p-4">Version</th>
              <th className="p-4">Access Window</th>
              <th className="p-4">Link</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {loading ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-gray-400">
                  Loading study materials...
                </td>
              </tr>
            ) : materialList.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-gray-400">
                  No study materials uploaded yet.
                </td>
              </tr>
            ) : (
              materialList.map((mat) => (
                <tr key={mat._id} className="hover:bg-gray-50/60 transition">
                  <td className="p-4 font-medium text-gray-900">
                    <div className="flex items-center gap-3">
                      {getIconForType(mat.materialType)}
                      <div>
                        <div>{mat.title}</div>
                        <span className="text-xs text-gray-400 uppercase">
                          {mat.materialType}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-gray-600">
                    {mat.classId?.name || mat.classId} — {mat.sectionId?.name || mat.sectionId}
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-medium text-gray-700">
                      {mat.subjectId?.code || mat.subjectId?.name || 'SUB'}
                    </span>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => setSelectedHistory(mat)}
                      className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-emerald-100"
                    >
                      <History className="w-3.5 h-3.5" />v{mat.currentVersion}
                    </button>
                  </td>
                  <td className="p-4 text-gray-600 text-xs">
                    {mat.publishAt && <div>Pub: {new Date(mat.publishAt).toLocaleDateString()}</div>}
                    {mat.expireAt && <div>Exp: {new Date(mat.expireAt).toLocaleDateString()}</div>}
                    {!mat.publishAt && !mat.expireAt && <span className="text-gray-400">Always Open</span>}
                  </td>
                  <td className="p-4">
                    <a
                      href={mat.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-1 text-xs"
                    >
                      View File <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleArchive(mat._id)}
                      className="text-gray-400 hover:text-red-600 p-1 rounded transition"
                      title="Archive Material"
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

      {/* Version History Modal */}
      {selectedHistory && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-gray-100 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <History className="w-5 h-5 text-emerald-600" />
                Version History — {selectedHistory.title}
              </h2>
              <button
                onClick={() => setSelectedHistory(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {selectedHistory.versionHistory?.map((ver: any, index: number) => (
                <div
                  key={index}
                  className="p-3 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-gray-800 text-sm">
                      Version {ver.version} — <span className="uppercase text-xs">{ver.materialType}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Uploaded at: {new Date(ver.changedAt).toLocaleString()}
                    </div>
                    {ver.changelog && (
                      <div className="text-xs text-emerald-700 mt-1 font-medium">
                        "{ver.changelog}"
                      </div>
                    )}
                  </div>
                  <a
                    href={ver.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-blue-600 hover:bg-gray-50 flex items-center gap-1"
                  >
                    Open <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedHistory(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full p-6 border border-gray-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Upload className="w-5 h-5 text-emerald-600" />
                Upload New Study Material
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

              <div className="grid grid-cols-2 gap-4">
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
                    Uploader Teacher ID
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.uploaderTeacherId}
                    onChange={(e) =>
                      setFormData({ ...formData, uploaderTeacherId: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Material Type
                  </label>
                  <select
                    value={formData.materialType}
                    onChange={(e) => setFormData({ ...formData, materialType: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg bg-white"
                  >
                    <option value="NOTES">NOTES</option>
                    <option value="PDF">PDF</option>
                    <option value="PRESENTATION">PRESENTATION</option>
                    <option value="VIDEO">VIDEO</option>
                    <option value="LINK">LINK</option>
                    <option value="REFERENCE_MATERIAL">REFERENCE_MATERIAL</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    File URL (PDF / Video / Web)
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://example.com/notes-chapter-1.pdf"
                    value={formData.fileUrl}
                    onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Publish At (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.publishAt}
                    onChange={(e) => setFormData({ ...formData, publishAt: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Expire At (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.expireAt}
                    onChange={(e) => setFormData({ ...formData, expireAt: e.target.value })}
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
                  Upload Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyMaterialPage;
