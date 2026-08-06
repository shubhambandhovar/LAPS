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
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  BookOpen,
  BookCheck,
  AlertCircle,
  DollarSign,
  ArrowUpRight,
  PlusCircle,
  Search,
  Bookmark,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';

const circulationTrend = [
  { month: 'Apr', issued: 420, returned: 390 },
  { month: 'May', issued: 510, returned: 480 },
  { month: 'Jun', issued: 380, returned: 410 },
  { month: 'Jul', issued: 640, returned: 590 },
  { month: 'Aug', issued: 580, returned: 540 },
];

const bookCategories = [
  { name: 'Science & Math', value: 38, color: '#3b82f6' },
  { name: 'Literature & Fiction', value: 27, color: '#8b5cf6' },
  { name: 'History & Civics', value: 20, color: '#10b981' },
  { name: 'Reference & General', value: 15, color: '#f59e0b' },
];

export const LibraryDashboard: React.FC = () => {
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
              Library Operations
            </span>
            <span className="text-sm text-slate-500">Central Library Catalog</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            Librarian Circulation Console
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Manage book issues and returns, track overdue fines, and monitor library catalog circulation.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/portal/library/issue"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition-all flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            Issue / Return Book
          </Link>
          <Link
            to="/portal/library/catalog"
            className="px-4 py-2 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            Catalog Directory
          </Link>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: 'Books Currently Issued',
            value: '482 Books',
            subtitle: 'Across 340 students & faculty',
            icon: BookOpen,
            color: 'from-blue-500 to-indigo-600',
            link: '/portal/library/issued',
          },
          {
            title: 'Returned Today',
            value: '34 Books',
            subtitle: 'All inspected in good condition',
            icon: BookCheck,
            color: 'from-emerald-500 to-teal-600',
            link: '/portal/library/returns',
          },
          {
            title: 'Overdue Books',
            value: '18 Overdue',
            subtitle: 'Fine notifications sent',
            icon: AlertCircle,
            color: 'from-amber-500 to-orange-600',
            link: '/portal/library/overdue',
          },
          {
            title: 'Overdue Fine Collection',
            value: '₹3,450',
            subtitle: 'Collected this month',
            icon: DollarSign,
            color: 'from-purple-500 to-violet-600',
            link: '/portal/library/fines',
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
                  <span>View books</span>
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
                  Monthly Circulation Trend (Issues vs Returns)
                </h2>
                <p className="text-xs text-slate-500">Monthly book borrowing statistics</p>
              </div>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={circulationTrend}>
                  <defs>
                    <linearGradient id="colorIss" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorRet" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="issued"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorIss)"
                    name="Issued"
                  />
                  <Area
                    type="monotone"
                    dataKey="returned"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRet)"
                    name="Returned"
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
                  Book Collection by Subject Category
                </h2>
                <p className="text-xs text-slate-500">Percentage breakdown of 14,800 titles</p>
              </div>
            </div>
            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip />
                  <Pie
                    data={bookCategories}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {bookCategories.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Most Borrowed Books & Overdue Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-blue-500" />
              Most Borrowed Library Books (This Month)
            </h3>
            <span className="text-xs text-slate-500">Top 3 Titles</span>
          </div>
          <div className="space-y-3">
            {[
              { title: 'Concepts of Physics (H.C. Verma)', author: 'H.C. Verma', count: '42 Issues' },
              { title: 'To Kill a Mockingbird', author: 'Harper Lee', count: '29 Issues' },
              { title: 'Advanced Vedic Mathematics', author: 'R.K. Thakur', count: '24 Issues' },
            ].map((book, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {book.title}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Author: {book.author}</p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                  {book.count}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              Overdue Books Flagged for Action
            </h3>
            <Link to="/portal/library/overdue" className="text-xs text-blue-600 hover:underline">
              Review All (18)
            </Link>
          </div>
          <div className="space-y-3">
            {[
              {
                student: 'Aarav Sharma (Class X-A)',
                book: 'Organic Chemistry Vol. 2',
                days: '8 days overdue',
                fine: '₹80 fine',
              },
              {
                student: 'Simran Kaur (Class XI-B)',
                book: 'World History Atlas',
                days: '5 days overdue',
                fine: '₹50 fine',
              },
              {
                student: 'Rohan Mehra (Class VI-A)',
                book: 'The Adventures of Tom Sawyer',
                days: '3 days overdue',
                fine: '₹30 fine',
              },
            ].map((od, i) => (
              <div
                key={i}
                className="p-3 rounded-lg bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {od.student}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Book: {od.book} ({od.days})
                  </p>
                </div>
                <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
                  {od.fine}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
