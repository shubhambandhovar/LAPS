import React, { useEffect, useState } from 'react';
import { apiClient } from '../../lib/api';
import {
  Bell,
  CheckCircle,
  Archive,
  AlertCircle,
  Filter,
  CheckCheck,
  RefreshCw,
} from 'lucide-react';

interface NotificationRecord {
  _id: string;
  title: string;
  message: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  category: string;
  readStatus: 'READ' | 'UNREAD';
  readAt?: string;
  isArchived: boolean;
  createdAt: string;
}

export const NotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterRead, setFilterRead] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (filterRead !== 'ALL') queryParams.append('readStatus', filterRead);
      if (filterCategory !== 'ALL') queryParams.append('category', filterCategory);

      const [listRes, countRes] = await Promise.all([
        apiClient.get(`/notifications?${queryParams.toString()}`),
        apiClient.get('/notifications/unread-count'),
      ]);

      setNotifications(listRes.data.data?.notifications || []);
      setUnreadCount(countRes.data.data?.unreadCount || 0);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [filterRead, filterCategory]);

  const markAsRead = async (id: string) => {
    try {
      await apiClient.patch(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiClient.patch('/notifications/read-all');
      fetchNotifications();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to mark all as read');
    }
  };

  const archiveNotification = async (id: string) => {
    try {
      await apiClient.patch(`/notifications/${id}/archive`);
      fetchNotifications();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to archive notification');
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-red-100 text-red-800">URGENT</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-orange-100 text-orange-800">HIGH</span>;
      case 'LOW':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-gray-100 text-gray-800">LOW</span>;
      default:
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-blue-100 text-blue-800">NORMAL</span>;
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notification Center</h1>
            <p className="text-sm text-gray-500">Centralized alert feed for ERP events and school circulars</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {unreadCount > 0 && (
            <span className="px-3 py-1 text-sm font-semibold rounded-full bg-red-500 text-white">
              {unreadCount} Unread
            </span>
          )}
          <button
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium transition-colors"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark All as Read</span>
          </button>
          <button
            onClick={fetchNotifications}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200 mb-6 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Status:</span>
            <select
              value={filterRead}
              onChange={(e) => setFilterRead(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Status</option>
              <option value="UNREAD">Unread</option>
              <option value="READ">Read</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Category:</span>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Categories</option>
              <option value="ATTENDANCE">Attendance</option>
              <option value="HOMEWORK">Homework</option>
              <option value="EXAM">Examination</option>
              <option value="RESULT">Result</option>
              <option value="FEE">Fee</option>
              <option value="GENERAL">General</option>
              <option value="SYSTEM">System</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3 text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No notifications match your current filter</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((item) => (
            <div
              key={item._id}
              className={`p-4 rounded-xl border transition-all ${
                item.readStatus === 'UNREAD'
                  ? 'bg-blue-50/50 border-blue-200 shadow-sm'
                  : 'bg-white border-gray-200 opacity-90'
              } flex items-start justify-between gap-4`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 px-2 py-0.5 bg-gray-100 rounded">
                    {item.category}
                  </span>
                  {getPriorityBadge(item.priority)}
                  <span className="text-xs text-gray-400">
                    {new Date(item.createdAt).toLocaleString()}
                  </span>
                </div>
                <h3
                  className={`text-base font-semibold ${
                    item.readStatus === 'UNREAD' ? 'text-gray-900' : 'text-gray-700'
                  }`}
                >
                  {item.title}
                </h3>
                <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">{item.message}</p>
              </div>

              <div className="flex items-center space-x-2 flex-shrink-0">
                {item.readStatus === 'UNREAD' && (
                  <button
                    onClick={() => markAsRead(item._id)}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                    title="Mark as Read"
                  >
                    <CheckCircle className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={() => archiveNotification(item._id)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Archive Notification"
                >
                  <Archive className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
