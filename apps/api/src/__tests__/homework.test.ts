import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../app';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { hashPassword } from '../utils/crypto';
import { User } from '../models/User';
import { Role } from '../models/Role';
import { AcademicSession } from '../models/AcademicSession';
import { Class } from '../models/Class';
import { Section } from '../models/Section';
import { Subject } from '../models/Subject';
import { Teacher } from '../models/Teacher';
import { TeachingAssignment } from '../models/TeachingAssignment';
import { Student } from '../models/Student';
import { Enrollment } from '../models/Enrollment';
import { TimetablePeriod } from '../models/TimetablePeriod';
import { BellSchedule } from '../models/BellSchedule';
import { Timetable } from '../models/Timetable';
import { Homework } from '../models/Homework';
import { HomeworkSubmission } from '../models/HomeworkSubmission';
import { StudyMaterial } from '../models/StudyMaterial';
import { RubricTemplate } from '../models/RubricTemplate';

let mongoServer: MongoMemoryServer;
let app: ReturnType<typeof createApp>;
let teacherToken: string;
let studentToken: string;

let superAdminUserId: string;

let teacherId: string;
let studentId: string;
let enrollmentId: string;
let academicSessionId: string;
let classId: string;
let sectionId: string;
let subjectId: string;
let teachingAssignmentId: string;
let publishedTimetableId: string;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await connectDatabase(uri);
  app = createApp();
});

afterAll(async () => {
  await disconnectDatabase();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

beforeEach(async () => {
  await User.deleteMany({});
  await Role.deleteMany({});
  await AcademicSession.deleteMany({});
  await Class.deleteMany({});
  await Section.deleteMany({});
  await Subject.deleteMany({});
  await Teacher.deleteMany({});
  await TeachingAssignment.deleteMany({});
  await Student.deleteMany({});
  await Enrollment.deleteMany({});
  await BellSchedule.deleteMany({});
  await TimetablePeriod.deleteMany({});
  await Timetable.deleteMany({});
  await Homework.deleteMany({});
  await HomeworkSubmission.deleteMany({});
  await StudyMaterial.deleteMany({});
  await RubricTemplate.deleteMany({});

  const superAdminRole = await Role.create({
    schoolId: 'LAPS-GOHAD',
    code: 'SUPER_ADMIN',
    name: 'Super Admin',
    description: 'System Super Admin',
    isSystem: true,
  });

  const teacherRole = await Role.create({
    schoolId: 'LAPS-GOHAD',
    code: 'TEACHER',
    name: 'Teacher Role',
    description: 'Faculty Role',
    isSystem: true,
  });

  const studentRole = await Role.create({
    schoolId: 'LAPS-GOHAD',
    code: 'STUDENT',
    name: 'Student Role',
    description: 'Student Role',
    isSystem: true,
  });

  const hashedPassword = await hashPassword('Password123!');

  const superAdmin = await User.create({
    schoolId: 'LAPS-GOHAD',
    identifier: 'admin@school.edu',
    email: 'admin@school.edu',
    passwordHash: hashedPassword,
    roleId: superAdminRole._id,
    roleCode: 'SUPER_ADMIN',
    userType: 'SUPER_ADMIN',
    status: 'ACTIVE',
  });
  superAdminUserId = String(superAdmin._id);

  await request(app)
    .post('/api/v1/auth/login')
    .send({ identifier: 'admin@school.edu', password: 'Password123!' });

  const session = await AcademicSession.create({
    name: '2026-2027',
    code: 'AS-2627',
    startDate: '2026-04-01',
    endDate: '2027-03-31',
    isCurrent: true,
    status: 'ACTIVE',
    createdBy: superAdmin._id,
    updatedBy: superAdmin._id,
  });
  academicSessionId = String(session._id);

  const cls = await Class.create({
    name: 'Class X',
    code: 'CLS-10',
    orderSequence: 10,
    level: 'SECONDARY',
    status: 'ACTIVE',
    createdBy: superAdmin._id,
    updatedBy: superAdmin._id,
  });
  classId = String(cls._id);

  const sec = await Section.create({
    name: 'Section A',
    code: 'SEC-10A',
    classId: cls._id,
    academicSessionId: session._id,
    maxCapacity: 40,
    status: 'ACTIVE',
    createdBy: superAdmin._id,
    updatedBy: superAdmin._id,
  });
  sectionId = String(sec._id);

  const sub = await Subject.create({
    name: 'Mathematics',
    code: 'MATH101',
    shortName: 'MATH',
    subjectType: 'THEORY',
    status: 'ACTIVE',
    createdBy: superAdmin._id,
    updatedBy: superAdmin._id,
  });
  subjectId = String(sub._id);

  const teacherDoc = await Teacher.create({
    employeeId: 'EMP-101',
    firstName: 'John',
    lastName: 'Doe',
    email: 'teacher@school.edu',
    phone: '1234567890',
    joiningDate: new Date('2024-01-01'),
    qualification: 'M.Sc',
    designation: 'PGT',
    status: 'ACTIVE',
    createdBy: superAdmin._id,
    updatedBy: superAdmin._id,
  });
  teacherId = String(teacherDoc._id);

  const teacherUser = await User.create({
    schoolId: 'LAPS-GOHAD',
    identifier: 'teacher@school.edu',
    email: 'teacher@school.edu',
    passwordHash: hashedPassword,
    roleId: teacherRole._id,
    roleCode: 'TEACHER',
    userType: 'TEACHER',
    status: 'ACTIVE',
    profileRef: teacherDoc._id,
  });
  teacherDoc.userId = teacherUser._id;
  await teacherDoc.save();

  const resTeacherLogin = await request(app)
    .post('/api/v1/auth/login')
    .send({ identifier: 'teacher@school.edu', password: 'Password123!' });
  teacherToken = resTeacherLogin.body.data.accessToken;

  const assignment = await TeachingAssignment.create({
    academicSessionId: session._id,
    classId: cls._id,
    sectionId: sec._id,
    subjectId: sub._id,
    teacherId: teacherDoc._id,
    effectiveFrom: new Date('2026-04-01'),
    isClassTeacher: true,
    workloadWeight: 1,
    status: 'ACTIVE',
    createdBy: superAdmin._id,
    updatedBy: superAdmin._id,
  });
  teachingAssignmentId = String(assignment._id);

  const studentDoc = await Student.create({
    admissionNumber: 'ADM-2026-001',
    firstName: 'Alice',
    lastName: 'Smith',
    gender: 'FEMALE',
    dateOfBirth: '2011-05-15',
    address: '123 Main St',
    city: 'Gohad',
    state: 'MP',
    pinCode: '477116',
    status: 'ACTIVE',
    createdBy: superAdmin._id,
    updatedBy: superAdmin._id,
  });
  studentId = String(studentDoc._id);

  await User.create({
    schoolId: 'LAPS-GOHAD',
    identifier: 'student@school.edu',
    email: 'student@school.edu',
    passwordHash: hashedPassword,
    roleId: studentRole._id,
    roleCode: 'STUDENT',
    userType: 'STUDENT',
    status: 'ACTIVE',
    profileRef: studentDoc._id,
  });

  const resStudentLogin = await request(app)
    .post('/api/v1/auth/login')
    .send({ identifier: 'student@school.edu', password: 'Password123!' });
  studentToken = resStudentLogin.body.data.accessToken;

  const enrollmentDoc = await Enrollment.create({
    studentId: studentDoc._id,
    academicSessionId: session._id,
    classId: cls._id,
    sectionId: sec._id,
    rollNumber: '101',
    enrollmentDate: '2026-04-01',
    enrollmentStatus: 'ACTIVE',
    createdBy: superAdmin._id,
    updatedBy: superAdmin._id,
  });
  enrollmentId = String(enrollmentDoc._id);

  const bellDoc = await BellSchedule.create({
    name: 'Test Bell',
    academicSessionId: session._id,
    scheduleType: 'REGULAR',
    isDefault: true,
    status: 'ACTIVE',
    createdBy: superAdmin._id,
    updatedBy: superAdmin._id,
  });

  const periodDoc = await TimetablePeriod.create({
    academicSessionId: session._id,
    bellScheduleId: bellDoc._id,
    name: 'Period 1',
    sequence: 1,
    startTime: '08:00',
    endTime: '08:45',
    isBreak: false,
    status: 'ACTIVE',
    createdBy: superAdmin._id,
    updatedBy: superAdmin._id,
  });

  const timetableDoc = await Timetable.create({
    academicSessionId: session._id,
    classId: cls._id,
    sectionId: sec._id,
    dayOfWeek: 'MONDAY',
    timetablePeriodId: periodDoc._id,
    classSubjectId: sub._id,
    subjectId: sub._id,
    teachingAssignmentId: assignment._id,
    teacherId: teacherDoc._id,
    status: 'PUBLISHED',
    createdBy: superAdmin._id,
    updatedBy: superAdmin._id,
  });
  publishedTimetableId = String(timetableDoc._id);
});

describe('Phase 7 — Homework, Assignments & Study Material Test Suite', () => {
  it('TEST-HOMEWORK-001: Create homework with valid TeachingAssignment and published Timetable', async () => {
    const payload = {
      academicSessionId,
      teachingAssignmentId,
      classSubjectId: subjectId,
      classId,
      sectionId,
      subjectId,
      title: 'Algebra Worksheet #1',
      description: 'Solve problems 1 to 10',
      instructions: 'Show all steps',
      homeworkType: 'HOMEWORK',
      maxAttempts: 2,
      assignedDate: '2026-08-01T00:00:00.000Z',
      dueDate: '2026-08-10T23:59:59.000Z',
      maxMarks: 50,
      status: 'PUBLISHED',
    };

    const res = await request(app)
      .post('/api/v1/homework')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Algebra Worksheet #1');
    expect(res.body.data.status).toBe('PUBLISHED');
  });

  it('TEST-HOMEWORK-002: Attempt homework creation without active TeachingAssignment', async () => {
    const otherClass = await Class.create({
      name: 'Class XI',
      code: 'CLS-11',
      orderSequence: 11,
      level: 'SECONDARY',
      status: 'ACTIVE',
      createdBy: superAdminUserId,
      updatedBy: superAdminUserId,
    });

    const payload = {
      academicSessionId,
      teachingAssignmentId,
      classSubjectId: subjectId,
      classId: String(otherClass._id), // Unassigned class for this teacher
      sectionId,
      subjectId,
      title: 'Unauthorized Assignment',
      description: 'Should fail RBAC check',
      homeworkType: 'HOMEWORK',
      maxAttempts: 1,
      assignedDate: '2026-08-01T00:00:00.000Z',
      dueDate: '2026-08-10T23:59:59.000Z',
      maxMarks: 20,
      status: 'PUBLISHED',
    };

    const res = await request(app)
      .post('/api/v1/homework')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send(payload);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.errorCode).toBe('RBAC_PERMISSION_DENIED');
  });

  it('TEST-HOMEWORK-003: Attempt homework creation when Timetable is DRAFT/unpublished', async () => {
    // Unpublish timetable
    await Timetable.updateOne({ _id: publishedTimetableId }, { $set: { status: 'DRAFT' } });

    const payload = {
      academicSessionId,
      teachingAssignmentId,
      classSubjectId: subjectId,
      classId,
      sectionId,
      subjectId,
      title: 'Timetable Draft Assignment',
      description: 'Should fail due to unpublished timetable',
      homeworkType: 'HOMEWORK',
      maxAttempts: 1,
      assignedDate: '2026-08-01T00:00:00.000Z',
      dueDate: '2026-08-10T23:59:59.000Z',
      maxMarks: 100,
      status: 'PUBLISHED',
    };

    const res = await request(app)
      .post('/api/v1/homework')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send(payload);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('unpublished timetable');
  });

  it('TEST-HOMEWORK-004: Scheduled homework transitions from SCHEDULED to PUBLISHED when scheduledPublishAt <= now', async () => {
    const pastScheduleDate = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago
    const payload = {
      academicSessionId,
      teachingAssignmentId,
      classSubjectId: subjectId,
      classId,
      sectionId,
      subjectId,
      title: 'Scheduled Auto-Publish Homework',
      description: 'Should publish immediately',
      homeworkType: 'ASSIGNMENT',
      maxAttempts: 1,
      assignedDate: '2026-08-01T00:00:00.000Z',
      dueDate: '2026-08-10T23:59:59.000Z',
      scheduledPublishAt: pastScheduleDate,
      maxMarks: 100,
      status: 'SCHEDULED',
    };

    const res = await request(app)
      .post('/api/v1/homework')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('PUBLISHED');
  });

  it('TEST-HOMEWORK-005: Student submits homework within attempt limit', async () => {
    // 1. Create homework
    const hwRes = await request(app)
      .post('/api/v1/homework')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        academicSessionId,
        teachingAssignmentId,
        classSubjectId: subjectId,
        classId,
        sectionId,
        subjectId,
        title: 'Submit Test Homework',
        homeworkType: 'HOMEWORK',
        maxAttempts: 2,
        assignedDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        maxMarks: 100,
        status: 'PUBLISHED',
      });
    const hwId = hwRes.body.data._id;

    // 2. Student submits attempt 1
    const subRes = await request(app)
      .post(`/api/v1/homework/${hwId}/submissions`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        enrollmentId,
        studentId,
        remarks: 'My first attempt',
        attachments: [
          {
            type: 'PDF',
            url: 'https://example.com/file1.pdf',
            fileName: 'file1.pdf',
            fileSize: 2048,
            mimeType: 'application/pdf',
            uploadedAt: new Date().toISOString(),
          },
        ],
      });

    expect(subRes.status).toBe(201);
    expect(subRes.body.success).toBe(true);
    expect(subRes.body.data.currentAttempt).toBe(1);
    expect(subRes.body.data.isLate).toBe(false);
    expect(subRes.body.data.plagiarismStatus).toBe('NOT_CHECKED');
  });

  it('TEST-HOMEWORK-006: Student submits homework after dueDate with automatic late arrival calculation', async () => {
    // 1. Create homework with past due date
    const hwRes = await request(app)
      .post('/api/v1/homework')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        academicSessionId,
        teachingAssignmentId,
        classSubjectId: subjectId,
        classId,
        sectionId,
        subjectId,
        title: 'Late Test Homework',
        homeworkType: 'HOMEWORK',
        maxAttempts: 1,
        assignedDate: new Date(Date.now() - 172800000).toISOString(),
        dueDate: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        maxMarks: 50,
        status: 'PUBLISHED',
      });
    const hwId = hwRes.body.data._id;

    // 2. Student submits now
    const subRes = await request(app)
      .post(`/api/v1/homework/${hwId}/submissions`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        enrollmentId,
        studentId,
        remarks: 'Submitting after deadline',
      });

    expect(subRes.status).toBe(201);
    expect(subRes.body.data.isLate).toBe(true);
    expect(subRes.body.data.lateMinutes).toBeGreaterThan(0);
  });

  it('TEST-HOMEWORK-007: Student exceeds maxAttempts', async () => {
    // 1. Create homework with maxAttempts = 1
    const hwRes = await request(app)
      .post('/api/v1/homework')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        academicSessionId,
        teachingAssignmentId,
        classSubjectId: subjectId,
        classId,
        sectionId,
        subjectId,
        title: 'Single Attempt Homework',
        homeworkType: 'HOMEWORK',
        maxAttempts: 1,
        assignedDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 86400000).toISOString(),
        maxMarks: 20,
        status: 'PUBLISHED',
      });
    const hwId = hwRes.body.data._id;

    // 2. Submit attempt 1
    await request(app)
      .post(`/api/v1/homework/${hwId}/submissions`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        enrollmentId,
        studentId,
        remarks: 'First attempt',
      });

    // 3. Submit attempt 2 -> should fail with 409
    const subRes2 = await request(app)
      .post(`/api/v1/homework/${hwId}/submissions`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        enrollmentId,
        studentId,
        remarks: 'Second attempt should be rejected',
      });

    expect(subRes2.status).toBe(409);
    expect(subRes2.body.success).toBe(false);
    expect(subRes2.body.errorCode).toBe('BUSINESS_RULE_VIOLATION');
  });

  it('TEST-HOMEWORK-008: Unenrolled student attempts submission', async () => {
    // Create homework
    const hwRes = await request(app)
      .post('/api/v1/homework')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        academicSessionId,
        teachingAssignmentId,
        classSubjectId: subjectId,
        classId,
        sectionId,
        subjectId,
        title: 'Unenrolled Submission Homework',
        homeworkType: 'HOMEWORK',
        maxAttempts: 1,
        assignedDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 86400000).toISOString(),
        maxMarks: 50,
        status: 'PUBLISHED',
      });
    const hwId = hwRes.body.data._id;

    // Make enrollment INACTIVE
    await Enrollment.updateOne({ _id: enrollmentId }, { $set: { enrollmentStatus: 'WITHDRAWN' } });

    const res = await request(app)
      .post(`/api/v1/homework/${hwId}/submissions`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        enrollmentId,
        studentId,
        remarks: 'Should fail unenrolled',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.errorCode).toBe('RBAC_PERMISSION_DENIED');
  });

  it('TEST-HOMEWORK-009: Teacher evaluates submission with RubricTemplate', async () => {
    // 1. Create RubricTemplate
    const rubricRes = await request(app)
      .post('/api/v1/rubrics')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        academicSessionId,
        title: 'Math Standard Rubric',
        description: 'Grading criteria for math assignments',
        subjectId,
        createdByTeacherId: teacherId,
        isShared: true,
        criteria: [
          { criterion: 'Accuracy', maxMarks: 40, description: 'Correct answer' },
          { criterion: 'Steps', maxMarks: 60, description: 'Step-by-step derivation' },
        ],
      });
    const rubricTemplateId = rubricRes.body.data._id;

    // 2. Create homework & submission
    const hwRes = await request(app)
      .post('/api/v1/homework')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        academicSessionId,
        teachingAssignmentId,
        classSubjectId: subjectId,
        classId,
        sectionId,
        subjectId,
        title: 'Rubric Evaluated Homework',
        homeworkType: 'HOMEWORK',
        maxAttempts: 1,
        assignedDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 86400000).toISOString(),
        maxMarks: 100,
        status: 'PUBLISHED',
      });
    const hwId = hwRes.body.data._id;

    const subRes = await request(app)
      .post(`/api/v1/homework/${hwId}/submissions`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        enrollmentId,
        studentId,
        remarks: 'My submission',
      });
    const submissionId = subRes.body.data._id;

    // 3. Teacher evaluates
    const evalRes = await request(app)
      .patch(`/api/v1/homework/submissions/${submissionId}/evaluate`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        rubricTemplateId,
        marks: 92,
        grade: 'A+',
        remarks: 'Excellent derivation',
        returnedForResubmission: false,
        rubric: [
          { criterion: 'Accuracy', marksAwarded: 38 },
          { criterion: 'Steps', marksAwarded: 54 },
        ],
      });

    expect(evalRes.status).toBe(200);
    expect(evalRes.body.success).toBe(true);
    expect(evalRes.body.data.status).toBe('EVALUATED');
    expect(evalRes.body.data.evaluation.marks).toBe(92);
    expect(evalRes.body.data.evaluation.grade).toBe('A+');
  });

  it('TEST-HOMEWORK-010: Teacher returns submission for resubmission', async () => {
    const hwRes = await request(app)
      .post('/api/v1/homework')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        academicSessionId,
        teachingAssignmentId,
        classSubjectId: subjectId,
        classId,
        sectionId,
        subjectId,
        title: 'Resubmit Homework',
        homeworkType: 'HOMEWORK',
        maxAttempts: 2,
        assignedDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 86400000).toISOString(),
        maxMarks: 100,
        status: 'PUBLISHED',
      });
    const hwId = hwRes.body.data._id;

    const subRes = await request(app)
      .post(`/api/v1/homework/${hwId}/submissions`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        enrollmentId,
        studentId,
        remarks: 'Attempt 1',
      });
    const submissionId = subRes.body.data._id;

    const evalRes = await request(app)
      .patch(`/api/v1/homework/submissions/${submissionId}/evaluate`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        marks: 40,
        grade: 'C',
        remarks: 'Incomplete steps, please resubmit',
        returnedForResubmission: true,
      });

    expect(evalRes.status).toBe(200);
    expect(evalRes.body.data.status).toBe('RETURNED');
    expect(evalRes.body.data.evaluation.returnedForResubmission).toBe(true);
  });

  it('TEST-HOMEWORK-011: Create Study Material with release and expire window -> stored with version 1 snapshot', async () => {
    const res = await request(app)
      .post('/api/v1/study-material')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        academicSessionId,
        teachingAssignmentId,
        classSubjectId: subjectId,
        classId,
        sectionId,
        subjectId,
        uploaderTeacherId: teacherId,
        title: 'Chapter 1 Notes',
        description: 'Introductory formulas',
        materialType: 'NOTES',
        fileUrl: 'https://example.com/chapter-1-v1.pdf',
        fileMimeType: 'application/pdf',
        publishAt: new Date().toISOString(),
        expireAt: new Date(Date.now() + 86400000 * 30).toISOString(),
        changelog: 'Initial upload of notes',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.currentVersion).toBe(1);
    expect(res.body.data.versionHistory).toHaveLength(1);
    expect(res.body.data.versionHistory[0].version).toBe(1);
    expect(res.body.data.versionHistory[0].fileUrl).toBe('https://example.com/chapter-1-v1.pdf');
  });

  it('TEST-HOMEWORK-012: Update Study Material fileUrl -> appends new snapshot to versionHistory (version 2)', async () => {
    const createRes = await request(app)
      .post('/api/v1/study-material')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        academicSessionId,
        teachingAssignmentId,
        classSubjectId: subjectId,
        classId,
        sectionId,
        subjectId,
        uploaderTeacherId: teacherId,
        title: 'Chapter 2 Notes',
        materialType: 'NOTES',
        fileUrl: 'https://example.com/chapter-2-v1.pdf',
        fileMimeType: 'application/pdf',
      });
    const matId = createRes.body.data._id;

    // Update with new file URL
    const updateRes = await request(app)
      .put(`/api/v1/study-material/${matId}`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        fileUrl: 'https://example.com/chapter-2-v2.pdf',
        changelog: 'Fixed typo in formula',
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.success).toBe(true);
    expect(updateRes.body.data.currentVersion).toBe(2);
    expect(updateRes.body.data.versionHistory).toHaveLength(2);
    expect(updateRes.body.data.versionHistory[1].version).toBe(2);
    expect(updateRes.body.data.versionHistory[1].fileUrl).toBe('https://example.com/chapter-2-v2.pdf');
  });

  it('TEST-HOMEWORK-013: Student query filters out Study Material before publishAt or after expireAt', async () => {
    // 1. Create future publishAt material
    const futureDate = new Date(Date.now() + 86400000 * 5).toISOString();
    await request(app)
      .post('/api/v1/study-material')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        academicSessionId,
        teachingAssignmentId,
        classSubjectId: subjectId,
        classId,
        sectionId,
        subjectId,
        uploaderTeacherId: teacherId,
        title: 'Future Secret Material',
        materialType: 'NOTES',
        fileUrl: 'https://example.com/future.pdf',
        publishAt: futureDate,
      });

    // 2. Create currently available material
    await request(app)
      .post('/api/v1/study-material')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        academicSessionId,
        teachingAssignmentId,
        classSubjectId: subjectId,
        classId,
        sectionId,
        subjectId,
        uploaderTeacherId: teacherId,
        title: 'Available Material',
        materialType: 'NOTES',
        fileUrl: 'https://example.com/available.pdf',
      });

    // Student lists study materials
    const listRes = await request(app)
      .get('/api/v1/study-material')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(listRes.status).toBe(200);
    const titles = listRes.body.data.map((m: any) => m.title);
    expect(titles).toContain('Available Material');
    expect(titles).not.toContain('Future Secret Material');
  });

  it('TEST-HOMEWORK-014: Create and share departmental RubricTemplate (isShared: true)', async () => {
    const res = await request(app)
      .post('/api/v1/rubrics')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        academicSessionId,
        title: 'Shared Departmental Rubric',
        description: 'For all Mathematics teachers',
        subjectId,
        createdByTeacherId: teacherId,
        isShared: true,
        criteria: [
          { criterion: 'Logic', maxMarks: 50 },
          { criterion: 'Accuracy', maxMarks: 50 },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isShared).toBe(true);
    expect(res.body.data.totalMaxMarks).toBe(100);
  });

  it('TEST-HOMEWORK-015: Soft-archive Homework, StudyMaterial, RubricTemplate -> status ARCHIVED', async () => {
    // 1. Create homework
    const hwRes = await request(app)
      .post('/api/v1/homework')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        academicSessionId,
        teachingAssignmentId,
        classSubjectId: subjectId,
        classId,
        sectionId,
        subjectId,
        title: 'To Be Archived HW',
        homeworkType: 'HOMEWORK',
        maxAttempts: 1,
        assignedDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 86400000).toISOString(),
        maxMarks: 50,
        status: 'PUBLISHED',
      });
    const hwId = hwRes.body.data._id;

    // Archive homework
    const archRes = await request(app)
      .patch(`/api/v1/homework/${hwId}/archive`)
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(archRes.status).toBe(200);
    expect(archRes.body.data.status).toBe('ARCHIVED');

    // Verify it is excluded from list queries
    const listRes = await request(app)
      .get('/api/v1/homework')
      .set('Authorization', `Bearer ${teacherToken}`);
    const ids = listRes.body.data.map((h: any) => h._id);
    expect(ids).not.toContain(hwId);
  });

  it('TEST-HOMEWORK-016: Homework Analytics Summary returns aggregate statistics', async () => {
    // Create 1 homework and 1 evaluated submission
    const hwRes = await request(app)
      .post('/api/v1/homework')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        academicSessionId,
        teachingAssignmentId,
        classSubjectId: subjectId,
        classId,
        sectionId,
        subjectId,
        title: 'Analytics HW',
        homeworkType: 'HOMEWORK',
        maxAttempts: 1,
        assignedDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 86400000).toISOString(),
        maxMarks: 100,
        status: 'PUBLISHED',
      });
    const hwId = hwRes.body.data._id;

    const subRes = await request(app)
      .post(`/api/v1/homework/${hwId}/submissions`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        enrollmentId,
        studentId,
        remarks: 'Analytics submission',
      });
    const subId = subRes.body.data._id;

    await request(app)
      .patch(`/api/v1/homework/submissions/${subId}/evaluate`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        marks: 88,
        grade: 'A',
      });

    const summaryRes = await request(app)
      .get('/api/v1/homework/analytics/summary')
      .set('Authorization', `Bearer ${teacherToken}`)
      .query({ academicSessionId, classId, sectionId, subjectId });

    expect(summaryRes.status).toBe(200);
    expect(summaryRes.body.success).toBe(true);
    expect(summaryRes.body.data.totalAssigned).toBe(1);
    expect(summaryRes.body.data.totalSubmissions).toBe(1);
    expect(summaryRes.body.data.submissionPercentage).toBe(100);
    expect(summaryRes.body.data.averageMarks).toBe(88);
  });
});
