import React, { useState, useEffect } from 'react';

interface ReEvalItem {
  _id: string;
  examId: string;
  marksEntryId: string;
  studentId: string;
  classSubjectId: string;
  requestType: 'RE_COUNTING' | 'RE_EVALUATION' | 'ANSWER_SCRIPT_VIEW';
  reason: string;
  previousMarks: number;
  previousGrade: string;
  revisedMarks?: number;
  revisedGrade?: string;
  marksChanged: boolean;
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED_FOR_EVALUATION' | 'COMPLETED' | 'REJECTED' | 'ARCHIVED';
  evaluationRemarks?: string;
  createdAt: string;
  auditTrail: {
    action: string;
    timestamp: string;
    userId: string;
    previousMarks?: number;
    newMarks?: number;
    comment?: string;
  }[];
}

export const ReEvaluationPage: React.FC = () => {
  const [requests, setRequests] = useState<ReEvalItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'ALL' | 'SUBMITTED' | 'APPROVED_FOR_EVALUATION' | 'COMPLETED'>('SUBMITTED');

  // Modal states
  const [reviewModalItem, setReviewModalItem] = useState<ReEvalItem | null>(null);
  const [reviewStatus, setReviewStatus] = useState<'APPROVED_FOR_EVALUATION' | 'REJECTED'>('APPROVED_FOR_EVALUATION');
  const [reviewRemarks, setReviewRemarks] = useState('');

  const [completeModalItem, setCompleteModalItem] = useState<ReEvalItem | null>(null);
  const [revisedMarks, setRevisedMarks] = useState(0);
  const [revisedGrade, setRevisedGrade] = useState('A');
  const [evaluationRemarks, setEvaluationRemarks] = useState('');

  const [auditModalItem, setAuditModalItem] = useState<ReEvalItem | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/re-evaluations', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRequests(data.data || []);
      } else {
        setError(data.message || 'Failed to fetch re-evaluation requests');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleReviewRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewModalItem) return;
    setError(null);
    setSuccessMsg(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/v1/re-evaluations/${reviewModalItem._id}/review`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: reviewStatus,
          reviewRemarks,
          evaluatorTeacherId: '000000000000000000000001',
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`Request updated to ${reviewStatus}`);
        setReviewModalItem(null);
        fetchRequests();
      } else {
        setError(data.message || 'Failed to review request');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    }
  };

  const handleCompleteEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completeModalItem) return;
    setError(null);
    setSuccessMsg(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/v1/re-evaluations/${completeModalItem._id}/complete`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          revisedMarks: Number(revisedMarks),
          revisedGrade,
          evaluationRemarks,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg('Evaluation completed! Revised marks have been synchronized with the marks entry.');
        setCompleteModalItem(null);
        fetchRequests();
      } else {
        setError(data.message || 'Failed to complete evaluation');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (selectedTab === 'ALL') return true;
    if (selectedTab === 'SUBMITTED') return r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW';
    return r.status === selectedTab;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Re-Evaluation & Scrutiny Management</h1>
        <p className="text-sm text-gray-500">
          Admin review queue, evaluator teacher assignment, and immutable audit logs.
        </p>
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

      {/* Tabs */}
      <div className="flex border-b border-gray-200 space-x-4">
        <button
          onClick={() => setSelectedTab('SUBMITTED')}
          className={`py-2 px-4 text-sm font-medium border-b-2 transition ${
            selectedTab === 'SUBMITTED'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Pending Admin Review ({requests.filter((r) => r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW').length})
        </button>
        <button
          onClick={() => setSelectedTab('APPROVED_FOR_EVALUATION')}
          className={`py-2 px-4 text-sm font-medium border-b-2 transition ${
            selectedTab === 'APPROVED_FOR_EVALUATION'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Teacher Evaluation ({requests.filter((r) => r.status === 'APPROVED_FOR_EVALUATION').length})
        </button>
        <button
          onClick={() => setSelectedTab('COMPLETED')}
          className={`py-2 px-4 text-sm font-medium border-b-2 transition ${
            selectedTab === 'COMPLETED'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Completed ({requests.filter((r) => r.status === 'COMPLETED').length})
        </button>
        <button
          onClick={() => setSelectedTab('ALL')}
          className={`py-2 px-4 text-sm font-medium border-b-2 transition ${
            selectedTab === 'ALL'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          All Requests
        </button>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="p-4 text-xs font-semibold text-gray-600 uppercase">Type</th>
              <th className="p-4 text-xs font-semibold text-gray-600 uppercase">Reason</th>
              <th className="p-4 text-xs font-semibold text-gray-600 uppercase">Prev Marks</th>
              <th className="p-4 text-xs font-semibold text-gray-600 uppercase">Revised Marks</th>
              <th className="p-4 text-xs font-semibold text-gray-600 uppercase">Status</th>
              <th className="p-4 text-xs font-semibold text-gray-600 uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-sm text-gray-500">
                  Loading requests...
                </td>
              </tr>
            ) : filteredRequests.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-sm text-gray-500">
                  No re-evaluation requests in this queue.
                </td>
              </tr>
            ) : (
              filteredRequests.map((item) => (
                <tr key={item._id} className="hover:bg-gray-50 transition">
                  <td className="p-4">
                    <p className="text-sm font-bold text-gray-900">{item.requestType}</p>
                    <p className="text-xs text-gray-500">{new Date(item.createdAt).toLocaleDateString()}</p>
                  </td>
                  <td className="p-4 text-sm text-gray-700 max-w-xs truncate">{item.reason}</td>
                  <td className="p-4 text-sm font-semibold text-gray-800">
                    {item.previousMarks} ({item.previousGrade})
                  </td>
                  <td className="p-4 text-sm font-bold text-blue-700">
                    {item.revisedMarks !== undefined
                      ? `${item.revisedMarks} (${item.revisedGrade})`
                      : '—'}
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {item.status}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => setAuditModalItem(item)}
                      className="px-2.5 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200 text-xs font-medium rounded transition"
                    >
                      Audit Log
                    </button>
                    {(item.status === 'SUBMITTED' || item.status === 'UNDER_REVIEW') && (
                      <button
                        onClick={() => {
                          setReviewModalItem(item);
                          setReviewRemarks('');
                        }}
                        className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-medium rounded transition"
                      >
                        Admin Review
                      </button>
                    )}
                    {item.status === 'APPROVED_FOR_EVALUATION' && (
                      <button
                        onClick={() => {
                          setCompleteModalItem(item);
                          setRevisedMarks(item.previousMarks);
                          setRevisedGrade(item.previousGrade);
                          setEvaluationRemarks('');
                        }}
                        className="px-2.5 py-1 bg-green-50 text-green-700 hover:bg-green-100 text-xs font-medium rounded transition"
                      >
                        Evaluate
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Admin Review Modal */}
      {reviewModalItem && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Admin Review Re-Evaluation Request</h2>
            <p className="text-xs text-gray-500">Student Reason: {reviewModalItem.reason}</p>
            <form onSubmit={handleReviewRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Decision</label>
                <select
                  value={reviewStatus}
                  onChange={(e) => setReviewStatus(e.target.value as any)}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="APPROVED_FOR_EVALUATION">Approve & Assign to Evaluator</option>
                  <option value="REJECTED">Reject Request</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Remarks / Note</label>
                <textarea
                  rows={3}
                  value={reviewRemarks}
                  onChange={(e) => setReviewRemarks(e.target.value)}
                  placeholder="Optional review note..."
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewModalItem(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
                >
                  Save Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Evaluation Modal */}
      {completeModalItem && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Complete Teacher Re-Evaluation</h2>
            <p className="text-xs text-gray-500">
              Previous Marks: <span className="font-bold">{completeModalItem.previousMarks}</span> ({completeModalItem.previousGrade})
            </p>
            <form onSubmit={handleCompleteEvaluation} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Revised Total Marks</label>
                  <input
                    type="number"
                    required
                    value={revisedMarks}
                    onChange={(e) => setRevisedMarks(Number(e.target.value))}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Revised Letter Grade</label>
                  <input
                    type="text"
                    required
                    value={revisedGrade}
                    onChange={(e) => setRevisedGrade(e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Evaluation Remarks (Required)</label>
                <textarea
                  rows={3}
                  required
                  value={evaluationRemarks}
                  onChange={(e) => setEvaluationRemarks(e.target.value)}
                  placeholder="Explain script re-checking findings..."
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCompleteModalItem(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition"
                >
                  Complete & Sync Marks
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Audit Log Modal */}
      {auditModalItem && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Immutable Audit Trail</h2>
            <div className="max-h-72 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-3">
              {auditModalItem.auditTrail.length === 0 ? (
                <p className="text-xs text-gray-500">No audit trail entries recorded yet.</p>
              ) : (
                auditModalItem.auditTrail.map((entry, idx) => (
                  <div key={idx} className="text-xs border-b border-gray-100 pb-2 last:border-0">
                    <div className="flex justify-between font-bold text-gray-800">
                      <span>Action: {entry.action}</span>
                      <span>{new Date(entry.timestamp).toLocaleString()}</span>
                    </div>
                    {entry.comment && <p className="text-gray-600 mt-0.5">{entry.comment}</p>}
                  </div>
                ))
              )}
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setAuditModalItem(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
