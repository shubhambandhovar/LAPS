import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Users,
  UserCheck,
  Calendar,
  PhoneCall,
  Clock,
  ArrowUpRight,
  UserPlus,
  Search,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';

const visitorTrafficData = [
  { time: '08:00 AM', visitors: 12 },
  { time: '10:00 AM', visitors: 34 },
  { time: '12:00 PM', visitors: 45 },
  { time: '02:00 PM', visitors: 28 },
  { time: '04:00 PM', visitors: 15 },
];

export const ReceptionistDashboard: React.FC = () => {
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
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300">
              Front Desk & Reception
            </span>
            <span className="text-sm text-slate-500">Live Visitor Gatekeeper</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            Reception Desk & Visitor Control
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Manage campus visitor passes, parent appointments, incoming calls, and front-desk inquiries.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/portal/visitors/new"
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-medium shadow-sm transition-all flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Check-In Visitor
          </Link>
          <Link
            to="/portal/visitors"
            className="px-4 py-2 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            Visitor Directory
          </Link>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: "Today's Visitors",
            value: '34 Checked-In',
            subtitle: '8 currently on campus',
            icon: Users,
            color: 'from-cyan-500 to-blue-600',
            link: '/portal/visitors',
          },
          {
            title: 'Scheduled Appointments',
            value: '14 Today',
            subtitle: 'Principal & Teacher meetings',
            icon: Calendar,
            color: 'from-blue-500 to-indigo-600',
            link: '/portal/visitors/appointments',
          },
          {
            title: 'Incoming Calls Logged',
            value: '42 Calls',
            subtitle: '6 pending callback requests',
            icon: PhoneCall,
            color: 'from-emerald-500 to-teal-600',
            link: '/portal/visitors/calls',
          },
          {
            title: 'Admission Walk-Ins',
            value: '7 Enquiries',
            subtitle: '3 brochures distributed',
            icon: UserCheck,
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
                  className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-medium text-cyan-600 dark:text-cyan-400 hover:underline"
                >
                  <span>View log</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Chart Section: Hourly Visitor Traffic */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                  Hourly Campus Visitor Traffic
                </h2>
                <p className="text-xs text-slate-500">Peak check-ins throughout the school day</p>
              </div>
              <span className="text-xs font-semibold px-2 py-1 bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300 rounded">
                Live Gate
              </span>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={visitorTrafficData}>
                  <defs>
                    <linearGradient id="colorVis" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="visitors"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorVis)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>

        {/* Live Visitor Queue */}
        <Card className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" />
              Visitors Currently on Campus (8 Active)
            </h3>
            <span className="text-xs text-emerald-600 font-medium">Verified Badges</span>
          </div>
          <div className="space-y-3">
            {[
              {
                name: 'Mr. Arvind Khanna (Parent)',
                purpose: 'Meeting with Class VIII Teacher',
                badge: 'PASS-104',
                inTime: '10:15 AM',
              },
              {
                name: 'Dr. Suresh Nair (Guest Speaker)',
                purpose: 'Science Auditorium Lecture',
                badge: 'PASS-105',
                inTime: '10:45 AM',
              },
              {
                name: 'Ms. Pooja Batra (Vendor)',
                purpose: 'Library Books Supply Delivery',
                badge: 'PASS-106',
                inTime: '11:10 AM',
              },
            ].map((v, i) => (
              <div
                key={i}
                className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {v.name}
                    </p>
                    <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      {v.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{v.purpose}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-medium text-slate-500">In: {v.inTime}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
