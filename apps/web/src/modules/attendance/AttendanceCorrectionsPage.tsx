import React, { useEffect, useState } from 'react';
import { apiClient } from '../../lib/api';
import {
  AlertCircle,
  CheckCircle2,
  Plus,
  FileCheck2,
} from 'lucide-react';


interface CorrectionRequestItem {
  _id: string;
  attendanceId: string;
  attendanceEntryId: string;
  studentId?: { firstName: string; lastName: string; rollNumber?: string };
  oldStatus: string;
  newStatus: string;
  reason: string;
  correctionStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewerRemarks?: string;
  createdAt: string;
}

export const AttendanceCorrectionsPage: React.FC = () => {
  const [corrections, setCorrections] = useState<CorrectionRequestItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [academicSessionId, setAcademicSessionId] = useState<string>('');
  const [attendanceId, setAttendanceId] = useState<string>('');
  const [attendanceEntryId, setAttendanceEntryId] = useState<string>('');
  const [studentId, setStudentId] = useState<string>('');
  const [newStatus, setNewStatus] = useState<string>('PRESENT');
  const [reason, setReason] = useState<string>('');

  const [filterStatus, setFilterStatus] = useState<string>('');

  const fetchCorrections = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await apiClient.get('/api/v1/attendance/corrections', {
        params: {
          correctionStatus: filterStatus || undefined,
        },
      });
      setCorrections(res.data.data);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Error fetching correction requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCorrections();
  }, [filterStatus]);

  const handleCreateCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await apiClient.post('/api/v1/attendance/corrections', {
        academicSessionId,
        attendanceId,
        attendanceEntryId,
        studentId,
        newStatus,
        reason,
      });
      setSuccessMessage('Correction request submitted successfully');
      setModalOpen(false);
      fetchCorrections();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Error submitting correction request');
    } finally {
      setLoading(false);
    }
  };

  const reviewCorrection = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    setLoading(true);
    try {
      await apiClient.patch(`/api/v1/attendance/corrections/${id}/review`, {
        correctionStatus: status,
        reviewerRemarks: `Reviewed by Admin (${status})`,
      });
      setSuccessMessage(`Correction request ${status.toLowerCase()} successfully`);
      fetchCorrections();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Error reviewing correction request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between bg-gradient-to-r from-amber-700 to-orange-800 p-6 rounded-2xl text-white shadow-xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
            <FileCheck2 className="w-8 h-8 text-amber-200" />
            Post-Lock Attendance Corrections
          </h1>
          <p className="text-amber-100 mt-1 text-sm">
            Request and approve formal attendance corrections for submitted or locked sessions with full audit trail.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-semibold flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" />
          Request Correction
        </button>
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-2">
        {['', 'PENDING', 'APPROVED', 'REJECTED'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              filterStatus === status
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {status || 'All Requests'}
          </button>
        ))}
      </div>

      {/* Corrections Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
              <th className="py-3 px-4">Student</th>
              <th className="py-3 px-4">Old Status</th>
              <th className="py-3 px-4">New Status</th>
              <th className="py-3 px-4">Reason</th>
              <th className="py-3 px-4">Review Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {corrections.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-500">
                  No correction requests found.
                </td>
              </tr>
            ) : (
              corrections.map((item) => (
                <tr key={item._id} className="hover:bg-gray-50/50 transition">
                  <td className="py-3 px-4 font-medium text-gray-900">
                    {item.studentId
                      ? `${item.studentId.firstName} ${item.studentId.lastName}`
                      : 'Student'}
                  </td>
                  <td className="py-3 px-4 font-semibold text-red-600">{item.oldStatus}</td>
                  <td className="py-3 px-4 font-semibold text-green-600">{item.newStatus}</td>
                  <td className="py-3 px-4 text-gray-600 max-w-xs truncate">{item.reason}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        item.correctionStatus === 'APPROVED'
                          ? 'bg-green-100 text-green-700'
                          : item.correctionStatus === 'REJECTED'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {item.correctionStatus}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    {item.correctionStatus === 'PENDING' && (
                      <>
                        <button
                          onClick={() => reviewCorrection(item._id, 'APPROVED')}
                          className="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-semibold"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => reviewCorrection(item._id, 'REJECTED')}
                          className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleCreateCorrection}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4"
          >
            <h3 className="text-lg font-bold text-gray-900">Request Attendance Correction</h3>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                Academic Session ID
              </label>
              <input
                type="text"
                required
                value={academicSessionId}
                onChange={(e) => setAcademicSessionId(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                  Attendance ID
                </label>
                <input
                  type="text"
                  required
                  value={attendanceId}
                  onChange={(e) => setAttendanceId(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                  Entry ID
                </label>
                <input
                  type="text"
                  required
                  value={attendanceEntryId}
                  onChange={(e) => setAttendanceEntryId(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                Student ID
              </label>
              <input
                type="text"
                required
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                New Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
              >
                <option value="PRESENT">Present</option>
                <option value="ABSENT">Absent</option>
                <option value="LATE">Late</option>
                <option value="HALF_DAY">Half Day</option>
                <option value="MEDICAL_LEAVE">Medical Leave</option>
                <option value="APPROVED_LEAVE">Approved Leave</option>
                <option value="UNAPPROVED_LEAVE">Unapproved Leave</option>
                <option value="EXCUSED">Excused</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                Mandatory Audit Reason (min 5 chars)
              </label>
              <textarea
                rows={3}
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                placeholder="Why is this correction needed?"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-semibold shadow-sm"
              >
                Submit Correction
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
