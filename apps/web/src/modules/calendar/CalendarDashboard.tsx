import React, { useEffect, useState } from 'react';
import { apiClient } from '../../lib/api';
import {
  Calendar as CalendarIcon,
  RefreshCw,
  Bell,
  Clock,
  Info,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface CalendarEventRecord {
  _id: string;
  title: string;
  description?: string;
  category: 'HOLIDAY' | 'EVENT' | 'EXAM' | 'HOMEWORK' | 'ATTENDANCE' | 'FEE';
  priority: 'LOW' | 'NORMAL' | 'HIGH';
  colorHex?: string;
  startDate: string;
  endDate: string;
  isAllDay: boolean;
  referenceModule?: string;
  referenceId?: string;
}

export const CalendarDashboard: React.FC = () => {
  const [events, setEvents] = useState<CalendarEventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day' | 'agenda'>('month');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventRecord | null>(null);
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [reminderChannel, setReminderChannel] = useState<'IN_APP' | 'EMAIL' | 'SMS'>('IN_APP');
  const [reminderSuccess, setReminderSuccess] = useState<string | null>(null);

  const fetchCalendar = async () => {
    setLoading(true);
    setError(null);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const start = new Date(year, month - 1, 1).toISOString();
      const end = new Date(year, month + 2, 0).toISOString();

      const params = new URLSearchParams();
      params.append('startDate', start);
      params.append('endDate', end);
      if (selectedCategory !== 'ALL') params.append('category', selectedCategory);
      params.append('view', viewMode);

      const res = await apiClient.get(`/calendar?${params.toString()}`);
      setEvents(res.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load calendar events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendar();
  }, [selectedCategory, viewMode, currentDate]);

  const handleCreateReminder = async () => {
    if (!selectedEvent) return;
    try {
      await apiClient.post('/reminders', {
        calendarEventId: selectedEvent._id,
        reminderTime: new Date(new Date(selectedEvent.startDate).getTime() - 3600000).toISOString(),
        channels: [reminderChannel],
      });
      setReminderSuccess('Reminder scheduled successfully!');
      setTimeout(() => setReminderSuccess(null), 3000);
      setReminderModalOpen(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create reminder');
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'HOLIDAY':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'EXAM':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'HOMEWORK':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'FEE':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-indigo-600" />
            Event & Holiday Calendar
          </h1>
          <p className="text-sm text-gray-600">
            Unified view of academic terms, school events, exams, and official holidays
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const d = new Date(currentDate);
              d.setMonth(d.getMonth() - 1);
              setCurrentDate(d);
            }}
            className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <span className="text-sm font-semibold text-gray-800 min-w-[120px] text-center">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
          <button
            onClick={() => {
              const d = new Date(currentDate);
              d.setMonth(d.getMonth() + 1);
              setCurrentDate(d);
            }}
            className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={fetchCalendar}
            className="p-2 text-gray-600 hover:text-indigo-600 bg-white border border-gray-200 rounded-lg"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter & View Switcher */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
          {['ALL', 'HOLIDAY', 'EVENT', 'EXAM', 'HOMEWORK', 'FEE'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
          {(['month', 'week', 'day', 'agenda'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
                viewMode === mode
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {reminderSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3 text-emerald-800">
          <Info className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">{reminderSuccess}</p>
        </div>
      )}

      {/* Calendar Grid / Agenda Feed */}
      {loading ? (
        <div className="text-center py-12 text-gray-500 text-sm">Loading calendar events...</div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-900">No events scheduled</h3>
          <p className="text-sm text-gray-500 mt-1">
            There are no calendar events or holidays matching the selected filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((evt) => (
            <div
              key={evt._id}
              onClick={() => setSelectedEvent(evt)}
              className="bg-white p-4 rounded-xl border border-gray-200 hover:shadow-md transition-shadow cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${getCategoryColor(
                      evt.category
                    )}`}
                  >
                    {evt.category}
                  </span>
                  <span className="text-xs text-gray-400 font-medium">
                    {new Date(evt.startDate).toLocaleDateString()}
                  </span>
                </div>
                <h4 className="text-base font-semibold text-gray-900">{evt.title}</h4>
                {evt.description && (
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">{evt.description}</p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {evt.isAllDay ? 'All Day' : new Date(evt.startDate).toLocaleTimeString()}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedEvent(evt);
                    setReminderModalOpen(true);
                  }}
                  className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                >
                  <Bell className="w-3.5 h-3.5" />
                  Remind
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reminder Schedule Modal */}
      {reminderModalOpen && selectedEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">
              Set Reminder for &quot;{selectedEvent.title}&quot;
            </h3>
            <p className="text-xs text-gray-600">
              Choose your preferred notification channel. You will be reminded 1 hour before the event.
            </p>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-700">Notification Channel</label>
              <select
                value={reminderChannel}
                onChange={(e) => setReminderChannel(e.target.value as any)}
                className="w-full text-sm border border-gray-200 rounded-lg p-2"
              >
                <option value="IN_APP">In-App Notification</option>
                <option value="EMAIL">Email Alert</option>
                <option value="SMS">SMS Text Message</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setReminderModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateReminder}
                className="px-4 py-2 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Schedule Reminder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
