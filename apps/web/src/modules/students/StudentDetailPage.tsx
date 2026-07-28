import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiClient } from '../../lib/api';
import {
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  ArrowUpRight,
  LogOut,
  Archive,
  Plus,
} from 'lucide-react';

interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

interface DocumentMetadata {
  id: string;
  title: string;
  documentType: string;
  uploadedAt: string;
  fileUrl?: string;
}

interface StudentDetail {
  id: string;
  admissionNumber: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  phone?: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  emergencyContacts: EmergencyContact[];
  documents?: DocumentMetadata[];
  status: 'ACTIVE' | 'ARCHIVED';
}

interface LinkedGuardian {
  id: string;
  studentId: string;
  guardianId: string;
  relationship: string;
  isPrimaryGuardian: boolean;
  pickupPermission: boolean;
  emergencyContactPermission: boolean;
  guardian?: {
    id: string;
    name: string;
    phone: string;
    email?: string;
    relationship: string;
    sameAsStudentAddress?: boolean;
    address?: string;
    city?: string;
  };
}

interface EnrollmentHistoryItem {
  id: string;
  rollNumber: number;
  enrollmentDate: string;
  enrollmentStatus: string;
  sessionName?: string;
  className?: string;
  sectionName?: string;
  classTeacher?: {
    id?: string;
    firstName: string;
    lastName: string;
    employeeId: string;
  };
  remarks?: string;
}

export const StudentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<'PROFILE' | 'GUARDIANS' | 'ENROLLMENTS' | 'WIZARDS'>('PROFILE');
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [guardians, setGuardians] = useState<LinkedGuardian[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Promote Wizard State
  const [targetSessionId, setTargetSessionId] = useState('');
  const [targetClassId, setTargetClassId] = useState('');
  const [targetSectionId, setTargetSectionId] = useState('');
  const [promoteRemarks, setPromoteRemarks] = useState('');
  const [wizardSuccess, setWizardSuccess] = useState<string | null>(null);
  const [wizardError, setWizardError] = useState<string | null>(null);

  // Transfer / Withdraw State
  const [transferRemarks, setTransferRemarks] = useState('');
  const [withdrawRemarks, setWithdrawRemarks] = useState('');

  // Link Guardian Modal
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [allGuardians, setAllGuardians] = useState<Array<{ id: string; name: string; phone: string }>>([]);
  const [selectedGuardianId, setSelectedGuardianId] = useState('');
  const [linkRel, setLinkRel] = useState('Parent');
  const [isPrimary, setIsPrimary] = useState(false);

  const fetchStudentDossier = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(`/students/${id}`);
      const payload = res.data.data || res.data;
      setStudent(payload.student || null);
      setGuardians(payload.guardians || []);
      setEnrollments(payload.enrollments || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch student dossier';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentDossier();
  }, [id]);

  const handleTogglePrimaryGuardian = async (studentGuardianId: string) => {
    try {
      await apiClient.patch(`/student-guardians/${studentGuardianId}`, {
        isPrimaryGuardian: true,
      });
      fetchStudentDossier();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to set primary guardian');
    }
  };

  const handleOpenLinkModal = async () => {
    setShowLinkModal(true);
    try {
      const res = await apiClient.get('/guardians');
      setAllGuardians(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLinkGuardianSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGuardianId || !id) return;
    try {
      await apiClient.post('/student-guardians', {
        studentId: id,
        guardianId: selectedGuardianId,
        relationship: linkRel,
        isPrimaryGuardian: isPrimary,
        pickupPermission: true,
        emergencyContactPermission: true,
      });
      setShowLinkModal(false);
      fetchStudentDossier();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to link guardian');
    }
  };

  const activeEnrollment = enrollments.find((e) => e.enrollmentStatus === 'ACTIVE');

  const handlePromote = async (e: React.FormEvent) => {
    e.preventDefault();
    setWizardError(null);
    setWizardSuccess(null);
    if (!activeEnrollment) {
      setWizardError('No active enrollment found to promote.');
      return;
    }
    try {
      await apiClient.post(`/enrollments/${activeEnrollment.id}/promote`, {
        targetAcademicSessionId: targetSessionId,
        targetClassId,
        targetSectionId,
        remarks: promoteRemarks || undefined,
      });
      setWizardSuccess('Student promoted successfully!');
      fetchStudentDossier();
    } catch (err: unknown) {
      setWizardError(err instanceof Error ? err.message : 'Promotion failed');
    }
  };

  const handleTransfer = async () => {
    setWizardError(null);
    setWizardSuccess(null);
    if (!activeEnrollment) return;
    if (!confirm('Are you sure you want to transfer this student?')) return;
    try {
      await apiClient.post(`/enrollments/${activeEnrollment.id}/transfer`, {
        remarks: transferRemarks || 'Transferred out',
      });
      setWizardSuccess('Student transferred successfully!');
      fetchStudentDossier();
    } catch (err: unknown) {
      setWizardError(err instanceof Error ? err.message : 'Transfer failed');
    }
  };

  const handleWithdraw = async () => {
    setWizardError(null);
    setWizardSuccess(null);
    if (!activeEnrollment) return;
    if (!confirm('Are you sure you want to withdraw this student?')) return;
    try {
      await apiClient.post(`/enrollments/${activeEnrollment.id}/withdraw`, {
        remarks: withdrawRemarks || 'Withdrawn from school',
      });
      setWizardSuccess('Student withdrawn successfully!');
      fetchStudentDossier();
    } catch (err: unknown) {
      setWizardError(err instanceof Error ? err.message : 'Withdrawal failed');
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 text-sm">
        Loading student dossier...
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-4">
        <Link
          to="/portal/students"
          className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Directory</span>
        </Link>
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error || 'Student not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Breadcrumb & Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            to="/portal/students"
            className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-semibold uppercase tracking-wider mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Student Directory</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {student.firstName} {student.middleName ? `${student.middleName} ` : ''}
              {student.lastName}
            </h1>
            <span className="font-mono text-sm bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full font-semibold">
              {student.admissionNumber}
            </span>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                student.status === 'ACTIVE'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {student.status}
            </span>
          </div>
        </div>

        {activeEnrollment && (
          <div className="text-right">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Current Enrollment
            </p>
            <p className="text-sm font-bold text-slate-900">
              {activeEnrollment.className} - {activeEnrollment.sectionName} (Roll #{activeEnrollment.rollNumber})
            </p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex gap-6">
        <button
          onClick={() => setActiveTab('PROFILE')}
          className={`py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'PROFILE'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Demographics & Profile
        </button>
        <button
          onClick={() => setActiveTab('GUARDIANS')}
          className={`py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'GUARDIANS'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Guardians ({guardians.length})
        </button>
        <button
          onClick={() => setActiveTab('ENROLLMENTS')}
          className={`py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'ENROLLMENTS'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Enrollment History ({enrollments.length})
        </button>
        <button
          onClick={() => setActiveTab('WIZARDS')}
          className={`py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'WIZARDS'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Lifecycle Wizards
        </button>
      </div>

      {/* Tab 1: Profile */}
      {activeTab === 'PROFILE' && (
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                Demographic Information
              </h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-slate-500">Gender</p>
                  <p className="font-semibold text-slate-800">{student.gender}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Date of Birth</p>
                  <p className="font-semibold text-slate-800">
                    {new Date(student.dateOfBirth).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Phone</p>
                  <p className="font-semibold text-slate-800">{student.phone || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Address</p>
                  <p className="font-semibold text-slate-800">
                    {student.address}, {student.city}, {student.state} - {student.pinCode}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                Emergency Contacts
              </h2>
              {student.emergencyContacts.length === 0 ? (
                <p className="text-sm text-slate-500">No emergency contacts recorded.</p>
              ) : (
                <div className="space-y-3">
                  {student.emergencyContacts.map((ec, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-sm"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">{ec.name}</p>
                        <p className="text-xs text-slate-500">{ec.relationship}</p>
                      </div>
                      <span className="font-mono font-medium text-slate-700">{ec.phone}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                Documents Repository
              </h2>
              {!student.documents || student.documents.length === 0 ? (
                <p className="text-xs text-slate-500">
                  No document metadata entries uploaded yet.
                </p>
              ) : (
                <ul className="space-y-2">
                  {student.documents.map((doc) => (
                    <li
                      key={doc.id}
                      className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between"
                    >
                      <div>
                        <p className="font-bold text-slate-800">{doc.title}</p>
                        <p className="text-slate-500">{doc.documentType}</p>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(doc.uploadedAt).toLocaleDateString()}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Guardians */}
      {activeTab === 'GUARDIANS' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">
              Linked Guardians & Emergency Authorization
            </h2>
            <button
              onClick={handleOpenLinkModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Link Guardian</span>
            </button>
          </div>

          {guardians.length === 0 ? (
            <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-500 text-sm">
              No guardians linked to this student profile.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {guardians.map((rel) => {
                const g = rel.guardian;
                return (
                  <div
                    key={rel.id}
                    className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-base">
                          {g?.name || 'Unknown Guardian'}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                          {rel.relationship}
                        </span>
                      </div>
                      {rel.isPrimaryGuardian ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Primary Guardian</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => handleTogglePrimaryGuardian(rel.id)}
                          className="text-xs font-semibold text-indigo-600 hover:underline"
                        >
                          Make Primary
                        </button>
                      )}
                    </div>

                    {g?.sameAsStudentAddress && (
                      <span className="inline-block text-[11px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                        ✓ Same Address as Student
                      </span>
                    )}

                    <div className="text-xs text-slate-600 space-y-1">
                      <p>
                        <strong className="text-slate-800">Phone:</strong> {g?.phone}
                      </p>
                      {g?.email && (
                        <p>
                          <strong className="text-slate-800">Email:</strong> {g?.email}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Link Guardian Modal */}
          {showLinkModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
                <h3 className="text-base font-bold text-slate-900">
                  Link Existing Guardian to Student
                </h3>
                <form onSubmit={handleLinkGuardianSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Select Guardian *
                    </label>
                    <select
                      required
                      value={selectedGuardianId}
                      onChange={(e) => setSelectedGuardianId(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                    >
                      <option value="">-- Choose Guardian --</option>
                      {allGuardians.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name} ({g.phone})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Relationship *
                    </label>
                    <input
                      type="text"
                      required
                      value={linkRel}
                      onChange={(e) => setLinkRel(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isPrimaryCheck"
                      checked={isPrimary}
                      onChange={(e) => setIsPrimary(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded"
                    />
                    <label htmlFor="isPrimaryCheck" className="text-xs font-medium text-slate-700">
                      Set as Primary Guardian
                    </label>
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowLinkModal(false)}
                      className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
                    >
                      Link
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Enrollment History */}
      {activeTab === 'ENROLLMENTS' && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-900">
            Historical Enrollment Timeline
          </h2>
          {enrollments.length === 0 ? (
            <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-500 text-sm">
              No academic enrollments recorded for this student.
            </div>
          ) : (
            <div className="space-y-4">
              {enrollments.map((enr) => (
                <div
                  key={enr.id}
                  className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-900 text-base">
                        {enr.sessionName || 'Academic Session'}
                      </span>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                          enr.enrollmentStatus === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : enr.enrollmentStatus === 'PROMOTED'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {enr.enrollmentStatus}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-700">
                      Class: {enr.className} — Section: {enr.sectionName}
                    </p>
                    <p className="text-xs text-slate-500 font-mono">
                      Roll Number: #{enr.rollNumber} • Enrolled on{' '}
                      {new Date(enr.enrollmentDate).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Class Teacher Card via TeachingAssignment */}
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-right min-w-[200px]">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Assigned Class Teacher
                    </p>
                    {enr.classTeacher ? (
                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          {enr.classTeacher.firstName} {enr.classTeacher.lastName}
                        </p>
                        <p className="text-xs text-slate-500 font-mono">
                          ID: {enr.classTeacher.employeeId}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic">Not Assigned</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Lifecycle Wizards */}
      {activeTab === 'WIZARDS' && (
        <div className="space-y-6">
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-amber-800 text-xs flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div>
              <strong>Student Lifecycle Management:</strong> Use these wizards to execute promotion,
              transfer, or withdrawal transitions. All historical enrollment records remain immutable.
            </div>
          </div>

          {wizardSuccess && (
            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              <span>{wizardSuccess}</span>
            </div>
          )}

          {wizardError && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <span>{wizardError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-6">
            {/* Promote Wizard */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5 text-indigo-600" />
                <span>Promote Student to Next Session</span>
              </h3>
              <p className="text-xs text-slate-500">
                Creates a new `ACTIVE` enrollment and marks current as `PROMOTED`.
              </p>
              <form onSubmit={handlePromote} className="space-y-3 text-sm">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Target Academic Session ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={targetSessionId}
                    onChange={(e) => setTargetSessionId(e.target.value)}
                    placeholder="Enter Session ObjectId"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Target Class ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={targetClassId}
                    onChange={(e) => setTargetClassId(e.target.value)}
                    placeholder="Enter Class ObjectId"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Target Section ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={targetSectionId}
                    onChange={(e) => setTargetSectionId(e.target.value)}
                    placeholder="Enter Section ObjectId"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Promotion Remarks
                  </label>
                  <input
                    type="text"
                    value={promoteRemarks}
                    onChange={(e) => setPromoteRemarks(e.target.value)}
                    placeholder="e.g. Annual exam passed"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!activeEnrollment}
                  className="w-full py-2 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs transition-colors disabled:opacity-50"
                >
                  Execute Promotion
                </button>
              </form>
            </div>

            {/* Transfer & Withdraw Wizards */}
            <div className="space-y-6">
              {/* Transfer */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <LogOut className="w-5 h-5 text-amber-600" />
                  <span>Transfer Student Out (TC)</span>
                </h3>
                <input
                  type="text"
                  value={transferRemarks}
                  onChange={(e) => setTransferRemarks(e.target.value)}
                  placeholder="Transfer remarks / TC #..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
                <button
                  onClick={handleTransfer}
                  disabled={!activeEnrollment}
                  className="w-full py-2 px-4 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs transition-colors disabled:opacity-50"
                >
                  Mark as Transferred
                </button>
              </div>

              {/* Withdraw */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Archive className="w-5 h-5 text-red-600" />
                  <span>Withdraw Student</span>
                </h3>
                <input
                  type="text"
                  value={withdrawRemarks}
                  onChange={(e) => setWithdrawRemarks(e.target.value)}
                  placeholder="Withdrawal remarks / reason..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
                <button
                  onClick={handleWithdraw}
                  disabled={!activeEnrollment}
                  className="w-full py-2 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium text-xs transition-colors disabled:opacity-50"
                >
                  Mark as Withdrawn
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
