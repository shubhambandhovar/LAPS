import React, { useState } from 'react';
import { apiClient } from '../../lib/api';
import { Layers, Send, CheckCircle2, AlertTriangle, Plus, Trash2 } from 'lucide-react';

interface BatchInput {
  academicSessionId: string;
  classId: string;
  sectionId: string;
  date: string;
  attendanceType: 'DAILY' | 'PERIOD';
  timetablePeriodId?: string;
  teachingAssignmentId: string;
  entries: {
    enrollmentId: string;
    studentId: string;
    studentName: string;
    rollNumber: string;
    className: string;
    sectionName: string;
    attendanceStatus: string;
    attendanceSource: string;
  }[];
}

export const BulkAttendancePage: React.FC = () => {
  const [batches, setBatches] = useState<BatchInput[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const addEmptyBatch = () => {
    setBatches((prev) => [
      ...prev,
      {
        academicSessionId: '',
        classId: '',
        sectionId: '',
        date: new Date().toISOString().split('T')[0],
        attendanceType: 'DAILY',
        teachingAssignmentId: '',
        entries: [],
      },
    ]);
  };

  const removeBatch = (index: number) => {
    setBatches((prev) => prev.filter((_, i) => i !== index));
  };

  const submitBulk = async () => {
    if (batches.length === 0) {
      setErrorMessage('Please add at least one batch to submit');
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await apiClient.post('/api/v1/attendance/bulk', { batches });
      setSuccessMessage(`Successfully processed ${res.data.data.processedBatches} attendance batches!`);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Error processing bulk attendance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between bg-gradient-to-r from-purple-700 to-indigo-800 p-6 rounded-2xl text-white shadow-xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
            <Layers className="w-8 h-8 text-purple-200" />
            Bulk Attendance Marking
          </h1>
          <p className="text-purple-100 mt-1 text-sm">
            Process attendance batches across multiple sections or periods atomically.
          </p>
        </div>
        <button
          onClick={addEmptyBatch}
          className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-semibold flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" />
          Add Batch
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

      {batches.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-dashed border-gray-300 text-center text-gray-500">
          No attendance batches queued. Click "Add Batch" to start marking bulk attendance.
        </div>
      ) : (
        <div className="space-y-4">
          {batches.map((batch, index) => (
            <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div className="grid grid-cols-4 gap-4 flex-1">
                <input
                  type="text"
                  placeholder="Academic Session ID"
                  value={batch.academicSessionId}
                  onChange={(e) => {
                    const val = e.target.value;
                    setBatches((prev) =>
                      prev.map((item, i) => (i === index ? { ...item, academicSessionId: val } : item))
                    );
                  }}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
                <input
                  type="text"
                  placeholder="Class ID"
                  value={batch.classId}
                  onChange={(e) => {
                    const val = e.target.value;
                    setBatches((prev) =>
                      prev.map((item, i) => (i === index ? { ...item, classId: val } : item))
                    );
                  }}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
                <input
                  type="text"
                  placeholder="Section ID"
                  value={batch.sectionId}
                  onChange={(e) => {
                    const val = e.target.value;
                    setBatches((prev) =>
                      prev.map((item, i) => (i === index ? { ...item, sectionId: val } : item))
                    );
                  }}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
                <input
                  type="date"
                  value={batch.date}
                  onChange={(e) => {
                    const val = e.target.value;
                    setBatches((prev) =>
                      prev.map((item, i) => (i === index ? { ...item, date: val } : item))
                    );
                  }}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>
              <button
                onClick={() => removeBatch(index)}
                className="ml-4 p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}

          <div className="flex justify-end">
            <button
              onClick={submitBulk}
              disabled={loading}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold text-sm flex items-center gap-2 shadow-md transition"
            >
              <Send className="w-4 h-4" />
              Process {batches.length} Batch(es)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
