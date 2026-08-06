import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { apiClient } from '../../lib/api';
import { Spinner } from '../../components/feedback/Spinner';

interface LoginHistoryRow {
  _id: string;
  userId?: string;
  identifier: string;
  loginAt: string;
  status: 'SUCCESS' | 'FAILURE';
  failureReason?: string;
  ipAddress?: string;
  userAgent?: string;
}

export const LoginHistoryPage: React.FC = () => {
  const [items, setItems] = useState<LoginHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [identifierSearch, setIdentifierSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchHistory = async (p = page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', String(p));
      params.append('limit', '25');
      if (identifierSearch) params.append('identifier', identifierSearch);
      if (statusFilter) params.append('status', statusFilter);

      const res = await apiClient.get(`/accounts/login-history?${params.toString()}`);
      setItems(res.data?.data || []);
      const meta = res.data?.pagination;
      if (meta) {
        setPage(meta.page || p);
        setTotalPages(meta.totalPages || 1);
        setTotalRecords(meta.totalRecords || items.length);
      }
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(1);
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchHistory(1);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <History className="w-6 h-6 text-indigo-400" /> Authentication Audit Trail
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time compliance log of successful and failed ERP login attempts, IP addresses, and
            reasons for denial.
          </p>
        </div>
        <div>
          <button
            onClick={() => fetchHistory(page)}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-all flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Refresh Trail
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-auto flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={identifierSearch}
              onChange={(e) => setIdentifierSearch(e.target.value)}
              placeholder="Search by username/identifier..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
              <option value="">All Outcomes</option>
              <option value="SUCCESS">Success Only</option>
              <option value="FAILURE">Failures Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" className="text-indigo-500" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-sm">
            No audit logs found matching your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-6">Timestamp</th>
                  <th className="py-3.5 px-6">Identifier</th>
                  <th className="py-3.5 px-4">Outcome</th>
                  <th className="py-3.5 px-4">IP Address</th>
                  <th className="py-3.5 px-6">Failure Reason / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {items.map((row) => (
                  <tr
                    key={row._id}
                    className="hover:bg-white/[0.02] transition-colors group"
                  >
                    <td className="py-4 px-6 text-slate-400 font-mono text-xs whitespace-nowrap">
                      {new Date(row.loginAt).toLocaleString()}
                    </td>

                    <td className="py-4 px-6 font-semibold text-white">
                      <div className="flex items-center gap-2">
                        <span className="text-indigo-300">{row.identifier}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      {row.status === 'SUCCESS' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5" /> SUCCESS
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          <XCircle className="w-3.5 h-3.5" /> FAILURE
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-xs font-mono text-slate-400">
                      {row.ipAddress || '127.0.0.1'}
                    </td>

                    <td className="py-4 px-6 text-xs text-slate-300">
                      {row.status === 'FAILURE' ? (
                        <span className="text-rose-400 font-medium">
                          {row.failureReason || 'Invalid credentials or account locked'}
                        </span>
                      ) : (
                        <span className="text-slate-500">Authenticated OK</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="bg-slate-950/40 border-t border-slate-800 p-4 flex items-center justify-between text-xs text-slate-400">
          <div>
            Showing <span className="font-semibold text-slate-200">{items.length}</span> of{' '}
            <span className="font-semibold text-slate-200">{totalRecords}</span> log entries
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchHistory(page - 1)}
              disabled={page <= 1 || loading}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-medium text-slate-300">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => fetchHistory(page + 1)}
              disabled={page >= totalPages || loading}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-50 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
