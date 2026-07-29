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
import { Holiday } from '../models/Holiday';
import { AcademicCalendarEvent } from '../models/AcademicCalendarEvent';
import { Attendance } from '../models/Attendance';
import { AttendanceEntry } from '../models/AttendanceEntry';
import { LeaveRequest } from '../models/LeaveRequest';
import { AttendanceCorrection } from '../models/AttendanceCorrection';

let mongoServer: MongoMemoryServer;
let app: ReturnType<typeof createApp>;
let superAdminToken: string;
let teacherToken: string;
let superAdminUserId: string;
let teacherUserId: string;
let teacherId: string;
let studentId: string;
let enrollmentId: string;
let academicSessionId: string;
let classId: string;
let sectionId: string;
let teachingAssignmentId: string;
let timetablePeriodId: string;
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
  await Holiday.deleteMany({});
  await AcademicCalendarEvent.deleteMany({});
  await Attendance.deleteMany({});
  await AttendanceEntry.deleteMany({});
  await LeaveRequest.deleteMany({});
  await AttendanceCorrection.deleteMany({});

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

  const resAdminLogin = await request(app)
    .post('/api/v1/auth/login')
    .send({ identifier: 'admin@school.edu', password: 'Password123!' });
  superAdminToken = resAdminLogin.body.data.accessToken;

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
    classId: cls._id,
    academicSessionId: session._id,
    name: 'Section A',
    code: 'SEC-10A',
    maxCapacity: 40,
    status: 'ACTIVE',
    createdBy: superAdmin._id,
    updatedBy: superAdmin._id,
  });
  sectionId = String(sec._id);

  const sub = await Subject.create({
    name: 'Mathematics',
    code: 'MATH-101',
    shortName: 'MATH',
    subjectType: 'THEORY',
    status: 'ACTIVE',
    createdBy: superAdmin._id,
    updatedBy: superAdmin._id,
  });

  const teacherDoc = await Teacher.create({
    firstName: 'John',
    lastName: 'Doe',
    employeeId: 'EMP-001',
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
  teacherUserId = String(teacherUser._id);
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

  const enrollmentDoc = await Enrollment.create({
    studentId: studentDoc._id,
    academicSessionId: session._id,
    classId: cls._id,
    sectionId: sec._id,
    rollNumber: '101',
    enrollmentDate: '2026-04-01',
    status: 'ACTIVE',
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
  timetablePeriodId = String(periodDoc._id);

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

describe('Phase 6 Attendance & Leave Management Test Suite', () => {
  it('TEST-ATTENDANCE-001: Teacher Daily Attendance Marking', async () => {
    const payload = {
      academicSessionId,
      classId,
      sectionId,
      attendanceType: 'DAILY',
      date: '2026-08-03', // Monday
      teachingAssignmentId,
      entries: [
        {
          enrollmentId,
          studentId,
          studentName: 'Alice Smith',
          rollNumber: '101',
          className: 'Class X',
          sectionName: 'Section A',
          attendanceStatus: 'PRESENT',
          attendanceSource: 'MANUAL',
          lateMinutes: 0,
        },
      ],
    };

    const res = await request(app)
      .post('/api/v1/attendance')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.session.sessionStatus).toBe('DRAFT');
    expect(res.body.data.entries[0].attendanceStatus).toBe('PRESENT');
  });

  it('TEST-ATTENDANCE-002: Teacher Period Attendance Marking', async () => {
    const payload = {
      academicSessionId,
      classId,
      sectionId,
      attendanceType: 'PERIOD',
      date: '2026-08-03', // Monday
      timetablePeriodId,
      teachingAssignmentId,
      entries: [
        {
          enrollmentId,
          studentId,
          studentName: 'Alice Smith',
          rollNumber: '101',
          className: 'Class X',
          sectionName: 'Section A',
          attendanceStatus: 'LATE',
          attendanceSource: 'MANUAL',
          lateMinutes: 10,
          remarks: 'Bus delayed',
        },
      ],
    };

    const res = await request(app)
      .post('/api/v1/attendance')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.session.timetablePeriodId).toBe(timetablePeriodId);
    expect(res.body.data.entries[0].attendanceStatus).toBe('LATE');
    expect(res.body.data.entries[0].lateMinutes).toBe(10);
  });

  it('TEST-ATTENDANCE-003: Unpublished Timetable Attendance Block', async () => {
    // Modify timetable to DRAFT
    await Timetable.findByIdAndUpdate(publishedTimetableId, { status: 'DRAFT' });

    const payload = {
      academicSessionId,
      classId,
      sectionId,
      attendanceType: 'PERIOD',
      date: '2026-08-03', // Monday
      timetablePeriodId,
      teachingAssignmentId,
      entries: [
        {
          enrollmentId,
          studentId,
          studentName: 'Alice Smith',
          rollNumber: '101',
          className: 'Class X',
          sectionName: 'Section A',
          attendanceStatus: 'PRESENT',
          attendanceSource: 'MANUAL',
        },
      ],
    };

    const res = await request(app)
      .post('/api/v1/attendance')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send(payload);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('unpublished or archived');
  });

  it('TEST-ATTENDANCE-004: Attendance Submission and Lockdown', async () => {
    const session = await Attendance.create({
      academicSessionId,
      classId,
      sectionId,
      attendanceType: 'DAILY',
      date: '2026-08-04',
      teachingAssignmentId,
      sessionStatus: 'DRAFT',
      markedByUserId: teacherUserId,
      markedAt: new Date(),
      isLocked: false,
      isFrozen: false,
      status: 'ACTIVE',
      createdBy: teacherUserId,
      updatedBy: teacherUserId,
    });

    const resSubmit = await request(app)
      .post(`/api/v1/attendance/${session._id}/submit`)
      .set('Authorization', `Bearer ${teacherToken}`);
    expect(resSubmit.status).toBe(200);
    expect(resSubmit.body.data.sessionStatus).toBe('SUBMITTED');

    const resLock = await request(app)
      .patch(`/api/v1/attendance/${session._id}/lock`)
      .set('Authorization', `Bearer ${superAdminToken}`);
    expect(resLock.status).toBe(200);
    expect(resLock.body.data.sessionStatus).toBe('LOCKED');
    expect(resLock.body.data.isLocked).toBe(true);
  });

  it('TEST-ATTENDANCE-005: Holiday Attendance Block', async () => {
    await Holiday.create({
      academicSessionId,
      title: 'Independence Day',
      holidayType: 'NATIONAL',
      startDate: '2026-08-15',
      endDate: '2026-08-15',
      isOptionalHoliday: false,
      affectsAttendance: true,
      status: 'ACTIVE',
      createdBy: superAdminUserId,
      updatedBy: superAdminUserId,
    });

    const payload = {
      academicSessionId,
      classId,
      sectionId,
      attendanceType: 'DAILY',
      date: '2026-08-15',
      teachingAssignmentId,
      entries: [
        {
          enrollmentId,
          studentId,
          studentName: 'Alice Smith',
          rollNumber: '101',
          className: 'Class X',
          sectionName: 'Section A',
          attendanceStatus: 'PRESENT',
          attendanceSource: 'MANUAL',
        },
      ],
    };

    const res = await request(app)
      .post('/api/v1/attendance')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send(payload);

    expect(res.status).toBe(409);
    expect(res.body.message).toContain('Cannot mark attendance on an official holiday');
  });

  it('TEST-ATTENDANCE-006: Emergency Closure Attendance Block', async () => {
    await AcademicCalendarEvent.create({
      academicSessionId,
      title: 'Heavy Rainfall Alert',
      eventType: 'EMERGENCY_CLOSURE',
      startDate: '2026-08-20',
      endDate: '2026-08-20',
      isWorkingDay: false,
      isRecurring: false,
      appliesToAllClasses: true,
      status: 'ACTIVE',
      createdBy: superAdminUserId,
      updatedBy: superAdminUserId,
    });

    const payload = {
      academicSessionId,
      classId,
      sectionId,
      attendanceType: 'DAILY',
      date: '2026-08-20',
      teachingAssignmentId,
      entries: [
        {
          enrollmentId,
          studentId,
          studentName: 'Alice Smith',
          rollNumber: '101',
          className: 'Class X',
          sectionName: 'Section A',
          attendanceStatus: 'PRESENT',
          attendanceSource: 'MANUAL',
        },
      ],
    };

    const res = await request(app)
      .post('/api/v1/attendance')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send(payload);

    expect(res.status).toBe(409);
    expect(res.body.message).toContain('School is closed due to emergency closure');
  });

  it('TEST-ATTENDANCE-007: Student Leave Application Submission', async () => {
    const payload = {
      academicSessionId,
      applicantType: 'STUDENT',
      studentId,
      enrollmentId,
      leaveType: 'MEDICAL',
      startDate: '2026-08-10',
      endDate: '2026-08-12',
      reason: 'Fever and cold',
    };

    const res = await request(app)
      .post('/api/v1/leaves')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.data.totalDays).toBe(3);
    expect(res.body.data.leaveStatus).toBe('PENDING');
  });

  it('TEST-ATTENDANCE-008: Student Leave Approval & Attendance Linkage', async () => {
    const leave = await LeaveRequest.create({
      academicSessionId,
      applicantType: 'STUDENT',
      studentId,
      enrollmentId,
      leaveType: 'MEDICAL',
      startDate: '2026-08-11',
      endDate: '2026-08-11',
      totalDays: 1,
      reason: 'Doctor prescribed rest',
      leaveStatus: 'PENDING',
      status: 'ACTIVE',
      createdBy: superAdminUserId,
      updatedBy: superAdminUserId,
    });

    const res = await request(app)
      .patch(`/api/v1/leaves/${leave._id}/review`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ leaveStatus: 'APPROVED', reviewerRemarks: 'Approved' });

    expect(res.status).toBe(200);
    expect(res.body.data.leaveStatus).toBe('APPROVED');

    // Verify linkage created or ready
    const entry = await AttendanceEntry.findOne({
      academicSessionId,
      studentId,
      date: '2026-08-11',
    });
    expect(entry).toBeDefined();
    expect(entry?.attendanceSource).toBe('LEAVE');
    expect(entry?.attendanceStatus).toBe('MEDICAL_LEAVE');
  });

  it('TEST-ATTENDANCE-009: Teacher Leave Application & Admin Approval', async () => {
    const payload = {
      academicSessionId,
      applicantType: 'TEACHER',
      teacherId,
      leaveType: 'CASUAL',
      startDate: '2026-08-25',
      endDate: '2026-08-25',
      reason: 'Personal work',
    };

    const resCreate = await request(app)
      .post('/api/v1/leaves')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send(payload);

    expect(resCreate.status).toBe(201);
    const leaveId = resCreate.body.data._id;

    // Teacher cannot approve teacher leave
    const resTeacherReview = await request(app)
      .patch(`/api/v1/leaves/${leaveId}/review`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ leaveStatus: 'APPROVED' });
    expect(resTeacherReview.status).toBe(403);

    // Admin approve
    const resAdminReview = await request(app)
      .patch(`/api/v1/leaves/${leaveId}/review`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ leaveStatus: 'APPROVED', reviewerRemarks: 'OK' });
    expect(resAdminReview.status).toBe(200);
    expect(resAdminReview.body.data.leaveStatus).toBe('APPROVED');
  });

  it('TEST-ATTENDANCE-010: Attendance Correction Workflow', async () => {
    const session = await Attendance.create({
      academicSessionId,
      classId,
      sectionId,
      attendanceType: 'DAILY',
      date: '2026-08-05',
      teachingAssignmentId,
      sessionStatus: 'LOCKED',
      markedByUserId: teacherUserId,
      markedAt: new Date(),
      isLocked: true,
      isFrozen: false,
      status: 'ACTIVE',
      createdBy: teacherUserId,
      updatedBy: teacherUserId,
    });

    const entry = await AttendanceEntry.create({
      attendanceId: session._id,
      academicSessionId,
      enrollmentId,
      studentId,
      classId,
      sectionId,
      studentName: 'Alice Smith',
      rollNumber: '101',
      className: 'Class X',
      sectionName: 'Section A',
      date: '2026-08-05',
      attendanceStatus: 'ABSENT',
      attendanceSource: 'MANUAL',
      lateMinutes: 0,
      statusHistory: [],
      status: 'ACTIVE',
      createdBy: teacherUserId,
      updatedBy: teacherUserId,
    });

    const resCorrection = await request(app)
      .post('/api/v1/attendance/corrections')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        academicSessionId,
        attendanceId: session._id,
        attendanceEntryId: entry._id,
        studentId,
        newStatus: 'PRESENT',
        reason: 'Student was present in library',
      });

    expect(resCorrection.status).toBe(201);
    const correctionId = resCorrection.body.data._id;

    const resReview = await request(app)
      .patch(`/api/v1/attendance/corrections/${correctionId}/review`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ correctionStatus: 'APPROVED', reviewerRemarks: 'Verified' });

    expect(resReview.status).toBe(200);
    expect(resReview.body.data.correctionStatus).toBe('APPROVED');

    const updatedEntry = await AttendanceEntry.findById(entry._id);
    expect(updatedEntry?.attendanceStatus).toBe('PRESENT');
    expect(updatedEntry?.statusHistory.length).toBe(1);
    expect(updatedEntry?.statusHistory[0].reason).toContain('Approved correction');
  });

  it('TEST-ATTENDANCE-011: Attendance Register Matrix Generation', async () => {
    await AttendanceEntry.create({
      attendanceId: '64d2f0a1e4b0000000000001',
      academicSessionId,
      enrollmentId,
      studentId,
      classId,
      sectionId,
      studentName: 'Alice Smith',
      rollNumber: '101',
      className: 'Class X',
      sectionName: 'Section A',
      date: '2026-08-01',
      attendanceStatus: 'PRESENT',
      attendanceSource: 'MANUAL',
      lateMinutes: 0,
      statusHistory: [],
      status: 'ACTIVE',
      createdBy: teacherUserId,
      updatedBy: teacherUserId,
    });

    const res = await request(app)
      .get('/api/v1/attendance/register')
      .set('Authorization', `Bearer ${teacherToken}`)
      .query({
        academicSessionId,
        startDate: '2026-08-01',
        endDate: '2026-08-31',
        frequency: 'MONTHLY',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.rows.length).toBeGreaterThan(0);
    expect(res.body.data.rows[0].summary.totalDays).toBe(1);
    expect(res.body.data.rows[0].summary.present).toBe(1);
    expect(res.body.data.rows[0].summary.percentage).toBe(100);
  });

  it('TEST-ATTENDANCE-012: Attendance Analytics Summary & Defaulters', async () => {
    // Create 4 records: 2 present, 2 absent = 50% (< 75% defaulter)
    const dates = ['2026-08-01', '2026-08-02', '2026-08-03', '2026-08-04'];
    const statuses = ['PRESENT', 'PRESENT', 'ABSENT', 'ABSENT'];

    for (let i = 0; i < dates.length; i++) {
      await AttendanceEntry.create({
        attendanceId: '64d2f0a1e4b000000000000' + i,
        academicSessionId,
        enrollmentId,
        studentId,
        classId,
        sectionId,
        studentName: 'Alice Smith',
        rollNumber: '101',
        className: 'Class X',
        sectionName: 'Section A',
        date: dates[i],
        attendanceStatus: statuses[i],
        attendanceSource: 'MANUAL',
        lateMinutes: 0,
        statusHistory: [],
        status: 'ACTIVE',
        createdBy: teacherUserId,
        updatedBy: teacherUserId,
      });
    }

    const res = await request(app)
      .get('/api/v1/attendance/analytics/summary')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .query({ academicSessionId });

    expect(res.status).toBe(200);
    expect(res.body.data.totalStudents).toBe(1);
    expect(res.body.data.averageAttendancePercentage).toBe(50);
    expect(res.body.data.defaultersCount).toBe(1);
    expect(res.body.data.defaulters[0].studentName).toBe('Alice Smith');
  });

  it('TEST-ATTENDANCE-013: Attendance Session Freeze on Report Card', async () => {
    const session = await Attendance.create({
      academicSessionId,
      classId,
      sectionId,
      attendanceType: 'DAILY',
      date: '2026-08-06',
      teachingAssignmentId,
      sessionStatus: 'LOCKED',
      markedByUserId: teacherUserId,
      markedAt: new Date(),
      isLocked: true,
      isFrozen: false,
      status: 'ACTIVE',
      createdBy: teacherUserId,
      updatedBy: teacherUserId,
    });

    const resFreeze = await request(app)
      .patch(`/api/v1/attendance/${session._id}/freeze`)
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(resFreeze.status).toBe(200);
    expect(resFreeze.body.data.sessionStatus).toBe('FROZEN');
    expect(resFreeze.body.data.isFrozen).toBe(true);

    // Teacher cannot update frozen session
    const resUpdate = await request(app)
      .post('/api/v1/attendance')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        academicSessionId,
        classId,
        sectionId,
        attendanceType: 'DAILY',
        date: '2026-08-06',
        teachingAssignmentId,
        entries: [
          {
            enrollmentId,
            studentId,
            studentName: 'Alice Smith',
            rollNumber: '101',
            className: 'Class X',
            sectionName: 'Section A',
            attendanceStatus: 'PRESENT',
            attendanceSource: 'MANUAL',
            lateMinutes: 0,
          },
        ],
      });

    expect(resUpdate.status).toBe(403);
    expect(resUpdate.body.message).toContain('frozen due to report card generation');
  });

  it('TEST-ATTENDANCE-014: Admin Reopen of Frozen Attendance', async () => {
    const session = await Attendance.create({
      academicSessionId,
      classId,
      sectionId,
      attendanceType: 'DAILY',
      date: '2026-08-07',
      teachingAssignmentId,
      sessionStatus: 'FROZEN',
      markedByUserId: teacherUserId,
      markedAt: new Date(),
      isLocked: true,
      isFrozen: true,
      freezeReason: 'Term 1 report card',
      status: 'ACTIVE',
      createdBy: teacherUserId,
      updatedBy: teacherUserId,
    });

    // Without mandatory reason should fail
    const resNoReason = await request(app)
      .patch(`/api/v1/attendance/${session._id}/reopen`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({});
    expect(resNoReason.status).toBe(400);

    // With mandatory reason should succeed
    const resReopen = await request(app)
      .patch(`/api/v1/attendance/${session._id}/reopen`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ reason: 'Correction needed before board submission' });

    expect(resReopen.status).toBe(200);
    expect(resReopen.body.data.isFrozen).toBe(false);
    expect(resReopen.body.data.sessionStatus).toBe('LOCKED');
    expect(resReopen.body.data.freezeReason).toContain('Reopened by Admin');
  });
});
