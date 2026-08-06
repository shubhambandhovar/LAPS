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
  AreaChart,
  Area,
} from 'recharts';
import {
  BookOpen,
  Calendar,
  Award,
  CheckCircle,
  Clock,
  ArrowUpRight,
  DollarSign,
  Truck,
  Bell,
  FileText,
  Star,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';

const subjectScores = [
  { subject: 'Math', score: 92, classAvg: 81 },
  { subject: 'Science', score: 88, classAvg: 79 },
  { subject: 'English', score: 85, classAvg: 80 },
  { subject: 'Social Sci', score: 90, classAvg: 83 },
  { subject: 'Computer', score: 96, classAvg: 88 },
];

const studentAttendanceTrend = [
  { month: 'Apr', att: 98 },
  { month: 'May', att: 96 },
  { month: 'Jun', att: 100 },
  { month: 'Jul', att: 95 },
  { month: 'Aug', att: 97 },
];

export const StudentDashboard: React.FC = () => {
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
              Student Portal
            </span>
            <span className="text-sm text-slate-500">Class X-A • Roll No #24</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            Student Academic Workstation
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Welcome back! Check your daily timetable, pending homework, library books, and exam grades.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/portal/homework"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition-all flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Submit Homework
          </Link>
          <Link
            to="/portal/academics/exams"
            className="px-4 py-2 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
          >
            <Award className="w-4 h-4" />
            Exam Schedule
          </Link>
        </div>
      </motion.div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: "Today's Classes",
            value: '5 Periods',
            subtitle: 'Next: Mathematics (Room 204)',
            icon: Clock,
            color: 'from-blue-500 to-indigo-600',
            link: '/portal/academics/timetable',
          },
          {
            title: 'Attendance Record',
            value: '97.4%',
            subtitle: '86 present / 2 absent days',
            icon: CheckCircle,
            color: 'from-emerald-500 to-teal-600',
            link: '/portal/academics/attendance',
          },
          {
            title: 'Pending Homework',
            value: '2 Assigned',
            subtitle: 'Trigonometry & English Essay',
            icon: FileText,
            color: 'from-amber-500 to-orange-600',
            link: '/portal/homework',
          },
          {
            title: 'Library Books Issued',
            value: '2 Books',
            subtitle: 'Due back on Aug 12',
            icon: BookOpen,
            color: 'from-purple-500 to-violet-600',
            link: '/portal/library',
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
                  <span>Open module</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Secondary Quick Telemetry (Fee Status, Transport Details, Achievements, Upcoming Events) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Fee Status',
            val: 'Paid in Full (Q2)',
            icon: DollarSign,
            color: 'text-emerald-600',
            link: '/portal/finance',
          },
          {
            label: 'Transport Details',
            val: 'Route #4 (Bus 102)',
            icon: Truck,
            color: 'text-blue-600',
            link: '/portal/transport',
          },
          {
            label: 'Upcoming Events',
            val: 'Science Fair (Aug 14)',
            icon: Calendar,
            color: 'text-purple-600',
            link: '/portal/academics/calendar',
          },
          {
            label: 'My Achievements',
            val: 'Gold Medal - Debate',
            icon: Star,
            color: 'text-amber-500',
            link: '/portal/profile',
          },
        ].map((stat, i) => {
          const IconComp = stat.icon;
          return (
            <Link key={i} to={stat.link}>
              <Card className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:shadow-sm transition-all flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase text-slate-400">
                    {stat.label}
                  </p>
                  <p className="text-sm font-bold text-slate-800 dark:text-white mt-0.5">
                    {stat.val}
                  </p>
                </div>
                <IconComp className={`w-5 h-5 ${stat.color}`} />
              </Card>
            </Link>
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
                  My Subject Scores vs Class Average (%)
                </h2>
                <p className="text-xs text-slate-500">Mid-term examination comparison</p>
              </div>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectScores}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="subject" stroke="#64748b" fontSize={12} />
                  <YAxis domain={[60, 100]} stroke="#64748b" fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="score" fill="#3b82f6" radius={[4, 4, 0, 0]} name="My Score" />
                  <Bar dataKey="classAvg" fill="#cbd5e1" radius={[4, 4, 0, 0]} name="Class Avg" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                  My Monthly Attendance Record (%)
                </h2>
                <p className="text-xs text-slate-500">Personal attendance percentage</p>
              </div>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={studentAttendanceTrend}>
                  <defs>
                    <linearGradient id="colorStuAtt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                  <YAxis domain={[85, 100]} stroke="#64748b" fontSize={12} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="att"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorStuAtt)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Today's Classes, Homework & Assignments, Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Timetable */}
        <Card className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" />
              Today&apos;s Class Schedule
            </h3>
            <span className="text-xs font-semibold text-blue-600">5 Periods</span>
          </div>
          <div className="space-y-3">
            {[
              { time: '08:30 AM', subject: 'Mathematics', teacher: 'Ravi Sharma', room: 'Room 204' },
              { time: '09:30 AM', subject: 'English Lit.', teacher: 'Mrs. Anita Rao', room: 'Room 204' },
              { time: '11:00 AM', subject: 'Physics Lab', teacher: 'Dr. Alok Verma', room: 'Sci Lab 1' },
              { time: '01:30 PM', subject: 'Computer Sci.', teacher: 'Mr. Vivek Jha', room: 'Computer Lab' },
            ].map((c, i) => (
              <div
                key={i}
                className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {c.subject}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {c.teacher} • {c.room}
                  </p>
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {c.time}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Homework & Assignments */}
        <Card className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-500" />
              Pending Homework & Projects
            </h3>
            <Link to="/portal/homework" className="text-xs text-blue-600 hover:underline">
              Submit
            </Link>
          </div>
          <div className="space-y-3">
            {[
              {
                title: 'Trigonometry Worksheet #4',
                subject: 'Math',
                due: 'Tomorrow, 11:59 PM',
                status: 'Pending',
              },
              {
                title: 'Essay: Climate Change & Renewable Energy',
                subject: 'English',
                due: 'Aug 07, 2026',
                status: 'In Progress',
              },
            ].map((hw, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {hw.title}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {hw.subject} • Due: {hw.due}
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-800 dark:bg-amber-800 dark:text-amber-200">
                  {hw.status}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* School Announcements */}
        <Card className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-purple-500" />
              School Notices & Circulars
            </h3>
            <Link to="/portal/communication/notices" className="text-xs text-blue-600 hover:underline">
              All Notices
            </Link>
          </div>
          <div className="space-y-3">
            {[
              { title: 'Mid-Term Exam Datesheet Released', date: 'Aug 04, 2026' },
              { title: 'Inter-House Sports Competitions Registration', date: 'Aug 02, 2026' },
              { title: 'Science Lab Safety Rules Updated', date: 'Jul 30, 2026' },
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
      </div>
    </div>
  );
};
