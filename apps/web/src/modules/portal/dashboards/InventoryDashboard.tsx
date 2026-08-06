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
  Box,
  AlertTriangle,
  ShoppingCart,
  Truck,
  DollarSign,
  ArrowUpRight,
  PlusCircle,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';

const stockMovementTrend = [
  { month: 'Apr', inbound: 42, outbound: 38 },
  { month: 'May', inbound: 55, outbound: 49 },
  { month: 'Jun', inbound: 31, outbound: 35 },
  { month: 'Jul', inbound: 68, outbound: 62 },
  { month: 'Aug', inbound: 45, outbound: 40 },
];

const assetCategoryValue = [
  { name: 'IT & Lab Electronics', value: 55, color: '#6366f1' },
  { name: 'Classroom Furniture', value: 25, color: '#3b82f6' },
  { name: 'Sports & PE Gear', value: 12, color: '#10b981' },
  { name: 'Stationery / Office', value: 8, color: '#f59e0b' },
];

export const InventoryDashboard: React.FC = () => {
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
              Inventory & Stores
            </span>
            <span className="text-sm text-slate-500">Asset Management</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            Store Manager Inventory Console
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Track fixed assets, monitor consumable stock levels, manage purchase orders, and audit vendor performance.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/portal/inventory/assets/new"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm transition-all flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            Add Asset
          </Link>
          <Link
            to="/portal/inventory/purchase-orders"
            className="px-4 py-2 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
          >
            <ShoppingCart className="w-4 h-4" />
            Purchase Orders
          </Link>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: 'Total Assets Tracked',
            value: '1,420 Items',
            subtitle: '1,380 active / 40 maintenance',
            icon: Box,
            color: 'from-indigo-500 to-blue-600',
            link: '/portal/inventory',
          },
          {
            title: 'Low Stock Alerts',
            value: '6 Items',
            subtitle: 'Requires reorder replenishment',
            icon: AlertTriangle,
            color: 'from-amber-500 to-orange-600',
            link: '/portal/inventory/alerts',
          },
          {
            title: 'Active Purchase Orders',
            value: '4 Orders',
            subtitle: '2 awaiting vendor dispatch',
            icon: ShoppingCart,
            color: 'from-emerald-500 to-teal-600',
            link: '/portal/inventory/purchase-orders',
          },
          {
            title: 'Total Inventory Valuation',
            value: '₹84.5 Lakhs',
            subtitle: 'Calculated across 14 categories',
            icon: DollarSign,
            color: 'from-purple-500 to-violet-600',
            link: '/portal/inventory/reports',
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
                  <span>View inventory</span>
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
                  Monthly Stock Inbound vs Outbound
                </h2>
                <p className="text-xs text-slate-500">Asset & consumable transaction velocity</p>
              </div>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stockMovementTrend}>
                  <defs>
                    <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="inbound"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorIn)"
                    name="Inbound Stock"
                  />
                  <Area
                    type="monotone"
                    dataKey="outbound"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorOut)"
                    name="Outbound Issue"
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
                  Asset Valuation Breakdown by Category
                </h2>
                <p className="text-xs text-slate-500">Percentage distribution of ₹84.5 Lakhs</p>
              </div>
            </div>
            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip />
                  <Pie
                    data={assetCategoryValue}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {assetCategoryValue.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Low Stock Alerts & Vendor Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Low Stock Alert Queue (Reorder Required)
            </h3>
            <Link to="/portal/inventory/alerts" className="text-xs text-blue-600 hover:underline">
              View All (6)
            </Link>
          </div>
          <div className="space-y-3">
            {[
              { item: 'A4 White Printer Paper Reams', stock: '4 remaining', min: '20 min' },
              { item: 'Whiteboard Dry Erase Markers (Black)', stock: '12 remaining', min: '50 min' },
              { item: 'Physics Lab Glass Beakers (500ml)', stock: '3 remaining', min: '15 min' },
            ].map((alert, i) => (
              <div
                key={i}
                className="p-3 rounded-lg bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {alert.item}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Min threshold: {alert.min}</p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-800 dark:bg-amber-800 dark:text-amber-200">
                  {alert.stock}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Truck className="w-4 h-4 text-emerald-600" />
              Active Vendor Orders & Deliveries
            </h3>
            <span className="text-xs font-medium text-emerald-600">4 in pipeline</span>
          </div>
          <div className="space-y-3">
            {[
              {
                vendor: 'Star Scientific & Lab Supplies',
                po: '#PO-2026-89',
                status: 'Dispatched (ETA Tomorrow)',
              },
              {
                vendor: 'Apex Furniture Works',
                po: '#PO-2026-85',
                status: 'Quality Inspection',
              },
              {
                vendor: 'Gupta Stationery Mart',
                po: '#PO-2026-90',
                status: 'Order Confirmed',
              },
            ].map((v, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {v.vendor}
                    </p>
                    <span className="text-[10px] text-slate-500">{v.po}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{v.status}</p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                  Track
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
