import React, { useEffect, useState } from 'react';
import { apiClient } from '../../lib/api';
import {
  Calendar as CalendarIcon,
  CheckSquare,
  Sun,
  Plus,
  AlertCircle,
} from 'lucide-react';

interface CalendarEventRecord {
  id: string;
  title: string;
  eventType: string;
  startDate: string;
  endDate: string;
  isWorkingDay: boolean;
  appliesToAllClasses: boolean;
  status: string;
}

interface WorkingDayRuleRecord {
  id: string;
  workingDays: string[];
  status: string;
}

interface HolidayRecord {
  id: string;
  title: string;
  holidayType: string;
  startDate: string;
  endDate: string;
  isOptionalHoliday: boolean;
  affectsAttendance: boolean;
  status: string;
}

interface AcademicSessionRecord {
  id: string;
  name: string;
  isCurrent: boolean;
}

export const AcademicCalendarPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'events' | 'rules' | 'holidays'>('events');

  const [sessions, setSessions] = useState<AcademicSessionRecord[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState('');

  const [events, setEvents] = useState<CalendarEventRecord[]>([]);
  const [workingRule, setWorkingRule] = useState<WorkingDayRuleRecord | null>(null);
  const [holidays, setHolidays] = useState<HolidayRecord[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showEventModal, setShowEventModal] = useState(false);
  const [showHolidayModal, setShowHolidayModal] = useState(false);

  // Event form
  const [eventTitle, setEventTitle] = useState('');
  const [eventType, setEventType] = useState('ACADEMIC');
  const [eventStart, setEventStart] = useState('');
  const [eventEnd, setEventEnd] = useState('');
  const [eventWorking, setEventWorking] = useState(true);

  // Holiday form
  const [holTitle, setHolTitle] = useState('');
  const [holType, setHolType] = useState('NATIONAL');
  const [holStart, setHolStart] = useState('');
  const [holEnd, setHolEnd] = useState('');
  const [holOptional, setHolOptional] = useState(false);
  const [holAttendance, setHolAttendance] = useState(true);

  // Working Days checkboxes
  const [workingDays, setWorkingDays] = useState<string[]>([
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
    'SATURDAY',
  ]);

  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchRefs = async () => {
    try {
      const res = await apiClient.get('/academic-sessions');
      const sList = res.data.data || [];
      setSessions(sList);
      const curr = sList.find((s: AcademicSessionRecord) => s.isCurrent) || sList[0];
      if (curr) {
        setSelectedSessionId(curr.id);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error loading academic sessions');
    }
  };

  useEffect(() => {
    fetchRefs();
  }, []);

  const fetchEvents = async () => {
    if (!selectedSessionId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(
        `/academic-calendar?academicSessionId=${selectedSessionId}`,
      );
      setEvents(res.data.data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch calendar events');
    } finally {
      setLoading(false);
    }
  };

  const fetchRules = async () => {
    if (!selectedSessionId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(
        `/working-day-rules?academicSessionId=${selectedSessionId}`,
      );
      const rList = res.data.data || [];
      if (rList.length > 0) {
        setWorkingRule(rList[0]);
        setWorkingDays(rList[0].workingDays || []);
      } else {
        setWorkingRule(null);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch working day rules');
    } finally {
      setLoading(false);
    }
  };

  const fetchHolidays = async () => {
    if (!selectedSessionId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(
        `/holidays?academicSessionId=${selectedSessionId}`,
      );
      setHolidays(res.data.data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch holidays');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'events') fetchEvents();
    if (activeTab === 'rules') fetchRules();
    if (activeTab === 'holidays') fetchHolidays();
  }, [activeTab, selectedSessionId]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await apiClient.post('/academic-calendar', {
        academicSessionId: selectedSessionId,
        title: eventTitle,
        eventType,
        startDate: eventStart,
        endDate: eventEnd || eventStart,
        isWorkingDay: eventWorking,
        appliesToAllClasses: true,
      });
      setShowEventModal(false);
      fetchEvents();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to create calendar event');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await apiClient.post('/holidays', {
        academicSessionId: selectedSessionId,
        title: holTitle,
        holidayType: holType,
        startDate: holStart,
        endDate: holEnd || holStart,
        isOptionalHoliday: holOptional,
        affectsAttendance: holAttendance,
      });
      setShowHolidayModal(false);
      fetchHolidays();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to create holiday');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveWorkingDays = async () => {
    if (!selectedSessionId) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiClient.put('/working-day-rules', {
        academicSessionId: selectedSessionId,
        workingDays,
        customWorkingDays: [],
        customNonWorkingDays: [],
      });
      fetchRules();
      alert('Working day rule saved successfully');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save working day rule');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleDay = (day: string) => {
    setWorkingDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Academic Calendar & Working Day Rules
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage academic events, holidays, and school working day configurations
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {sessions.length > 0 && (
            <select
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-gray-800 border rounded-lg text-sm font-medium"
            >
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.isCurrent ? '(Current)' : ''}
                </option>
              ))}
            </select>
          )}
          {activeTab === 'events' && (
            <button
              onClick={() => {
                setFormError(null);
                setShowEventModal(true);
              }}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Calendar Event
            </button>
          )}
          {activeTab === 'holidays' && (
            <button
              onClick={() => {
                setFormError(null);
                setShowHolidayModal(true);
              }}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Holiday
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('events')}
            className={`flex items-center pb-4 px-1 border-b-2 font-medium text-sm transition ${
              activeTab === 'events'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400'
            }`}
          >
            <CalendarIcon className="w-4 h-4 mr-2" />
            Calendar Events
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`flex items-center pb-4 px-1 border-b-2 font-medium text-sm transition ${
              activeTab === 'rules'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400'
            }`}
          >
            <CheckSquare className="w-4 h-4 mr-2" />
            Working Day Rules
          </button>
          <button
            onClick={() => setActiveTab('holidays')}
            className={`flex items-center pb-4 px-1 border-b-2 font-medium text-sm transition ${
              activeTab === 'holidays'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400'
            }`}
          >
            <Sun className="w-4 h-4 mr-2" />
            Holidays
          </button>
        </nav>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 flex items-center">
          <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading && (
        <div className="text-center py-4 text-sm text-gray-500">
          Loading calendar data...
        </div>
      )}

      {/* EVENTS TAB */}
      {activeTab === 'events' && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dates
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Working Day
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {events.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    No academic calendar events created for this session yet.
                  </td>
                </tr>
              ) : (
                events.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-white">
                      {e.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {e.eventType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {e.startDate} to {e.endDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {e.isWorkingDay ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                          Yes
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold">
                          No
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* RULES TAB */}
      {activeTab === 'rules' && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700 max-w-2xl">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Configure Standard Working Days
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            Select the default instructional days of the week for this academic session.
          </p>

          {workingRule && (
            <div className="mb-4 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              Rule Status: {workingRule.status}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mb-6">
            {[
              'MONDAY',
              'TUESDAY',
              'WEDNESDAY',
              'THURSDAY',
              'FRIDAY',
              'SATURDAY',
              'SUNDAY',
            ].map((day) => (
              <label
                key={day}
                className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={workingDays.includes(day)}
                  onChange={() => toggleDay(day)}
                  className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="font-medium text-gray-900 dark:text-white">{day}</span>
              </label>
            ))}
          </div>

          <button
            onClick={handleSaveWorkingDays}
            disabled={submitting}
            className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition"
          >
            {submitting ? 'Saving...' : 'Save Working Day Rule'}
          </button>
        </div>
      )}

      {/* HOLIDAYS TAB */}
      {activeTab === 'holidays' && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Holiday Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dates
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Optional Holiday
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Affects Attendance
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {holidays.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No holidays scheduled yet for this session.
                  </td>
                </tr>
              ) : (
                holidays.map((h) => (
                  <tr key={h.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-white">
                      {h.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {h.holidayType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                      {h.startDate} to {h.endDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {h.isOptionalHoliday ? (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                          Optional
                        </span>
                      ) : (
                        'No'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {h.affectsAttendance ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                          Yes
                        </span>
                      ) : (
                        'No'
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Create Calendar Event
            </h3>
            {formError && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded text-sm">
                {formError}
              </div>
            )}
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Event Title
                </label>
                <input
                  type="text"
                  required
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="e.g. Annual Sports Meet"
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Event Type
                </label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="ACADEMIC">Academic</option>
                  <option value="EXAMINATION">Examination</option>
                  <option value="CO_CURRICULAR">Co-Curricular</option>
                  <option value="SPORTS">Sports</option>
                  <option value="CULTURAL">Cultural</option>
                  <option value="ADMINISTRATIVE">Administrative</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={eventStart}
                    onChange={(e) => setEventStart(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    value={eventEnd}
                    onChange={(e) => setEventEnd(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="eventWorking"
                  checked={eventWorking}
                  onChange={(e) => setEventWorking(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="eventWorking"
                  className="text-sm text-gray-700 dark:text-gray-300"
                >
                  This event is a working/instructional day
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
                >
                  {submitting ? 'Creating...' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Holiday Modal */}
      {showHolidayModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Create Holiday
            </h3>
            {formError && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded text-sm">
                {formError}
              </div>
            )}
            <form onSubmit={handleCreateHoliday} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Holiday Title
                </label>
                <input
                  type="text"
                  required
                  value={holTitle}
                  onChange={(e) => setHolTitle(e.target.value)}
                  placeholder="e.g. Independence Day"
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Holiday Type
                </label>
                <select
                  value={holType}
                  onChange={(e) => setHolType(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="NATIONAL">National Holiday</option>
                  <option value="STATE">State Holiday</option>
                  <option value="SCHOOL">School Holiday</option>
                  <option value="OPTIONAL">Optional Holiday</option>
                  <option value="EMERGENCY_CLOSURE">Emergency Closure</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={holStart}
                    onChange={(e) => setHolStart(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    value={holEnd}
                    onChange={(e) => setHolEnd(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="holOptional"
                  checked={holOptional}
                  onChange={(e) => setHolOptional(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="holOptional"
                  className="text-sm text-gray-700 dark:text-gray-300"
                >
                  Optional Holiday
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="holAttendance"
                  checked={holAttendance}
                  onChange={(e) => setHolAttendance(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="holAttendance"
                  className="text-sm text-gray-700 dark:text-gray-300"
                >
                  Affects Attendance (no attendance marking required)
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowHolidayModal(false)}
                  className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
                >
                  {submitting ? 'Creating...' : 'Create Holiday'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
