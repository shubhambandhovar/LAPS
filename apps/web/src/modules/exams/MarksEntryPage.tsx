import React, { useState, useEffect } from 'react';

interface StudentMarkRow {
  enrollmentId: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  marksObtained: number;
  isAbsent: boolean;
  isMedical: boolean;
  isExempt: boolean;
  remarks?: string;
  status: 'DRAFT' | 'SUBMITTED' | 'LOCKED' | 'PUBLISHED' | 'ARCHIVED';
  history: {
    modifiedBy: string;
    modifiedAt: string;
    previousTotal: number;
    newTotal: number;
    reason: string;
    status: string;
  }[];
}

export const MarksEntryPage: React.FC = () => {
  const [rows, setRows] = useState<StudentMarkRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [selectedExamId, setSelectedExamId] = useState<string>('000000000000000000000001');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('000000000000000000000001');
  const [historyModalRow, setHistoryModalRow] = useState<StudentMarkRow | null>(null);

  const fetchMarks = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `/api/v1/marks?examId=${selectedExamId}&classSubjectId=${selectedSubjectId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await res.json();
      if (res.ok && data.success) {
        // Format backend response into rows
        const formatted: StudentMarkRow[] = (data.data || []).map((item: any) => ({
          enrollmentId: item.enrollmentId,
          studentId: item.studentId,
          studentName: item.studentName || 'Student',
          rollNumber: item.rollNumber || '',
          marksObtained: item.totalMarksObtained || 0,
          isAbsent: item.isAbsent || false,
          isMedical: item.isMedical || false,
          isExempt: item.isExempt || false,
          remarks: item.remarks || '',
          status: item.status || 'DRAFT',
          history: item.history || [],
        }));
        setRows(formatted);
      } else {
        setError(data.message || 'Failed to fetch student marks');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarks();
  }, [selectedExamId, selectedSubjectId]);

  const handleMarkChange = (index: number, field: keyof StudentMarkRow, value: any) => {
    const updated = [...rows];
    (updated[index] as any)[field] = value;
    setRows(updated);
  };

  const handleSaveBulk = async (submit: boolean) => {
    setError(null);
    setSuccessMsg(null);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        examId: selectedExamId,
        academicSessionId: '000000000000000000000001',
        academicTermId: '000000000000000000000001',
        classSubjectId: selectedSubjectId,
        teachingAssignmentId: '000000000000000000000001',
        submit,
        entries: rows.map((r) => ({
          enrollmentId: r.enrollmentId,
          studentId: r.studentId,
          componentMarks: [
            {
              assessmentComponentId: '000000000000000000000001',
              componentName: 'THEORY',
              marksObtained: r.marksObtained,
              isAbsent: r.isAbsent,
              isMedical: r.isMedical,
              isExempt: r.isExempt,
            },
          ],
          isAbsent: r.isAbsent,
          isMedical: r.isMedical,
          isExempt: r.isExempt,
          remarks: r.remarks,
        })),
      };

      const res = await fetch('/api/v1/marks/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(submit ? 'Marks submitted successfully!' : 'Draft marks saved successfully!');
        fetchMarks();
      } else {
        setError(data.message || 'Failed to save marks');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    }
  };

  // Helper to resolve live preview grade
  const getPreviewGrade = (marks: number, isAbsent: boolean) => {
    if (isAbsent) return { grade: 'AB', color: 'bg-red-100 text-red-800' };
    if (marks >= 90) return { grade: 'A+', color: 'bg-green-100 text-green-800' };
    if (marks >= 80) return { grade: 'A', color: 'bg-green-100 text-green-800' };
    if (marks >= 70) return { grade: 'B+', color: 'bg-blue-100 text-blue-800' };
    if (marks >= 60) return { grade: 'B', color: 'bg-blue-100 text-blue-800' };
    if (marks >= 50) return { grade: 'C', color: 'bg-yellow-100 text-yellow-800' };
    if (marks >= 33) return { grade: 'P', color: 'bg-yellow-100 text-yellow-800' };
    return { grade: 'F', color: 'bg-red-100 text-red-800' };
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Examination Marks Entry</h1>
          <p className="text-sm text-gray-500">
            Enter subject marks, record absences, and preview letter grades in real-time.
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => handleSaveBulk(false)}
            className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition"
          >
            Save Draft
          </button>
          <button
            onClick={() => handleSaveBulk(true)}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
          >
            Submit Marks
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

      {/* Selector Toolbar */}
      <div className="flex flex-wrap gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Select Examination</label>
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="000000000000000000000001">Mid-Term Examination 2026</option>
            <option value="000000000000000000000002">Final Examination 2026</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Select Assigned Subject</label>
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="000000000000000000000001">Mathematics — Class 10A</option>
            <option value="000000000000000000000002">Physics — Class 10A</option>
          </select>
        </div>
      </div>

      {/* Marks Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="p-4 text-xs font-semibold text-gray-600 uppercase">Roll No</th>
              <th className="p-4 text-xs font-semibold text-gray-600 uppercase">Student Name</th>
              <th className="p-4 text-xs font-semibold text-gray-600 uppercase">Marks (Max 100)</th>
              <th className="p-4 text-xs font-semibold text-gray-600 uppercase">Absent</th>
              <th className="p-4 text-xs font-semibold text-gray-600 uppercase">Medical</th>
              <th className="p-4 text-xs font-semibold text-gray-600 uppercase">Exempt</th>
              <th className="p-4 text-xs font-semibold text-gray-600 uppercase">Preview Grade</th>
              <th className="p-4 text-xs font-semibold text-gray-600 uppercase">Status</th>
              <th className="p-4 text-xs font-semibold text-gray-600 uppercase text-right">Audit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-sm text-gray-500">
                  Loading students...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-sm text-gray-500">
                  No enrolled students found for this subject.
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => {
                const preview = getPreviewGrade(row.marksObtained, row.isAbsent);
                const isLocked = row.status === 'SUBMITTED' || row.status === 'LOCKED' || row.status === 'PUBLISHED';
                return (
                  <tr key={row.enrollmentId} className="hover:bg-gray-50 transition">
                    <td className="p-4 text-sm text-gray-600 font-mono">{row.rollNumber || '—'}</td>
                    <td className="p-4 text-sm font-medium text-gray-900">{row.studentName}</td>
                    <td className="p-4">
                      <input
                        type="number"
                        disabled={isLocked || row.isAbsent || row.isExempt}
                        value={row.marksObtained}
                        onChange={(e) => handleMarkChange(idx, 'marksObtained', Number(e.target.value))}
                        className="w-24 text-sm border border-gray-300 rounded px-2 py-1 disabled:bg-gray-100 disabled:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="p-4">
                      <input
                        type="checkbox"
                        disabled={isLocked}
                        checked={row.isAbsent}
                        onChange={(e) => handleMarkChange(idx, 'isAbsent', e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="p-4">
                      <input
                        type="checkbox"
                        disabled={isLocked}
                        checked={row.isMedical}
                        onChange={(e) => handleMarkChange(idx, 'isMedical', e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="p-4">
                      <input
                        type="checkbox"
                        disabled={isLocked}
                        checked={row.isExempt}
                        onChange={(e) => handleMarkChange(idx, 'isExempt', e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-xs font-bold rounded ${preview.color}`}>
                        {preview.grade}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                        {row.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setHistoryModalRow(row)}
                        className="text-xs text-blue-600 hover:underline font-medium"
                      >
                        History ({row.history.length})
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Revision History Modal */}
      {historyModalRow && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">
              Revision History: {historyModalRow.studentName}
            </h2>
            <div className="max-h-72 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-3">
              {historyModalRow.history.length === 0 ? (
                <p className="text-xs text-gray-500">No revisions recorded yet.</p>
              ) : (
                historyModalRow.history.map((h, i) => (
                  <div key={i} className="text-xs border-b border-gray-100 pb-2 last:border-0">
                    <div className="flex justify-between font-semibold text-gray-800">
                      <span>{h.reason}</span>
                      <span>{new Date(h.modifiedAt).toLocaleString()}</span>
                    </div>
                    <p className="text-gray-600 mt-0.5">
                      Marks: {h.previousTotal} → <span className="font-bold text-blue-600">{h.newTotal}</span> ({h.status})
                    </p>
                  </div>
                ))
              )}
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setHistoryModalRow(null)}
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
