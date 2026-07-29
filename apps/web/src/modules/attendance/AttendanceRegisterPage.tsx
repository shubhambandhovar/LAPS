import React, { useState } from 'react';
import { apiClient } from '../../lib/api';
import {
  Filter,
  AlertTriangle,
  FileText,
  Percent,
} from 'lucide-react';

export const AttendanceRegisterPage: React.FC = () => {
  const [academicSessionId, setAcademicSessionId] = useState<string>('');
  const [classId, setClassId] = useState<string>('');
  const [sectionId, setSectionId] = useState<string>('');
  const [frequency, setFrequency] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [registerData, setRegisterData] = useState<any>(null);

  const fetchRegister = async () => {
    if (!academicSessionId || !startDate || !endDate) {
      setErrorMessage('Please provide Academic Session ID, Start Date, and End Date');
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await apiClient.get('/api/v1/attendance/register', {
        params: {
          academicSessionId,
          classId: classId || undefined,
          sectionId: sectionId || undefined,
          frequency,
          startDate,
          endDate,
        },
      });
      setRegisterData(res.data.data);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Error fetching attendance register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between bg-gradient-to-r from-emerald-700 to-teal-800 p-6 rounded-2xl text-white shadow-xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
            <FileText className="w-8 h-8 text-emerald-200" />
            Attendance Register & Matrix
          </h1>
          <p className="text-emerald-100 mt-1 text-sm">
            View student attendance history across Daily, Weekly, Monthly, or Yearly frequencies.
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
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-6 gap-4">
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
            Class ID
          </label>
          <input
            type="text"
            placeholder="Class ID"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Section ID
          </label>
          <input
            type="text"
            placeholder="Section ID"
            value={sectionId}
            onChange={(e) => setSectionId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Frequency
          </label>
          <select
            value={frequency}
            onChange={(e: any) => setFrequency(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
          >
            <option value="DAILY">Daily</option>
            <option value="WEEKLY">Weekly</option>
            <option value="MONTHLY">Monthly</option>
            <option value="YEARLY">Yearly</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Start Date
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
            End Date
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
            onClick={fetchRegister}
            disabled={loading}
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-sm transition flex items-center justify-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Load Register
          </button>
        </div>
      </div>

      {/* Register Table */}
      {registerData && registerData.rows && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">
              Student Attendance Register ({registerData.rows.length} students)
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
                  <th className="py-3 px-4">Roll</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Class/Sec</th>
                  <th className="py-3 px-4 text-center">Total Days</th>
                  <th className="py-3 px-4 text-center">Present</th>
                  <th className="py-3 px-4 text-center">Absent</th>
                  <th className="py-3 px-4 text-center">Late</th>
                  <th className="py-3 px-4 text-center">Percentage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {registerData.rows.map((row: any) => (
                  <tr key={row.studentId} className="hover:bg-gray-50/50 transition">
                    <td className="py-3 px-4 font-mono text-gray-600">{row.rollNumber || '#'}</td>
                    <td className="py-3 px-4 font-medium text-gray-900">{row.studentName}</td>
                    <td className="py-3 px-4 text-gray-600">
                      {row.className} - {row.sectionName}
                    </td>
                    <td className="py-3 px-4 text-center font-medium">{row.summary.totalDays}</td>
                    <td className="py-3 px-4 text-center text-green-600 font-semibold">
                      {row.summary.present}
                    </td>
                    <td className="py-3 px-4 text-center text-red-600 font-semibold">
                      {row.summary.absent}
                    </td>
                    <td className="py-3 px-4 text-center text-amber-600 font-semibold">
                      {row.summary.late}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          row.summary.percentage < 75
                            ? 'bg-red-100 text-red-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        <Percent className="w-3 h-3" />
                        {row.summary.percentage}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
