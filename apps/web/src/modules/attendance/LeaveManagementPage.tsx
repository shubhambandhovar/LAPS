import React, { useEffect, useState } from 'react';
import { apiClient } from '../../lib/api';
import {
  Calendar,
  Plus,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';


interface LeaveRequestItem {
  _id: string;
  applicantType: 'STUDENT' | 'TEACHER';
  studentId?: { firstName: string; lastName: string; rollNumber?: string };
  teacherId?: { firstName: string; lastName: string; employeeId?: string };
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  leaveStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  reviewerRemarks?: string;
  createdAt: string;
}

export const LeaveManagementPage: React.FC = () => {
  const [leaves, setLeaves] = useState<LeaveRequestItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [academicSessionId, setAcademicSessionId] = useState<string>('');
  const [applicantType, setApplicantType] = useState<'STUDENT' | 'TEACHER'>('STUDENT');
  const [studentId, setStudentId] = useState<string>('');
  const [enrollmentId, setEnrollmentId] = useState<string>('');
  const [teacherId, setTeacherId] = useState<string>('');
  const [leaveType, setLeaveType] = useState<string>('MEDICAL');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState<string>('');

  const [filterStatus, setFilterStatus] = useState<string>('');

  const fetchLeaves = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await apiClient.get('/api/v1/leaves', {
        params: {
          leaveStatus: filterStatus || undefined,
        },
      });
      setLeaves(res.data.data);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Error fetching leave requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [filterStatus]);

  const handleCreateLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const payload: any = {
        academicSessionId,
        applicantType,
        leaveType,
        startDate,
        endDate,
        reason,
      };
      if (applicantType === 'STUDENT') {
        payload.studentId = studentId;
        payload.enrollmentId = enrollmentId;
      } else {
        payload.teacherId = teacherId;
      }

      await apiClient.post('/api/v1/leaves', payload);
      setSuccessMessage('Leave application submitted successfully');
      setModalOpen(false);
      fetchLeaves();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Error submitting leave request');
    } finally {
      setLoading(false);
    }
  };

  const reviewLeave = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    setLoading(true);
    try {
      await apiClient.patch(`/api/v1/leaves/${id}/review`, {
        leaveStatus: status,
        reviewerRemarks: `Reviewed by Admin (${status})`,
      });
      setSuccessMessage(`Leave request ${status.toLowerCase()} successfully`);
      fetchLeaves();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Error reviewing leave request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between bg-gradient-to-r from-teal-700 to-emerald-800 p-6 rounded-2xl text-white shadow-xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
            <Calendar className="w-8 h-8 text-teal-200" />
            Leave Management System
          </h1>
          <p className="text-teal-100 mt-1 text-sm">
            Apply for, review, and track student and teacher leave applications with automatic register linkage.
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-semibold flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" />
          Apply for Leave
        </button>
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
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
        {['', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              filterStatus === status
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {status || 'All Leaves'}
          </button>
        ))}
      </div>

      {/* Leaves Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
              <th className="py-3 px-4">Applicant</th>
              <th className="py-3 px-4">Type</th>
              <th className="py-3 px-4">Leave Type</th>
              <th className="py-3 px-4">Date Range</th>
              <th className="py-3 px-4">Days</th>
              <th className="py-3 px-4">Reason</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {leaves.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-gray-500">
                  No leave requests found matching selected filter.
                </td>
              </tr>
            ) : (
              leaves.map((leave) => (
                <tr key={leave._id} className="hover:bg-gray-50/50 transition">
                  <td className="py-3 px-4 font-medium text-gray-900">
                    {leave.applicantType === 'STUDENT'
                      ? `${leave.studentId?.firstName || ''} ${leave.studentId?.lastName || ''}`
                      : `${leave.teacherId?.firstName || ''} ${leave.teacherId?.lastName || ''}`}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
                      {leave.applicantType}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-teal-700">{leave.leaveType}</td>
                  <td className="py-3 px-4 text-gray-600">
                    {leave.startDate} → {leave.endDate}
                  </td>
                  <td className="py-3 px-4 font-medium">{leave.totalDays}</td>
                  <td className="py-3 px-4 text-gray-600 max-w-xs truncate">{leave.reason}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        leave.leaveStatus === 'APPROVED'
                          ? 'bg-green-100 text-green-700'
                          : leave.leaveStatus === 'REJECTED'
                          ? 'bg-red-100 text-red-700'
                          : leave.leaveStatus === 'CANCELLED'
                          ? 'bg-gray-100 text-gray-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {leave.leaveStatus}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    {leave.leaveStatus === 'PENDING' && (
                      <>
                        <button
                          onClick={() => reviewLeave(leave._id, 'APPROVED')}
                          className="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-semibold"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => reviewLeave(leave._id, 'REJECTED')}
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

      {/* Apply Leave Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleCreateLeave}
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4"
          >
            <h3 className="text-lg font-bold text-gray-900">Submit Leave Application</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                  Applicant Type
                </label>
                <select
                  value={applicantType}
                  onChange={(e: any) => setApplicantType(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="STUDENT">Student</option>
                  <option value="TEACHER">Teacher</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                  Leave Type
                </label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="CASUAL">Casual</option>
                  <option value="MEDICAL">Medical</option>
                  <option value="EMERGENCY">Emergency</option>
                  <option value="SPORTS">Sports</option>
                  <option value="OFFICIAL">Official</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>

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

            {applicantType === 'STUDENT' ? (
              <div className="grid grid-cols-2 gap-4">
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
                    Enrollment ID
                  </label>
                  <input
                    type="text"
                    required
                    value={enrollmentId}
                    onChange={(e) => setEnrollmentId(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                  Teacher ID
                </label>
                <input
                  type="text"
                  required
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                Reason
              </label>
              <textarea
                rows={3}
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                placeholder="Brief reason for leave..."
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
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold shadow-sm"
              >
                Submit Application
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
