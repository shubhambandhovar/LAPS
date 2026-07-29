import React, { useState } from 'react';
import { apiClient } from '../../lib/api';
import {
  BarChart2,
  Users,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Filter,
} from 'lucide-react';


export const AttendanceDashboardPage: React.FC = () => {
  const [academicSessionId, setAcademicSessionId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [summaryData, setSummaryData] = useState<any>(null);

  const fetchSummary = async () => {
    if (!academicSessionId) {
      setErrorMessage('Please enter an Academic Session ID');
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await apiClient.get('/api/v1/attendance/analytics/summary', {
        params: {
          academicSessionId,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        },
      });
      setSummaryData(res.data.data);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Error fetching analytics summary');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Banner */}
      <div className="flex items-center justify-between bg-gradient-to-r from-blue-800 via-indigo-800 to-purple-900 p-8 rounded-3xl text-white shadow-2xl relative overflow-hidden">
        <div className="z-10">
          <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-semibold uppercase tracking-wider text-blue-200">
            Materialized Summary Cache Strategy Enabled
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight mt-2 flex items-center gap-3">
            <BarChart2 className="w-9 h-9 text-blue-300" />
            Attendance & Defaulter Analytics
          </h1>
          <p className="text-blue-100 mt-2 max-w-2xl text-sm">
            Monitor real-time institutional attendance percentages, identify chronic defaulters (&lt; 75%),
            and analyze class-wise punctuality metrics across the academic session.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Session ID
          </label>
          <input
            type="text"
            placeholder="Academic Session ID"
            value={academicSessionId}
            onChange={(e) => setAcademicSessionId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Start Date (Optional)
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            End Date (Optional)
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={fetchSummary}
            disabled={loading}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-sm transition flex items-center justify-center gap-2 shadow-sm"
          >
            <Filter className="w-4 h-4" />
            Compute Analytics
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      {summaryData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Total Students Tracked</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-1">{summaryData.totalStudents}</h3>
              </div>
              <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
                <Users className="w-8 h-8" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Average Attendance</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-1">
                  {summaryData.averageAttendancePercentage}%
                </h3>
              </div>
              <div
                className={`p-4 rounded-2xl ${
                  summaryData.averageAttendancePercentage >= 80
                    ? 'bg-green-50 text-green-600'
                    : 'bg-amber-50 text-amber-600'
                }`}
              >
                <TrendingUp className="w-8 h-8" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Defaulters (&lt; 75%)</p>
                <h3 className="text-3xl font-bold text-red-600 mt-1">
                  {summaryData.defaultersCount}
                </h3>
              </div>
              <div className="p-4 bg-red-50 text-red-600 rounded-2xl">
                <TrendingDown className="w-8 h-8" />
              </div>
            </div>
          </div>

          {/* Defaulters List */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 bg-red-50/50 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-red-800 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                Attendance Defaulters List (&lt; 75%)
              </h3>
              <span className="text-xs font-semibold bg-red-100 text-red-700 px-3 py-1 rounded-full">
                Requires Intervention
              </span>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Class/Sec</th>
                  <th className="py-3 px-4 text-center">Total Days</th>
                  <th className="py-3 px-4 text-center">Present Days</th>
                  <th className="py-3 px-4 text-center">Percentage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {summaryData.defaulters.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500">
                      No attendance defaulters detected in selected scope!
                    </td>
                  </tr>
                ) : (
                  summaryData.defaulters.map((d: any) => (
                    <tr key={d.studentId} className="hover:bg-red-50/30 transition">
                      <td className="py-3 px-4 font-semibold text-gray-900">{d.studentName}</td>
                      <td className="py-3 px-4 text-gray-600">
                        {d.className} - {d.sectionName}
                      </td>
                      <td className="py-3 px-4 text-center font-medium">{d.totalDays}</td>
                      <td className="py-3 px-4 text-center text-red-600 font-semibold">
                        {d.presentDays}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
                          {d.percentage}%
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Class-Wise Breakdown */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">Class & Section Attendance Breakdown</h3>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
                  <th className="py-3 px-4">Class</th>
                  <th className="py-3 px-4">Section</th>
                  <th className="py-3 px-4 text-center">Attendance %</th>
                  <th className="py-3 px-4">Performance Bar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {summaryData.classWiseBreakdown.map((cs: any, index: number) => (
                  <tr key={index} className="hover:bg-gray-50/50 transition">
                    <td className="py-3 px-4 font-medium text-gray-900">{cs.className}</td>
                    <td className="py-3 px-4 text-gray-600">{cs.sectionName}</td>
                    <td className="py-3 px-4 text-center font-bold">{cs.percentage}%</td>
                    <td className="py-3 px-4 w-1/2">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className={`h-2.5 rounded-full ${
                            cs.percentage >= 85
                              ? 'bg-green-600'
                              : cs.percentage >= 75
                              ? 'bg-amber-500'
                              : 'bg-red-600'
                          }`}
                          style={{ width: `${Math.min(100, cs.percentage)}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};
