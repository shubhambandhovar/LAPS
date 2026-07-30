import React, { useEffect, useState } from 'react';
import { apiClient } from '../../lib/api';
import {
  BarChart3,
  Calendar,
  CheckCircle,
  Clock,
  BookOpen,
  Award,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

interface SummaryData {
  totalDays: number;
  workingDays: number;
  holidayCount: number;
  teachingDays: number;
  examinationDays: number;
}

export const CalendarAnalytics: React.FC = () => {
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/calendar/summary?academicSessionId=60d5ecb8b5c9c62b3c7c4b5b');
      setData(res.data.data || null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch academic calendar summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
            Calendar Analytics & Term Summary
          </h1>
          <p className="text-sm text-gray-600">
            Real-time tracking of working days, instructional time, and examination days
          </p>
        </div>
        <button
          onClick={fetchSummary}
          className="p-2 text-gray-600 hover:text-indigo-600 bg-white border border-gray-200 rounded-lg"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500 text-sm">Loading analytics summary...</div>
      ) : !data ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
          No summary data available.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase">Total Days</span>
                <Calendar className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-2">{data.totalDays}</p>
              <span className="text-xs text-gray-500 mt-1 block">Full Term Span</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-600 uppercase">Working Days</span>
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-bold text-emerald-600 mt-2">{data.workingDays}</p>
              <span className="text-xs text-gray-500 mt-1 block">
                {Math.round((data.workingDays / (data.totalDays || 1)) * 100)}% of total
              </span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-red-600 uppercase">Holidays</span>
                <Clock className="w-4 h-4 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-red-600 mt-2">{data.holidayCount}</p>
              <span className="text-xs text-gray-500 mt-1 block">Official Closures</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-indigo-600 uppercase">Teaching Days</span>
                <BookOpen className="w-4 h-4 text-indigo-600" />
              </div>
              <p className="text-2xl font-bold text-indigo-600 mt-2">{data.teachingDays}</p>
              <span className="text-xs text-gray-500 mt-1 block">Instructional Days</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-purple-600 uppercase">Exam Days</span>
                <Award className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-purple-600 mt-2">{data.examinationDays}</p>
              <span className="text-xs text-gray-500 mt-1 block">Assessment Period</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-gray-900">Term Instructional Efficiency</h3>
            <div>
              <div className="flex justify-between text-xs font-semibold text-gray-600 mb-1">
                <span>Working vs Total Days</span>
                <span>{Math.round((data.workingDays / (data.totalDays || 1)) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-emerald-600 h-2.5 rounded-full"
                  style={{ width: `${Math.round((data.workingDays / (data.totalDays || 1)) * 100)}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-gray-600 mb-1">
                <span>Teaching vs Working Days</span>
                <span>{Math.round((data.teachingDays / (data.workingDays || 1)) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-indigo-600 h-2.5 rounded-full"
                  style={{ width: `${Math.round((data.teachingDays / (data.workingDays || 1)) * 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
