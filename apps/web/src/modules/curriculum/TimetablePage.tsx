import React, { useEffect, useState } from 'react';
import { apiClient } from '../../lib/api';
import {
  Calendar,
  Clock,
  Plus,
  AlertCircle,
  CheckCircle2,
  Share2,
  BarChart2,
  Layers,
} from 'lucide-react';

interface BellScheduleRecord {
  id: string;
  name: string;
  scheduleType: string;
  isDefault: boolean;
  status: string;
}

interface TimetablePeriodRecord {
  id: string;
  name: string;
  sequence: number;
  startTime: string;
  endTime: string;
  isBreak: boolean;
  status: string;
}

interface TimetableSlotRecord {
  id: string;
  dayOfWeek: string;
  timetablePeriodId: { id: string; name: string; sequence: number; startTime: string; endTime: string };
  subjectId: { id: string; name: string; code: string };
  teacherId: { id: string; firstName: string; lastName: string };
  roomId?: { id: string; name: string; code: string };
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
}

interface AcademicSessionRecord {
  id: string;
  name: string;
  isCurrent: boolean;
}

interface ClassRecord {
  id: string;
  name: string;
  code: string;
}

interface SectionRecord {
  id: string;
  name: string;
  classId: string;
}

interface TeacherRecord {
  id: string;
  firstName: string;
  lastName: string;
  employeeId: string;
}

export const TimetablePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'matrix' | 'bells' | 'periods' | 'workload'>('matrix');

  // References
  const [sessions, setSessions] = useState<AcademicSessionRecord[]>([]);
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [sections, setSections] = useState<SectionRecord[]>([]);
  const [teachers, setTeachers] = useState<TeacherRecord[]>([]);

  // Selected filters for Matrix
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');

  // Data records
  const [bellSchedules, setBellSchedules] = useState<BellScheduleRecord[]>([]);
  const [periods, setPeriods] = useState<TimetablePeriodRecord[]>([]);
  const [slots, setSlots] = useState<TimetableSlotRecord[]>([]);
  const [workload, setWorkload] = useState<Record<string, unknown> | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal states
  const [showBellModal, setShowBellModal] = useState(false);
  const [showPeriodModal, setShowPeriodModal] = useState(false);

  // Bell form
  const [bellName, setBellName] = useState('');
  const [bellType, setBellType] = useState('REGULAR');
  const [bellDefault, setBellDefault] = useState(true);

  // Period form
  const [periodBellId, setPeriodBellId] = useState('');
  const [periodName, setPeriodName] = useState('');
  const [periodSeq, setPeriodSeq] = useState('1');
  const [periodStart, setPeriodStart] = useState('08:00');
  const [periodEnd, setPeriodEnd] = useState('08:45');
  const [periodBreak, setPeriodBreak] = useState(false);

  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchRefs = async () => {
    try {
      const [sessRes, clsRes, secRes, tchRes, bellRes] = await Promise.all([
        apiClient.get('/academic-sessions'),
        apiClient.get('/classes'),
        apiClient.get('/sections'),
        apiClient.get('/teachers'),
        apiClient.get('/bell-schedules'),
      ]);
      const sList = sessRes.data.data || [];
      setSessions(sList);
      const curr = sList.find((s: AcademicSessionRecord) => s.isCurrent) || sList[0];
      if (curr) {
        setSelectedSessionId(curr.id);
      }
      setClasses(clsRes.data.data || []);
      setSections(secRes.data.data || []);
      setTeachers(tchRes.data.data || []);
      const bList = bellRes.data.data || [];
      setBellSchedules(bList);
      if (bList.length > 0) {
        setPeriodBellId(bList[0].id);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error loading reference data');
    }
  };

  useEffect(() => {
    fetchRefs();
  }, []);

  const fetchMatrix = async () => {
    if (!selectedSessionId || !selectedClassId || !selectedSectionId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(
        `/timetables?academicSessionId=${selectedSessionId}&classId=${selectedClassId}&sectionId=${selectedSectionId}`,
      );
      setSlots(res.data.data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch timetable slots');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'matrix') {
      fetchMatrix();
    }
  }, [activeTab, selectedSessionId, selectedClassId, selectedSectionId]);

  const fetchPeriods = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/periods');
      setPeriods(res.data.data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch periods');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'periods') {
      fetchPeriods();
    }
  }, [activeTab]);

  const fetchWorkload = async () => {
    if (!selectedTeacherId || !selectedSessionId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(
        `/timetables/workload/${selectedTeacherId}?academicSessionId=${selectedSessionId}`,
      );
      setWorkload(res.data.data || null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch teacher workload');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'workload' && selectedTeacherId) {
      fetchWorkload();
    }
  }, [activeTab, selectedTeacherId, selectedSessionId]);

  const handleCreateBell = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await apiClient.post('/bell-schedules', {
        name: bellName,
        academicSessionId: selectedSessionId,
        scheduleType: bellType,
        isDefault: bellDefault,
      });
      setShowBellModal(false);
      fetchRefs();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to create bell schedule');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreatePeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await apiClient.post('/periods', {
        bellScheduleId: periodBellId,
        name: periodName,
        sequence: Number(periodSeq),
        startTime: periodStart,
        endTime: periodEnd,
        isBreak: periodBreak,
      });
      setShowPeriodModal(false);
      fetchPeriods();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to create period');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublishAll = async () => {
    if (!selectedSessionId || !selectedClassId || !selectedSectionId) return;
    try {
      const res = await apiClient.post('/timetables/publish', {
        academicSessionId: selectedSessionId,
        classId: selectedClassId,
        sectionId: selectedSectionId,
      });
      setSuccessMsg(res.data.data?.message || 'Published successfully');
      fetchMatrix();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to publish timetable');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Timetable & Teacher Workload
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Design bell schedules, configure timetable slots, and monitor teacher workload
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {sessions.length > 0 && (
            <select
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-gray-800 border rounded-lg text-sm font-medium"
            >
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.isCurrent ? '(Current)' : ''}
                </option>
              ))}
            </select>
          )}
          {activeTab === 'matrix' && (
            <button
              onClick={handlePublishAll}
              disabled={!selectedSessionId || !selectedClassId || !selectedSectionId}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Publish Timetable
            </button>
          )}
          {activeTab === 'bells' && (
            <button
              onClick={() => {
                setFormError(null);
                setShowBellModal(true);
              }}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Bell Schedule
            </button>
          )}
          {activeTab === 'periods' && (
            <button
              onClick={() => {
                setFormError(null);
                setShowPeriodModal(true);
              }}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Period
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center pb-4 px-1 border-b-2 font-medium text-sm transition ${
              activeTab === 'matrix'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400'
            }`}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Timetable Matrix
          </button>
          <button
            onClick={() => setActiveTab('bells')}
            className={`flex items-center pb-4 px-1 border-b-2 font-medium text-sm transition ${
              activeTab === 'bells'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400'
            }`}
          >
            <Clock className="w-4 h-4 mr-2" />
            Bell Schedules
          </button>
          <button
            onClick={() => setActiveTab('periods')}
            className={`flex items-center pb-4 px-1 border-b-2 font-medium text-sm transition ${
              activeTab === 'periods'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400'
            }`}
          >
            <Layers className="w-4 h-4 mr-2" />
            Timetable Periods
          </button>
          <button
            onClick={() => setActiveTab('workload')}
            className={`flex items-center pb-4 px-1 border-b-2 font-medium text-sm transition ${
              activeTab === 'workload'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400'
            }`}
          >
            <BarChart2 className="w-4 h-4 mr-2" />
            Teacher Workload
          </button>
        </nav>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 flex items-center">
          <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 flex items-center">
          <CheckCircle2 className="w-5 h-5 mr-3 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {loading && (
        <div className="text-center py-4 text-sm text-gray-500">
          Loading timetable data...
        </div>
      )}

      {/* MATRIX TAB */}
      {activeTab === 'matrix' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-wrap gap-4 items-center">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                Class
              </label>
              <select
                value={selectedClassId}
                onChange={(e) => {
                  setSelectedClassId(e.target.value);
                  setSelectedSectionId('');
                }}
                className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">Select Class...</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                Section
              </label>
              <select
                value={selectedSectionId}
                onChange={(e) => setSelectedSectionId(e.target.value)}
                disabled={!selectedClassId}
                className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50"
              >
                <option value="">Select Section...</option>
                {sections
                  .filter((s) => s.classId === selectedClassId)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            {!selectedClassId || !selectedSectionId ? (
              <div className="p-12 text-center text-gray-500">
                Please select a Class and Section to view or build the Timetable Matrix.
              </div>
            ) : slots.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                No timetable slots scheduled for this section yet.
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Day
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Period & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Teacher
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Room
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {slots.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900 dark:text-white">
                        {s.dayOfWeek}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        P{s.timetablePeriodId?.sequence}: {s.timetablePeriodId?.startTime} -{' '}
                        {s.timetablePeriodId?.endTime}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-indigo-600 dark:text-indigo-400">
                        {s.subjectId?.name} ({s.subjectId?.code})
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {s.teacherId?.firstName} {s.teacherId?.lastName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {s.roomId ? `${s.roomId.name} (${s.roomId.code})` : '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            s.status === 'PUBLISHED'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* BELLS TAB */}
      {activeTab === 'bells' && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Schedule Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Default
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {bellSchedules.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-white">
                    {b.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                    {b.scheduleType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {b.isDefault ? (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
                        Default
                      </span>
                    ) : (
                      'No'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* PERIODS TAB */}
      {activeTab === 'periods' && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sequence & Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Start Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  End Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Break / Instructional
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {periods.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-white">
                    P{p.sequence}: {p.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                    {p.startTime}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                    {p.endTime}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {p.isBreak ? (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                        Break
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                        Instructional
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* WORKLOAD TAB */}
      {activeTab === 'workload' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center space-x-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                Select Teacher
              </label>
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">Select Teacher...</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.firstName} {t.lastName} ({t.employeeId})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {workload ? (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Workload Report — {String(workload.teacherName)}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-gray-50 dark:bg-gray-700/40 rounded-lg">
                  <div className="text-xs text-gray-500 uppercase">Weekly Periods</div>
                  <div className="text-2xl font-bold text-indigo-600">
                    {String(workload.totalPeriodsPerWeek)}
                  </div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700/40 rounded-lg">
                  <div className="text-xs text-gray-500 uppercase">Free Periods</div>
                  <div className="text-2xl font-bold text-green-600">
                    {String(workload.freePeriodsPerWeek)}
                  </div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700/40 rounded-lg">
                  <div className="text-xs text-gray-500 uppercase">Max Threshold</div>
                  <div className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                    {String(workload.maxWeeklyPeriodsThreshold)}
                  </div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700/40 rounded-lg">
                  <div className="text-xs text-gray-500 uppercase">Status</div>
                  <div className="text-lg font-semibold">
                    {workload.isOverloaded ? (
                      <span className="text-red-600">OVERLOADED</span>
                    ) : (
                      <span className="text-green-600">OPTIMAL</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 bg-white dark:bg-gray-800 rounded-lg shadow text-center text-gray-500">
              Select a teacher to view computed daily/weekly period load and overload metrics.
            </div>
          )}
        </div>
      )}

      {/* Bell Modal */}
      {showBellModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Create Bell Schedule
            </h3>
            {formError && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded text-sm">
                {formError}
              </div>
            )}
            <form onSubmit={handleCreateBell} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Schedule Name
                </label>
                <input
                  type="text"
                  required
                  value={bellName}
                  onChange={(e) => setBellName(e.target.value)}
                  placeholder="e.g. Regular Day Schedule"
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Schedule Type
                </label>
                <select
                  value={bellType}
                  onChange={(e) => setBellType(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="REGULAR">Regular</option>
                  <option value="EXAM">Exam</option>
                  <option value="HALF_DAY">Half Day</option>
                  <option value="ASSEMBLY">Assembly Day</option>
                </select>
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="bellDefault"
                  checked={bellDefault}
                  onChange={(e) => setBellDefault(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="bellDefault"
                  className="text-sm text-gray-700 dark:text-gray-300"
                >
                  Set as Default Bell Schedule for this session
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowBellModal(false)}
                  className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
                >
                  {submitting ? 'Creating...' : 'Create Bell Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Period Modal */}
      {showPeriodModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Create Timetable Period
            </h3>
            {formError && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded text-sm">
                {formError}
              </div>
            )}
            <form onSubmit={handleCreatePeriod} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Period Name
                </label>
                <input
                  type="text"
                  required
                  value={periodName}
                  onChange={(e) => setPeriodName(e.target.value)}
                  placeholder="e.g. Period 1"
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Seq #
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={periodSeq}
                    onChange={(e) => setPeriodSeq(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start
                  </label>
                  <input
                    type="time"
                    required
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    End
                  </label>
                  <input
                    type="time"
                    required
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="periodBreak"
                  checked={periodBreak}
                  onChange={(e) => setPeriodBreak(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="periodBreak"
                  className="text-sm text-gray-700 dark:text-gray-300"
                >
                  This is a Break / Lunch Period (no attendance/teaching)
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPeriodModal(false)}
                  className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
                >
                  {submitting ? 'Creating...' : 'Create Period'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
