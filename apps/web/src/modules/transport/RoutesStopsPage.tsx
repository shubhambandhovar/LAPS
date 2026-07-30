import React, { useState } from 'react';

interface RouteItem {
  id: string;
  routeName: string;
  routeCode: string;
  distanceKm: number;
  durationMinutes: number;
  stopsCount: number;
  vehicleAssigned: string | null;
  status: 'ACTIVE' | 'ARCHIVED';
}

interface StopItem {
  id: string;
  stopName: string;
  stopCode: string;
  pickupTime: string;
  dropTime: string;
  studentCount: number;
  feeAmount: number;
}

export const RoutesStopsPage: React.FC = () => {
  const [routes, _setRoutes] = useState<RouteItem[]>([
    {
      id: 'rt-1',
      routeName: 'City Center to Gohad Fort',
      routeCode: 'RT-01',
      distanceKm: 12.5,
      durationMinutes: 45,
      stopsCount: 6,
      vehicleAssigned: 'MP-04-AB-1234',
      status: 'ACTIVE',
    },
    {
      id: 'rt-2',
      routeName: 'Industrial Area Loop',
      routeCode: 'RT-02',
      distanceKm: 8.2,
      durationMinutes: 30,
      stopsCount: 4,
      vehicleAssigned: 'MP-04-CD-5678',
      status: 'ACTIVE',
    },
    {
      id: 'rt-3',
      routeName: 'Outer Ring Express',
      routeCode: 'RT-03',
      distanceKm: 22.0,
      durationMinutes: 65,
      stopsCount: 8,
      vehicleAssigned: null,
      status: 'ARCHIVED',
    },
  ]);

  const [selectedRoute, setSelectedRoute] = useState<RouteItem | null>(routes[0]);
  const [searchRoute, setSearchRoute] = useState('');

  const [stops] = useState<StopItem[]>([
    {
      id: 'stp-1',
      stopName: 'Gohad Main Gate',
      stopCode: 'STP-GHD-01',
      pickupTime: '07:15',
      dropTime: '15:45',
      studentCount: 12,
      feeAmount: 1200,
    },
    {
      id: 'stp-2',
      stopName: 'Railway Station',
      stopCode: 'STP-GHD-02',
      pickupTime: '07:30',
      dropTime: '15:30',
      studentCount: 20,
      feeAmount: 1500,
    },
    {
      id: 'stp-3',
      stopName: 'Fort Chowk',
      stopCode: 'STP-GHD-03',
      pickupTime: '07:45',
      dropTime: '15:15',
      studentCount: 10,
      feeAmount: 800,
    },
  ]);

  const filteredRoutes = routes.filter((r) =>
    r.routeName.toLowerCase().includes(searchRoute.toLowerCase()) ||
    r.routeCode.toLowerCase().includes(searchRoute.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Routes & Stops Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Design fleet routes, configure geo-fenced stops, and manage distance-based fees.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2.5 rounded-xl font-semibold text-sm bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 shadow-sm transition-all duration-200 flex items-center gap-2">
            <span>+ Add Stop</span>
          </button>
          <button className="px-4 py-2.5 rounded-xl font-semibold text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-all duration-200 flex items-center gap-2">
            <span>+ Create Route</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Routes List */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col h-[600px]">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <input
              type="text"
              placeholder="Search routes..."
              value={searchRoute}
              onChange={(e) => setSearchRoute(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {filteredRoutes.map((route) => (
              <button
                key={route.id}
                onClick={() => setSelectedRoute(route)}
                className={`w-full text-left p-4 rounded-xl transition-all border ${
                  selectedRoute?.id === route.id
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 shadow-sm'
                    : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:border-slate-200 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">{route.routeName}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{route.routeCode}</p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      route.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {route.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs text-slate-600 dark:text-slate-400 font-medium">
                  <div className="flex items-center gap-1">
                    <span>⏱️</span> {route.durationMinutes} min
                  </div>
                  <div className="flex items-center gap-1">
                    <span>📍</span> {route.stopsCount} stops
                  </div>
                </div>
              </button>
            ))}
            {filteredRoutes.length === 0 && (
              <div className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">
                No routes found.
              </div>
            )}
          </div>
        </div>

        {/* Route Details & Stops */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {selectedRoute ? (
            <>
              {/* Route Info Card */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                      {selectedRoute.routeName}
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 font-medium">
                        {selectedRoute.routeCode}
                      </span>
                      {selectedRoute.vehicleAssigned ? (
                        <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                          🚌 Assigned to {selectedRoute.vehicleAssigned}
                        </span>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400">⚠️ No Vehicle Assigned</span>
                      )}
                    </p>
                  </div>
                  <button className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                    Edit Route
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Distance</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">{selectedRoute.distanceKm} km</p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Est. Duration</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">{selectedRoute.durationMinutes} mins</p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Students</p>
                    <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                      {stops.reduce((acc, stop) => acc + stop.studentCount, 0)} Active
                    </p>
                  </div>
                </div>
              </div>

              {/* Stops Timeline/Table */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex-1">
                <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                  <h3 className="font-bold text-slate-900 dark:text-white">Route Waypoints & Stops</h3>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-full">
                    {stops.length} Stops Configured
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900/50 text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                        <th className="p-4">Stop Name & Code</th>
                        <th className="p-4">Schedule</th>
                        <th className="p-4">Transport Fee</th>
                        <th className="p-4">Students</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-sm">
                      {stops.map((stop, index) => (
                        <tr key={stop.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="flex flex-col items-center">
                                <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                                  {index + 1}
                                </div>
                                {index !== stops.length - 1 && (
                                  <div className="w-0.5 h-full bg-indigo-200 dark:bg-indigo-800 absolute top-8 bottom-0 -z-10" />
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 dark:text-white">{stop.stopName}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{stop.stopCode}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col gap-1 text-xs font-medium text-slate-600 dark:text-slate-300">
                              <div className="flex items-center gap-1">
                                <span className="text-emerald-500">↑</span> Pick: {stop.pickupTime}
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-rose-500">↓</span> Drop: {stop.dropTime}
                              </div>
                            </div>
                          </td>
                          <td className="p-4 font-medium text-slate-900 dark:text-white">
                            ₹{stop.feeAmount.toLocaleString()}
                          </td>
                          <td className="p-4">
                            <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                              {stop.studentCount} Assigned
                            </span>
                          </td>
                          <td className="p-4 text-right space-x-2">
                            <button className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                              Edit
                            </button>
                            <button className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline">
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-600 h-full flex items-center justify-center">
              <div className="text-center">
                <span className="text-4xl">🗺️</span>
                <p className="mt-4 text-sm font-semibold text-slate-500 dark:text-slate-400">
                  Select a route to view its details and stops
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
