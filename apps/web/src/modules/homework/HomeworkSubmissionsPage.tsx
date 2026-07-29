import React, { useState, useEffect } from 'react';
import { apiClient } from '../../lib/api';
import {
  AlertTriangle,
  Award,
  Upload,
  X,
} from 'lucide-react';

export const HomeworkSubmissionsPage: React.FC<{ defaultHomeworkId?: string }> = ({
  defaultHomeworkId = '',
}) => {
  const [homeworkId, setHomeworkId] = useState<string>(defaultHomeworkId);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Evaluation Modal
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
  const [evalMarks, setEvalMarks] = useState<number>(0);
  const [evalGrade, setEvalGrade] = useState<string>('A');
  const [evalRemarks, setEvalRemarks] = useState<string>('');
  const [returnForResubmission, setReturnForResubmission] = useState<boolean>(false);

  // Submit Modal (Student)
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [studentForm, setStudentForm] = useState<any>({
    enrollmentId: '',
    studentId: '',
    remarks: '',
    attachmentUrl: '',
    attachmentName: '',
  });

  const fetchSubmissions = async () => {
    if (!homeworkId) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await apiClient.get(`/api/v1/homework/${homeworkId}/submissions`);
      setSubmissions(res.data.data || []);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Error fetching submissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (homeworkId) {
      fetchSubmissions();
    }
  }, [homeworkId]);

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmission) return;
    try {
      await apiClient.patch(
        `/api/v1/homework/submissions/${selectedSubmission._id}/evaluate`,
        {
          marks: Number(evalMarks),
          grade: evalGrade,
          remarks: evalRemarks,
          returnedForResubmission: returnForResubmission,
        }
      );
      setSelectedSubmission(null);
      fetchSubmissions();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Error evaluating submission');
    }
  };

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!homeworkId) return;
    try {
      const attachments = studentForm.attachmentUrl
        ? [
            {
              type: 'PDF',
              url: studentForm.attachmentUrl,
              fileName: studentForm.attachmentName || 'submission.pdf',
              fileSize: 1024,
              mimeType: 'application/pdf',
              uploadedAt: new Date().toISOString(),
            },
          ]
        : [];

      await apiClient.post(`/api/v1/homework/${homeworkId}/submissions`, {
        enrollmentId: studentForm.enrollmentId,
        studentId: studentForm.studentId,
        remarks: studentForm.remarks,
        attachments,
      });

      setShowSubmitModal(false);
      fetchSubmissions();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Error submitting homework');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">
            Homework Submissions & Evaluation
          </h1>
          <p className="text-sm text-gray-500">
            Review student attempts, check late arrivals and integrity, and evaluate with rubrics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSubmitModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-md flex items-center gap-2 transition"
          >
            <Upload className="w-4 h-4" />
            Submit Homework
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Homework ID Selector bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
        <label className="text-xs font-semibold uppercase text-gray-500 tracking-wider">
          Homework Assignment ID:
        </label>
        <input
          type="text"
          placeholder="Paste Homework ID to view submissions..."
          value={homeworkId}
          onChange={(e) => setHomeworkId(e.target.value)}
          className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm w-80 focus:ring-2 focus:ring-emerald-500"
        />
        <button
          onClick={fetchSubmissions}
          className="px-4 py-1.5 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700"
        >
          Load Submissions
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <th className="p-4">Student</th>
              <th className="p-4">Attempt #</th>
              <th className="p-4">Submitted At</th>
              <th className="p-4">Punctuality</th>
              <th className="p-4">Plagiarism</th>
              <th className="p-4">Status & Score</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {loading ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-gray-400">
                  Loading student submissions...
                </td>
              </tr>
            ) : submissions.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-gray-400">
                  No submissions found for this homework ID.
                </td>
              </tr>
            ) : (
              submissions.map((sub) => (
                <tr key={sub._id} className="hover:bg-gray-50/60 transition">
                  <td className="p-4 font-medium text-gray-900">
                    <div>
                      {sub.studentId?.firstName} {sub.studentId?.lastName}
                    </div>
                    <span className="text-xs text-gray-400 font-normal">
                      Admission: {sub.studentId?.admissionNumber || sub.studentId}
                    </span>
                  </td>
                  <td className="p-4 font-semibold text-gray-700">
                    Attempt #{sub.currentAttempt}
                  </td>
                  <td className="p-4 text-gray-600">
                    {new Date(sub.submittedAt).toLocaleString()}
                  </td>
                  <td className="p-4">
                    {sub.isLate ? (
                      <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded text-xs font-bold uppercase">
                        Late ({sub.lateMinutes}m)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-xs font-bold uppercase">
                        On Time
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-semibold">
                      {sub.plagiarismStatus || 'NOT_CHECKED'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${
                          sub.status === 'EVALUATED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : sub.status === 'RETURNED'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {sub.status}
                      </span>
                      {sub.evaluation?.marks !== undefined && (
                        <span className="font-extrabold text-gray-800">
                          {sub.evaluation.marks} pts
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => {
                        setSelectedSubmission(sub);
                        setEvalMarks(sub.evaluation?.marks || 0);
                        setEvalGrade(sub.evaluation?.grade || 'A');
                        setEvalRemarks(sub.evaluation?.remarks || '');
                        setReturnForResubmission(sub.evaluation?.returnedForResubmission || false);
                      }}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
                    >
                      Evaluate
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Evaluate Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-gray-100 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-600" />
                Evaluate Submission — Attempt #{selectedSubmission.currentAttempt}
              </h2>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEvaluate} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Marks Awarded
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={evalMarks}
                    onChange={(e) => setEvalMarks(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Grade (Optional)
                  </label>
                  <input
                    type="text"
                    value={evalGrade}
                    onChange={(e) => setEvalGrade(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Teacher Remarks & Feedback
                </label>
                <textarea
                  rows={3}
                  value={evalRemarks}
                  onChange={(e) => setEvalRemarks(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Provide feedback on the submission..."
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="returnResub"
                  checked={returnForResubmission}
                  onChange={(e) => setReturnForResubmission(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
                <label htmlFor="returnResub" className="text-sm text-gray-700 font-medium">
                  Return for student resubmission (Sets status to RETURNED)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedSubmission(null)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow"
                >
                  Save Evaluation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-gray-100 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-600" />
                Submit Homework Assignment
              </h2>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStudentSubmit} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Enrollment ID
                  </label>
                  <input
                    type="text"
                    required
                    value={studentForm.enrollmentId}
                    onChange={(e) =>
                      setStudentForm({ ...studentForm, enrollmentId: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Student ID
                  </label>
                  <input
                    type="text"
                    required
                    value={studentForm.studentId}
                    onChange={(e) =>
                      setStudentForm({ ...studentForm, studentId: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Attachment URL (PDF / DOC)
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/homework-submission.pdf"
                  value={studentForm.attachmentUrl}
                  onChange={(e) =>
                    setStudentForm({ ...studentForm, attachmentUrl: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  File Name
                </label>
                <input
                  type="text"
                  placeholder="submission.pdf"
                  value={studentForm.attachmentName}
                  onChange={(e) =>
                    setStudentForm({ ...studentForm, attachmentName: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Student Remarks / Notes
                </label>
                <textarea
                  rows={3}
                  value={studentForm.remarks}
                  onChange={(e) =>
                    setStudentForm({ ...studentForm, remarks: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow"
                >
                  Submit Attempt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeworkSubmissionsPage;
