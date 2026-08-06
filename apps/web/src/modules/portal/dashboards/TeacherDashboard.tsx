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
  Calendar,
  Users,
  Award,
  Clock,
  ArrowUpRight,
  CheckCircle2,
  FileText,
  AlertTriangle,
  MessageSquare,
  PlusCircle,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';

const classPerformanceData = [
  { subject: 'Math (X-A)', average: 84 },
  { subject: 'Science (X-A)', average: 79 },
  { subject: 'Physics (XI-B)', average: 88 },
  { subject: 'Chemistry (XI-B)', average: 82 },
];

const classAttendanceTrend = [
  { day: 'Mon', attendance: 96 },
  { day: 'Tue', attendance: 94 },
  { day: 'Wed', attendance: 97 },
  { day: 'Thu', attendance: 95 },
  { day: 'Fri', attendance: 98 },
];

export const TeacherDashboard: React.FC = () => {
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
              Faculty Workstation
            </span>
            <span className="text-sm text-slate-500">Academic Year 2026-27</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            Teacher Classroom Console
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Manage daily class schedules, submit attendance, grade homework, and track student mastery.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/portal/academics/attendance"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium shadow-sm transition-all flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            Take Attendance
          </Link>
          <Link
            to="/portal/homework/new"
            className="px-4 py-2 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            Assign Homework
          </Link>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: "Today's Classes",
            value: '4 Sessions',
            subtitle: 'Next class at 10:30 AM (X-A)',
            icon: Clock,
            color: 'from-emerald-500 to-teal-600',
            link: '/portal/academics/timetable',
          },
          {
            title: 'Pending Attendance',
            value: '1 Class',
            subtitle: 'Class X-A Math attendance due',
            icon: Users,
            color: 'from-amber-500 to-orange-600',
            link: '/portal/academics/attendance',
          },
          {
            title: 'Homework to Review',
            value: '18 Submissions',
            subtitle: 'Trigonometry Worksheet #4',
            icon: FileText,
            color: 'from-blue-500 to-indigo-600',
            link: '/portal/homework',
          },
          {
            title: 'Exam Marks Pending',
            value: 'Mid-Term',
            subtitle: 'Class XI Physics grading open',
            icon: Award,
            color: 'from-purple-500 to-violet-600',
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
                  className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  <span>Open classroom</span>
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
                  Class Average Exam Performance (%)
                </h2>
                <p className="text-xs text-slate-500">Mid-term score averages by assigned section</p>
              </div>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={classPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="subject" stroke="#64748b" fontSize={12} />
                  <YAxis domain={[60, 100]} stroke="#64748b" fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="average" fill="#10b981" radius={[6, 6, 0, 0]} name="Average Score" />
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
                  Weekly Class Attendance Consistency
                </h2>
                <p className="text-xs text-slate-500">Average student attendance in my subjects</p>
              </div>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={classAttendanceTrend}>
                  <defs>
                    <linearGradient id="colorTchAtt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
                  <YAxis domain={[85, 100]} stroke="#64748b" fontSize={12} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="attendance"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorTchAtt)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Today's Timetable, Student Alerts, and Messages */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Timetable */}
        <Card className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              Today&apos;s Class Timetable
            </h3>
            <span className="text-xs font-semibold text-emerald-600">4 periods</span>
          </div>
          <div className="space-y-3">
            {[
              { time: '08:30 - 09:15 AM', subject: 'Mathematics', cls: 'Class X-A', room: 'Room 204' },
              { time: '10:30 - 11:15 AM', subject: 'Science', cls: 'Class X-B', room: 'Lab 2' },
              { time: '01:00 - 01:45 PM', subject: 'Physics', cls: 'Class XI-A', room: 'Lab 1' },
              { time: '02:30 - 03:15 PM', subject: 'Mathematics', cls: 'Class IX-A', room: 'Room 108' },
            ].map((cls, i) => (
              <div
                key={i}
                className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {cls.subject} ({cls.cls})
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {cls.time} • {cls.room}
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                  Active
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Student Alerts */}
        <Card className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Student Academic & Attendance Alerts
            </h3>
            <span className="text-xs text-amber-600 font-medium">3 flagged</span>
          </div>
          <div className="space-y-3">
            {[
              {
                student: 'Aarav Sharma (X-A)',
                reason: 'Absent for 3 consecutive days',
                type: 'Attendance',
              },
              {
                student: 'Meera Patel (XI-B)',
                reason: 'Homework overdue: Physics Ch. 3',
                type: 'Homework',
              },
              {
                student: 'Rahul Verma (X-A)',
                reason: 'Low quiz score (42%) in Algebra',
                type: 'Academic',
              },
            ].map((alert, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {alert.student}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{alert.reason}</p>
                </div>
                <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-amber-200 text-amber-800 dark:bg-amber-800 dark:text-amber-200">
                  {alert.type}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Parent / Student Messages */}
        <Card className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-500" />
              Recent Parent & Student Messages
            </h3>
            <Link to="/portal/messages" className="text-xs text-blue-600 hover:underline">
              Inbox
            </Link>
          </div>
          <div className="space-y-3">
            {[
              {
                from: 'Mrs. Sunita Gupta (Parent of Anaya)',
                preview: 'Regarding permission for Tuesday doctor appointment...',
                time: '1 hr ago',
              },
              {
                from: 'Ravi Kumar (Student, XI-B)',
                preview: 'Submitted revised Lab Experiment 2 report...',
                time: '3 hrs ago',
              },
            ].map((m, i) => (
              <div
                key={i}
                className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 flex flex-col gap-1"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {m.from}
                  </p>
                  <span className="text-[10px] text-slate-400">{m.time}</span>
                </div>
                <p className="text-xs text-slate-500 truncate">{m.preview}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
