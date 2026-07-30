import React, { useState } from 'react';

interface AssignmentItem {
  id: string;
  studentName: string;
  className: string;
  section: string;
  routeAssigned: string;
  stopAssigned: string;
  vehicleAssigned: string;
  feeAmount: number;
  status: 'ACTIVE' | 'PENDING' | 'CANCELLED';
}

export const TransportAssignmentsPage: React.FC = () => {
  const [assignments, _setAssignments] = useState<AssignmentItem[]>([
    {
      id: 'asg-1',
      studentName: 'Aarav Sharma',
      className: 'Class 8',
      section: 'A',
      routeAssigned: 'RT-01 (City Center to Gohad Fort)',
      stopAssigned: 'Fort Chowk',
      vehicleAssigned: 'MP-04-AB-1234',
      feeAmount: 800,
      status: 'ACTIVE',
    },
    {
      id: 'asg-2',
      studentName: 'Diya Patel',
      className: 'Class 9',
      section: 'B',
      routeAssigned: 'RT-02 (Industrial Area Loop)',
      stopAssigned: 'Main Square',
      vehicleAssigned: 'MP-04-CD-5678',
      feeAmount: 1200,
      status: 'ACTIVE',
    },
    {
      id: 'asg-3',
      studentName: 'Rohan Gupta',
      className: 'Class 7',
      section: 'C',
      routeAssigned: 'RT-01 (City Center to Gohad Fort)',
      stopAssigned: 'Railway Station',
      vehicleAssigned: 'MP-04-AB-1234',
      feeAmount: 1500,
      status: 'PENDING',
    },
  ]);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredAssignments = assignments.filter((a) => {
    const matchesSearch =
      a.studentName.toLowerCase().includes(search.toLowerCase()) ||
      a.routeAssigned.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Student Transport Assignments
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Assign students to routes and stops, and manage their transport fees.
          </p>
        </div>
        <button className="px-4 py-2.5 rounded-xl font-semibold text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-all duration-200 flex items-center gap-2">
          <span>+ New Assignment</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search by student or route..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Status:</span>
          {['ALL', 'ACTIVE', 'PENDING', 'CANCELLED'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === status
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {status === 'ALL' ? 'All Assignments' : status}
            </button>
          ))}
        </div>
      </div>

      {/* Assignments Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                <th className="p-4">Student Details</th>
                <th className="p-4">Route & Vehicle</th>
                <th className="p-4">Stop Info</th>
                <th className="p-4">Transport Fee</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-sm">
              {filteredAssignments.map((a) => (
                <tr
                  key={a.id}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-700/30 transition-colors"
                >
                  <td className="p-4">
                    <div className="font-bold text-slate-900 dark:text-white">{a.studentName}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {a.className} - {a.section}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="font-semibold text-slate-700 dark:text-slate-200">{a.routeAssigned}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                      <span>🚌</span> {a.vehicleAssigned}
                    </div>
                  </td>
                  <td className="p-4 font-medium text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                      {a.stopAssigned}
                    </div>
                  </td>
                  <td className="p-4 font-bold text-slate-900 dark:text-white">
                    ₹{a.feeAmount.toLocaleString()} / mo
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        a.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                          : a.status === 'PENDING'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300'
                      }`}
                    >
                      {a.status}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                      Reassign
                    </button>
                    <button className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline">
                      Cancel
                    </button>
                  </td>
                </tr>
              ))}
              {filteredAssignments.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 dark:text-slate-400">
                    No assignments found.
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
