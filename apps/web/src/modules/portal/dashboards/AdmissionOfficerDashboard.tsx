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
  UserPlus,
  CheckCircle,
  Calendar,
  Clock,
  PhoneCall,
  FileText,
  ArrowUpRight,
  Filter,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';

const funnelData = [
  { stage: 'Inquiries', count: 420 },
  { stage: 'Applications', count: 310 },
  { stage: 'Interviews', count: 240 },
  { stage: 'Admitted', count: 185 },
];

const sourceData = [
  { name: 'Website Form', value: 45, color: '#6366f1' },
  { name: 'Referral', value: 25, color: '#10b981' },
  { name: 'Walk-In', value: 18, color: '#f59e0b' },
  { name: 'Social Media', value: 12, color: '#ec4899' },
];

export const AdmissionOfficerDashboard: React.FC = () => {
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
              Admissions Office
            </span>
            <span className="text-sm text-slate-500">2026-27 Enrollment</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            Admissions Pipeline & Interviews
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Track incoming student applications, schedule parent interviews, and manage enrollment conversions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/portal/admissions"
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium shadow-sm transition-all flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            New Application
          </Link>
          <Link
            to="/portal/admissions/enquiries"
            className="px-4 py-2 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filter Inquiries
          </Link>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: 'Total Applications',
            value: '310',
            subtitle: '+24 this week',
            icon: FileText,
            color: 'from-purple-500 to-indigo-600',
            link: '/portal/admissions',
          },
          {
            title: 'Pending Review',
            value: '42',
            subtitle: 'Requires officer assessment',
            icon: Clock,
            color: 'from-amber-500 to-orange-600',
            link: '/portal/admissions?status=PENDING',
          },
          {
            title: 'Approved / Admitted',
            value: '185',
            subtitle: '59.6% conversion rate',
            icon: CheckCircle,
            color: 'from-emerald-500 to-teal-600',
            link: '/portal/admissions?status=APPROVED',
          },
          {
            title: "Today's Visits / Interviews",
            value: '8 Scheduled',
            subtitle: 'Next interview at 11:30 AM',
            icon: Calendar,
            color: 'from-blue-500 to-cyan-600',
            link: '/portal/admissions/interviews',
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
                  <span>View applications</span>
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
                  Admissions Conversion Funnel
                </h2>
                <p className="text-xs text-slate-500">Stage-by-stage progression of candidates</p>
              </div>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" stroke="#64748b" fontSize={12} />
                  <YAxis dataKey="stage" type="category" stroke="#64748b" fontSize={12} width={90} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Candidates" />
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
                  Inquiry Source Breakdown
                </h2>
                <p className="text-xs text-slate-500">Where our new applicants discover the school</p>
              </div>
            </div>
            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip />
                  <Pie
                    data={sourceData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {sourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Widgets: Today's Interview Schedule & Pending Applications Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-600" />
              Today&apos;s Scheduled Parent Interviews
            </h3>
            <span className="text-xs text-slate-500">3 remaining</span>
          </div>
          <div className="space-y-3">
            {[
              {
                name: 'Anaya Gupta (Grade III)',
                parent: 'Mr. Rajesh Gupta',
                time: '11:30 AM',
                status: 'Confirmed',
              },
              {
                name: 'Kiran Patel (Grade VI)',
                parent: 'Mrs. Sunita Patel',
                time: '02:00 PM',
                status: 'Confirmed',
              },
              {
                name: 'Rohan Mehra (Grade I)',
                parent: 'Mr. Alok Mehra',
                time: '03:30 PM',
                status: 'Rescheduled',
              },
            ].map((interview, i) => (
              <div
                key={i}
                className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {interview.name}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">Parent: {interview.parent}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {interview.time}
                  </span>
                  <p className="text-[10px] text-purple-600">{interview.status}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-emerald-600" />
              Pending Follow-Ups & Inquiries
            </h3>
            <Link to="/portal/admissions/enquiries" className="text-xs text-blue-600 hover:underline">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {[
              {
                name: 'Vikram Singh (Enquiry #INQ-882)',
                note: 'Requested hostel room tour details',
                time: '2 hours ago',
              },
              {
                name: 'Meena Iyer (Enquiry #INQ-890)',
                note: 'Pending fee discount approval signature',
                time: 'Yesterday',
              },
              {
                name: 'Amit Verma (Enquiry #INQ-895)',
                note: 'Needs assistance with online birth certificate upload',
                time: '2 days ago',
              },
            ].map((inq, i) => (
              <div
                key={i}
                className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {inq.name}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{inq.note}</p>
                </div>
                <span className="text-[10px] text-slate-400">{inq.time}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
