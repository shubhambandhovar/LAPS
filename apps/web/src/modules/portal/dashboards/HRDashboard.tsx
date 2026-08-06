import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Users,
  UserCheck,
  Calendar,
  DollarSign,
  Gift,
  Briefcase,
  ArrowUpRight,
  UserPlus,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';

const deptStaffDistribution = [
  { name: 'Academics', count: 68, color: '#3b82f6' },
  { name: 'Admin & HR', count: 14, color: '#8b5cf6' },
  { name: 'Support / IT', count: 18, color: '#10b981' },
  { name: 'Transport & Store', count: 12, color: '#f59e0b' },
];

const staffAttendanceTrend = [
  { day: 'Mon', rate: 98 },
  { day: 'Tue', rate: 97 },
  { day: 'Wed', rate: 99 },
  { day: 'Thu', rate: 96 },
  { day: 'Fri', rate: 98 },
];

export const HRDashboard: React.FC = () => {
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
              Human Resources
            </span>
            <span className="text-sm text-slate-500">Staff & Faculty Operations</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            HR & Payroll Management Console
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Track employee attendance, manage leave applications, process monthly payroll, and recruit talent.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/portal/hr/leaves"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm transition-all flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            Approve Leaves
          </Link>
          <Link
            to="/portal/hr/recruitment"
            className="px-4 py-2 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Recruitment
          </Link>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: 'Total Employees',
            value: '112 Staff',
            subtitle: '68 faculty / 44 staff',
            icon: Users,
            color: 'from-indigo-500 to-blue-600',
            link: '/portal/hr',
          },
          {
            title: "Today's Staff Attendance",
            value: '98.2%',
            subtitle: '110 present / 2 on leave',
            icon: UserCheck,
            color: 'from-emerald-500 to-teal-600',
            link: '/portal/hr/attendance',
          },
          {
            title: 'Pending Leave Requests',
            value: '6 Requests',
            subtitle: '4 casual / 2 medical leaves',
            icon: Calendar,
            color: 'from-amber-500 to-orange-600',
            link: '/portal/hr/leaves',
          },
          {
            title: 'Payroll Status (July)',
            value: 'Completed',
            subtitle: '₹42.8 Lakhs disbursed',
            icon: DollarSign,
            color: 'from-purple-500 to-violet-600',
            link: '/portal/hr/payroll',
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
                  className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  <span>Open HR report</span>
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
                  Staff Distribution by Department
                </h2>
                <p className="text-xs text-slate-500">Total institutional employee headcount</p>
              </div>
            </div>
            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip />
                  <Pie
                    data={deptStaffDistribution}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, count }) => `${name}: ${count}`}
                  >
                    {deptStaffDistribution.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                  Daily Employee Attendance Rate (%)
                </h2>
                <p className="text-xs text-slate-500">This week staff attendance percentage</p>
              </div>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={staffAttendanceTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
                  <YAxis domain={[90, 100]} stroke="#64748b" fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="rate" fill="#6366f1" radius={[4, 4, 0, 0]} name="Attendance %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Leave Requests, Upcoming Birthdays & Staff Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Leave Applications */}
        <Card className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-500" />
              Pending Leave Requests
            </h3>
            <Link to="/portal/hr/leaves" className="text-xs text-blue-600 hover:underline">
              Review (6)
            </Link>
          </div>
          <div className="space-y-3">
            {[
              {
                emp: 'Mrs. Anita Rao (Teacher)',
                type: 'Casual Leave (1 Day)',
                date: 'Aug 06',
              },
              {
                emp: 'Mr. Vivek Jha (IT Dept)',
                type: 'Medical Leave (2 Days)',
                date: 'Aug 07-08',
              },
              {
                emp: 'Ms. Neha Gupta (HR Assistant)',
                type: 'Earned Leave (3 Days)',
                date: 'Aug 12-14',
              },
            ].map((req, i) => (
              <div
                key={i}
                className="p-3 rounded-lg bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {req.emp}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {req.type} • {req.date}
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-800 dark:bg-amber-800 dark:text-amber-200 cursor-pointer">
                  Action
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Staff Birthdays & Work Anniversaries */}
        <Card className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Gift className="w-4 h-4 text-pink-500" />
              Staff Birthdays & Anniversaries
            </h3>
            <span className="text-xs text-pink-600 font-medium">This Week</span>
          </div>
          <div className="space-y-3">
            {[
              { name: 'Dr. Alok Verma (Physics Dept)', event: 'Birthday', date: 'Tomorrow (Aug 06)' },
              { name: 'Ravi Sharma (Math Dept)', event: '5 Yr Work Anniversary', date: 'Aug 08' },
              { name: 'Pooja Singh (Reception)', event: 'Birthday', date: 'Aug 10' },
            ].map((b, i) => (
              <div
                key={i}
                className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {b.name}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{b.event}</p>
                </div>
                <span className="text-xs font-bold text-pink-600">{b.date}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Recruitment Pipeline */}
        <Card className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-blue-500" />
              Active Recruitment Pipeline
            </h3>
            <Link to="/portal/hr/recruitment" className="text-xs text-blue-600 hover:underline">
              Openings (3)
            </Link>
          </div>
          <div className="space-y-3">
            {[
              { role: 'PGT Chemistry Teacher', applicants: '12 Applied', stage: 'Interviews' },
              { role: 'Junior Systems Admin', applicants: '8 Applied', stage: 'Screening' },
              { role: 'Librarian Assistant', applicants: '15 Applied', stage: 'Offer Stage' },
            ].map((pos, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {pos.role}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{pos.applicants}</p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                  {pos.stage}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
