import React from 'react';

export const GpsTrackingPage: React.FC = () => {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Live GPS Tracking
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Monitor real-time telemetry and fleet location.
          </p>
        </div>
      </div>

      {/* Placeholder Map */}
      <div className="bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 h-[600px] flex items-center justify-center">
        <div className="text-center">
          <span className="text-6xl block mb-4">🗺️</span>
          <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300">Map Integration</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto">
            Live GPS telemetry maps would be integrated here using Leaflet or Google Maps to track active routes.
          </p>
        </div>
      </div>
    </div>
  );
};
