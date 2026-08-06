import React, { useState, useEffect } from 'react';
import { usePermissions } from '../../hooks/usePermissions';
import {
  Users,
  Search,
  Filter,
  KeyRound,
  RefreshCw,
  ShieldOff,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { apiClient } from '../../lib/api';
import { Spinner } from '../../components/feedback/Spinner';

interface AccountRow {
  _id: string;
  identifier: string;
  email?: string;
  phone?: string;
  roleCode: string;
  userType: string;
  status: string;
  forcePasswordChange?: boolean;
  failedLoginAttempts?: number;
  lockedUntil?: string;
  createdAt?: string;
  lastLoginAt?: string;
}

export const UserAccountsPage: React.FC = () => {
  const { can } = usePermissions();
  const [items, setItems] = useState<AccountRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState('');
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null,
  );
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchAccounts = async (p = page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', String(p));
      params.append('limit', '20');
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (userTypeFilter) params.append('userType', userTypeFilter);

      const res = await apiClient.get(`/accounts?${params.toString()}`);
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
    fetchAccounts(1);
  }, [statusFilter, userTypeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAccounts(1);
  };

  const handleResetPassword = async (userId: string, identifier: string) => {
    if (!window.confirm(`Reset password for user "${identifier}" to a new secure temporary password?`)) {
      return;
    }
    setActionLoading(userId);
    setActionMsg(null);
    try {
      await apiClient.post('/accounts/reset-password', {
        userId,
        sendNotification: true,
      });
      setActionMsg({
        type: 'success',
        text: `Password reset successfully for "${identifier}". A temporary credential has been generated.`,
      });
      await fetchAccounts();
    } catch (err: any) {
      setActionMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to reset password',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusChange = async (userId: string, newStatus: string, identifier: string) => {
    setActionLoading(userId);
    setActionMsg(null);
    try {
      await apiClient.patch('/accounts/status', {
        userId,
        status: newStatus,
        reason: `Status updated to ${newStatus} by admin`,
      });
      setActionMsg({
        type: 'success',
        text: `Account "${identifier}" status changed to ${newStatus}.`,
      });
      await fetchAccounts();
    } catch (err: any) {
      setActionMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update status',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> Active
          </span>
        );
      case 'PASSWORD_RESET_REQUIRED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
            <KeyRound className="w-3.5 h-3.5" /> Reset Required
          </span>
        );
      case 'LOCKED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <Lock className="w-3.5 h-3.5" /> Locked
          </span>
        );
      case 'DISABLED':
      case 'SUSPENDED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
            <ShieldOff className="w-3.5 h-3.5" /> {status}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-indigo-400" /> User Accounts Directory
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Search, filter, and manage ERP user credentials, account locks, and status policies.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchAccounts(page)}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-all flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {actionMsg && (
        <div
          className={`p-4 rounded-xl border text-sm flex items-center justify-between ${
            actionMsg.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {actionMsg.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400" />
            )}
            <span>{actionMsg.text}</span>
          </div>
          <button onClick={() => setActionMsg(null)} className="text-xs underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Search Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-auto flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by identifier, email, phone..."
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
              value={userTypeFilter}
              onChange={(e) => setUserTypeFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
              <option value="">All Account Types</option>
              <option value="STUDENT">Student</option>
              <option value="TEACHER">Teacher</option>
              <option value="EMPLOYEE">Employee</option>
              <option value="GUARDIAN">Guardian</option>
            </select>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PASSWORD_RESET_REQUIRED">Reset Required</option>
            <option value="LOCKED">Locked</option>
            <option value="DISABLED">Disabled</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
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
            No user accounts found matching your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-6">Identifier</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Role / Type</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Security State</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {items.map((row) => (
                  <tr
                    key={row._id}
                    className="hover:bg-white/[0.02] transition-colors group"
                  >
                    <td className="py-4 px-6 font-semibold text-white">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-400 text-xs font-bold shrink-0">
                          {row.identifier.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span>{row.identifier}</span>
                          {row.lastLoginAt && (
                            <p className="text-[11px] text-slate-500 font-normal">
                              Last login: {new Date(row.lastLoginAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-slate-300 text-xs">
                      <div>{row.email || '—'}</div>
                      <div className="text-slate-500">{row.phone || ''}</div>
                    </td>

                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700 uppercase">
                        {row.roleCode || row.userType}
                      </span>
                    </td>

                    <td className="py-4 px-4">{getStatusBadge(row.status)}</td>

                    <td className="py-4 px-4 text-xs text-slate-400">
                      {row.failedLoginAttempts && row.failedLoginAttempts > 0 ? (
                        <span className="text-amber-400">
                          {row.failedLoginAttempts} failed attempt(s)
                        </span>
                      ) : (
                        <span className="text-emerald-400/80">Clean history</span>
                      )}
                    </td>

                    <td className="py-4 px-6 text-right space-x-2">
                      {can('user.update') && (
                        <>
                          <button
                            onClick={() => handleResetPassword(row._id, row.identifier)}
                            disabled={actionLoading === row._id}
                            className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 text-xs font-medium transition-all"
                            title="Reset password and send notification"
                          >
                            Reset Password
                          </button>

                          {row.status === 'LOCKED' ? (
                            <button
                              onClick={() => handleStatusChange(row._id, 'ACTIVE', row.identifier)}
                              disabled={actionLoading === row._id}
                              className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-medium transition-all"
                            >
                              <Unlock className="w-3.5 h-3.5 inline mr-1" /> Unlock
                            </button>
                          ) : row.status === 'ACTIVE' ? (
                            <button
                              onClick={() => handleStatusChange(row._id, 'SUSPENDED', row.identifier)}
                              disabled={actionLoading === row._id}
                              className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-medium transition-all"
                            >
                              Suspend
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStatusChange(row._id, 'ACTIVE', row.identifier)}
                              disabled={actionLoading === row._id}
                              className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-medium transition-all"
                            >
                              Activate
                            </button>
                          )}
                        </>
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
            <span className="font-semibold text-slate-200">{totalRecords}</span> accounts
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchAccounts(page - 1)}
              disabled={page <= 1 || loading}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-medium text-slate-300">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => fetchAccounts(page + 1)}
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
