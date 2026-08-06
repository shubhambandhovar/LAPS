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
  Users,
  GraduationCap,
  Calendar,
  Shield,
  School,
  Globe,
  DollarSign,
  BookOpen,
  Box,
  Activity,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';

const revenueData = [
  { month: 'Apr', revenue: 2400000, expenses: 1800000 },
  { month: 'May', revenue: 3200000, expenses: 2100000 },
  { month: 'Jun', revenue: 2900000, expenses: 1950000 },
  { month: 'Jul', revenue: 3800000, expenses: 2200000 },
  { month: 'Aug', revenue: 4100000, expenses: 2300000 },
];

const enrollmentGrowth = [
  { year: '2023', students: 950 },
  { year: '2024', students: 1080 },
  { year: '2025', students: 1195 },
  { year: '2026', students: 1240 },
];

export const AdminDashboard: React.FC = () => {
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
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300">
              Super Admin
            </span>
            <span className="text-sm text-slate-500">System Governance</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            Institutional Command Center
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Real-time telemetry across academic, financial, inventory, and administrative systems.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/portal/admin/audit-logs"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm transition-all flex items-center gap-2"
          >
            <Shield className="w-4 h-4" />
            Security Logs
          </Link>
          <Link
            to="/portal/admin/settings"
            className="px-4 py-2 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
          >
            <Activity className="w-4 h-4" />
            System Health
          </Link>
        </div>
      </motion.div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: 'Total Students',
            value: '1,240',
            subtitle: '+4.2% YoY growth',
            icon: GraduationCap,
            color: 'from-indigo-500 to-blue-600',
            link: '/portal/students',
          },
          {
            title: 'Teachers & Faculty',
            value: '68',
            subtitle: '100% attendance today',
            icon: Users,
            color: 'from-blue-500 to-cyan-600',
            link: '/portal/hr',
          },
          {
            title: 'Total Employees',
            value: '112',
            subtitle: 'Including support & admin',
            icon: School,
            color: 'from-emerald-500 to-teal-600',
            link: '/portal/hr',
          },
          {
            title: 'New Admissions',
            value: '185',
            subtitle: '42 pending review',
            icon: Calendar,
            color: 'from-purple-500 to-violet-600',
            link: '/portal/admissions',
          },
        ].map((kpi, index) => {
          const IconComponent = kpi.icon;
          return (
            <motion.div
              key={kpi.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
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
                  className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  <span>Explore module</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Secondary Operational Telemetry Grid (Revenue, Fees, Library, Inventory, Transport, Website) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {[
          {
            label: 'Monthly Revenue',
            val: '₹41.0L',
            icon: DollarSign,
            color: 'text-emerald-600',
          },
          {
            label: 'Outstanding Fees',
            val: '₹3.2L',
            icon: AlertCircle,
            color: 'text-amber-600',
          },
          {
            label: 'Attendance Rate',
            val: '96.4%',
            icon: Activity,
            color: 'text-blue-600',
          },
          {
            label: 'Library Circulation',
            val: '482 Books',
            icon: BookOpen,
            color: 'text-purple-600',
          },
          {
            label: 'Inventory Value',
            val: '₹84.5L',
            icon: Box,
            color: 'text-indigo-600',
          },
          {
            label: 'Website Analytics',
            val: '4,280 Visits',
            icon: Globe,
            color: 'text-cyan-600',
          },
        ].map((stat, i) => {
          const IconComp = stat.icon;
          return (
            <Card
              key={i}
              className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between"
            >
              <div>
                <p className="text-[11px] font-semibold uppercase text-slate-400">
                  {stat.label}
                </p>
                <p className="text-lg font-bold text-slate-800 dark:text-white mt-0.5">
                  {stat.val}
                </p>
              </div>
              <IconComp className={`w-6 h-6 ${stat.color}`} />
            </Card>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                  Revenue vs Operating Expenses (INR)
                </h2>
                <p className="text-xs text-slate-500">Monthly fiscal cash flow summary</p>
              </div>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRev)"
                    name="Revenue"
                  />
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    stroke="#ef4444"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorExp)"
                    name="Expenses"
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
                  Student Enrollment Growth (2023–2026)
                </h2>
                <p className="text-xs text-slate-500">Total active institutional enrollment</p>
              </div>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={enrollmentGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="year" stroke="#64748b" fontSize={12} />
                  <YAxis domain={[800, 1400]} stroke="#64748b" fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="students" fill="#6366f1" radius={[6, 6, 0, 0]} name="Students" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* System Health, Approval Queue, and Recent Security Audits */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Health */}
        <Card className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" />
              System Health & Services
            </h3>
            <span className="text-xs font-semibold text-emerald-600">100% Online</span>
          </div>
          <div className="space-y-3">
            {[
              { service: 'MongoDB Atlas Replica Cluster', status: 'Optimal', latency: '12ms' },
              { service: 'Redis Token & Session Cache', status: 'Optimal', latency: '2ms' },
              { service: 'API Gateway & Rate Limiter', status: 'Healthy', latency: '4ms' },
              { service: 'Automated Daily Backups', status: 'Completed', latency: '03:00 AM' },
            ].map((s, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {s.service}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{s.latency}</p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                  {s.status}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Approval Queue */}
        <Card className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-500" />
              Institutional Approval Queue
            </h3>
            <span className="text-xs text-slate-500">4 items</span>
          </div>
          <div className="space-y-3">
            {[
              { title: 'New Teacher Account Authorization', dept: 'HR Dept', tag: 'High' },
              { title: 'Annual Library Book Vendor Budget', dept: 'Finance', tag: 'Urgent' },
              { title: 'Class X Supplementary Exam Notice', dept: 'Academics', tag: 'Normal' },
            ].map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {item.title}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{item.dept}</p>
                </div>
                <span className="text-xs text-blue-600 font-medium hover:underline cursor-pointer">
                  Review
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-500" />
              Recent Security Audit Logs
            </h3>
          </div>
          <div className="space-y-3">
            {[
              {
                text: 'User Ravi (TEACHER) password reset by admin',
                time: '14 mins ago',
              },
              {
                text: 'Role permission matrix seeded successfully',
                time: '1 hour ago',
              },
              {
                text: 'Super Admin logged in from IP 127.0.0.1',
                time: '2 hours ago',
              },
            ].map((log, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-purple-600 mt-1.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-300">
                    {log.text}
                  </p>
                  <p className="text-[10px] text-slate-400">{log.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
