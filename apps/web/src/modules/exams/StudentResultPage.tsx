import React, { useState, useEffect } from 'react';

interface SubjectResult {
  classSubjectId: string;
  subjectName: string;
  subjectCode: string;
  marksEntryId: string;
  totalMarksObtained: number;
  maximumMarks: number;
  percentage: number;
  grade: string;
  gradePoint: number;
  isPassed: boolean;
  isAbsent: boolean;
  graceMarks: number;
}

interface StudentResult {
  _id: string;
  examId: string;
  overallTotalObtained: number;
  overallMaximumMarks: number;
  overallPercentage: number;
  overallGrade: string;
  overallGradePoint: number;
  rankInClass?: number;
  resultStatus: 'PASS' | 'FAIL' | 'COMPARTMENT' | 'WITHHELD' | 'EXEMPT';
  subjectResults: SubjectResult[];
  publishedAt?: string;
}

export const StudentResultPage: React.FC = () => {
  const [results, setResults] = useState<StudentResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<StudentResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Re-evaluation Modal state
  const [isReEvalModalOpen, setIsReEvalModalOpen] = useState(false);
  const [targetSubject, setTargetSubject] = useState<SubjectResult | null>(null);
  const [requestType, setRequestType] = useState<'RE_COUNTING' | 'RE_EVALUATION' | 'ANSWER_SCRIPT_VIEW'>('RE_COUNTING');
  const [reason, setReason] = useState('');

  const fetchMyResults = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/results/my', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResults(data.data || []);
        if (data.data && data.data.length > 0) {
          setSelectedResult(data.data[0]);
        }
      } else {
        setError(data.message || 'Failed to fetch published results');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyResults();
  }, []);

  const handleOpenReEval = (subject: SubjectResult) => {
    setTargetSubject(subject);
    setReason('');
    setIsReEvalModalOpen(true);
  };

  const handleCreateReEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResult || !targetSubject) return;
    setError(null);
    setSuccessMsg(null);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        examId: selectedResult.examId,
        academicSessionId: '000000000000000000000001',
        academicTermId: '000000000000000000000001',
        marksEntryId: targetSubject.marksEntryId,
        enrollmentId: '000000000000000000000001',
        studentId: '000000000000000000000001',
        classSubjectId: targetSubject.classSubjectId,
        requestType,
        reason,
      };

      const res = await fetch('/api/v1/re-evaluations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsReEvalModalOpen(false);
        setSuccessMsg('Re-evaluation request submitted successfully! An administrator will review your request.');
      } else {
        setError(data.message || 'Failed to submit re-evaluation request');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Examination Results</h1>
        <p className="text-sm text-gray-500">
          View your published academic examination performance, grades, and request re-evaluations.
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

      {results.length > 1 && (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <label className="text-xs font-medium text-gray-700">Select Examination Term:</label>
          <select
            value={selectedResult?._id || ''}
            onChange={(e) => {
              const found = results.find((r) => r._id === e.target.value);
              if (found) setSelectedResult(found);
            }}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {results.map((res, i) => (
              <option key={res._id} value={res._id}>
                Examination #{i + 1} ({res.resultStatus})
              </option>
            ))}
          </select>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-sm text-gray-500">Loading your results...</div>
      ) : !selectedResult ? (
        <div className="p-12 text-center bg-white rounded-xl shadow-sm border border-gray-100 text-sm text-gray-500">
          No published examination results available at this time.
        </div>
      ) : (
        <>
          {/* Summary Banner */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-5 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-xl shadow-md">
              <p className="text-xs font-medium uppercase tracking-wider text-blue-100">OVERALL GRADE</p>
              <p className="text-4xl font-extrabold mt-1">{selectedResult.overallGrade}</p>
              <p className="text-xs text-blue-200 mt-1">GPA: {selectedResult.overallGradePoint}</p>
            </div>
            <div className="p-5 bg-white rounded-xl shadow-sm border border-gray-100">
              <p className="text-xs text-gray-500 font-medium uppercase">PERCENTAGE</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{selectedResult.overallPercentage}%</p>
              <p className="text-xs text-gray-400 mt-1">
                {selectedResult.overallTotalObtained} / {selectedResult.overallMaximumMarks} marks
              </p>
            </div>
            <div className="p-5 bg-white rounded-xl shadow-sm border border-gray-100">
              <p className="text-xs text-gray-500 font-medium uppercase">CLASS RANK</p>
              <p className="text-3xl font-bold text-purple-600 mt-1">
                {selectedResult.rankInClass ? `#${selectedResult.rankInClass}` : '—'}
              </p>
            </div>
            <div className="p-5 bg-white rounded-xl shadow-sm border border-gray-100">
              <p className="text-xs text-gray-500 font-medium uppercase">RESULT STATUS</p>
              <p
                className={`text-2xl font-bold mt-1 ${
                  selectedResult.resultStatus === 'PASS' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {selectedResult.resultStatus}
              </p>
            </div>
          </div>

          {/* Subjects Breakdown Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Subject Wise Breakdown</h2>
              {selectedResult.publishedAt && (
                <span className="text-xs text-gray-500">
                  Published: {new Date(selectedResult.publishedAt).toLocaleDateString()}
                </span>
              )}
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50">
                  <th className="p-4 text-xs font-semibold text-gray-600 uppercase">Subject</th>
                  <th className="p-4 text-xs font-semibold text-gray-600 uppercase">Marks Obtained</th>
                  <th className="p-4 text-xs font-semibold text-gray-600 uppercase">Percentage</th>
                  <th className="p-4 text-xs font-semibold text-gray-600 uppercase">Grade</th>
                  <th className="p-4 text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="p-4 text-xs font-semibold text-gray-600 uppercase text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {selectedResult.subjectResults.map((sub, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition">
                    <td className="p-4">
                      <p className="text-sm font-medium text-gray-900">{sub.subjectName}</p>
                      <p className="text-xs text-gray-500 font-mono">{sub.subjectCode}</p>
                    </td>
                    <td className="p-4 text-sm text-gray-700">
                      {sub.isAbsent ? (
                        <span className="text-red-600 font-bold">ABSENT</span>
                      ) : (
                        <span>
                          {sub.totalMarksObtained} / {sub.maximumMarks}
                          {sub.graceMarks > 0 && (
                            <span className="text-xs text-purple-600 ml-1">(+{sub.graceMarks} grace)</span>
                          )}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-sm font-semibold text-gray-800">{sub.percentage}%</td>
                    <td className="p-4">
                      <span className="px-2 py-1 text-xs font-bold rounded bg-blue-50 text-blue-800">
                        {sub.grade}
                      </span>
                    </td>
                    <td className="p-4">
                      {sub.isPassed ? (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          PASSED
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          FAILED
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleOpenReEval(sub)}
                        className="px-3 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200 text-xs font-medium rounded-lg transition"
                      >
                        Re-Evaluation
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Re-Evaluation Request Modal */}
      {isReEvalModalOpen && targetSubject && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">
              Request Re-Evaluation — {targetSubject.subjectName}
            </h2>
            <form onSubmit={handleCreateReEvaluation} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Request Type</label>
                <select
                  value={requestType}
                  onChange={(e) => setRequestType(e.target.value as any)}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="RE_COUNTING">Re-Counting (Marks Retotaling)</option>
                  <option value="RE_EVALUATION">Re-Evaluation (Script Checking)</option>
                  <option value="ANSWER_SCRIPT_VIEW">Answer Script Scrutiny View</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Reason for Request (Required)
                </label>
                <textarea
                  rows={3}
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain why you are requesting marks re-checking..."
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReEvalModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
