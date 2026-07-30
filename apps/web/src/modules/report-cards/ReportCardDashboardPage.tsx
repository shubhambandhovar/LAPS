import React, { useState, useEffect } from 'react';

interface ReportCardRow {
  _id: string;
  reportCardNumber: string;
  examId: { name: string; examType: string };
  classId: { name: string };
  sectionId: { name: string };
  studentId: string;
  enrollmentId: string;
  versionNumber: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  createdAt: string;
}

export const ReportCardDashboardPage: React.FC = () => {
  const [reportCards, setReportCards] = useState<ReportCardRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReportCards = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch('/api/v1/report-cards', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setReportCards(data.data || []);
      } else {
        setError(data.message || 'Failed to fetch report cards');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportCards();
  }, []);

  const totalCards = reportCards.length;
  const publishedCards = reportCards.filter((r) => r.status === 'PUBLISHED').length;
  const draftCards = reportCards.filter((r) => r.status === 'DRAFT').length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Report Cards & Promotions Dashboard</h1>
          <p className="text-sm text-gray-600">
            Overview of terminal examinations, generated report cards, and student academic standing
          </p>
        </div>
        <button
          onClick={fetchReportCards}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        >
          Refresh Data
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="text-sm font-medium text-gray-500">Total Report Cards</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{totalCards}</div>
        </div>
        <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="text-sm font-medium text-gray-500">Published Report Cards</div>
          <div className="text-2xl font-bold text-green-600 mt-1">{publishedCards}</div>
        </div>
        <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="text-sm font-medium text-gray-500">Draft / Pending Cards</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">{draftCards}</div>
        </div>
      </div>

      {/* Report Cards List */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-base font-semibold text-gray-800">Recent Report Cards</h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading report cards...</div>
        ) : reportCards.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No report cards generated yet.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-xs font-semibold text-gray-600 uppercase">
                <th className="py-3 px-6">Report Card #</th>
                <th className="py-3 px-6">Exam</th>
                <th className="py-3 px-6">Class / Section</th>
                <th className="py-3 px-6">Version</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6">Generated At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm text-gray-700">
              {reportCards.map((rc) => (
                <tr key={rc._id} className="hover:bg-gray-50">
                  <td className="py-3 px-6 font-medium text-gray-900">{rc.reportCardNumber}</td>
                  <td className="py-3 px-6">{rc.examId?.name || 'Exam'}</td>
                  <td className="py-3 px-6">
                    {rc.classId?.name} — {rc.sectionId?.name}
                  </td>
                  <td className="py-3 px-6">v{rc.versionNumber}</td>
                  <td className="py-3 px-6">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        rc.status === 'PUBLISHED'
                          ? 'bg-green-100 text-green-800'
                          : rc.status === 'DRAFT'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {rc.status}
                    </span>
                  </td>
                  <td className="py-3 px-6">
                    {new Date(rc.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
