import React, { useState } from 'react';

interface VehicleItem {
  id: string;
  registrationNumber: string;
  vehicleType: 'BUS' | 'MINIBUS' | 'VAN';
  capacity: number;
  assignedStudents: number;
  odometerReadingKm: number;
  insuranceExpiryDate: string;
  fitnessExpiryDate: string;
  status: 'ACTIVE' | 'MAINTENANCE' | 'OUT_OF_SERVICE';
}

export const VehiclesPage: React.FC = () => {
  const [vehicles, setVehicles] = useState<VehicleItem[]>([
    {
      id: 'veh-1',
      registrationNumber: 'MP-04-AB-1234',
      vehicleType: 'BUS',
      capacity: 45,
      assignedStudents: 42,
      odometerReadingKm: 42500,
      insuranceExpiryDate: '2026-12-31',
      fitnessExpiryDate: '2026-11-15',
      status: 'ACTIVE',
    },
    {
      id: 'veh-2',
      registrationNumber: 'MP-04-CD-5678',
      vehicleType: 'BUS',
      capacity: 45,
      assignedStudents: 45,
      odometerReadingKm: 58200,
      insuranceExpiryDate: '2026-09-30',
      fitnessExpiryDate: '2026-08-10',
      status: 'ACTIVE',
    },
    {
      id: 'veh-3',
      registrationNumber: 'MP-04-EF-9012',
      vehicleType: 'MINIBUS',
      capacity: 25,
      assignedStudents: 22,
      odometerReadingKm: 31000,
      insuranceExpiryDate: '2026-10-31',
      fitnessExpiryDate: '2026-10-15',
      status: 'ACTIVE',
    },
    {
      id: 'veh-4',
      registrationNumber: 'MP-04-GH-3456',
      vehicleType: 'VAN',
      capacity: 14,
      assignedStudents: 0,
      odometerReadingKm: 89400,
      insuranceExpiryDate: '2026-08-01',
      fitnessExpiryDate: '2026-08-05',
      status: 'MAINTENANCE',
    },
  ]);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<{
    registrationNumber: string;
    vehicleType: 'BUS' | 'MINIBUS' | 'VAN';
    capacity: number;
    odometerReadingKm: number;
    insuranceExpiryDate: string;
    fitnessExpiryDate: string;
  }>({
    registrationNumber: '',
    vehicleType: 'BUS',
    capacity: 45,
    odometerReadingKm: 0,
    insuranceExpiryDate: '',
    fitnessExpiryDate: '',
  });

  const filteredVehicles = vehicles.filter((v) => {
    const matchesSearch = v.registrationNumber.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.registrationNumber || !form.insuranceExpiryDate || !form.fitnessExpiryDate) return;
    const newVeh: VehicleItem = {
      id: `veh-${Date.now()}`,
      registrationNumber: form.registrationNumber.toUpperCase(),
      vehicleType: form.vehicleType,
      capacity: Number(form.capacity),
      assignedStudents: 0,
      odometerReadingKm: Number(form.odometerReadingKm),
      insuranceExpiryDate: form.insuranceExpiryDate,
      fitnessExpiryDate: form.fitnessExpiryDate,
      status: 'ACTIVE',
    };
    setVehicles([newVeh, ...vehicles]);
    setShowModal(false);
    setForm({
      registrationNumber: '',
      vehicleType: 'BUS',
      capacity: 45,
      odometerReadingKm: 0,
      insuranceExpiryDate: '',
      fitnessExpiryDate: '',
    });
  };

  const isExpiringSoon = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays >= 0;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Fleet Vehicles
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage school buses, passenger vans, seating capacity, and compliance certificates.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 rounded-xl font-semibold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all duration-200 flex items-center gap-2"
        >
          <span>+ Add New Vehicle</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search by registration number (e.g. MP-04-AB)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Status:</span>
          {['ALL', 'ACTIVE', 'MAINTENANCE', 'OUT_OF_SERVICE'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === status
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {status === 'ALL' ? 'All Fleet' : status.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Vehicles Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                <th className="p-4">Registration #</th>
                <th className="p-4">Type</th>
                <th className="p-4">Seating Occupancy</th>
                <th className="p-4">Odometer</th>
                <th className="p-4">Insurance Expiry</th>
                <th className="p-4">Fitness Expiry</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-sm">
              {filteredVehicles.map((v) => {
                const occPercentage = Math.round((v.assignedStudents / v.capacity) * 100);
                const isInsExpiring = isExpiringSoon(v.insuranceExpiryDate);
                const isFitExpiring = isExpiringSoon(v.fitnessExpiryDate);

                return (
                  <tr
                    key={v.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="p-4 font-bold text-slate-900 dark:text-white">
                      {v.registrationNumber}
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        {v.vehicleType}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {v.assignedStudents} / {v.capacity}
                        </span>
                        <span
                          className={`text-xs font-bold ${
                            occPercentage >= 95
                              ? 'text-rose-600 dark:text-rose-400'
                              : occPercentage >= 80
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          ({occPercentage}%)
                        </span>
                      </div>
                      <div className="w-24 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-1 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            occPercentage >= 95
                              ? 'bg-rose-500'
                              : occPercentage >= 80
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, occPercentage)}%` }}
                        />
                      </div>
                    </td>
                    <td className="p-4 font-medium text-slate-600 dark:text-slate-300">
                      {v.odometerReadingKm.toLocaleString()} km
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-900 dark:text-white">
                          {v.insuranceExpiryDate}
                        </span>
                        {isInsExpiring && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                            Expiring Soon
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-900 dark:text-white">
                          {v.fitnessExpiryDate}
                        </span>
                        {isFitExpiring && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                            Expiring Soon
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          v.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                            : v.status === 'MAINTENANCE'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300'
                        }`}
                      >
                        {v.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                        Edit
                      </button>
                      <button className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:underline">
                        Log Maintenance
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredVehicles.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500 dark:text-slate-400">
                    No vehicles matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Add Fleet Vehicle</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateVehicle} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                  Registration Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="MP-04-XX-0000"
                  value={form.registrationNumber}
                  onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                    Vehicle Type
                  </label>
                  <select
                    value={form.vehicleType}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        vehicleType: e.target.value as 'BUS' | 'MINIBUS' | 'VAN',
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
                  >
                    <option value="BUS">Bus (45 Seats)</option>
                    <option value="MINIBUS">Mini Bus (25 Seats)</option>
                    <option value="VAN">Passenger Van (14 Seats)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                    Seating Capacity
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={form.capacity}
                    onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                  Initial Odometer Reading (km)
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.odometerReadingKm}
                  onChange={(e) =>
                    setForm({ ...form, odometerReadingKm: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                    Insurance Expiry
                  </label>
                  <input
                    type="date"
                    required
                    value={form.insuranceExpiryDate}
                    onChange={(e) => setForm({ ...form, insuranceExpiryDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                    Fitness Expiry
                  </label>
                  <input
                    type="date"
                    required
                    value={form.fitnessExpiryDate}
                    onChange={(e) => setForm({ ...form, fitnessExpiryDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                >
                  Save Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
