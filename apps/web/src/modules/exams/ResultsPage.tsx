import React, { useState, useEffect } from 'react';

interface ResultRow {
  _id: string;
  examId: string;
  enrollmentId: string;
  studentId: string;
  studentName?: string;
  overallTotalObtained: number;
  overallMaximumMarks: number;
  overallPercentage: number;
  overallGrade: string;
  overallGradePoint: number;
  rankInClass?: number;
  resultStatus: 'PASS' | 'FAIL' | 'COMPARTMENT' | 'WITHHELD' | 'EXEMPT';
  status: 'DRAFT' | 'CALCULATED' | 'LOCKED' | 'PUBLISHED' | 'ARCHIVED';
}

interface AnalyticsSummary {
  totalStudents: number;
  totalPassed: number;
  totalFailed: number;
  totalCompartment: number;
  passPercentage: number;
  averagePercentage: number;
  averageMarks: number;
  highestMarks: number;
  lowestMarks: number;
}

export const ResultsPage: React.FC = () => {
  const [results, setResults] = useState<ResultRow[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Selected filters
  const [selectedExamId, setSelectedExamId] = useState<string>('000000000000000000000001');
  const [selectedClassId, setSelectedClassId] = useState<string>('000000000000000000000001');

  const fetchResults = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const [resList, resSummary] = await Promise.all([
        fetch(`/api/v1/results?examId=${selectedExamId}&classId=${selectedClassId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(
          `/api/v1/results/analytics/summary?examId=${selectedExamId}&classId=${selectedClassId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        ),
      ]);

      const dataList = await resList.json();
      const dataSummary = await resSummary.json();

      if (resList.ok && dataList.success) {
        setResults(dataList.data || []);
      }
      if (resSummary.ok && dataSummary.success) {
        setSummary(dataSummary.data);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [selectedExamId, selectedClassId]);

  const handleCalculate = async () => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/results/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          examId: selectedExamId,
          classId: selectedClassId,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`Results calculated and ranked for ${data.data.length} students!`);
        fetchResults();
      } else {
        setError(data.message || 'Failed to calculate results');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/results/publish', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          examId: selectedExamId,
          classId: selectedClassId,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`Published results for ${data.data.publishedCount} students!`);
        fetchResults();
      } else {
        setError(data.message || 'Failed to publish results');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: ResultRow['resultStatus']) => {
    switch (status) {
      case 'PASS':
        return <span className="px-2 py-1 text-xs font-bold rounded bg-green-100 text-green-800">PASS</span>;
      case 'COMPARTMENT':
        return <span className="px-2 py-1 text-xs font-bold rounded bg-yellow-100 text-yellow-800">COMPARTMENT</span>;
      case 'FAIL':
        return <span className="px-2 py-1 text-xs font-bold rounded bg-red-100 text-red-800">FAIL</span>;
      default:
        return <span className="px-2 py-1 text-xs font-bold rounded bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Examination Results & Rankings</h1>
          <p className="text-sm text-gray-500">
            Automated CGPA/GPA calculation, class ranking boards, and result publication.
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleCalculate}
            disabled={loading}
            className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition"
          >
            Run Calculation Engine
          </button>
          <button
            onClick={handlePublish}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition"
          >
            Publish Results
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
          {successMsg}
        </div>
      )}

      {/* Filter Selector Toolbar */}
      <div className="flex flex-wrap gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Select Examination</label>
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="000000000000000000000001">Mid-Term Examination 2026</option>
            <option value="000000000000000000000002">Final Examination 2026</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Select Class / Section</label>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="000000000000000000000001">Class 10 — Section A</option>
            <option value="000000000000000000000002">Class 10 — Section B</option>
          </select>
        </div>
      </div>

      {/* Analytics Summary Cache Card */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500 font-medium">PASS PERCENTAGE</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{summary.passPercentage}%</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {summary.totalPassed} of {summary.totalStudents} passed
            </p>
          </div>
          <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500 font-medium">AVERAGE PERCENTAGE</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{summary.averagePercentage}%</p>
          </div>
          <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500 font-medium">HIGHEST MARKS</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">{summary.highestMarks}</p>
          </div>
          <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500 font-medium">COMPARTMENT / FAIL</p>
            <p className="text-2xl font-bold text-red-600 mt-1">
              {summary.totalCompartment} / {summary.totalFailed}
            </p>
          </div>
        </div>
      )}

      {/* Class Ranking Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="p-4 text-xs font-semibold text-gray-600 uppercase">Rank</th>
              <th className="p-4 text-xs font-semibold text-gray-600 uppercase">Student Name</th>
              <th className="p-4 text-xs font-semibold text-gray-600 uppercase">Total Marks</th>
              <th className="p-4 text-xs font-semibold text-gray-600 uppercase">Percentage</th>
              <th className="p-4 text-xs font-semibold text-gray-600 uppercase">Grade / GPA</th>
              <th className="p-4 text-xs font-semibold text-gray-600 uppercase">Result</th>
              <th className="p-4 text-xs font-semibold text-gray-600 uppercase">Lifecycle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-sm text-gray-500">
                  Loading examination results...
                </td>
              </tr>
            ) : results.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-sm text-gray-500">
                  No calculated results found. Click "Run Calculation Engine" to compute results.
                </td>
              </tr>
            ) : (
              results.map((res) => (
                <tr key={res._id} className="hover:bg-gray-50 transition">
                  <td className="p-4 text-sm font-bold text-purple-700">#{res.rankInClass || '—'}</td>
                  <td className="p-4 text-sm font-medium text-gray-900">{res.studentName || 'Student'}</td>
                  <td className="p-4 text-sm text-gray-700">
                    {res.overallTotalObtained} / {res.overallMaximumMarks}
                  </td>
                  <td className="p-4 text-sm font-semibold text-gray-800">{res.overallPercentage}%</td>
                  <td className="p-4 text-sm font-bold text-blue-700">
                    {res.overallGrade} ({res.overallGradePoint} GPA)
                  </td>
                  <td className="p-4">{getStatusBadge(res.resultStatus)}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                      {res.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
