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
  Users,
  Award,
  DollarSign,
  Truck,
  Bell,
  ArrowUpRight,
  UserCheck,
  BookOpen,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';

const wardProgressData = [
  { term: 'Term 1', percentage: 86.4 },
  { term: 'Mid-Term', percentage: 89.2 },
  { term: 'Term 2', percentage: 91.5 },
];

const wardAttendanceTrend = [
  { month: 'Apr', att: 98 },
  { month: 'May', att: 97 },
  { month: 'Jun', att: 100 },
  { month: 'Jul', att: 95 },
  { month: 'Aug', att: 98 },
];

export const GuardianDashboard: React.FC = () => {
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
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">
              Parent & Guardian Portal
            </span>
            <span className="text-sm text-slate-500">Wards: Anaya Gupta (X-A), Rohan Gupta (VI-B)</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            Guardian Family Dashboard
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Monitor your children&apos;s daily attendance, exam grades, fee payments, and school bus routes.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/portal/finance"
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium shadow-sm transition-all flex items-center gap-2"
          >
            <DollarSign className="w-4 h-4" />
            Pay School Fees
          </Link>
          <Link
            to="/portal/transport"
            className="px-4 py-2 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
          >
            <Truck className="w-4 h-4" />
            Live GPS Bus Tracker
          </Link>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: 'Wards Enrolled',
            value: '2 Children',
            subtitle: 'Anaya (X-A) & Rohan (VI-B)',
            icon: Users,
            color: 'from-purple-500 to-indigo-600',
            link: '/portal/profile',
          },
          {
            title: 'Average Attendance',
            value: '97.6%',
            subtitle: 'No unexcused absences',
            icon: UserCheck,
            color: 'from-emerald-500 to-teal-600',
            link: '/portal/academics/attendance',
          },
          {
            title: 'Fee Dues & Balances',
            value: '₹0 Due',
            subtitle: 'Q2 tuition fee receipt ready',
            icon: DollarSign,
            color: 'from-blue-500 to-cyan-600',
            link: '/portal/finance',
          },
          {
            title: 'Latest Exam Average',
            value: '90.3%',
            subtitle: 'Top 10% in Class X-A',
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
                  className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-medium text-purple-600 dark:text-purple-400 hover:underline"
                >
                  <span>View ward report</span>
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
                  Ward Academic Growth Chart (%)
                </h2>
                <p className="text-xs text-slate-500">Overall percentage progression by term</p>
              </div>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={wardProgressData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="term" stroke="#64748b" fontSize={12} />
                  <YAxis domain={[70, 100]} stroke="#64748b" fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="percentage" fill="#8b5cf6" radius={[6, 6, 0, 0]} name="Score %" />
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
                  Ward Attendance Trend (%)
                </h2>
                <p className="text-xs text-slate-500">Monthly attendance consistency</p>
              </div>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={wardAttendanceTrend}>
                  <defs>
                    <linearGradient id="colorGdAtt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                  <YAxis domain={[85, 100]} stroke="#64748b" fontSize={12} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="att"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorGdAtt)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Live Transport Status, Homework & School Notices */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Transport GPS Status */}
        <Card className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-500" />
              Live School Bus GPS Status
            </h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
              On Schedule
            </span>
          </div>
          <div className="p-3 rounded-lg bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200">
              <span>Bus Route #4 (Gohad Campus)</span>
              <span>Bus No. DL-04-AB-1234</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Driver: Mr. Ramesh Singh (+91 98765-43210)
            </p>
            <div className="pt-2 border-t border-blue-100 dark:border-blue-900/20 flex items-center justify-between text-[11px] text-blue-700 dark:text-blue-300 font-medium">
              <span>Current Location: Civil Lines Crossing</span>
              <span>ETA Home: 03:45 PM</span>
            </div>
          </div>
        </Card>

        {/* Ward Pending Homework */}
        <Card className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-500" />
              Wards&apos; Pending Homework
            </h3>
            <span className="text-xs text-slate-500">2 tasks</span>
          </div>
          <div className="space-y-3">
            {[
              {
                ward: 'Anaya Gupta (X-A)',
                title: 'Trigonometry Worksheet #4',
                due: 'Tomorrow',
              },
              {
                ward: 'Rohan Gupta (VI-B)',
                title: 'Science Lab Observation Notes',
                due: 'Aug 07',
              },
            ].map((hw, i) => (
              <div
                key={i}
                className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {hw.title}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {hw.ward} • Due: {hw.due}
                  </p>
                </div>
                <span className="text-xs font-bold text-amber-600">Pending</span>
              </div>
            ))}
          </div>
        </Card>

        {/* School Circulars */}
        <Card className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-purple-500" />
              School Circulars & Parent Notices
            </h3>
          </div>
          <div className="space-y-3">
            {[
              { title: 'Parent-Teacher Meeting (PTM) Scheduled for Saturday', date: 'Aug 04' },
              { title: 'Annual Cultural Festival Costume Guidance', date: 'Aug 01' },
              { title: 'Monsoon Dengue Prevention Advisory', date: 'Jul 29' },
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
