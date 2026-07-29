import React, { useEffect, useState } from 'react';
import { apiClient } from '../../lib/api';
import {
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Unlock,
  Send,
  Save,
  Filter,
} from 'lucide-react';

interface RosterStudent {
  enrollmentId: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
}

interface AttendanceEntryState {
  studentId: string;
  enrollmentId: string;
  studentName: string;
  rollNumber: string;
  attendanceStatus: string;
  attendanceSource: string;
  lateMinutes: number;
  remarks: string;
}

export const AttendanceMarkPage: React.FC = () => {
  const [academicSessionId, setAcademicSessionId] = useState<string>('');
  const [classId, setClassId] = useState<string>('');
  const [sectionId, setSectionId] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [attendanceType, setAttendanceType] = useState<'DAILY' | 'PERIOD'>('DAILY');
  const [timetablePeriodId, setTimetablePeriodId] = useState<string>('');
  
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [sessionData, setSessionData] = useState<any>(null);
  const [entries, setEntries] = useState<AttendanceEntryState[]>([]);
  const [reopenModalOpen, setReopenModalOpen] = useState<boolean>(false);
  const [reopenReason, setReopenReason] = useState<string>('');

  const fetchSessionContext = async () => {
    if (!academicSessionId || !classId || !sectionId || !date) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await apiClient.get('/api/v1/attendance/session-context', {
        params: {
          academicSessionId,
          classId,
          sectionId,
          date,
          attendanceType,
          timetablePeriodId: attendanceType === 'PERIOD' ? timetablePeriodId : undefined,
        },
      });
      const data = res.data.data;
      setSessionData(data);
      setEntries(
        data.roster.map((stu: RosterStudent) => ({
          studentId: stu.studentId,
          enrollmentId: stu.enrollmentId,
          studentName: stu.studentName,
          rollNumber: stu.rollNumber,
          attendanceStatus: 'PRESENT',
          attendanceSource: 'MANUAL',
          lateMinutes: 0,
          remarks: '',
        }))
      );
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Error fetching session context');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch trigger if values present
  }, []);

  const updateStudentEntry = (studentId: string, field: keyof AttendanceEntryState, value: any) => {
    setEntries((prev) =>
      prev.map((item) => (item.studentId === studentId ? { ...item, [field]: value } : item))
    );
  };

  const setAllStatus = (status: string) => {
    setEntries((prev) => prev.map((item) => ({ ...item, attendanceStatus: status })));
  };

  const saveAttendance = async (targetStatus: 'DRAFT' | 'SUBMITTED') => {
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const payload = {
        academicSessionId,
        classId,
        sectionId,
        attendanceType,
        date,
        timetablePeriodId: attendanceType === 'PERIOD' ? timetablePeriodId : undefined,
        teachingAssignmentId: sessionData?.teachingAssignmentId,
        sessionStatus: targetStatus,
        entries: entries.map((e) => ({
          enrollmentId: e.enrollmentId,
          studentId: e.studentId,
          studentName: e.studentName,
          rollNumber: e.rollNumber,
          className: sessionData?.className || 'Class',
          sectionName: sessionData?.sectionName || 'A',
          attendanceStatus: e.attendanceStatus,
          attendanceSource: e.attendanceSource,
          lateMinutes: Number(e.lateMinutes) || 0,
          remarks: e.remarks,
        })),
      };

      const res = await apiClient.post('/api/v1/attendance', payload);
      setSuccessMessage(`Attendance successfully saved as ${targetStatus}`);
      setSessionData((prev: any) => ({ ...prev, session: res.data.data.session }));
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Error saving attendance');
    } finally {
      setLoading(false);
    }
  };

  const handleReopenSession = async () => {
    if (!reopenReason || reopenReason.trim().length < 5) {
      setErrorMessage('A mandatory audit reason of at least 5 characters is required to reopen frozen attendance.');
      return;
    }
    setLoading(true);
    try {
      const sessionId = sessionData?.session?._id;
      if (!sessionId) return;
      await apiClient.patch(`/api/v1/attendance/${sessionId}/reopen`, { reason: reopenReason });
      setSuccessMessage('Attendance session reopened successfully.');
      setReopenModalOpen(false);
      setReopenReason('');
      fetchSessionContext();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Error reopening attendance session.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between bg-gradient-to-r from-blue-700 to-indigo-800 p-6 rounded-2xl text-white shadow-xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
            <UserCheck className="w-8 h-8 text-blue-200" />
            Attendance & Register Marking
          </h1>
          <p className="text-blue-100 mt-1 text-sm">
            Mark daily or period-wise student attendance with punctuality tracking and audit snapshots.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setAllStatus('PRESENT')}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-semibold transition"
          >
            Mark All Present
          </button>
        </div>
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

      {/* Filter Bar */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-6 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Session ID</label>
          <input
            type="text"
            placeholder="Academic Session ID"
            value={academicSessionId}
            onChange={(e) => setAcademicSessionId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Class ID</label>
          <input
            type="text"
            placeholder="Class ID"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Section ID</label>
          <input
            type="text"
            placeholder="Section ID"
            value={sectionId}
            onChange={(e) => setSectionId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Type</label>
          <select
            value={attendanceType}
            onChange={(e: any) => setAttendanceType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="DAILY">Daily Attendance</option>
            <option value="PERIOD">Period Attendance</option>
          </select>
        </div>
        {attendanceType === 'PERIOD' && (
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Period ID
            </label>
            <input
              type="text"
              placeholder="Timetable Period ID"
              value={timetablePeriodId}
              onChange={(e) => setTimetablePeriodId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
        <div className="flex items-end">
          <button
            onClick={fetchSessionContext}
            disabled={loading}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition flex items-center justify-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Load Roster
          </button>
        </div>
      </div>

      {/* Roster Table */}
      {entries.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-800">Student Attendance Roster</h3>
              <p className="text-xs text-gray-500">
                {entries.length} students loaded for date {date}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => saveAttendance('DRAFT')}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Draft
              </button>
              <button
                onClick={() => saveAttendance('SUBMITTED')}
                disabled={loading}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm"
              >
                <Send className="w-4 h-4" />
                Submit Attendance
              </button>
              {sessionData?.session?.sessionStatus === 'FROZEN' && (
                <button
                  onClick={() => setReopenModalOpen(true)}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm"
                >
                  <Unlock className="w-4 h-4" />
                  Reopen Session
                </button>
              )}
            </div>
          </div>

          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 text-gray-500 text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
                <th className="py-3 px-4">Roll</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4">Late Mins</th>
                <th className="py-3 px-4">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {entries.map((student) => (
                <tr key={student.studentId} className="hover:bg-gray-50/50 transition">
                  <td className="py-3 px-4 font-mono text-gray-600">{student.rollNumber || '#'}</td>
                  <td className="py-3 px-4 font-medium text-gray-900">{student.studentName}</td>
                  <td className="py-3 px-4">
                    <select
                      value={student.attendanceStatus}
                      onChange={(e) =>
                        updateStudentEntry(student.studentId, 'attendanceStatus', e.target.value)
                      }
                      className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-blue-500"
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
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        student.attendanceSource === 'LEAVE'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {student.attendanceSource}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <input
                      type="number"
                      min="0"
                      value={student.lateMinutes}
                      onChange={(e) =>
                        updateStudentEntry(student.studentId, 'lateMinutes', parseInt(e.target.value) || 0)
                      }
                      className="w-20 px-2 py-1 border border-gray-200 rounded text-xs"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <input
                      type="text"
                      placeholder="Remarks..."
                      value={student.remarks}
                      onChange={(e) => updateStudentEntry(student.studentId, 'remarks', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-200 rounded text-xs"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Reopen Modal with Mandatory Audit Reason */}
      {reopenModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Unlock className="w-5 h-5 text-amber-600" />
              Reopen Frozen Attendance Session
            </h3>
            <p className="text-sm text-gray-600">
              This session was frozen after report-card generation. Reopening requires a mandatory audit reason.
            </p>
            <textarea
              rows={3}
              placeholder="Enter mandatory audit reason (minimum 5 characters)..."
              value={reopenReason}
              onChange={(e) => setReopenReason(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setReopenModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleReopenSession}
                disabled={loading}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-semibold shadow-sm"
              >
                Confirm Reopen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
