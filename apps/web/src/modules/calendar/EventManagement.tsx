import React, { useEffect, useState } from 'react';
import { apiClient } from '../../lib/api';
import {
  Calendar,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Users,
  MapPin,
} from 'lucide-react';

interface SchoolEventRecord {
  _id: string;
  name: string;
  eventType: string;
  startDate: string;
  endDate: string;
  isAllDay: boolean;
  location?: string;
  visibility: 'SCHOOL_WIDE' | 'TEACHERS_ONLY' | 'CLASS_SPECIFIC';
  targetClassIds?: { _id: string; name: string }[];
}

export const EventManagement: React.FC = () => {
  const [events, setEvents] = useState<SchoolEventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    eventType: 'ACADEMIC',
    startDate: '',
    endDate: '',
    isAllDay: false,
    location: '',
    visibility: 'SCHOOL_WIDE' as 'SCHOOL_WIDE' | 'TEACHERS_ONLY' | 'CLASS_SPECIFIC',
    targetClassIds: [] as string[],
    academicSessionId: '60d5ecb8b5c9c62b3c7c4b5b',
  });
  const [classIdInput, setClassIdInput] = useState('');

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/events');
      setEvents(res.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch school events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const targetClassIds =
        formData.visibility === 'CLASS_SPECIFIC' && classIdInput.trim()
          ? classIdInput.split(',').map((id) => id.trim())
          : undefined;

      await apiClient.post('/events', {
        ...formData,
        targetClassIds,
      });

      setSuccess('School event published successfully!');
      setTimeout(() => setSuccess(null), 3000);
      setModalOpen(false);
      fetchEvents();
    } catch (err: any) {
      setError(
        err.response?.status === 403
          ? 'RBAC Permission Denied: Teachers can only author events for classes assigned via active TeachingAssignment.'
          : err.response?.data?.message || 'Failed to create school event'
      );
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await apiClient.patch(`/events/${id}/archive`);
      setSuccess('Event archived successfully');
      setTimeout(() => setSuccess(null), 3000);
      fetchEvents();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to archive event');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-indigo-600" />
            School Event Manager
          </h1>
          <p className="text-sm text-gray-600">
            Author and broadcast academic, cultural, and sports events with target audience scoping
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Event
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
        <div className="text-center py-12 text-gray-500 text-sm">Loading school events...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.length === 0 ? (
            <div className="col-span-3 bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
              No active school events found.
            </div>
          ) : (
            events.map((evt) => (
              <div
                key={evt._id}
                className="bg-white p-4 rounded-xl border border-gray-200 hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-md">
                      {evt.eventType}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(evt.startDate).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-gray-900">{evt.name}</h4>
                  {evt.location && (
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {evt.location}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-gray-400" />
                    {evt.visibility}
                  </span>
                  <button
                    onClick={() => handleArchive(evt._id)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded-lg"
                    title="Archive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* New Event Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">Create School Event</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-700">Event Title</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full text-sm border border-gray-200 rounded-lg p-2 mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700">Event Type</label>
                  <select
                    value={formData.eventType}
                    onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                    className="w-full text-sm border border-gray-200 rounded-lg p-2 mt-1"
                  >
                    <option value="ACADEMIC">ACADEMIC</option>
                    <option value="SPORTS">SPORTS</option>
                    <option value="CULTURAL">CULTURAL</option>
                    <option value="PTM">PTM</option>
                    <option value="MEETING">MEETING</option>
                    <option value="EXAM">EXAM</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700">Audience Scope</label>
                  <select
                    value={formData.visibility}
                    onChange={(e) => setFormData({ ...formData, visibility: e.target.value as any })}
                    className="w-full text-sm border border-gray-200 rounded-lg p-2 mt-1"
                  >
                    <option value="SCHOOL_WIDE">SCHOOL_WIDE</option>
                    <option value="TEACHERS_ONLY">TEACHERS_ONLY</option>
                    <option value="CLASS_SPECIFIC">CLASS_SPECIFIC</option>
                  </select>
                </div>
              </div>

              {formData.visibility === 'CLASS_SPECIFIC' && (
                <div>
                  <label className="text-xs font-semibold text-gray-700">
                    Target Class IDs (comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 60d5ecb8b5c9c62b3c7c4b5b"
                    value={classIdInput}
                    onChange={(e) => setClassIdInput(e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-lg p-2 mt-1"
                  />
                </div>
              )}

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
                  Publish Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
