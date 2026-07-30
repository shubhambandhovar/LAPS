import React, { useEffect, useState } from 'react';
import { apiClient } from '../../lib/api';
import {
  Bell,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Mail,
  Smartphone,
  MessageSquare,
  RefreshCw,
} from 'lucide-react';

interface ReminderRecord {
  _id: string;
  calendarEventId?: {
    _id: string;
    title: string;
    startDate: string;
    category: string;
  };
  reminderTime: string;
  channels: ('IN_APP' | 'EMAIL' | 'SMS')[];
  status: 'PENDING' | 'SENT' | 'FAILED';
}

export const EventReminders: React.FC = () => {
  const [reminders, setReminders] = useState<ReminderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchReminders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/reminders');
      setReminders(res.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch reminders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, []);

  const handleCancel = async (id: string) => {
    try {
      await apiClient.delete(`/reminders/${id}`);
      setSuccess('Reminder cancelled successfully');
      setTimeout(() => setSuccess(null), 3000);
      fetchReminders();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to cancel reminder');
    }
  };

  const renderChannelIcon = (ch: string) => {
    switch (ch) {
      case 'EMAIL':
        return <Mail className="w-3.5 h-3.5 text-blue-600" key={ch} />;
      case 'SMS':
        return <Smartphone className="w-3.5 h-3.5 text-emerald-600" key={ch} />;
      default:
        return <MessageSquare className="w-3.5 h-3.5 text-indigo-600" key={ch} />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-indigo-600" />
            Event Reminder Center
          </h1>
          <p className="text-sm text-gray-600">
            Manage your personal notification alerts for upcoming exams, homework, and events
          </p>
        </div>
        <button
          onClick={fetchReminders}
          className="p-2 text-gray-600 hover:text-indigo-600 bg-white border border-gray-200 rounded-lg"
        >
          <RefreshCw className="w-4 h-4" />
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
        <div className="text-center py-12 text-gray-500 text-sm">Loading reminders...</div>
      ) : reminders.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Bell className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-900">No scheduled reminders</h3>
          <p className="text-sm text-gray-500 mt-1">
            You have no active reminders. Click &quot;Remind&quot; on any calendar event to get started.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase">
                <th className="py-3 px-4">Event Title</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Reminder Time</th>
                <th className="py-3 px-4">Channels</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {reminders.map((rem) => (
                <tr key={rem._id} className="hover:bg-gray-50/50">
                  <td className="py-3 px-4 font-semibold text-gray-900">
                    {rem.calendarEventId?.title || 'Event Removed'}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                      {rem.calendarEventId?.category || 'EVENT'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {new Date(rem.reminderTime).toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      {rem.channels.map((ch) => renderChannelIcon(ch))}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-md text-xs font-semibold ${
                        rem.status === 'SENT'
                          ? 'bg-emerald-100 text-emerald-800'
                          : rem.status === 'FAILED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {rem.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleCancel(rem._id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded-lg"
                      title="Cancel Reminder"
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
    </div>
  );
};
