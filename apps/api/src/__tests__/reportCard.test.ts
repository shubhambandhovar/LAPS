import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../app';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { hashPassword } from '../utils/crypto';
import { User } from '../models/User';
import { Role } from '../models/Role';
import { AcademicSession } from '../models/AcademicSession';
import { AcademicTerm } from '../models/AcademicTerm';
import { Class } from '../models/Class';
import { Section } from '../models/Section';
import { Subject } from '../models/Subject';
import { ClassSubject } from '../models/ClassSubject';
import { Teacher } from '../models/Teacher';
import { TeachingAssignment } from '../models/TeachingAssignment';
import { Student } from '../models/Student';
import { Enrollment } from '../models/Enrollment';
import { Exam } from '../models/Exam';
import { Result } from '../models/Result';
import { Attendance } from '../models/Attendance';
import { AttendanceEntry } from '../models/AttendanceEntry';
import { ReportCard } from '../models/ReportCard';
import { ReportCardVersion } from '../models/ReportCardVersion';
import { PromotionDecision } from '../models/PromotionDecision';

let mongoServer: MongoMemoryServer;
let app: ReturnType<typeof createApp>;
let adminToken: string;
let teacherToken: string;
let unassignedTeacherToken: string;
let studentToken: string;
let student2Token: string;

let academicSessionId: string;
let academicTermId: string;
let classId: string;
let sectionId: string;
let subjectId: string;
let classSubjectId: string;
let enrollmentId: string;
let enrollment2Id: string;
let examId: string;

let createdTemplateId: string;
let createdReportCardId: string;
let createdPromotionId: string;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await connectDatabase(uri);
  app = createApp();

  const passwordHash = await hashPassword('Test@1234!');

  // 1. Roles
  const adminRole = await Role.create({
    schoolId: 'LAPS-GOHAD',
    code: 'SCHOOL_ADMIN',
    name: 'School Admin',
    description: 'Admin access',
    isSystem: true,
  });

  const teacherRole = await Role.create({
    schoolId: 'LAPS-GOHAD',
    code: 'TEACHER',
    name: 'Teacher Role',
    description: 'Teacher access',
    isSystem: true,
  });

  const studentRole = await Role.create({
    schoolId: 'LAPS-GOHAD',
    code: 'STUDENT',
    name: 'Student Role',
    description: 'Student access',
    isSystem: true,
  });

  // 2. Users & Auth Tokens
  const adminUser = await User.create({
    schoolId: 'LAPS-GOHAD',
    identifier: 'admin_rc@laps.local',
    email: 'admin_rc@laps.local',
    passwordHash,
    roleId: adminRole._id,
    roleCode: 'SCHOOL_ADMIN',
    userType: 'SCHOOL_ADMIN',
    status: 'ACTIVE',
  });

  const teacherProfileDoc = await Teacher.create({
    employeeId: 'EMP-RC-01',
    firstName: 'Ravi',
    lastName: 'Sharma',
    email: 'teacher_rc@laps.local',
    phone: '9876543210',
    joiningDate: new Date('2024-01-01'),
    qualification: 'M.Sc',
    designation: 'PGT',
    status: 'ACTIVE',
    createdBy: adminUser._id,
    updatedBy: adminUser._id,
  });

  const teacherUser = await User.create({
    schoolId: 'LAPS-GOHAD',
    identifier: 'teacher_rc@laps.local',
    email: 'teacher_rc@laps.local',
    passwordHash,
    roleId: teacherRole._id,
    roleCode: 'TEACHER',
    userType: 'TEACHER',
    status: 'ACTIVE',
    profileRef: teacherProfileDoc._id,
  });
  teacherProfileDoc.userId = teacherUser._id;
  await teacherProfileDoc.save();

  const unassignedTeacherProfile = await Teacher.create({
    employeeId: 'EMP-RC-02',
    firstName: 'Amit',
    lastName: 'Verma',
    email: 'unassigned_rc@laps.local',
    phone: '9876543211',
    joiningDate: new Date('2024-01-01'),
    qualification: 'M.Sc',
    designation: 'PGT',
    status: 'ACTIVE',
    createdBy: adminUser._id,
    updatedBy: adminUser._id,
  });

  await User.create({
    schoolId: 'LAPS-GOHAD',
    identifier: 'unassigned_rc@laps.local',
    email: 'unassigned_rc@laps.local',
    passwordHash,
    roleId: teacherRole._id,
    roleCode: 'TEACHER',
    userType: 'TEACHER',
    status: 'ACTIVE',
    profileRef: unassignedTeacherProfile._id,
  });

  const studentProfileDoc = await Student.create({
    admissionNumber: 'ADM-RC-001',
    firstName: 'Aarav',
    lastName: 'Patel',
    gender: 'MALE',
    dateOfBirth: '2011-05-15',
    address: '123 Main St',
    city: 'Gohad',
    state: 'MP',
    pinCode: '477116',
    status: 'ACTIVE',
    createdBy: adminUser._id,
    updatedBy: adminUser._id,
  });

  await User.create({
    schoolId: 'LAPS-GOHAD',
    identifier: 'student_rc1@laps.local',
    email: 'student_rc1@laps.local',
    passwordHash,
    roleId: studentRole._id,
    roleCode: 'STUDENT',
    userType: 'STUDENT',
    status: 'ACTIVE',
    profileRef: studentProfileDoc._id,
  });

  const student2ProfileDoc = await Student.create({
    admissionNumber: 'ADM-RC-002',
    firstName: 'Diya',
    lastName: 'Mehta',
    gender: 'FEMALE',
    dateOfBirth: '2011-08-20',
    address: '124 Main St',
    city: 'Gohad',
    state: 'MP',
    pinCode: '477116',
    status: 'ACTIVE',
    createdBy: adminUser._id,
    updatedBy: adminUser._id,
  });

  await User.create({
    schoolId: 'LAPS-GOHAD',
    identifier: 'student_rc2@laps.local',
    email: 'student_rc2@laps.local',
    passwordHash,
    roleId: studentRole._id,
    roleCode: 'STUDENT',
    userType: 'STUDENT',
    status: 'ACTIVE',
    profileRef: student2ProfileDoc._id,
  });

  // Login tokens
  const adminRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ identifier: 'admin_rc@laps.local', password: 'Test@1234!' });
  adminToken = adminRes.body.data.accessToken;

  const teacherRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ identifier: 'teacher_rc@laps.local', password: 'Test@1234!' });
  teacherToken = teacherRes.body.data.accessToken;

  const unassignedRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ identifier: 'unassigned_rc@laps.local', password: 'Test@1234!' });
  unassignedTeacherToken = unassignedRes.body.data.accessToken;

  const studentRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ identifier: 'student_rc1@laps.local', password: 'Test@1234!' });
  studentToken = studentRes.body.data.accessToken;

  const student2Res = await request(app)
    .post('/api/v1/auth/login')
    .send({ identifier: 'student_rc2@laps.local', password: 'Test@1234!' });
  student2Token = student2Res.body.data.accessToken;

  // 3. Academic Structure
  const sessionDoc = await AcademicSession.create({
    schoolId: 'LAPS-GOHAD',
    code: 'SESS-2026-RC',
    name: '2026-2027 RC Session',
    startDate: new Date('2026-04-01'),
    endDate: new Date('2027-03-31'),
    status: 'ACTIVE',
    createdBy: adminUser._id,
    updatedBy: adminUser._id,
  });
  academicSessionId = sessionDoc._id.toString();

  const termDoc = await AcademicTerm.create({
    schoolId: 'LAPS-GOHAD',
    code: 'TERM-1-2026-RC',
    academicSessionId,
    name: 'Term 1',
    orderSequence: 1,
    startDate: new Date('2026-04-01'),
    endDate: new Date('2026-09-30'),
    status: 'ACTIVE',
    createdBy: adminUser._id,
    updatedBy: adminUser._id,
  });
  academicTermId = termDoc._id.toString();

  const classDoc = await Class.create({
    name: 'Class 10 RC',
    code: 'CLS10_RC',
    orderSequence: 10,
    displayOrder: 10,
    level: 'SECONDARY',
    academicSessionId,
    createdBy: adminUser._id,
    updatedBy: adminUser._id,
  });
  classId = classDoc._id.toString();

  await Class.create({
    name: 'Class 11 RC',
    code: 'CLS11_RC',
    orderSequence: 11,
    displayOrder: 11,
    level: 'SECONDARY',
    academicSessionId,
    createdBy: adminUser._id,
    updatedBy: adminUser._id,
  });

  const sectionDoc = await Section.create({
    classId,
    name: 'Section A RC',
    code: 'SEC-10A-RC',
    roomNumber: '101',
    capacity: 40,
    academicSessionId,
    createdBy: adminUser._id,
    updatedBy: adminUser._id,
  });
  sectionId = sectionDoc._id.toString();

  const subjectDoc = await Subject.create({
    name: 'Mathematics',
    code: 'MATH101_RC',
    shortName: 'MATH',
    department: 'Science',
    subjectType: 'THEORY',
    status: 'ACTIVE',
    isActive: true,
    createdBy: adminUser._id,
    updatedBy: adminUser._id,
  });
  subjectId = subjectDoc._id.toString();

  const classSubDoc = await ClassSubject.create({
    classId,
    subjectId,
    academicSessionId,
    credits: 4,
    isOptional: false,
    status: 'ACTIVE',
    createdBy: adminUser._id,
    updatedBy: adminUser._id,
  });
  classSubjectId = classSubDoc._id.toString();

  // 4. Teaching Assignment
  const taDoc = await TeachingAssignment.create({
    teacherId: teacherProfileDoc._id,
    academicSessionId,
    classId,
    sectionId,
    subjectId,
    classSubjectId,
    effectiveFrom: new Date('2026-04-01'),
    workloadWeight: 1,
    isPrimary: true,
    isClassTeacher: true,
    status: 'ACTIVE',
    createdBy: adminUser._id,
    updatedBy: adminUser._id,
  });

  // 5. Enrollments
  const enrollmentDoc = await Enrollment.create({
    admissionNumber: 'ADM-RC-001',
    studentId: studentProfileDoc._id,
    academicSessionId,
    classId,
    sectionId,
    rollNumber: '101',
    enrollmentDate: new Date('2026-04-01'),
    enrollmentStatus: 'ACTIVE',
    createdBy: adminUser._id,
    updatedBy: adminUser._id,
  });
  enrollmentId = enrollmentDoc._id.toString();

  const enrollment2Doc = await Enrollment.create({
    admissionNumber: 'ADM-RC-002',
    studentId: student2ProfileDoc._id,
    academicSessionId,
    classId,
    sectionId,
    rollNumber: '102',
    enrollmentDate: new Date('2026-04-01'),
    enrollmentStatus: 'ACTIVE',
    createdBy: adminUser._id,
    updatedBy: adminUser._id,
  });
  enrollment2Id = enrollment2Doc._id.toString();

  // 6. Exam & Result Records
  const examDoc = await Exam.create({
    name: 'Mid-Term Exam 2026 RC',
    academicSessionId,
    academicTermId,
    examType: 'MID_TERM',
    status: 'PUBLISHED',
    createdBy: adminUser._id,
    updatedBy: adminUser._id,
  });
  examId = examDoc._id.toString();

  // Result Student 1 (Pass)
  await Result.create({
    examId: examDoc._id,
    academicSessionId,
    academicTermId,
    enrollmentId: enrollmentDoc._id,
    studentId: studentProfileDoc._id,
    classId,
    sectionId,
    subjectResults: [
      {
        classSubjectId: classSubDoc._id,
        subjectId: subjectDoc._id,
        subjectName: 'Mathematics',
        subjectCode: 'MATH101_RC',
        marksEntryId: examDoc._id, // placeholder ID
        totalMarksObtained: 85,
        maximumMarks: 100,
        passingMarks: 33,
        percentage: 85,
        grade: 'A',
        gradePoint: 9.0,
        isPassed: true,
        isAbsent: false,
        isExempt: false,
        graceMarks: 0,
      },
    ],
    overallTotalObtained: 85,
    overallMaximumMarks: 100,
    overallPercentage: 85,
    overallGrade: 'A',
    overallGradePoint: 9.0,
    rankInClass: 1,
    rankInSection: 1,
    resultStatus: 'PASS',
    graceRulesApplied: [],
    status: 'PUBLISHED',
    createdBy: adminUser._id,
    updatedBy: adminUser._id,
  });

  // Result Student 2 (Fail/Detained)
  await Result.create({
    examId: examDoc._id,
    academicSessionId,
    academicTermId,
    enrollmentId: enrollment2Doc._id,
    studentId: student2ProfileDoc._id,
    classId,
    sectionId,
    subjectResults: [
      {
        classSubjectId: classSubDoc._id,
        subjectId: subjectDoc._id,
        subjectName: 'Mathematics',
        subjectCode: 'MATH101_RC',
        marksEntryId: examDoc._id,
        totalMarksObtained: 20,
        maximumMarks: 100,
        passingMarks: 33,
        percentage: 20,
        grade: 'E',
        gradePoint: 2.0,
        isPassed: false,
        isAbsent: false,
        isExempt: false,
        graceMarks: 0,
      },
    ],
    overallTotalObtained: 20,
    overallMaximumMarks: 100,
    overallPercentage: 20,
    overallGrade: 'E',
    overallGradePoint: 2.0,
    rankInClass: 2,
    rankInSection: 2,
    resultStatus: 'FAIL',
    graceRulesApplied: [],
    status: 'PUBLISHED',
    createdBy: adminUser._id,
    updatedBy: adminUser._id,
  });

  // 7. Attendance Records
  const attSession = await Attendance.create({
    academicSessionId,
    classId,
    sectionId,
    attendanceType: 'DAILY',
    date: '2026-08-01',
    teachingAssignmentId: taDoc._id,
    sessionStatus: 'SUBMITTED',
    markedByUserId: teacherUser._id,
    markedAt: new Date(),
    isLocked: false,
    isFrozen: false,
    status: 'ACTIVE',
    createdBy: teacherUser._id,
    updatedBy: teacherUser._id,
  });

  await AttendanceEntry.create({
    attendanceId: attSession._id,
    academicSessionId,
    enrollmentId: enrollmentDoc._id,
    studentId: studentProfileDoc._id,
    classId,
    sectionId,
    studentName: 'Aarav Patel',
    className: 'Class 10 RC',
    sectionName: 'Section A RC',
    date: '2026-08-01',
    attendanceStatus: 'PRESENT',
    attendanceSource: 'MANUAL',
    statusHistory: [],
    status: 'ACTIVE',
    createdBy: teacherUser._id,
    updatedBy: teacherUser._id,
  });

  await AttendanceEntry.create({
    attendanceId: attSession._id,
    academicSessionId,
    enrollmentId: enrollment2Doc._id,
    studentId: student2ProfileDoc._id,
    classId,
    sectionId,
    studentName: 'Diya Mehta',
    className: 'Class 10 RC',
    sectionName: 'Section A RC',
    date: '2026-08-01',
    attendanceStatus: 'ABSENT',
    attendanceSource: 'MANUAL',
    statusHistory: [],
    status: 'ACTIVE',
    createdBy: teacherUser._id,
    updatedBy: teacherUser._id,
  });
});

afterAll(async () => {
  await disconnectDatabase();
  await mongoServer.stop();
});

describe('Phase 9 — Report Cards, Academic Transcripts & Promotion Management', () => {
  it('TEST-RC-001: Create Report Card Template', async () => {
    const res = await request(app)
      .post('/api/v1/report-card-templates')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Standard Term Template',
        description: 'Default layout for terminal examinations',
        academicSessionId,
        isDefault: true,
        branding: {
          schoolLogoUrl: 'https://laps.edu/logo.png',
          headerText: 'Little Angels School — Term Report',
          footerText: 'Page 1 of 1',
        },
        signatures: {
          showPrincipalSignature: true,
          principalTitle: 'Principal Signature',
          showClassTeacherSignature: true,
          classTeacherTitle: 'Class Teacher Signature',
        },
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Standard Term Template');
    expect(res.body.data.status).toBe('ACTIVE');
    createdTemplateId = res.body.data._id;
  });

  it('TEST-RC-002: Template Validation (Duplicate Name check)', async () => {
    const res = await request(app)
      .post('/api/v1/report-card-templates')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Standard Term Template',
        academicSessionId,
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.errorCode).toBe('DUPLICATE_RESOURCE');
  });

  it('TEST-RC-003: Generate Student Report Card in DRAFT status without duplication', async () => {
    const res = await request(app)
      .post('/api/v1/report-cards/generate')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        academicSessionId,
        academicTermId,
        examId,
        classId,
        templateId: createdTemplateId,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(2);

    const firstRC = res.body.data.find((rc: any) => rc.enrollmentId === enrollmentId);
    expect(firstRC).toBeDefined();
    expect(firstRC.status).toBe('DRAFT');
    expect(firstRC.versionNumber).toBe(1);
    createdReportCardId = firstRC._id;

    // Asserts that attendance session is now FROZEN due to report card generation
    const att = await Attendance.findOne({ academicSessionId, classId });
    expect(att?.isFrozen).toBe(true);
    expect(att?.sessionStatus).toBe('FROZEN');
  });

  it('TEST-RC-004: Report Card Data Accuracy (Subject marks, rank, attendance summary)', async () => {
    const res = await request(app)
      .get(`/api/v1/report-cards/${createdReportCardId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const rc = res.body.data;
    expect(rc.subjectResults[0].subjectName).toBe('Mathematics');
    expect(rc.subjectResults[0].percentage).toBe(85);
    expect(rc.subjectResults[0].grade).toBe('A');
    expect(rc.meritRanking.rankInClass).toBe(1);
    expect(rc.meritRanking.overallPercentage).toBe(85);
    expect(rc.attendanceSummary.workingDays).toBe(1);
    expect(rc.attendanceSummary.presentDays).toBe(1);
    expect(rc.attendanceSummary.attendancePercentage).toBe(100);
  });

  it('TEST-RC-005: Report Card Versioning on regeneration', async () => {
    const res = await request(app)
      .post('/api/v1/report-cards/generate')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        academicSessionId,
        academicTermId,
        examId,
        classId,
        changeReason: 'Updated Mathematics internal marks after re-evaluation',
      });

    expect(res.status).toBe(200);
    const firstRC = res.body.data.find((rc: any) => rc.enrollmentId === enrollmentId);
    expect(firstRC.versionNumber).toBe(2);
    expect(firstRC.versionHistory.length).toBe(2);
    expect(firstRC.versionHistory[1].changeReason).toBe('Updated Mathematics internal marks after re-evaluation');

    // Asserts historical snapshot in ReportCardVersion Collection #44
    const versionSnap = await ReportCardVersion.findOne({
      reportCardId: createdReportCardId,
      versionNumber: 1,
    });
    expect(versionSnap).not.toBeNull();
    expect(versionSnap?.versionNumber).toBe(1);
  });

  it('TEST-RC-006: Teacher enters remarks on DRAFT report card', async () => {
    const res = await request(app)
      .patch(`/api/v1/report-cards/${createdReportCardId}/remarks`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        classTeacherRemarks: 'Outstanding performance in Mathematics!',
        principalRemarks: 'Well done, keep it up.',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.remarks.classTeacherRemarks).toBe('Outstanding performance in Mathematics!');
    expect(res.body.data.remarks.principalRemarks).toBe('Well done, keep it up.');
  });

  it('TEST-RC-007: Bulk Publish Report Cards', async () => {
    const res = await request(app)
      .patch('/api/v1/report-cards/publish')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        reportCardIds: [createdReportCardId],
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.publishedCount).toBe(1);

    const rc = await ReportCard.findById(createdReportCardId);
    expect(rc?.status).toBe('PUBLISHED');
  });

  it('TEST-RC-008: Student Report Card Retrieval (/api/v1/report-cards/my)', async () => {
    const res = await request(app)
      .get('/api/v1/report-cards/my')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0]._id).toBe(createdReportCardId);
  });

  it('TEST-RC-009: Student RBAC Isolation (Cannot access another student report card)', async () => {
    const res = await request(app)
      .get('/api/v1/report-cards/my')
      .set('Authorization', `Bearer ${student2Token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // student 2's report card has not been published yet
    expect(res.body.data.length).toBe(0);
  });

  it('TEST-RC-010: Evaluate Promotion Decisions', async () => {
    const res = await request(app)
      .post('/api/v1/promotions/evaluate')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        academicSessionId,
        academicTermId,
        classId,
        minPassPercentage: 33,
        minAttendancePercentage: 75,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(2);

    const promo1 = res.body.data.find((p: any) => p.enrollmentId === enrollmentId);
    const promo2 = res.body.data.find((p: any) => p.enrollmentId === enrollment2Id);

    expect(promo1.promotionStatus).toBe('PROMOTED');
    expect(promo2.promotionStatus).toBe('DETAINED'); // Student 2 has 20% marks (<33%) and 0% attendance
    createdPromotionId = promo1._id;
  });

  it('TEST-RC-011: Approve Promotion Decisions', async () => {
    const res = await request(app)
      .patch('/api/v1/promotions/approve')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        promotionIds: [createdPromotionId],
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.approvedCount).toBe(1);

    const promo = await PromotionDecision.findById(createdPromotionId);
    expect(promo?.status).toBe('APPROVED');
  });

  it('TEST-RC-012: Teacher Class Scoping (Cannot query unassigned class report cards or promotions)', async () => {
    const resRC = await request(app)
      .get(`/api/v1/report-cards?classId=${classId}`)
      .set('Authorization', `Bearer ${unassignedTeacherToken}`);

    expect(resRC.status).toBe(403);
    expect(resRC.body.errorCode).toBe('RBAC_PERMISSION_DENIED');

    const resPromo = await request(app)
      .get(`/api/v1/promotions?classId=${classId}`)
      .set('Authorization', `Bearer ${unassignedTeacherToken}`);

    expect(resPromo.status).toBe(403);
    expect(resPromo.body.errorCode).toBe('RBAC_PERMISSION_DENIED');
  });

  it('TEST-RC-013: Download Printable PDF payload/URL', async () => {
    const res = await request(app)
      .get(`/api/v1/report-cards/${createdReportCardId}/download?version=1`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.pdfUrl).toBeDefined();
    expect(res.body.data.versionNumber).toBe(1);
  });

  it('TEST-RC-014: Soft-Archive Report Card & Template', async () => {
    const resRC = await request(app)
      .patch(`/api/v1/report-cards/${createdReportCardId}/archive`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(resRC.status).toBe(200);
    expect(resRC.body.data.status).toBe('ARCHIVED');

    const resTpl = await request(app)
      .patch(`/api/v1/report-card-templates/${createdTemplateId}/archive`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(resTpl.status).toBe(200);
    expect(resTpl.body.data.status).toBe('ARCHIVED');

    // Asserts exclusion from active queries
    const resList = await request(app)
      .get('/api/v1/report-card-templates')
      .set('Authorization', `Bearer ${adminToken}`);

    const archivedFound = resList.body.data.some((t: any) => t._id === createdTemplateId);
    expect(archivedFound).toBe(false);
  });
});
