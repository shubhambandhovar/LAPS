import React, { useState, useEffect } from 'react';

interface ExamScheduleItem {
  _id: string;
  examId: string;
  classId: string;
  sectionId?: string;
  subjectId: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  room?: string;
  maximumMarks: number;
  passingMarks: number;
  status: 'SCHEDULED' | 'RESCHEDULED' | 'CANCELLED' | 'COMPLETED' | 'ARCHIVED';
}

export const ExamSchedulePage: React.FC = () => {
  const [schedules, setSchedules] = useState<ExamScheduleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [examId, setExamId] = useState('');
  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('12:00');
  const [durationMinutes, setDurationMinutes] = useState(180);
  const [room, setRoom] = useState('Room 101');
  const [maximumMarks, setMaximumMarks] = useState(100);
  const [passingMarks, setPassingMarks] = useState(33);

  const fetchSchedules = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/exam-schedules', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSchedules(data.data || []);
      } else {
        setError(data.message || 'Failed to fetch exam schedules');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setConflictWarning(null);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        examId: examId || '000000000000000000000001',
        academicSessionId: '000000000000000000000001',
        academicTermId: '000000000000000000000001',
        classSubjectId: '000000000000000000000001',
        classId: classId || '000000000000000000000001',
        subjectId: subjectId || '000000000000000000000001',
        date: new Date(date).toISOString(),
        startTime,
        endTime,
        durationMinutes: Number(durationMinutes),
        room,
        maximumMarks: Number(maximumMarks),
        passingMarks: Number(passingMarks),
      };

      const res = await fetch('/api/v1/exam-schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.status === 409) {
        // Real-time conflict detected
        setConflictWarning(
          data.message || 'Scheduling Conflict Detected: Another exam slot overlaps in time, room, or invigilator.'
        );
      } else if (res.ok && data.success) {
        setIsModalOpen(false);
        fetchSchedules();
      } else {
        setError(data.message || 'Failed to create schedule slot');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Examination Timetable & Schedule</h1>
          <p className="text-sm text-gray-500">
            Schedule exam dates, times, rooms, and invigilators with real-time conflict detection.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
        >
          + Add Schedule Slot
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {conflictWarning && (
        <div className="p-4 bg-amber-50 border border-amber-300 text-amber-800 rounded-lg text-sm flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-bold">CONFLICT WARNING:</span>
            <span>{conflictWarning}</span>
          </div>
          <button
            onClick={() => setConflictWarning(null)}
            className="text-xs font-semibold text-amber-700 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Schedule Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="p-4 text-xs font-semibold text-gray-600 uppercase">Date</th>
              <th className="p-4 text-xs font-semibold text-gray-600 uppercase">Time Slot</th>
              <th className="p-4 text-xs font-semibold text-gray-600 uppercase">Room</th>
              <th className="p-4 text-xs font-semibold text-gray-600 uppercase">Max / Passing</th>
              <th className="p-4 text-xs font-semibold text-gray-600 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-sm text-gray-500">
                  Loading exam schedules...
                </td>
              </tr>
            ) : schedules.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-sm text-gray-500">
                  No schedule slots found. Click "+ Add Schedule Slot" to get started.
                </td>
              </tr>
            ) : (
              schedules.map((slot) => (
                <tr key={slot._id} className="hover:bg-gray-50 transition">
                  <td className="p-4 text-sm font-medium text-gray-900">
                    {new Date(slot.date).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-sm text-gray-700">
                    {slot.startTime} - {slot.endTime} ({slot.durationMinutes}m)
                  </td>
                  <td className="p-4 text-sm text-gray-700">{slot.room || '—'}</td>
                  <td className="p-4 text-sm text-gray-700">
                    {slot.maximumMarks} / {slot.passingMarks}
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {slot.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Slot Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Add Examination Schedule Slot</h2>
            <form onSubmit={handleCreateSchedule} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Exam ID / Name</label>
                <input
                  type="text"
                  value={examId}
                  onChange={(e) => setExamId(e.target.value)}
                  placeholder="000000000000000000000001"
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Class ID</label>
                  <input
                    type="text"
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    placeholder="000000000000000000000001"
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Subject ID</label>
                  <input
                    type="text"
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    placeholder="000000000000000000000001"
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Exam Date</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Duration (min)</label>
                  <input
                    type="number"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Max Marks</label>
                  <input
                    type="number"
                    value={maximumMarks}
                    onChange={(e) => setMaximumMarks(Number(e.target.value))}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Passing Marks</label>
                  <input
                    type="number"
                    value={passingMarks}
                    onChange={(e) => setPassingMarks(Number(e.target.value))}
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Room / Hall</label>
                <input
                  type="text"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  placeholder="e.g. Hall A, Room 204"
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
                >
                  Save Schedule Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
