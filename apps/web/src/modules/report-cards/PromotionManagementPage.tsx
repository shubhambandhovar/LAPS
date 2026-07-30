import React, { useState, useEffect } from 'react';

interface PromotionRow {
  _id: string;
  studentId: {
    firstName: string;
    lastName: string;
    admissionNumber: string;
  };
  fromClassId: { name: string };
  promotionStatus: 'PROMOTED' | 'PROMOTED_CONDITIONALLY' | 'DETAINED';
  remarks?: string;
  status: 'DRAFT' | 'APPROVED' | 'ARCHIVED';
}

export const PromotionManagementPage: React.FC = () => {
  const [promotions, setPromotions] = useState<PromotionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filters for evaluation
  const [sessionId, setSessionId] = useState('000000000000000000000001');
  const [termId, setTermId] = useState('000000000000000000000001');
  const [classId, setClassId] = useState('000000000000000000000001');
  const [minPassPercentage, setMinPassPercentage] = useState(33);
  const [minAttendancePercentage, setMinAttendancePercentage] = useState(75);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const fetchPromotions = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`/api/v1/promotions?classId=${classId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPromotions(data.data || []);
      } else {
        setError(data.message || 'Failed to fetch promotion decisions');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, [classId]);

  const handleEvaluate = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch('/api/v1/promotions/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          academicSessionId: sessionId,
          academicTermId: termId,
          classId,
          minPassPercentage: Number(minPassPercentage),
          minAttendancePercentage: Number(minAttendancePercentage),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(`Evaluated ${data.data?.length || 0} student promotion decision(s).`);
        fetchPromotions();
      } else {
        setError(data.message || 'Failed to evaluate promotions');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveSelected = async () => {
    if (selectedIds.length === 0) return;
    setError(null);
    setSuccess(null);
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch('/api/v1/promotions/approve', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          promotionIds: selectedIds,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(`Approved ${data.data?.approvedCount} promotion decision(s).`);
        setSelectedIds([]);
        fetchPromotions();
      } else {
        setError(data.message || 'Failed to approve promotions');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === promotions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(promotions.map((p) => p._id));
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Academic Promotion Decisions</h1>
        <p className="text-sm text-gray-600">
          Evaluate annual promotion criteria (marks & attendance threshold) and approve student advancement
        </p>
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

      {/* Evaluation Control Bar */}
      <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase">Session ID</label>
            <input
              type="text"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              className="mt-1 w-full p-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase">Term ID</label>
            <input
              type="text"
              value={termId}
              onChange={(e) => setTermId(e.target.value)}
              className="mt-1 w-full p-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase">Class ID</label>
            <input
              type="text"
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="mt-1 w-full p-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase">Min Pass %</label>
            <input
              type="number"
              value={minPassPercentage}
              onChange={(e) => setMinPassPercentage(Number(e.target.value))}
              className="mt-1 w-full p-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase">
              Min Attendance %
            </label>
            <input
              type="number"
              value={minAttendancePercentage}
              onChange={(e) => setMinAttendancePercentage(Number(e.target.value))}
              className="mt-1 w-full p-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
        </div>

        <div className="flex justify-between items-center pt-2 border-t">
          <button
            onClick={handleEvaluate}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium text-sm transition"
          >
            {loading ? 'Evaluating...' : 'Run Automatic Evaluation'}
          </button>

          <button
            onClick={handleApproveSelected}
            disabled={selectedIds.length === 0}
            className={`px-4 py-2 rounded-md font-medium text-sm transition ${
              selectedIds.length > 0
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            Approve Selected ({selectedIds.length})
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-base font-semibold text-gray-800">
            Student Promotion Roster ({promotions.length})
          </h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : promotions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No promotion decisions found. Click Run Automatic Evaluation above.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-xs font-semibold text-gray-600 uppercase">
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === promotions.length && promotions.length > 0}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="py-3 px-6">Admission #</th>
                <th className="py-3 px-6">Student Name</th>
                <th className="py-3 px-6">Current Class</th>
                <th className="py-3 px-6">Recommended Decision</th>
                <th className="py-3 px-6">Remarks</th>
                <th className="py-3 px-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm text-gray-700">
              {promotions.map((item) => (
                <tr key={item._id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(item._id)}
                      onChange={() => toggleSelect(item._id)}
                    />
                  </td>
                  <td className="py-3 px-6 font-medium text-gray-900">
                    {item.studentId?.admissionNumber}
                  </td>
                  <td className="py-3 px-6">
                    {item.studentId?.firstName} {item.studentId?.lastName}
                  </td>
                  <td className="py-3 px-6">{item.fromClassId?.name}</td>
                  <td className="py-3 px-6">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.promotionStatus === 'PROMOTED'
                          ? 'bg-green-100 text-green-800'
                          : item.promotionStatus === 'PROMOTED_CONDITIONALLY'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {item.promotionStatus.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-6 text-xs text-gray-600 max-w-sm truncate">
                    {item.remarks || 'None'}
                  </td>
                  <td className="py-3 px-6">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.status === 'APPROVED'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {item.status}
                    </span>
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
