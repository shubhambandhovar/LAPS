import React, { useEffect, useState } from 'react';
import { apiClient } from '../../lib/api';
import {
  Calendar,
  Home,
  BookOpen,
  Plus,
  Archive,
  AlertCircle,
  Tag,
} from 'lucide-react';

interface AcademicTermRecord {
  id: string;
  name: string;
  code: string;
  academicSessionId: string;
  startDate: string;
  endDate: string;
  orderSequence: number;
  status: 'ACTIVE' | 'ARCHIVED';
}

interface RoomRecord {
  id: string;
  name: string;
  code: string;
  capacity: number;
  roomType: 'CLASSROOM' | 'LAB' | 'LIBRARY' | 'AUDITORIUM' | 'SPORTS_HALL' | 'STAFF_ROOM' | 'OTHER';
  building?: string;
  floor?: string;
  status: 'ACTIVE' | 'ARCHIVED';
}

interface ClassSubjectRecord {
  id: string;
  academicSessionId: string;
  classId: { id: string; name: string; code: string };
  subjectId: { id: string; name: string; code: string; shortName: string };
  isMandatory: boolean;
  isOptional: boolean;
  minPeriodsPerWeek?: number;
  maxPeriodsPerWeek?: number;
  status: 'ACTIVE' | 'ARCHIVED';
}

interface AcademicSessionRecord {
  id: string;
  name: string;
  code: string;
  isCurrent: boolean;
}

interface ClassRecord {
  id: string;
  name: string;
  code: string;
}

interface SubjectRecord {
  id: string;
  name: string;
  code: string;
}

export const CurriculumPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'terms' | 'rooms' | 'mappings'>('terms');

  // Master lists for form selects
  const [sessions, setSessions] = useState<AcademicSessionRecord[]>([]);
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [subjects, setSubjects] = useState<SubjectRecord[]>([]);

  // Records
  const [terms, setTerms] = useState<AcademicTermRecord[]>([]);
  const [rooms, setRooms] = useState<RoomRecord[]>([]);
  const [classSubjects, setClassSubjects] = useState<ClassSubjectRecord[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal controls
  const [showTermModal, setShowTermModal] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showMappingModal, setShowMappingModal] = useState(false);

  // Term Form
  const [termName, setTermName] = useState('');
  const [termCode, setTermCode] = useState('');
  const [termSessionId, setTermSessionId] = useState('');
  const [termStart, setTermStart] = useState('');
  const [termEnd, setTermEnd] = useState('');
  const [termSeq, setTermSeq] = useState('1');

  // Room Form
  const [roomName, setRoomName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [roomCap, setRoomCap] = useState('30');
  const [roomType, setRoomType] = useState('CLASSROOM');
  const [roomBuilding, setRoomBuilding] = useState('');

  // Mapping Form
  const [mapSessionId, setMapSessionId] = useState('');
  const [mapClassId, setMapClassId] = useState('');
  const [mapSubjectId, setMapSubjectId] = useState('');
  const [mapMandatory, setMapMandatory] = useState(true);

  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sessRes, clsRes, subRes, trmRes, rmRes, mapRes] = await Promise.all([
        apiClient.get('/academic-sessions'),
        apiClient.get('/classes'),
        apiClient.get('/subjects'),
        apiClient.get('/academic-terms'),
        apiClient.get('/rooms'),
        apiClient.get('/class-subjects'),
      ]);
      const sessionList = sessRes.data.data || [];
      setSessions(sessionList);
      const currSess = sessionList.find((s: AcademicSessionRecord) => s.isCurrent) || sessionList[0];
      if (currSess) {
        setTermSessionId(currSess.id);
        setMapSessionId(currSess.id);
      }
      setClasses(clsRes.data.data || []);
      setSubjects(subRes.data.data || []);
      setTerms(trmRes.data.data || []);
      setRooms(rmRes.data.data || []);
      setClassSubjects(mapRes.data.data || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch curriculum data';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateTerm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await apiClient.post('/academic-terms', {
        name: termName,
        code: termCode,
        academicSessionId: termSessionId,
        startDate: termStart,
        endDate: termEnd,
        orderSequence: Number(termSeq),
      });
      setShowTermModal(false);
      fetchData();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error creating academic term');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await apiClient.post('/rooms', {
        name: roomName,
        code: roomCode,
        capacity: Number(roomCap),
        roomType,
        building: roomBuilding || undefined,
      });
      setShowRoomModal(false);
      fetchData();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error creating room');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateMapping = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await apiClient.post('/class-subjects', {
        academicSessionId: mapSessionId,
        classId: mapClassId,
        subjectId: mapSubjectId,
        isMandatory: mapMandatory,
        isOptional: !mapMandatory,
        orderSequence: 1,
      });
      setShowMappingModal(false);
      fetchData();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error creating class-subject mapping');
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchiveTerm = async (id: string) => {
    try {
      await apiClient.patch(`/academic-terms/${id}/archive`);
      fetchData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to archive term');
    }
  };

  const handleArchiveRoom = async (id: string) => {
    try {
      await apiClient.patch(`/rooms/${id}/archive`);
      fetchData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to archive room');
    }
  };

  const handleArchiveMapping = async (id: string) => {
    try {
      await apiClient.patch(`/class-subjects/${id}/archive`);
      fetchData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to archive mapping');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Curriculum & Academic Foundation
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage academic terms, rooms, and class-subject mappings
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {activeTab === 'terms' && (
            <button
              onClick={() => {
                setFormError(null);
                setShowTermModal(true);
              }}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300 transition"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Academic Term
            </button>
          )}
          {activeTab === 'rooms' && (
            <button
              onClick={() => {
                setFormError(null);
                setShowRoomModal(true);
              }}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300 transition"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Room
            </button>
          )}
          {activeTab === 'mappings' && (
            <button
              onClick={() => {
                setFormError(null);
                setShowMappingModal(true);
              }}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300 transition"
            >
              <Plus className="w-4 h-4 mr-2" />
              Map Class Subject
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('terms')}
            className={`flex items-center pb-4 px-1 border-b-2 font-medium text-sm transition ${
              activeTab === 'terms'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400'
            }`}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Academic Terms
          </button>
          <button
            onClick={() => setActiveTab('rooms')}
            className={`flex items-center pb-4 px-1 border-b-2 font-medium text-sm transition ${
              activeTab === 'rooms'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400'
            }`}
          >
            <Home className="w-4 h-4 mr-2" />
            Rooms & Venues
          </button>
          <button
            onClick={() => setActiveTab('mappings')}
            className={`flex items-center pb-4 px-1 border-b-2 font-medium text-sm transition ${
              activeTab === 'mappings'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400'
            }`}
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Class-Subject Mappings
          </button>
        </nav>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 flex items-center">
          <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <>
          {/* TERMS TAB */}
          {activeTab === 'terms' && (
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Term Name & Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Dates
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {terms.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                        No academic terms found. Create your first term to begin.
                      </td>
                    </tr>
                  ) : (
                    terms.map((t) => (
                      <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {t.name}
                          </div>
                          <div className="text-xs text-gray-500">{t.code}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                          {t.startDate} to {t.endDate}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              t.status === 'ACTIVE'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {t.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          {t.status === 'ACTIVE' && (
                            <button
                              onClick={() => handleArchiveTerm(t.id)}
                              className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition"
                              title="Archive term"
                            >
                              <Archive className="w-4 h-4 inline" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* ROOMS TAB */}
          {activeTab === 'rooms' && (
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Room Code & Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Type & Capacity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Building
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {rooms.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        No rooms configured yet.
                      </td>
                    </tr>
                  ) : (
                    rooms.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {r.name}
                          </div>
                          <div className="text-xs text-gray-500">{r.code}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                          <span className="font-semibold">{r.roomType}</span> — Cap: {r.capacity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {r.building || '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              r.status === 'ACTIVE'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          {r.status === 'ACTIVE' && (
                            <button
                              onClick={() => handleArchiveRoom(r.id)}
                              className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition"
                              title="Archive room"
                            >
                              <Archive className="w-4 h-4 inline" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* MAPPINGS TAB */}
          {activeTab === 'mappings' && (
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Class
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {classSubjects.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        No class-subject mappings created yet.
                      </td>
                    </tr>
                  ) : (
                    classSubjects.map((cs) => (
                      <tr key={cs.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {cs.classId?.name}
                          </div>
                          <div className="text-xs text-gray-500">{cs.classId?.code}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {cs.subjectId?.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {cs.subjectId?.code} ({cs.subjectId?.shortName})
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              cs.isMandatory
                                ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300'
                                : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                            }`}
                          >
                            <Tag className="w-3 h-3 mr-1" />
                            {cs.isMandatory ? 'Mandatory' : 'Optional'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              cs.status === 'ACTIVE'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {cs.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          {cs.status === 'ACTIVE' && (
                            <button
                              onClick={() => handleArchiveMapping(cs.id)}
                              className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition"
                              title="Archive mapping"
                            >
                              <Archive className="w-4 h-4 inline" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Term Modal */}
      {showTermModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Create New Academic Term
            </h3>
            {formError && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded text-sm">
                {formError}
              </div>
            )}
            <form onSubmit={handleCreateTerm} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Term Name
                </label>
                <input
                  type="text"
                  required
                  value={termName}
                  onChange={(e) => setTermName(e.target.value)}
                  placeholder="e.g. Term 1"
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Term Code
                </label>
                <input
                  type="text"
                  required
                  value={termCode}
                  onChange={(e) => setTermCode(e.target.value.toUpperCase())}
                  placeholder="e.g. T1"
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Academic Session
                </label>
                <select
                  required
                  value={termSessionId}
                  onChange={(e) => setTermSessionId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">Select Academic Session...</option>
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.isCurrent ? '(Current)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={termStart}
                    onChange={(e) => setTermStart(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    value={termEnd}
                    onChange={(e) => setTermEnd(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Order Sequence
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={termSeq}
                  onChange={(e) => setTermSeq(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowTermModal(false)}
                  className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
                >
                  {submitting ? 'Creating...' : 'Create Term'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Room Modal */}
      {showRoomModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Create New Room
            </h3>
            {formError && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded text-sm">
                {formError}
              </div>
            )}
            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Room Name
                </label>
                <input
                  type="text"
                  required
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="e.g. Physics Lab 101"
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Room Code
                  </label>
                  <input
                    type="text"
                    required
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    placeholder="e.g. LAB-101"
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Capacity
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={roomCap}
                    onChange={(e) => setRoomCap(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Room Type
                </label>
                <select
                  value={roomType}
                  onChange={(e) => setRoomType(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="CLASSROOM">Classroom</option>
                  <option value="LAB">Laboratory</option>
                  <option value="LIBRARY">Library</option>
                  <option value="AUDITORIUM">Auditorium</option>
                  <option value="SPORTS_HALL">Sports Hall</option>
                  <option value="STAFF_ROOM">Staff Room</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Building (Optional)
                </label>
                <input
                  type="text"
                  value={roomBuilding}
                  onChange={(e) => setRoomBuilding(e.target.value)}
                  placeholder="e.g. Main Block"
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowRoomModal(false)}
                  className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
                >
                  {submitting ? 'Creating...' : 'Create Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mapping Modal */}
      {showMappingModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Map Subject to Class
            </h3>
            {formError && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded text-sm">
                {formError}
              </div>
            )}
            <form onSubmit={handleCreateMapping} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Class
                </label>
                <select
                  required
                  value={mapClassId}
                  onChange={(e) => setMapClassId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">Select a class...</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Subject
                </label>
                <select
                  required
                  value={mapSubjectId}
                  onChange={(e) => setMapSubjectId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">Select a subject...</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="mapMandatory"
                  checked={mapMandatory}
                  onChange={(e) => setMapMandatory(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="mapMandatory"
                  className="text-sm text-gray-700 dark:text-gray-300"
                >
                  Mandatory Subject for all students in class
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowMappingModal(false)}
                  className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
                >
                  {submitting ? 'Mapping...' : 'Create Mapping'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
