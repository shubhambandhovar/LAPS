import React, { useState, useEffect } from 'react';

interface ReportCardRow {
  _id: string;
  reportCardNumber: string;
  enrollmentId: string;
  studentId: string;
  versionNumber: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  meritRanking?: {
    overallPercentage: number;
    gpa: number;
    rankInClass?: number;
  };
  attendanceSummary?: {
    workingDays: number;
    presentDays: number;
    attendancePercentage: number;
  };
  remarks?: {
    classTeacherRemarks?: string;
    principalRemarks?: string;
    autoRemarks?: string;
  };
}

export const GeneratePublishPage: React.FC = () => {
  const [reportCards, setReportCards] = useState<ReportCardRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filters & Target
  const [selectedSessionId, setSelectedSessionId] = useState('000000000000000000000001');
  const [selectedTermId, setSelectedTermId] = useState('000000000000000000000001');
  const [selectedExamId, setSelectedExamId] = useState('000000000000000000000001');
  const [selectedClassId, setSelectedClassId] = useState('000000000000000000000001');
  const [changeReason, setChangeReason] = useState('');

  // Selected for Publish
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Remark Modal / Row editing
  const [editingCard, setEditingCard] = useState<ReportCardRow | null>(null);
  const [teacherRemarks, setTeacherRemarks] = useState('');
  const [principalRemarks, setPrincipalRemarks] = useState('');

  const fetchReportCards = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch(
        `/api/v1/report-cards?examId=${selectedExamId}&classId=${selectedClassId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (res.ok && data.success) {
        setReportCards(data.data || []);
      } else {
        setError(data.message || 'Failed to list report cards');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportCards();
  }, [selectedExamId, selectedClassId]);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch('/api/v1/report-cards/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          academicSessionId: selectedSessionId,
          academicTermId: selectedTermId,
          examId: selectedExamId,
          classId: selectedClassId,
          changeReason: changeReason || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(`Generated / regenerated ${data.data?.length || 0} report card(s).`);
        setChangeReason('');
        fetchReportCards();
      } else {
        setError(data.message || 'Failed to generate report cards');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const handlePublishSelected = async () => {
    if (selectedIds.length === 0) return;
    setError(null);
    setSuccess(null);
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch('/api/v1/report-cards/publish', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reportCardIds: selectedIds,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(`Published ${data.data?.publishedCount} report card(s).`);
        setSelectedIds([]);
        fetchReportCards();
      } else {
        setError(data.message || 'Failed to publish report cards');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    }
  };

  const handleOpenRemarks = (rc: ReportCardRow) => {
    setEditingCard(rc);
    setTeacherRemarks(rc.remarks?.classTeacherRemarks || '');
    setPrincipalRemarks(rc.remarks?.principalRemarks || '');
  };

  const handleSaveRemarks = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCard) return;
    setError(null);
    setSuccess(null);
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`/api/v1/report-cards/${editingCard._id}/remarks`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          classTeacherRemarks: teacherRemarks,
          principalRemarks,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess('Remarks updated successfully');
        setEditingCard(null);
        fetchReportCards();
      } else {
        setError(data.message || 'Failed to save remarks');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === reportCards.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(reportCards.map((rc) => rc._id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Generate & Publish Report Cards</h1>
          <p className="text-sm text-gray-600">
            Compile examination marks & attendance into draft report cards, enter remarks, and publish
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
          {success}
        </div>
      )}

      {/* Control Panel */}
      <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase">
              Academic Session ID
            </label>
            <input
              type="text"
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              className="mt-1 w-full p-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase">
              Academic Term ID
            </label>
            <input
              type="text"
              value={selectedTermId}
              onChange={(e) => setSelectedTermId(e.target.value)}
              className="mt-1 w-full p-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase">Exam ID</label>
            <input
              type="text"
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="mt-1 w-full p-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase">Class ID</label>
            <input
              type="text"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="mt-1 w-full p-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2 border-t">
          <div className="flex items-center space-x-2 flex-1">
            <input
              type="text"
              value={changeReason}
              onChange={(e) => setChangeReason(e.target.value)}
              placeholder="Reason for regeneration (optional if generating for first time)"
              className="w-full max-w-md p-2 border border-gray-300 rounded-md text-sm"
            />
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium text-sm transition"
            >
              {loading ? 'Generating...' : 'Generate Report Cards'}
            </button>
          </div>

          <button
            onClick={handlePublishSelected}
            disabled={selectedIds.length === 0}
            className={`px-4 py-2 rounded-md font-medium text-sm transition ${
              selectedIds.length > 0
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            Publish Selected ({selectedIds.length})
          </button>
        </div>
      </div>

      {/* Report Cards Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h2 className="text-base font-semibold text-gray-800">
            Generated Report Cards ({reportCards.length})
          </h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : reportCards.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No report cards found for this Exam & Class. Click generate above.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-xs font-semibold text-gray-600 uppercase">
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === reportCards.length && reportCards.length > 0}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="py-3 px-6">Report Card #</th>
                <th className="py-3 px-6">Version</th>
                <th className="py-3 px-6">Rank & %</th>
                <th className="py-3 px-6">Attendance %</th>
                <th className="py-3 px-6">Remarks</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm text-gray-700">
              {reportCards.map((rc) => (
                <tr key={rc._id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(rc._id)}
                      onChange={() => toggleSelect(rc._id)}
                    />
                  </td>
                  <td className="py-3 px-6 font-medium text-gray-900">{rc.reportCardNumber}</td>
                  <td className="py-3 px-6">v{rc.versionNumber}</td>
                  <td className="py-3 px-6">
                    <div>Rank: #{rc.meritRanking?.rankInClass || 'N/A'}</div>
                    <div className="text-xs text-gray-500">
                      {rc.meritRanking?.overallPercentage}%
                    </div>
                  </td>
                  <td className="py-3 px-6">
                    {rc.attendanceSummary?.attendancePercentage}%
                  </td>
                  <td className="py-3 px-6 text-xs max-w-xs truncate">
                    <div><span className="font-semibold">CT:</span> {rc.remarks?.classTeacherRemarks || 'None'}</div>
                    <div><span className="font-semibold">PR:</span> {rc.remarks?.principalRemarks || 'None'}</div>
                  </td>
                  <td className="py-3 px-6">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        rc.status === 'PUBLISHED'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {rc.status}
                    </span>
                  </td>
                  <td className="py-3 px-6">
                    {rc.status === 'DRAFT' && (
                      <button
                        onClick={() => handleOpenRemarks(rc)}
                        className="text-blue-600 hover:underline text-xs font-medium"
                      >
                        Edit Remarks
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal for Remarks */}
      {editingCard && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">
              Edit Remarks: {editingCard.reportCardNumber}
            </h3>
            <form onSubmit={handleSaveRemarks} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Class Teacher Remarks
                </label>
                <textarea
                  value={teacherRemarks}
                  onChange={(e) => setTeacherRemarks(e.target.value)}
                  rows={3}
                  className="mt-1 w-full p-2 border border-gray-300 rounded-md text-sm"
                  placeholder="Enter positive and encouraging remarks..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Principal Remarks</label>
                <textarea
                  value={principalRemarks}
                  onChange={(e) => setPrincipalRemarks(e.target.value)}
                  rows={2}
                  className="mt-1 w-full p-2 border border-gray-300 rounded-md text-sm"
                  placeholder="Optional principal comments..."
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCard(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                >
                  Save Remarks
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
