import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../app';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { hashPassword } from '../utils/crypto';
import { User } from '../models/User';
import { Role } from '../models/Role';
import { Holiday } from '../models/Holiday';
import { SchoolEvent } from '../models/SchoolEvent';
import { CalendarEvent } from '../models/CalendarEvent';
import { EventReminder } from '../models/EventReminder';
import { AcademicCalendarSummary } from '../models/AcademicCalendarSummary';
import { AcademicSession } from '../models/AcademicSession';
import { Class } from '../models/Class';
import { Section } from '../models/Section';
import { Teacher } from '../models/Teacher';
import { TeachingAssignment } from '../models/TeachingAssignment';
import { Student } from '../models/Student';
import { Enrollment } from '../models/Enrollment';

let mongoServer: MongoMemoryServer;
let app: ReturnType<typeof createApp>;

let adminToken: string;
let teacherToken: string;
let studentToken: string;

let academicSessionId: string;
let classId1: string;
let classId2: string;
let sectionId1: string;
let sectionId2: string;
let createdEventId: string;
let studentProfileId: string;
let teachingAssignmentId: string;
let enrollmentId: string;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await connectDatabase(uri);
  app = createApp();

  const passwordHash = await hashPassword('Test@1234!');

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

  // Admin User
  const adminUser = await User.create({
    schoolId: 'LAPS-GOHAD',
    identifier: 'admin_cal@laps.local',
    email: 'admin_cal@laps.local',
    passwordHash,
    roleId: adminRole._id,
    roleCode: 'SCHOOL_ADMIN',
    userType: 'SCHOOL_ADMIN',
    status: 'ACTIVE',
  });

  const adminLogin = await request(app)
    .post('/api/v1/auth/login')
    .send({ identifier: 'admin_cal@laps.local', password: 'Test@1234!' });
  adminToken = adminLogin.body.data.accessToken;

  // Teacher User & Profile
  const teacherUser = await User.create({
    schoolId: 'LAPS-GOHAD',
    identifier: 'teacher_cal@laps.local',
    email: 'teacher_cal@laps.local',
    passwordHash,
    roleId: teacherRole._id,
    roleCode: 'TEACHER',
    userType: 'TEACHER',
    status: 'ACTIVE',
  });

  const teacherProfile = await Teacher.create({
    employeeId: 'EMP-CAL-01',
    firstName: 'Arjun',
    lastName: 'Sharma',
    email: 'teacher_cal@laps.local',
    phone: '9876543210',
    joiningDate: new Date('2024-01-01'),
    qualification: 'M.Sc',
    designation: 'PGT',
    status: 'ACTIVE',
    userId: teacherUser._id,
    createdBy: adminUser._id,
    updatedBy: adminUser._id,
  });

  const teacherLogin = await request(app)
    .post('/api/v1/auth/login')
    .send({ identifier: 'teacher_cal@laps.local', password: 'Test@1234!' });
  teacherToken = teacherLogin.body.data.accessToken;

  // Student User & Profile
  const studentUser = await User.create({
    schoolId: 'LAPS-GOHAD',
    identifier: 'student_cal@laps.local',
    email: 'student_cal@laps.local',
    passwordHash,
    roleId: studentRole._id,
    roleCode: 'STUDENT',
    userType: 'STUDENT',
    status: 'ACTIVE',
  });

  const studentProfile = await Student.create({
    admissionNumber: 'ADM-CAL-001',
    firstName: 'Rohan',
    lastName: 'Verma',
    dateOfBirth: new Date('2012-05-15'),
    gender: 'MALE',
    address: '123 Main St, Gohad',
    pinCode: '477116',
    status: 'ACTIVE',
    userId: studentUser._id,
    schoolId: 'LAPS-GOHAD',
    createdBy: adminUser._id,
    updatedBy: adminUser._id,
  });
  studentProfileId = studentProfile._id.toString();
  studentUser.profileRef = studentProfile._id;
  await studentUser.save();

  const studentLogin = await request(app)
    .post('/api/v1/auth/login')
    .send({ identifier: 'student_cal@laps.local', password: 'Test@1234!' });
  studentToken = studentLogin.body.data.accessToken;

  // Academic Session, Classes, Sections
  const session = await AcademicSession.create({
    schoolId: 'LAPS-GOHAD',
    name: '2026-2027',
    startDate: new Date('2026-04-01'),
    endDate: new Date('2027-03-31'),
    isCurrent: true,
    createdBy: adminUser._id,
    updatedBy: adminUser._id,
  });
  academicSessionId = session._id.toString();

  const cls1 = await Class.create({
    schoolId: 'LAPS-GOHAD',
    name: 'Class 10',
    code: 'CLS10',
    orderSequence: 10,
    level: 'SECONDARY',
    createdBy: adminUser._id,
    updatedBy: adminUser._id,
  });
  classId1 = cls1._id.toString();

  const cls2 = await Class.create({
    schoolId: 'LAPS-GOHAD',
    name: 'Class 9',
    code: 'CLS9',
    orderSequence: 9,
    level: 'SECONDARY',
    createdBy: adminUser._id,
    updatedBy: adminUser._id,
  });
  classId2 = cls2._id.toString();

  const sec1 = await Section.create({
    schoolId: 'LAPS-GOHAD',
    academicSessionId: session._id,
    classId: cls1._id,
    name: 'A',
    capacity: 40,
    createdBy: adminUser._id,
    updatedBy: adminUser._id,
  });
  sectionId1 = sec1._id.toString();

  const sec2 = await Section.create({
    schoolId: 'LAPS-GOHAD',
    academicSessionId: session._id,
    classId: cls2._id,
    name: 'A',
    capacity: 40,
    createdBy: adminUser._id,
    updatedBy: adminUser._id,
  });
  sectionId2 = sec2._id.toString();

  // Active Teaching Assignment for Teacher in Class 10 - Sec A
  const assignment = await TeachingAssignment.create({
    schoolId: 'LAPS-GOHAD',
    academicSessionId: session._id,
    teacherId: teacherProfile._id,
    classId: cls1._id,
    sectionId: sec1._id,
    subjectId: cls1._id, // placeholder ID
    effectiveFrom: new Date('2026-04-01'),
    status: 'ACTIVE',
    createdBy: adminUser._id,
    updatedBy: adminUser._id,
  });
  teachingAssignmentId = assignment._id.toString();

  // Student Enrollment in Class 10 - Sec A
  const enrollment = await Enrollment.create({
    studentId: studentProfile._id,
    academicSessionId: session._id,
    classId: cls1._id,
    sectionId: sec1._id,
    rollNumber: 1,
    status: 'ACTIVE',
    enrolledAt: new Date(),
    createdBy: adminUser._id,
    updatedBy: adminUser._id,
  });
  enrollmentId = enrollment._id.toString();
});

afterAll(async () => {
  await disconnectDatabase();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

beforeEach(async () => {
  await Holiday.deleteMany({});
  await SchoolEvent.deleteMany({});
  await CalendarEvent.deleteMany({});
  await EventReminder.deleteMany({});
  await AcademicCalendarSummary.deleteMany({});
});

describe('Phase 12 — Event & Holiday Calendar Verification Suite (TEST-CAL-001 to TEST-CAL-010)', () => {
  it('TEST-CAL-001: Syncs a Holiday creation to CalendarEvent automatically', async () => {
    const res = await request(app)
      .post('/api/v1/holidays')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Independence Day',
        startDate: '2026-08-15',
        endDate: '2026-08-15',
        holidayType: 'NATIONAL',
        affectsAttendance: true,
        academicSessionId,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('Independence Day');

    // Verify CalendarEvent projection was automatically created
    const calEvent = await CalendarEvent.findOne({
      referenceModule: 'Holiday',
      referenceId: res.body.data._id,
    });
    expect(calEvent).not.toBeNull();
    expect(calEvent?.category).toBe('HOLIDAY');
    expect(calEvent?.title).toBe('Independence Day');
  });

  it('TEST-CAL-002: Rejects creating a Holiday that overlaps an existing active holiday', async () => {
    // Create initial holiday
    await request(app)
      .post('/api/v1/holidays')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Mid-Term Break',
        startDate: '2026-10-10',
        endDate: '2026-10-15',
        holidayType: 'SCHOOL',
        affectsAttendance: true,
        academicSessionId,
      });

    // Attempt overlapping holiday
    const overlapRes = await request(app)
      .post('/api/v1/holidays')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Overlapping Holiday',
        startDate: '2026-10-12',
        endDate: '2026-10-14',
        holidayType: 'OPTIONAL',
        affectsAttendance: false,
        academicSessionId,
      });

    expect(overlapRes.status).toBe(409);
    expect(overlapRes.body.errorCode).toBe('DUPLICATE_RESOURCE');
  });

  it('TEST-CAL-003: Allows a Teacher to create a class-specific event for their assigned section and syncs CalendarEvent', async () => {
    const res = await request(app)
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        name: 'Science Exhibition Prep',
        eventType: 'ACADEMIC',
        startDate: '2026-09-01T09:00:00Z',
        endDate: '2026-09-01T12:00:00Z',
        visibility: 'CLASS_SPECIFIC',
        targetClassIds: [classId1],
        targetSectionIds: [sectionId1],
        academicSessionId,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Science Exhibition Prep');
    createdEventId = res.body.data._id;

    const calEvent = await CalendarEvent.findOne({
      referenceModule: 'SchoolEvent',
      referenceId: createdEventId,
    });
    expect(calEvent).not.toBeNull();
    expect(calEvent?.category).toBe('EVENT');
    expect(calEvent?.title).toBe('Science Exhibition Prep');
  });

  it('TEST-CAL-004: Denies a Teacher from creating an event for an unassigned section or SCHOOL_WIDE visibility', async () => {
    const res = await request(app)
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        name: 'Unauthorized Section Event',
        eventType: 'ACADEMIC',
        startDate: '2026-09-05T09:00:00Z',
        endDate: '2026-09-05T12:00:00Z',
        visibility: 'CLASS_SPECIFIC',
        targetClassIds: [classId2], // Class 9, where teacher has no assignment
        targetSectionIds: [sectionId2],
        academicSessionId,
      });

    expect(res.status).toBe(403);
    expect(res.body.errorCode).toBe('RBAC_PERMISSION_DENIED');
  });

  it('TEST-CAL-005: Filters unified calendar so a Student sees only SCHOOL_WIDE events and their enrolled class events', async () => {
    // 1. School-wide event (Admin)
    await request(app)
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Annual Sports Day',
        eventType: 'SPORTS',
        startDate: '2026-11-20T08:00:00Z',
        endDate: '2026-11-20T17:00:00Z',
        visibility: 'SCHOOL_WIDE',
        academicSessionId,
      });

    // 2. Event for student enrolled Class 10
    await request(app)
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Class 10 Guest Lecture',
        eventType: 'ACADEMIC',
        startDate: '2026-11-22T10:00:00Z',
        endDate: '2026-11-22T11:30:00Z',
        visibility: 'CLASS_SPECIFIC',
        targetClassIds: [classId1],
        academicSessionId,
      });

    // 3. Event for Class 9 (where student is not enrolled)
    await request(app)
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Class 9 Picnic',
        eventType: 'CULTURAL',
        startDate: '2026-11-25T09:00:00Z',
        endDate: '2026-11-25T16:00:00Z',
        visibility: 'CLASS_SPECIFIC',
        targetClassIds: [classId2],
        academicSessionId,
      });

    // Student queries calendar
    const res = await request(app)
      .get(`/api/v1/calendar?academicSessionId=${academicSessionId}`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    const titles = res.body.data.map((evt: any) => evt.title);
    expect(titles).toContain('Annual Sports Day');
    expect(titles).toContain('Class 10 Guest Lecture');
    expect(titles).not.toContain('Class 9 Picnic');
  });

  it('TEST-CAL-006: Allows scheduling a personal EventReminder and retrieving it in user reminder list', async () => {
    // Create an event first
    const evtRes = await request(app)
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Parent Teacher Meeting',
        eventType: 'PTM',
        startDate: '2026-12-05T10:00:00Z',
        endDate: '2026-12-05T14:00:00Z',
        visibility: 'SCHOOL_WIDE',
        academicSessionId,
      });
    const eventId = evtRes.body.data._id;

    // Find the CalendarEvent corresponding to this event
    const calEvt = await CalendarEvent.findOne({ referenceModule: 'SchoolEvent', referenceId: eventId });

    const remRes = await request(app)
      .post('/api/v1/reminders')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        calendarEventId: calEvt?._id.toString(),
        reminderTime: '2026-12-04T10:00:00Z',
        channels: ['IN_APP', 'EMAIL'],
      });

    expect(remRes.status).toBe(201);
    expect(remRes.body.data.channels).toContain('EMAIL');

    // Retrieve reminders list for student
    const listRes = await request(app)
      .get('/api/v1/reminders')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.data.length).toBe(1);
    expect(listRes.body.data[0].status).toBe('PENDING');
  });

  it('TEST-CAL-007: Generates multiple Holiday & CalendarEvent occurrences when isRecurring rule is provided', async () => {
    const res = await request(app)
      .post('/api/v1/holidays')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Weekly Sunday Break',
        startDate: '2026-07-05',
        endDate: '2026-07-05',
        holidayType: 'OPTIONAL',
        affectsAttendance: false,
        academicSessionId,
        isRecurring: true,
        recurrenceRule: {
          frequency: 'WEEKLY',
          count: 3,
        },
      });

    expect(res.status).toBe(201);
    expect(res.body.data.length).toBe(3);

    const holidayCount = await Holiday.countDocuments({ title: 'Weekly Sunday Break' });
    const calEventCount = await CalendarEvent.countDocuments({ title: 'Weekly Sunday Break' });

    expect(holidayCount).toBe(3);
    expect(calEventCount).toBe(3);
  });

  it('TEST-CAL-008: Blocks attendance marking when a mandatory Holiday (affectsAttendance: true) exists on that date', async () => {
    // Create National Holiday affecting attendance
    await request(app)
      .post('/api/v1/holidays')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Republic Day',
        startDate: '2027-01-26',
        endDate: '2027-01-26',
        holidayType: 'NATIONAL',
        affectsAttendance: true,
        academicSessionId,
      });

    // Attempt marking attendance on Republic Day
    const attRes = await request(app)
      .post('/api/v1/attendance')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        academicSessionId,
        classId: classId1,
        sectionId: sectionId1,
        date: '2027-01-26',
        attendanceType: 'DAILY',
        teachingAssignmentId,
        entries: [
          {
            studentId: studentProfileId,
            enrollmentId,
            studentName: 'Rohan Verma',
            className: 'Class 10',
            sectionName: 'A',
            attendanceStatus: 'PRESENT',
          },
        ],
      });

    expect(attRes.status).toBe(409);
    expect(attRes.body.errorCode).toBe('BUSINESS_RULE_VIOLATION');
  });

  it('TEST-CAL-009: Calculates and retrieves accurate Academic Calendar Summary metrics', async () => {
    // 1. Create 2 holidays affecting attendance
    await request(app)
      .post('/api/v1/holidays')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Holiday 1',
        startDate: '2026-08-01',
        endDate: '2026-08-01',
        holidayType: 'NATIONAL',
        affectsAttendance: true,
        academicSessionId,
      });

    await request(app)
      .post('/api/v1/holidays')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Holiday 2',
        startDate: '2026-08-02',
        endDate: '2026-08-02',
        holidayType: 'NATIONAL',
        affectsAttendance: true,
        academicSessionId,
      });

    const sumRes = await request(app)
      .get(`/api/v1/calendar/summary?academicSessionId=${academicSessionId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(sumRes.status).toBe(200);
    expect(sumRes.body.data.totalDays).toBe(180);
    expect(sumRes.body.data.holidayCount).toBe(2);
    expect(sumRes.body.data.workingDays).toBe(178);
  });

  it('TEST-CAL-010: Archives a SchoolEvent and automatically removes its CalendarEvent projection', async () => {
    // Create event
    const createRes = await request(app)
      .post('/api/v1/events')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Old Workshop',
        eventType: 'ACADEMIC',
        startDate: '2026-05-10T10:00:00Z',
        endDate: '2026-05-10T12:00:00Z',
        visibility: 'SCHOOL_WIDE',
        academicSessionId,
      });

    const id = createRes.body.data._id;
    // Ensure CalendarEvent exists before archive
    const beforeCal = await CalendarEvent.findOne({ referenceModule: 'SchoolEvent', referenceId: id });
    expect(beforeCal).not.toBeNull();

    // Archive event
    const archiveRes = await request(app)
      .patch(`/api/v1/events/${id}/archive`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(archiveRes.status).toBe(200);
    expect(archiveRes.body.data.status).toBe('ARCHIVED');

    // Ensure CalendarEvent projection was deleted
    const afterCal = await CalendarEvent.findOne({ referenceModule: 'SchoolEvent', referenceId: id });
    expect(afterCal).toBeNull();
  });
});
