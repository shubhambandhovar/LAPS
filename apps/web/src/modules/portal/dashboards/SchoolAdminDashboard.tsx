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
  GraduationCap,
  Calendar,
  DollarSign,
  TrendingUp,
  Award,
  Bell,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  UserCheck,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';

const attendanceData = [
  { day: 'Mon', attendance: 95.2 },
  { day: 'Tue', attendance: 96.5 },
  { day: 'Wed', attendance: 94.8 },
  { day: 'Thu', attendance: 97.1 },
  { day: 'Fri', attendance: 96.0 },
  { day: 'Sat', attendance: 92.4 },
];

const feeCollectionData = [
  { month: 'Apr', collected: 1200000, target: 1500000 },
  { month: 'May', collected: 1400000, target: 1500000 },
  { month: 'Jun', collected: 1350000, target: 1500000 },
  { month: 'Jul', collected: 1480000, target: 1500000 },
  { month: 'Aug', collected: 1520000, target: 1500000 },
];

export const SchoolAdminDashboard: React.FC = () => {
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
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
              School Admin
            </span>
            <span className="text-sm text-slate-500">Academic Year 2026-2027</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            School Operations Overview
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Real-time tracking of academic schedules, attendance, fee collection, and exam performance.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/portal/students"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition-all flex items-center gap-2"
          >
            <GraduationCap className="w-4 h-4" />
            Manage Students
          </Link>
          <Link
            to="/portal/academics/calendar"
            className="px-4 py-2 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            Academic Calendar
          </Link>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: 'Total Students',
            value: '1,240',
            subtitle: '+45 this semester',
            icon: GraduationCap,
            color: 'from-blue-500 to-indigo-600',
            link: '/portal/students',
          },
          {
            title: "Today's Attendance",
            value: '96.2%',
            subtitle: '1,193 present today',
            icon: UserCheck,
            color: 'from-emerald-500 to-teal-600',
            link: '/portal/academics/attendance',
          },
          {
            title: 'Fee Collection Rate',
            value: '91.8%',
            subtitle: '₹14.8M collected (Aug)',
            icon: DollarSign,
            color: 'from-purple-500 to-violet-600',
            link: '/portal/finance',
          },
          {
            title: 'Active Examinations',
            value: 'Mid-Term',
            subtitle: '12 classes scheduled',
            icon: Award,
            color: 'from-amber-500 to-orange-600',
            link: '/portal/academics/exams',
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
                  className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <span>View full report</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </Card>
            </motion.div>
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
                  Attendance Trend (This Week)
                </h2>
                <p className="text-xs text-slate-500">Daily attendance percentage across all classes</p>
              </div>
              <span className="text-xs font-semibold px-2 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 rounded">
                Target: 95%
              </span>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={attendanceData}>
                  <defs>
                    <linearGradient id="colorAtt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
                  <YAxis domain={[85, 100]} stroke="#64748b" fontSize={12} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="attendance"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorAtt)"
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
                  Monthly Fee Collection vs Target
                </h2>
                <p className="text-xs text-slate-500">Comparison of collected fees (in INR)</p>
              </div>
              <TrendingUp className="w-4 h-4 text-purple-600" />
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={feeCollectionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="collected" fill="#6366f1" radius={[4, 4, 0, 0]} name="Collected" />
                  <Bar dataKey="target" fill="#cbd5e1" radius={[4, 4, 0, 0]} name="Target" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Widgets Grid: Tasks, Recent Activities, Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Important Announcements */}
        <Card className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-500" />
              School Announcements
            </h3>
            <Link
              to="/portal/communication/notices"
              className="text-xs text-blue-600 hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {[
              {
                title: 'Mid-Term Exam Schedule Published',
                date: 'Aug 04, 2026',
                tag: 'Academics',
              },
              {
                title: 'Staff Development Workshop this Saturday',
                date: 'Aug 02, 2026',
                tag: 'HR',
              },
              {
                title: 'Independence Day Cultural Parade Prep',
                date: 'Aug 01, 2026',
                tag: 'Events',
              },
            ].map((notice, i) => (
              <div
                key={i}
                className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-start justify-between gap-3"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {notice.title}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{notice.date}</p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                  {notice.tag}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Operational Tasks */}
        <Card className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Priority Administrative Tasks
            </h3>
            <span className="text-xs text-slate-500">3 pending</span>
          </div>
          <div className="space-y-3">
            {[
              {
                task: 'Review Class XI new admission applications',
                status: 'In Progress',
                due: 'Today',
              },
              {
                task: 'Approve teacher transport allowance roster',
                status: 'Pending',
                due: 'Tomorrow',
              },
              {
                task: 'Sign off on library book inventory order',
                status: 'Urgent',
                due: 'Aug 06',
              },
            ].map((t, i) => (
              <div
                key={i}
                className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                    {t.task}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">Due: {t.due}</p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {t.status}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Operational Activity Timeline */}
        <Card className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" />
              Recent Activity Timeline
            </h3>
          </div>
          <div className="space-y-4">
            {[
              {
                text: 'New admission application #ADM-1089 submitted',
                time: '12 mins ago',
              },
              {
                text: 'Teacher Ravi Sharma submitted Class X science attendance',
                time: '45 mins ago',
              },
              {
                text: 'Fee receipt #REC-9821 generated for Student Rahul K.',
                time: '2 hours ago',
              },
            ].map((activity, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-300">
                    {activity.text}
                  </p>
                  <p className="text-[10px] text-slate-400">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
