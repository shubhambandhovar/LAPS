import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  UserCheck,
  Users,
  GraduationCap,
  Briefcase,
  KeyRound,
  History,
  Zap,
  CheckCircle2,
  Lock,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../lib/api';
import { Spinner } from '../../components/feedback/Spinner';

interface AccountStats {
  totalUsers: number;
  activeCount: number;
  resetRequiredCount: number;
  lockedCount: number;
  disabledCount: number;
  studentUsers: number;
  teacherUsers: number;
  employeeUsers: number;
}

export const IdentityDashboard: React.FC = () => {
  const [stats, setStats] = useState<AccountStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [bulkLoading, setBulkLoading] = useState<string | null>(null);
  const [bulkMsg, setBulkMsg] = useState<string | null>(null);

  const loadStats = async () => {
    setLoading(true);
    try {
      // Load first 100 accounts to compute quick stats (or call pagination metadata)
      const res = await apiClient.get('/accounts?limit=100');
      const items = res.data?.data || [];
      const total = res.data?.pagination?.totalRecords || items.length;

      let activeCount = 0;
      let resetRequiredCount = 0;
      let lockedCount = 0;
      let disabledCount = 0;
      let studentUsers = 0;
      let teacherUsers = 0;
      let employeeUsers = 0;

      for (const u of items) {
        if (u.status === 'ACTIVE') activeCount++;
        if (u.status === 'PASSWORD_RESET_REQUIRED') resetRequiredCount++;
        if (u.status === 'LOCKED') lockedCount++;
        if (u.status === 'DISABLED' || u.status === 'SUSPENDED') disabledCount++;

        if (u.userType === 'STUDENT') studentUsers++;
        if (u.userType === 'TEACHER') teacherUsers++;
        if (u.userType === 'EMPLOYEE') employeeUsers++;
      }

      setStats({
        totalUsers: total,
        activeCount,
        resetRequiredCount,
        lockedCount,
        disabledCount,
        studentUsers,
        teacherUsers,
        employeeUsers,
      });
    } catch {
      // Default empty if error
      setStats({
        totalUsers: 0,
        activeCount: 0,
        resetRequiredCount: 0,
        lockedCount: 0,
        disabledCount: 0,
        studentUsers: 0,
        teacherUsers: 0,
        employeeUsers: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleBulkGenerate = async (entityType: 'STUDENT' | 'TEACHER' | 'EMPLOYEE') => {
    setBulkLoading(entityType);
    setBulkMsg(null);
    try {
      const res = await apiClient.post('/accounts/generate-bulk', {
        entityType,
        sendNotification: true,
      });
      const data = res.data?.data;
      setBulkMsg(
        `Bulk generation for ${entityType} complete! Success: ${data?.successCount || 0}, Errors: ${
          data?.failureCount || 0
        }`,
      );
      await loadStats();
    } catch (err: any) {
      setBulkMsg(err.response?.data?.message || `Failed bulk generation for ${entityType}`);
    } finally {
      setBulkLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" className="text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-3">
              <ShieldCheck className="w-3.5 h-3.5" /> Identity & Credential Automation v2.1
            </span>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              ERP Credential & Lifecycle Manager
            </h1>
            <p className="text-slate-400 mt-2 max-w-2xl text-sm leading-relaxed">
              Automated, collision-free ERP account generation with NIST 800-63B password lifecycle
              enforcement, multi-device session governance, and comprehensive audit history.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/portal/identity/accounts"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all hover:-translate-y-0.5"
            >
              <Users className="w-4 h-4" /> Manage Accounts
            </Link>
            <Link
              to="/portal/identity/history"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 transition-all hover:-translate-y-0.5"
            >
              <History className="w-4 h-4" /> Login Audit Log
            </Link>
          </div>
        </div>
      </div>

      {bulkMsg && (
        <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-indigo-400" />
            <span>{bulkMsg}</span>
          </div>
          <button onClick={() => setBulkMsg(null)} className="text-xs text-indigo-400 underline">
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 shadow-xl hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total ERP Users
            </span>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white mt-4">{stats?.totalUsers || 0}</p>
          <div className="mt-3 flex items-center gap-2 text-xs text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{stats?.activeCount || 0} Active</span>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 shadow-xl hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Password Reset Needed
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <KeyRound className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white mt-4">
            {stats?.resetRequiredCount || 0}
          </p>
          <div className="mt-3 flex items-center gap-2 text-xs text-amber-300 font-medium">
            <span>Pending permanent password</span>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 shadow-xl hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Locked Accounts
            </span>
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <Lock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white mt-4">{stats?.lockedCount || 0}</p>
          <div className="mt-3 flex items-center gap-2 text-xs text-rose-300 font-medium">
            <span>Locked after failed logins</span>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 shadow-xl hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Role Distribution
            </span>
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-300">
              <span>Students</span>
              <span className="font-bold text-white">{stats?.studentUsers || 0}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Teachers</span>
              <span className="font-bold text-white">{stats?.teacherUsers || 0}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Employees</span>
              <span className="font-bold text-white">{stats?.employeeUsers || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Account Generation Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between pb-5 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" /> One-Click Bulk Credential Generation
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Automatically provision collision-free IDs and temporary credentials for any active
              records missing an ERP account.
            </p>
          </div>
          <button
            onClick={loadStats}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
            title="Refresh statistics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          {/* Students */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-5 flex flex-col justify-between space-y-4 hover:border-indigo-500/40 transition-all">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Students Bulk Provision</h4>
                  <p className="text-xs text-slate-400">LAS2026xxxx sequence</p>
                </div>
              </div>
              <p className="text-xs text-slate-400">
                Generate login accounts for all approved students who do not yet have an active ERP
                account.
              </p>
            </div>
            <button
              onClick={() => handleBulkGenerate('STUDENT')}
              disabled={bulkLoading === 'STUDENT'}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 font-semibold text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {bulkLoading === 'STUDENT' ? (
                <>
                  <Spinner size="sm" /> Provisioning...
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5" /> Generate Student Accounts
                </>
              )}
            </button>
          </div>

          {/* Teachers */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-5 flex flex-col justify-between space-y-4 hover:border-teal-500/40 transition-all">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Teachers Bulk Provision</h4>
                  <p className="text-xs text-slate-400">TCHxxxx sequence</p>
                </div>
              </div>
              <p className="text-xs text-slate-400">
                Generate login accounts for all active faculty members who do not yet have an ERP
                user account.
              </p>
            </div>
            <button
              onClick={() => handleBulkGenerate('TEACHER')}
              disabled={bulkLoading === 'TEACHER'}
              className="w-full py-2.5 px-4 rounded-xl bg-teal-600/20 hover:bg-teal-600 text-teal-300 hover:text-white border border-teal-500/30 font-semibold text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {bulkLoading === 'TEACHER' ? (
                <>
                  <Spinner size="sm" /> Provisioning...
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5" /> Generate Teacher Accounts
                </>
              )}
            </button>
          </div>

          {/* Employees */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-5 flex flex-col justify-between space-y-4 hover:border-purple-500/40 transition-all">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Employees Bulk Provision</h4>
                  <p className="text-xs text-slate-400">EMPxxxx sequence</p>
                </div>
              </div>
              <p className="text-xs text-slate-400">
                Generate login accounts for administrative and operational employees without active
                credentials.
              </p>
            </div>
            <button
              onClick={() => handleBulkGenerate('EMPLOYEE')}
              disabled={bulkLoading === 'EMPLOYEE'}
              className="w-full py-2.5 px-4 rounded-xl bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 font-semibold text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {bulkLoading === 'EMPLOYEE' ? (
                <>
                  <Spinner size="sm" /> Provisioning...
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5" /> Generate Employee Accounts
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
