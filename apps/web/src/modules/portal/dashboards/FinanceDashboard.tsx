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
  DollarSign,
  CreditCard,
  FileText,
  AlertCircle,
  ArrowUpRight,
  TrendingUp,
  Download,
  PlusCircle,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';

const monthlyRevenueData = [
  { month: 'Apr', collected: 1400000, target: 1500000 },
  { month: 'May', collected: 1550000, target: 1500000 },
  { month: 'Jun', collected: 1380000, target: 1500000 },
  { month: 'Jul', collected: 1620000, target: 1500000 },
  { month: 'Aug', collected: 1520000, target: 1500000 },
];

const feeBreakdownData = [
  { name: 'Tuition Paid', value: 72, color: '#10b981' },
  { name: 'Pending Dues', value: 20, color: '#3b82f6' },
  { name: 'Overdue Defaults', value: 8, color: '#ef4444' },
];

export const FinanceDashboard: React.FC = () => {
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
              Finance & Accounts
            </span>
            <span className="text-sm text-slate-500">Academic Year 2026-27</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            Accounts & Fee Collection Command Center
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Track daily fee collections, manage outstanding defaulters, generate receipts, and reconcile revenue.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/portal/finance/collect"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium shadow-sm transition-all flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            Collect Fees
          </Link>
          <Link
            to="/portal/finance/reports"
            className="px-4 py-2 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Financial Report
          </Link>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: "Today's Fee Collection",
            value: '₹1,84,500',
            subtitle: '18 cash / 12 online payments',
            icon: DollarSign,
            color: 'from-emerald-500 to-teal-600',
            link: '/portal/finance/receipts',
          },
          {
            title: 'Outstanding Fees',
            value: '₹3,20,000',
            subtitle: '48 defaulter accounts flagged',
            icon: AlertCircle,
            color: 'from-amber-500 to-orange-600',
            link: '/portal/finance/defaulters',
          },
          {
            title: 'Monthly Revenue (Aug)',
            value: '₹15.2 Lakhs',
            subtitle: '101.3% of target collected',
            icon: TrendingUp,
            color: 'from-blue-500 to-indigo-600',
            link: '/portal/finance/reports',
          },
          {
            title: 'Pending Invoices',
            value: '24 Invoices',
            subtitle: 'Awaiting parent bank transfer',
            icon: FileText,
            color: 'from-purple-500 to-violet-600',
            link: '/portal/finance/invoices',
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
                  <span>Open finance view</span>
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
                  Monthly Fee Collection vs Target (INR)
                </h2>
                <p className="text-xs text-slate-500">Collected tuition and fees comparison</p>
              </div>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="collected" fill="#10b981" radius={[4, 4, 0, 0]} name="Collected" />
                  <Bar dataKey="target" fill="#cbd5e1" radius={[4, 4, 0, 0]} name="Target" />
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
                  Institutional Fee Status Breakdown
                </h2>
                <p className="text-xs text-slate-500">Percentage distribution of student fee balances</p>
              </div>
            </div>
            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip />
                  <Pie
                    data={feeBreakdownData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {feeBreakdownData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Recent Receipts & Defaulter Alert Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              Recently Issued Fee Receipts
            </h3>
            <Link to="/portal/finance/receipts" className="text-xs text-blue-600 hover:underline">
              All Receipts
            </Link>
          </div>
          <div className="space-y-3">
            {[
              {
                rec: 'REC-9842',
                student: 'Anaya Gupta (Class X-A)',
                amount: '₹18,500',
                mode: 'UPI Online',
                time: '12 mins ago',
              },
              {
                rec: 'REC-9841',
                student: 'Karan Mehra (Class VIII-B)',
                amount: '₹14,000',
                mode: 'Cash',
                time: '45 mins ago',
              },
              {
                rec: 'REC-9840',
                student: 'Simran Kaur (Class XI-A)',
                amount: '₹22,000',
                mode: 'Bank Transfer',
                time: '2 hours ago',
              },
            ].map((r, i) => (
              <div
                key={i}
                className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {r.rec}
                    </span>
                    <span className="text-[10px] text-slate-500">• {r.mode}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{r.student}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-emerald-600">{r.amount}</span>
                  <p className="text-[10px] text-slate-400">{r.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              Overdue Fee Defaulter Alerts (High Priority)
            </h3>
            <span className="text-xs font-semibold text-amber-600">48 accounts</span>
          </div>
          <div className="space-y-3">
            {[
              {
                student: 'Rahul Verma (Class X-A)',
                due: '₹24,500',
                overdue: '32 days',
                parent: '+91 98111-22334',
              },
              {
                student: 'Priya Sharma (Class IX-B)',
                due: '₹18,000',
                overdue: '18 days',
                parent: '+91 98222-33445',
              },
              {
                student: 'Alok Nath (Class VI-A)',
                due: '₹12,500',
                overdue: '14 days',
                parent: '+91 98333-44556',
              },
            ].map((d, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {d.student}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Overdue: {d.overdue} • Parent: {d.parent}
                  </p>
                </div>
                <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
                  {d.due}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
