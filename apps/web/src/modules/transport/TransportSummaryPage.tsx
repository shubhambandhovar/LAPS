import React, { useState } from 'react';

interface TransportSummaryData {
  totalVehicles: number;
  activeVehicles: number;
  maintenanceVehicles: number;
  totalDrivers: number;
  activeDrivers: number;
  totalRoutes: number;
  totalStops: number;
  totalAssignedStudents: number;
  totalCapacity: number;
  overallOccupancyPercentage: number;
}

export const TransportSummaryPage: React.FC = () => {
  const [summary, _setSummary] = useState<TransportSummaryData>({
    totalVehicles: 12,
    activeVehicles: 10,
    maintenanceVehicles: 2,
    totalDrivers: 14,
    activeDrivers: 12,
    totalRoutes: 8,
    totalStops: 42,
    totalAssignedStudents: 380,
    totalCapacity: 480,
    overallOccupancyPercentage: 79.17,
  });

  const [loading, setLoading] = useState(false);

  const refreshData = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 500);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 rounded-2xl text-white shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/30 text-blue-300 border border-blue-400/30">
              Phase 13 ERP Module
            </span>
            <span className="text-xs text-slate-300">• Live Fleet Telemetry Ready</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mt-2">
            Transport, Fleet & GPS Tracking
          </h1>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl">
            Monitor school buses, driver assignments, route stops, occupancy utilization, and real-time GPS coordinates across the institution.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={refreshData}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl font-medium text-sm bg-white/10 hover:bg-white/20 text-white transition-all duration-200 border border-white/10 flex items-center gap-2"
          >
            <svg
              className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {loading ? 'Refreshing...' : 'Refresh KPIs'}
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Fleet Card */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Fleet Vehicles
            </span>
            <span className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
              🚌
            </span>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {summary.totalVehicles}
            </span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full">
              {summary.activeVehicles} Active
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            {summary.maintenanceVehicles} in Scheduled Maintenance
          </p>
        </div>

        {/* Drivers Card */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Assigned Drivers
            </span>
            <span className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-sm">
              👨‍✈️
            </span>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {summary.totalDrivers}
            </span>
            <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 px-2 py-0.5 rounded-full">
              {summary.activeDrivers} On Duty
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            100% Background & License Verified
          </p>
        </div>

        {/* Routes & Stops Card */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Active Routes
            </span>
            <span className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-sm">
              🗺️
            </span>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {summary.totalRoutes}
            </span>
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-full">
              {summary.totalStops} Pick-up Stops
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Geo-fenced stop waypoints active
          </p>
        </div>

        {/* Occupancy Card */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Fleet Occupancy
            </span>
            <span className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
              📊
            </span>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {summary.overallOccupancyPercentage}%
            </span>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
              {summary.totalAssignedStudents} / {summary.totalCapacity} Seats
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${summary.overallOccupancyPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Fleet Utilization & Module Navigation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Insights Box */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
            Transport Operations Overview
          </h2>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="font-medium">On-Time Morning Dispatch Rate</span>
              </div>
              <span className="font-bold text-slate-900 dark:text-white">98.4%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="font-medium">GPS Telemetry Signal Health</span>
              </div>
              <span className="font-bold text-slate-900 dark:text-white">100% Online</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="font-medium">Upcoming Fitness Certificate Expiries (30 Days)</span>
              </div>
              <span className="font-bold text-amber-600 dark:text-amber-400">1 Vehicle</span>
            </div>
          </div>
        </div>

        {/* Quick System Links */}
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-md flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold mb-2">Transport Security & RBAC</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Strict RBAC enforcement ensures teachers only inspect student transport rosters for their assigned class and section. Guardians view live telemetry restricted exclusively to their wards&apos; assigned vehicle.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
            <span className="text-xs text-slate-400">System Status: ACTIVE</span>
            <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              Audit Enabled
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
