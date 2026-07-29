import React, { useState } from 'react';
import { apiClient } from '../../lib/api';
import {
  BookOpen,
  CheckCircle,
  Clock,
  AlertTriangle,
  Award,
  Filter,
  TrendingUp,
  FileText,
  Users,
} from 'lucide-react';

export const HomeworkDashboardPage: React.FC = () => {
  const [academicSessionId, setAcademicSessionId] = useState<string>('');
  const [classId, setClassId] = useState<string>('');
  const [sectionId, setSectionId] = useState<string>('');
  const [subjectId, setSubjectId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [summaryData, setSummaryData] = useState<any>(null);

  const fetchSummary = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await apiClient.get('/api/v1/homework/analytics/summary', {
        params: {
          academicSessionId: academicSessionId || undefined,
          classId: classId || undefined,
          sectionId: sectionId || undefined,
          subjectId: subjectId || undefined,
        },
      });
      setSummaryData(res.data.data);
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || 'Error fetching homework analytics summary'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Premium Hero Banner */}
      <div className="flex items-center justify-between bg-gradient-to-r from-emerald-800 via-teal-800 to-cyan-900 p-8 rounded-3xl text-white shadow-2xl relative overflow-hidden">
        <div className="z-10">
          <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-semibold uppercase tracking-wider text-emerald-200">
            Phase 7 — Homework, Assignments & Study Material
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight mt-2 flex items-center gap-3">
            <BookOpen className="w-9 h-9 text-emerald-300" />
            Homework & Academic Repository Analytics
          </h1>
          <p className="text-emerald-100 mt-2 max-w-2xl text-sm">
            Monitor assignment publication schedules, track multi-attempt student submissions,
            analyze late arrival metrics, and evaluate with reusable rubric templates.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-3 shadow-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Session ID
          </label>
          <input
            type="text"
            placeholder="Academic Session ID"
            value={academicSessionId}
            onChange={(e) => setAcademicSessionId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Class ID
          </label>
          <input
            type="text"
            placeholder="Class ID (Optional)"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Section ID
          </label>
          <input
            type="text"
            placeholder="Section ID (Optional)"
            value={sectionId}
            onChange={(e) => setSectionId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Subject ID
          </label>
          <input
            type="text"
            placeholder="Subject ID (Optional)"
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div>
          <button
            onClick={fetchSummary}
            disabled={loading}
            className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-sm shadow flex items-center justify-center gap-2 transition"
          >
            <Filter className="w-4 h-4" />
            {loading ? 'Analyzing...' : 'Refresh Analytics'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {summaryData && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-gray-500">
              <span className="text-xs font-bold uppercase tracking-wider">Total Assigned</span>
              <FileText className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="text-2xl font-extrabold text-gray-900 mt-2">
              {summaryData.totalAssigned}
            </div>
            <span className="text-xs text-gray-400 mt-1">Active/Published assignments</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-gray-500">
              <span className="text-xs font-bold uppercase tracking-wider">Submissions</span>
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-2xl font-extrabold text-gray-900 mt-2">
              {summaryData.totalSubmissions}
            </div>
            <span className="text-xs text-blue-600 font-semibold mt-1">
              {summaryData.submissionPercentage}% submission rate
            </span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-gray-500">
              <span className="text-xs font-bold uppercase tracking-wider">Pending Evaluation</span>
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
            <div className="text-2xl font-extrabold text-amber-600 mt-2">
              {summaryData.pendingEvaluationCount}
            </div>
            <span className="text-xs text-amber-600 font-semibold mt-1">
              {summaryData.pendingPercentage}% awaiting grading
            </span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-gray-500">
              <span className="text-xs font-bold uppercase tracking-wider">Late Submissions</span>
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <div className="text-2xl font-extrabold text-red-600 mt-2">
              {summaryData.lateSubmissionCount}
            </div>
            <span className="text-xs text-red-600 font-semibold mt-1">
              {summaryData.latePercentage}% after due date
            </span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-gray-500">
              <span className="text-xs font-bold uppercase tracking-wider">Average Marks</span>
              <Award className="w-5 h-5 text-purple-500" />
            </div>
            <div className="text-2xl font-extrabold text-purple-600 mt-2">
              {summaryData.averageMarks}
            </div>
            <span className="text-xs text-gray-400 mt-1">Across evaluated attempts</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-gray-500">
              <span className="text-xs font-bold uppercase tracking-wider">Rubrics & Integrity</span>
              <CheckCircle className="w-5 h-5 text-teal-500" />
            </div>
            <div className="text-lg font-bold text-teal-700 mt-2">
              Template Ready
            </div>
            <span className="text-xs text-gray-400 mt-1">Plagiarism flags enabled</span>
          </div>
        </div>
      )}

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition">
          <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center mb-4">
            <FileText className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-gray-800 text-lg">Strict Timetable & TA Coupling</h3>
          <p className="text-gray-600 text-sm mt-2">
            Homework assignments are dynamically scoped to teachers holding active TeachingAssignments
            with PUBLISHED timetable periods for the target section.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition">
          <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center mb-4">
            <TrendingUp className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-gray-800 text-lg">Multi-Attempt & Late Arrival</h3>
          <p className="text-gray-600 text-sm mt-2">
            Tracks currentAttempt against maxAttempts with automatic late arrival calculation
            (isLate and lateMinutes) and resubmission loops.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition">
          <div className="w-10 h-10 bg-purple-100 text-purple-700 rounded-xl flex items-center justify-center mb-4">
            <Award className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-gray-800 text-lg">Rubric Templates & Version History</h3>
          <p className="text-gray-600 text-sm mt-2">
            Create reusable departmental rubrics and maintain immutable version history snapshots
            in StudyMaterial across every file URL update.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomeworkDashboardPage;
