import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  UserCheck,
  Calendar,
  DollarSign,
  FileText,
  ArrowUpRight,
  Bell,
  CheckSquare,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';

const attendanceHistory = [
  { month: 'Apr', attendance: 98 },
  { month: 'May', attendance: 96 },
  { month: 'Jun', attendance: 94 },
  { month: 'Jul', attendance: 100 },
  { month: 'Aug', attendance: 97 },
];

const leaveUsage = [
  { type: 'Casual (CL)', used: 4, total: 12 },
  { type: 'Medical (ML)', used: 1, total: 10 },
  { type: 'Earned (EL)', used: 2, total: 15 },
];

export const EmployeeDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
              Staff Portal
            </span>
            <span className="text-sm text-slate-500">Employee Self-Service</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            My Employee Workstation
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Track your monthly attendance, leave balances, payslips, and daily administrative duties.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/portal/hr/leaves"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium shadow-sm transition-all flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            Apply Leave
          </Link>
          <Link
            to="/portal/hr/payslips"
            className="px-4 py-2 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Download Payslip
          </Link>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: 'Attendance (This Month)',
            value: '97.2%',
            subtitle: '19 days present / 0 late',
            icon: UserCheck,
            color: 'from-emerald-500 to-teal-600',
            link: '/portal/hr/attendance',
          },
          {
            title: 'Leave Balance Available',
            value: '18 Days',
            subtitle: 'CL: 8 | ML: 9 | EL: 13',
            icon: Calendar,
            color: 'from-blue-500 to-indigo-600',
            link: '/portal/hr/leaves',
          },
          {
            title: 'Last Month Salary',
            value: '₹42,500',
            subtitle: 'Credited on July 31',
            icon: DollarSign,
            color: 'from-purple-500 to-violet-600',
            link: '/portal/hr/payslips',
          },
          {
            title: 'Assigned Duties / Tasks',
            value: '4 Pending',
            subtitle: '2 due this week',
            icon: CheckSquare,
            color: 'from-amber-500 to-orange-600',
            link: '/portal/hr/tasks',
          },
        ].map((kpi, index) => {
          const IconComponent = kpi.icon;
          return (
            <motion.div
              key={kpi.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:shadow-md transition-all">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {kpi.title}
                    </p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                      {kpi.value}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {kpi.subtitle}
                    </p>
                  </div>
                  <div
                    className={`p-3 rounded-xl bg-gradient-to-br ${kpi.color} text-white shadow-sm`}
                  >
                    <IconComponent className="w-5 h-5" />
                  </div>
                </div>
                <Link
                  to={kpi.link}
                  className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  <span>View record</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                  My Monthly Attendance Record (%)
                </h2>
                <p className="text-xs text-slate-500">Personal attendance consistency trend</p>
              </div>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={attendanceHistory}>
                  <defs>
                    <linearGradient id="colorEmpAtt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                  <YAxis domain={[80, 100]} stroke="#64748b" fontSize={12} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="attendance"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorEmpAtt)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                  Leave Quota Utilization
                </h2>
                <p className="text-xs text-slate-500">Days used vs Total Annual Entitlement</p>
              </div>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={leaveUsage}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="type" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="used" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Used Days" />
                  <Bar dataKey="total" fill="#e2e8f0" radius={[4, 4, 0, 0]} name="Total Allowance" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Announcements & Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-emerald-600" />
              Institutional Circulars & Staff Notices
            </h3>
          </div>
          <div className="space-y-3">
            {[
              {
                title: 'Annual Performance Appraisal Process Initiated',
                date: 'Aug 04, 2026',
              },
              {
                title: 'Staff Health Insurance Policy Renewal Guidance',
                date: 'Aug 01, 2026',
              },
              {
                title: 'Independence Day Holiday Schedule Confirmed',
                date: 'Jul 28, 2026',
              },
            ].map((n, i) => (
              <div
                key={i}
                className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center justify-between"
              >
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {n.title}
                </p>
                <span className="text-[10px] text-slate-400">{n.date}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-blue-600" />
              My Assigned Responsibilities
            </h3>
          </div>
          <div className="space-y-3">
            {[
              {
                title: 'Submit quarterly departmental equipment checklist',
                due: 'Tomorrow',
                status: 'Pending',
              },
              {
                title: 'Complete annual POSH compliance refresher video',
                due: 'Aug 10',
                status: 'In Progress',
              },
            ].map((t, i) => (
              <div
                key={i}
                className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                    {t.title}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Due: {t.due}</p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                  {t.status}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
