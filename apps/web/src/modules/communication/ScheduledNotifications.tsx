import React, { useEffect, useState } from 'react';
import { apiClient } from '../../lib/api';
import {
  Clock,
  Plus,
  XCircle,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

interface ScheduledJobRecord {
  _id: string;
  title: string;
  message: string;
  category: string;
  priority: string;
  targetType: string;
  scheduleType: string;
  scheduledAt?: string;
  cronExpression?: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED' | 'FAILED';
  totalRecipients: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  createdAt: string;
}

export const ScheduledNotifications: React.FC = () => {
  const [jobs, setJobs] = useState<ScheduledJobRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('GENERAL');
  const [priority, setPriority] = useState('NORMAL');
  const [targetType, setTargetType] = useState('ALL');
  const [targetRoles, setTargetRoles] = useState<string[]>(['ALL']);
  const [scheduleType, setScheduleType] = useState('SCHEDULED');
  const [scheduledAt, setScheduledAt] = useState('');
  const [cronExpression, setCronExpression] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/scheduled-notifications');
      setJobs(res.data.data?.jobs || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load scheduled notification jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleOpenCreate = () => {
    setTitle('');
    setMessage('');
    setCategory('GENERAL');
    setPriority('NORMAL');
    setTargetType('ALL');
    setTargetRoles(['ALL']);
    setScheduleType('SCHEDULED');
    setScheduledAt('');
    setCronExpression('');
    setFormError(null);
    setShowModal(true);
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      const payload: any = {
        title,
        message,
        category,
        priority,
        targetType,
        targetRoles: targetType === 'ROLE' ? targetRoles : undefined,
        scheduleType,
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
        cronExpression: scheduleType === 'RECURRING' ? cronExpression : undefined,
      };

      await apiClient.post('/scheduled-notifications', payload);
      setShowModal(false);
      fetchJobs();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to schedule notification');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelJob = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel this scheduled notification?')) return;
    try {
      await apiClient.patch(`/scheduled-notifications/${id}/cancel`);
      fetchJobs();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to cancel scheduled job');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">Completed</span>;
      case 'PROCESSING':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Processing</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">Cancelled</span>;
      case 'FAILED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Failed</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">Pending</span>;
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Scheduled Notifications</h1>
            <p className="text-sm text-gray-500">
              Manage immediate, future scheduled, and recurring cron notification broadcasts
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchJobs}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center space-x-2 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 font-medium text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Notification</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3 text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading scheduled jobs...</div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium mb-4">No scheduled notifications queued</p>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 text-sm font-medium"
          >
            Schedule New Job
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold uppercase text-gray-500">
                <th className="py-3 px-4">Title / Message</th>
                <th className="py-3 px-4">Target</th>
                <th className="py-3 px-4">Schedule</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Delivery Telemetry</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {jobs.map((job) => (
                <tr key={job._id} className="hover:bg-gray-50/50">
                  <td className="py-3 px-4 max-w-xs">
                    <div className="font-semibold text-gray-900">{job.title}</div>
                    <div className="text-xs text-gray-500 truncate">{job.message}</div>
                  </td>
                  <td className="py-3 px-4 font-semibold text-gray-700">{job.targetType}</td>
                  <td className="py-3 px-4 text-xs">
                    <div>{job.scheduleType}</div>
                    {job.scheduledAt && (
                      <div className="text-gray-500">
                        {new Date(job.scheduledAt).toLocaleString()}
                      </div>
                    )}
                    {job.cronExpression && (
                      <div className="font-mono text-gray-600">{job.cronExpression}</div>
                    )}
                  </td>
                  <td className="py-3 px-4">{getStatusBadge(job.status)}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-xs font-bold text-gray-700">
                      {job.successfulDeliveries} / {job.totalRecipients}
                    </span>
                    {job.failedDeliveries > 0 && (
                      <span className="ml-1 text-xs text-red-600 font-semibold">
                        ({job.failedDeliveries} failed)
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {job.status === 'PENDING' && (
                      <button
                        onClick={() => handleCancelJob(job._id)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-xs font-semibold transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Cancel</span>
                      </button>
                    )}
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
              Schedule Notification Broadcast
            </h2>

            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateJob} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Monthly Attendance Review Alert"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="ATTENDANCE">Attendance</option>
                    <option value="HOMEWORK">Homework</option>
                    <option value="EXAM">Examination</option>
                    <option value="RESULT">Result</option>
                    <option value="FEE">Fee</option>
                    <option value="GENERAL">General</option>
                    <option value="SYSTEM">System</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Priority *
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Target Type *
                  </label>
                  <select
                    value={targetType}
                    onChange={(e) => setTargetType(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="ALL">All Users</option>
                    <option value="ROLE">By Role</option>
                    <option value="CLASS">By Class</option>
                    <option value="SECTION">By Section</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Schedule Type *
                  </label>
                  <select
                    value={scheduleType}
                    onChange={(e) => setScheduleType(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="SCHEDULED">One-time Scheduled</option>
                    <option value="IMMEDIATE">Immediate</option>
                    <option value="RECURRING">Recurring (Cron)</option>
                  </select>
                </div>
              </div>

              {targetType === 'ROLE' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Select Target Roles
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['STUDENT', 'GUARDIAN', 'TEACHER', 'ACCOUNTANT', 'SCHOOL_ADMIN'].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => {
                          if (targetRoles.includes(r)) {
                            setTargetRoles(targetRoles.filter((item) => item !== r));
                          } else {
                            setTargetRoles([...targetRoles.filter((item) => item !== 'ALL'), r]);
                          }
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                          targetRoles.includes(r)
                            ? 'bg-rose-600 text-white border-rose-600'
                            : 'bg-white text-gray-700 border-gray-300'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {scheduleType === 'SCHEDULED' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Scheduled Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              )}

              {scheduleType === 'RECURRING' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Cron Expression * (e.g. 0 8 * * 1 for Monday 8:00 AM)
                  </label>
                  <input
                    type="text"
                    required
                    value={cronExpression}
                    onChange={(e) => setCronExpression(e.target.value)}
                    placeholder="0 8 * * 1"
                    className="w-full font-mono border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Message Content *
                </label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter broadcast message text..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
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
                  className="px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700 disabled:opacity-50"
                >
                  {submitting ? 'Scheduling...' : 'Queue Notification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
