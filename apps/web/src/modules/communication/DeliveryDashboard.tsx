import React, { useEffect, useState } from 'react';
import { apiClient } from '../../lib/api';
import {
  Send,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';

interface DeliveryLogRecord {
  _id: string;
  recipientId: {
    _id: string;
    profile?: {
      firstName: string;
      lastName: string;
    };
    email?: string;
    role: string;
  };
  channel: 'IN_APP' | 'EMAIL' | 'SMS';
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED';
  retryCount: number;
  maxRetries: number;
  failureReason?: string;
  deliveredAt?: string;
  createdAt: string;
}

export const DeliveryDashboard: React.FC = () => {
  const [logs, setLogs] = useState<DeliveryLogRecord[]>([]);
  const [stats, setStats] = useState<Record<string, Record<string, number>>>({
    IN_APP: { PENDING: 0, SENT: 0, DELIVERED: 0, FAILED: 0 },
    EMAIL: { PENDING: 0, SENT: 0, DELIVERED: 0, FAILED: 0 },
    SMS: { PENDING: 0, SENT: 0, DELIVERED: 0, FAILED: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterChannel, setFilterChannel] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (filterChannel !== 'ALL') queryParams.append('channel', filterChannel);
      if (filterStatus !== 'ALL') queryParams.append('status', filterStatus);

      const [logsRes, statsRes] = await Promise.all([
        apiClient.get(`/delivery-logs?${queryParams.toString()}`),
        apiClient.get('/delivery-logs/stats'),
      ]);

      setLogs(logsRes.data.data?.logs || []);
      setStats(
        statsRes.data.data || {
          IN_APP: { PENDING: 0, SENT: 0, DELIVERED: 0, FAILED: 0 },
          EMAIL: { PENDING: 0, SENT: 0, DELIVERED: 0, FAILED: 0 },
          SMS: { PENDING: 0, SENT: 0, DELIVERED: 0, FAILED: 0 },
        }
      );
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load delivery telemetry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterChannel, filterStatus]);

  const handleRetry = async (id: string) => {
    try {
      await apiClient.post(`/delivery-logs/${id}/retry`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to retry delivery');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">Delivered</span>;
      case 'SENT':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Sent</span>;
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
          <div className="p-2.5 bg-teal-50 text-teal-600 rounded-xl">
            <Send className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Delivery Telemetry Dashboard</h1>
            <p className="text-sm text-gray-500">
              Audit channel dispatch status, failure logs, and automated retry mechanics
            </p>
          </div>
        </div>
        <button
          onClick={fetchData}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          title="Refresh Telemetry"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {(['IN_APP', 'EMAIL', 'SMS'] as ('IN_APP' | 'EMAIL' | 'SMS')[]).map((ch) => {
          const chStats = stats[ch] || { PENDING: 0, SENT: 0, DELIVERED: 0, FAILED: 0 };
          return (
            <div key={ch} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-gray-900">{ch} CHANNEL</span>
                <span className="text-xs font-semibold text-gray-400">STATUS TOTALS</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-2 bg-emerald-50 rounded-lg">
                  <span className="text-xs text-emerald-600 font-semibold block">Delivered</span>
                  <span className="text-lg font-bold text-emerald-700">{chStats.DELIVERED || 0}</span>
                </div>
                <div className="p-2 bg-red-50 rounded-lg">
                  <span className="text-xs text-red-600 font-semibold block">Failed</span>
                  <span className="text-lg font-bold text-red-700">{chStats.FAILED || 0}</span>
                </div>
                <div className="p-2 bg-blue-50 rounded-lg">
                  <span className="text-xs text-blue-600 font-semibold block">Sent</span>
                  <span className="text-lg font-bold text-blue-700">{chStats.SENT || 0}</span>
                </div>
                <div className="p-2 bg-amber-50 rounded-lg">
                  <span className="text-xs text-amber-600 font-semibold block">Pending</span>
                  <span className="text-lg font-bold text-amber-700">{chStats.PENDING || 0}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200 mb-6 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Channel:</span>
            <select
              value={filterChannel}
              onChange={(e) => setFilterChannel(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="ALL">All Channels</option>
              <option value="IN_APP">IN_APP</option>
              <option value="EMAIL">EMAIL</option>
              <option value="SMS">SMS</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="ALL">All Status</option>
              <option value="DELIVERED">Delivered</option>
              <option value="SENT">Sent</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
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
        <div className="text-center py-12 text-gray-500">Loading delivery logs...</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Send className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No delivery log entries found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold uppercase text-gray-500">
                <th className="py-3 px-4">Recipient</th>
                <th className="py-3 px-4">Channel</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Retries</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {logs.map((log) => (
                <tr key={log._id} className="hover:bg-gray-50/50">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-gray-900">
                      {log.recipientId?.profile
                        ? `${log.recipientId.profile.firstName} ${log.recipientId.profile.lastName}`
                        : log.recipientId?._id}
                    </div>
                    <div className="text-xs text-gray-500">{log.recipientId?.email || log.recipientId?.role}</div>
                  </td>
                  <td className="py-3 px-4 font-mono text-xs font-bold text-gray-700">
                    {log.channel}
                  </td>
                  <td className="py-3 px-4">{getStatusBadge(log.status)}</td>
                  <td className="py-3 px-4 text-gray-600">
                    {log.retryCount} / {log.maxRetries}
                  </td>
                  <td className="py-3 px-4 text-gray-500 text-xs">
                    {log.deliveredAt
                      ? new Date(log.deliveredAt).toLocaleString()
                      : new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {log.status === 'FAILED' && log.retryCount < log.maxRetries && (
                      <button
                        onClick={() => handleRetry(log._id)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-xs font-semibold transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Retry</span>
                      </button>
                    )}
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
