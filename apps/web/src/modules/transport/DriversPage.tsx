import React, { useState } from 'react';

interface DriverItem {
  id: string;
  name: string;
  phone: string;
  licenseNumber: string;
  licenseType: string;
  medicalExpiry: string;
  emergencyContact: {
    name: string;
    phone: string;
  };
  status: 'ACTIVE' | 'ON_LEAVE' | 'SUSPENDED';
}

export const DriversPage: React.FC = () => {
  const [drivers, _setDrivers] = useState<DriverItem[]>([
    {
      id: 'drv-1',
      name: 'Ramesh Yadav',
      phone: '+91 9876543210',
      licenseNumber: 'MP-04-2020-0012345',
      licenseType: 'HEAVY_PASSENGER',
      medicalExpiry: '2026-12-31',
      emergencyContact: { name: 'Suresh Yadav', phone: '9876543212' },
      status: 'ACTIVE',
    },
    {
      id: 'drv-2',
      name: 'Kamlesh Singh',
      phone: '+91 9123456789',
      licenseNumber: 'MP-04-2018-0056789',
      licenseType: 'HEAVY_PASSENGER',
      medicalExpiry: '2026-08-15',
      emergencyContact: { name: 'Priya Singh', phone: '9123456780' },
      status: 'ACTIVE',
    },
    {
      id: 'drv-3',
      name: 'Mukesh Sharma',
      phone: '+91 9988776655',
      licenseNumber: 'MP-04-2019-0098765',
      licenseType: 'LIGHT_PASSENGER',
      medicalExpiry: '2027-01-20',
      emergencyContact: { name: 'Anita Sharma', phone: '9988776650' },
      status: 'ON_LEAVE',
    },
  ]);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredDrivers = drivers.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.licenseNumber.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
            Fleet Drivers
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage driver profiles, licenses, medical records, and duty assignments.
          </p>
        </div>
        <button className="px-4 py-2.5 rounded-xl font-semibold text-sm bg-purple-600 hover:bg-purple-700 text-white shadow-md transition-all duration-200 flex items-center gap-2">
          <span>+ Onboard Driver</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search by name or license number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Status:</span>
          {['ALL', 'ACTIVE', 'ON_LEAVE', 'SUSPENDED'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === status
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {status === 'ALL' ? 'All Drivers' : status.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Drivers Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                <th className="p-4">Driver Name</th>
                <th className="p-4">Phone Number</th>
                <th className="p-4">License Details</th>
                <th className="p-4">Medical Expiry</th>
                <th className="p-4">Emergency Contact</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-sm">
              {filteredDrivers.map((d) => {
                const isMedExpiring = isExpiringSoon(d.medicalExpiry);

                return (
                  <tr
                    key={d.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="p-4 font-bold text-slate-900 dark:text-white">
                      {d.name}
                    </td>
                    <td className="p-4 font-medium text-slate-600 dark:text-slate-300">
                      {d.phone}
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-900 dark:text-white">{d.licenseNumber}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{d.licenseType}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-900 dark:text-white">
                          {d.medicalExpiry}
                        </span>
                        {isMedExpiring && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                            Renew Soon
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-xs">
                      <div className="font-semibold text-slate-700 dark:text-slate-200">{d.emergencyContact.name}</div>
                      <div className="text-slate-500 dark:text-slate-400">{d.emergencyContact.phone}</div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          d.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                            : d.status === 'ON_LEAVE'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300'
                        }`}
                      >
                        {d.status}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline">
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredDrivers.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 dark:text-slate-400">
                    No drivers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
