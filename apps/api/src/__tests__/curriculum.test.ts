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
import { AcademicTerm } from '../models/AcademicTerm';
import { Room } from '../models/Room';
import { ClassSubject } from '../models/ClassSubject';
import { BellSchedule } from '../models/BellSchedule';
import { TimetablePeriod } from '../models/TimetablePeriod';
import { Timetable } from '../models/Timetable';
import { AcademicCalendarEvent } from '../models/AcademicCalendarEvent';
import { WorkingDayRule } from '../models/WorkingDayRule';
import { Holiday } from '../models/Holiday';

let mongoServer: MongoMemoryServer;
let app: ReturnType<typeof createApp>;
let superAdminToken: string;
let teacherToken: string;
let superAdminUserId: string;
let teacherId: string;
let academicSessionId: string;
let classId: string;
let sectionId: string;
let subjectId: string;
let teachingAssignmentId: string;

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
  await AcademicTerm.deleteMany({});
  await Room.deleteMany({});
  await ClassSubject.deleteMany({});
  await BellSchedule.deleteMany({});
  await TimetablePeriod.deleteMany({});
  await Timetable.deleteMany({});
  await AcademicCalendarEvent.deleteMany({});
  await WorkingDayRule.deleteMany({});
  await Holiday.deleteMany({});

  const superRole = await Role.create({
    schoolId: 'LAPS-GOHAD',
    code: 'SUPER_ADMIN',
    name: 'Super Admin',
    description: 'Full access',
    isSystem: true,
  });

  const teacherRole = await Role.create({
    schoolId: 'LAPS-GOHAD',
    code: 'TEACHER',
    name: 'Teacher Role',
    description: 'Teacher access',
    isSystem: true,
  });

  const pwHash = await hashPassword('SecureAdminPass10!');

  const adminUser = await User.create({
    schoolId: 'LAPS-GOHAD',
    identifier: 'admin@littleangelsschool.edu.in',
    email: 'admin@littleangelsschool.edu.in',
    passwordHash: pwHash,
    roleId: superRole._id,
    roleCode: 'SUPER_ADMIN',
    userType: 'SUPER_ADMIN',
    status: 'ACTIVE',
  });
  superAdminUserId = adminUser._id.toString();

  // Create teacher profile first so user can link profileRef
  const teacherDoc = await Teacher.create({
    firstName: 'Anjali',
    lastName: 'Sharma',
    employeeId: 'EMP-001',
    email: 'teacher1@littleangelsschool.edu.in',
    phone: '9876543210',
    joiningDate: new Date('2024-01-01'),
    qualification: 'M.Sc. Physics',
    designation: 'PGT',
    createdBy: adminUser._id,
    updatedBy: adminUser._id,
    status: 'ACTIVE',
  });
  teacherId = teacherDoc._id.toString();

  const tUser = await User.create({
    schoolId: 'LAPS-GOHAD',
    identifier: 'teacher1@littleangelsschool.edu.in',
    email: 'teacher1@littleangelsschool.edu.in',
    passwordHash: pwHash,
    roleId: teacherRole._id,
    roleCode: 'TEACHER',
    userType: 'TEACHER',
    status: 'ACTIVE',
    profileRef: teacherDoc._id,
  });

  teacherDoc.userId = tUser._id;
  await teacherDoc.save();

  const resAdmin = await request(app)
    .post('/api/v1/auth/login')
    .send({
      identifier: 'admin@littleangelsschool.edu.in',
      password: 'SecureAdminPass10!',
    });
  superAdminToken = resAdmin.body.data.accessToken;

  const resTeacher = await request(app)
    .post('/api/v1/auth/login')
    .send({
      identifier: 'teacher1@littleangelsschool.edu.in',
      password: 'SecureAdminPass10!',
    });
  teacherToken = resTeacher.body.data.accessToken;

  // Create academic foundation fixtures
  const sessionDoc = await AcademicSession.create({
    name: '2026-2027',
    startDate: new Date('2026-04-01'),
    endDate: new Date('2027-03-31'),
    status: 'ACTIVE',
    isCurrent: true,
    createdBy: adminUser._id,
    updatedBy: adminUser._id,
  });
  academicSessionId = sessionDoc._id.toString();

  const classDoc = await Class.create({
    name: 'Class 10',
    code: 'CLS-10',
    level: 'SECONDARY',
    orderSequence: 10,
    status: 'ACTIVE',
    createdBy: adminUser._id,
    updatedBy: adminUser._id,
  });
  classId = classDoc._id.toString();

  const sectionDoc = await Section.create({
    name: 'A',
    classId: classDoc._id,
    academicSessionId: sessionDoc._id,
    roomNumber: '101',
    maxCapacity: 40,
    status: 'ACTIVE',
    createdBy: adminUser._id,
    updatedBy: adminUser._id,
  });
  sectionId = sectionDoc._id.toString();

  const subjectDoc = await Subject.create({
    name: 'Physics',
    code: 'PHY-10',
    shortName: 'PHY',
    subjectType: 'THEORY',
    isOptional: false,
    status: 'ACTIVE',
    createdBy: adminUser._id,
    updatedBy: adminUser._id,
  });
  subjectId = subjectDoc._id.toString();

  const assignmentDoc = await TeachingAssignment.create({
    academicSessionId: sessionDoc._id,
    classId: classDoc._id,
    sectionId: sectionDoc._id,
    subjectId: subjectDoc._id,
    teacherId: teacherDoc._id,
    isPrimaryTeacher: true,
    effectiveFrom: new Date('2026-04-01'),
    status: 'ACTIVE',
    createdBy: adminUser._id,
    updatedBy: adminUser._id,
  });
  teachingAssignmentId = assignmentDoc._id.toString();
});

describe('Phase 5 — Curriculum, Timetable & Academic Calendar Verification Suite', () => {
  it('TEST-CURRICULUM-001: AcademicTerm creation, unique code per session, and soft archive', async () => {
    const resCreate = await request(app)
      .post('/api/v1/academic-terms')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        name: 'Term 1',
        code: 'T1',
        academicSessionId,
        startDate: '2026-04-01',
        endDate: '2026-09-30',
        orderSequence: 1,
      });
    expect(resCreate.status).toBe(201);
    expect(resCreate.body.data.code).toBe('T1');

    const termId = resCreate.body.data.id || resCreate.body.data._id;

    // Duplicate check
    const resDup = await request(app)
      .post('/api/v1/academic-terms')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        name: 'Term 1 Duplicate',
        code: 'T1',
        academicSessionId,
        startDate: '2026-04-01',
        endDate: '2026-09-30',
        orderSequence: 2,
      });
    expect(resDup.status).toBe(409);

    // Archive
    const resArch = await request(app)
      .patch(`/api/v1/academic-terms/${termId}/archive`)
      .set('Authorization', `Bearer ${superAdminToken}`);
    expect(resArch.status).toBe(200);
    expect(resArch.body.data.status).toBe('ARCHIVED');
  });

  it('TEST-CURRICULUM-002: Room creation, unique code/name, and soft archive', async () => {
    const resCreate = await request(app)
      .post('/api/v1/rooms')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        name: 'Physics Lab 101',
        code: 'LAB-101',
        capacity: 35,
        roomType: 'LAB',
        building: 'Science Block',
      });
    expect(resCreate.status).toBe(201);
    const roomId = resCreate.body.data.id || resCreate.body.data._id;

    // Duplicate name/code check
    const resDup = await request(app)
      .post('/api/v1/rooms')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        name: 'Physics Lab 101',
        code: 'LAB-101',
        capacity: 35,
        roomType: 'LAB',
      });
    expect(resDup.status).toBe(409);

    // Soft archive
    const resArch = await request(app)
      .patch(`/api/v1/rooms/${roomId}/archive`)
      .set('Authorization', `Bearer ${superAdminToken}`);
    expect(resArch.status).toBe(200);
    expect(resArch.body.data.status).toBe('ARCHIVED');
  });

  it('TEST-CURRICULUM-003: ClassSubject mapping creation, mandatory/optional flags, prevent duplicates', async () => {
    const resCreate = await request(app)
      .post('/api/v1/class-subjects')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        academicSessionId,
        classId,
        subjectId,
        isMandatory: true,
        isOptional: false,
        orderSequence: 1,
      });
    expect(resCreate.status).toBe(201);
    expect(resCreate.body.data.isMandatory).toBe(true);

    // Prevent duplicate mapping
    const resDup = await request(app)
      .post('/api/v1/class-subjects')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        academicSessionId,
        classId,
        subjectId,
        isMandatory: true,
        isOptional: false,
        orderSequence: 2,
      });
    expect(resDup.status).toBe(409);
  });

  it('TEST-CURRICULUM-004 & 005: BellSchedule and TimetablePeriod creation, time interval overlap detection', async () => {
    const resBell = await request(app)
      .post('/api/v1/bell-schedules')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        name: 'Regular Schedule',
        academicSessionId,
        scheduleType: 'REGULAR',
        isDefault: true,
      });
    expect(resBell.status).toBe(201);
    const bellScheduleId = resBell.body.data.id || resBell.body.data._id;

    // Period 1: 08:00 - 08:45
    const resP1 = await request(app)
      .post('/api/v1/periods')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        academicSessionId,
        bellScheduleId,
        name: 'Period 1',
        sequence: 1,
        startTime: '08:00',
        endTime: '08:45',
        isBreak: false,
      });
    expect(resP1.status).toBe(201);

    // Overlapping period: 08:30 - 09:15 -> Should fail with 409
    const resOverlap = await request(app)
      .post('/api/v1/periods')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        academicSessionId,
        bellScheduleId,
        name: 'Period 2 Overlap',
        sequence: 2,
        startTime: '08:30',
        endTime: '09:15',
        isBreak: false,
      });
    expect(resOverlap.status).toBe(409);
  });

  it('TEST-CURRICULUM-006, 007, 008, 009, 010: Timetable slot creation, conflict detection, publish, and teacher access control', async () => {
    // Setup ClassSubject and BellSchedule + Period
    const csDoc = await ClassSubject.create({
      academicSessionId,
      classId,
      subjectId,
      isMandatory: true,
      isOptional: false,
      orderSequence: 1,
      status: 'ACTIVE',
      createdBy: superAdminUserId,
      updatedBy: superAdminUserId,
    });

    const bellDoc = await BellSchedule.create({
      name: 'Test Bell',
      academicSessionId,
      scheduleType: 'REGULAR',
      isDefault: true,
      status: 'ACTIVE',
      createdBy: superAdminUserId,
      updatedBy: superAdminUserId,
    });

    const periodDoc = await TimetablePeriod.create({
      academicSessionId,
      bellScheduleId: bellDoc._id,
      name: 'Period 1',
      sequence: 1,
      startTime: '08:00',
      endTime: '08:45',
      isBreak: false,
      status: 'ACTIVE',
      createdBy: superAdminUserId,
      updatedBy: superAdminUserId,
    });

    const roomDoc = await Room.create({
      name: 'Room 101',
      code: 'RM-101',
      capacity: 40,
      roomType: 'CLASSROOM',
      status: 'ACTIVE',
      createdBy: superAdminUserId,
      updatedBy: superAdminUserId,
    });

    // Create Timetable Slot (DRAFT)
    const resCreate = await request(app)
      .post('/api/v1/timetables')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        academicSessionId,
        classId,
        sectionId,
        dayOfWeek: 'MONDAY',
        timetablePeriodId: periodDoc._id,
        classSubjectId: csDoc._id,
        subjectId,
        teachingAssignmentId,
        teacherId,
        roomId: roomDoc._id,
      });
    expect(resCreate.status).toBe(201);
    expect(resCreate.body.data.status).toBe('DRAFT');

    // TEST-CURRICULUM-007: Teacher Conflict Check
    // Try scheduling same teacher on same day/period in another section
    const sec2Doc = await Section.create({
      name: 'B',
      classId,
      academicSessionId,
      roomNumber: '102',
      maxCapacity: 40,
      status: 'ACTIVE',
      createdBy: superAdminUserId,
      updatedBy: superAdminUserId,
    });
    const assign2Doc = await TeachingAssignment.create({
      academicSessionId,
      classId,
      sectionId: sec2Doc._id,
      subjectId,
      teacherId,
      isPrimaryTeacher: false,
      effectiveFrom: new Date('2026-04-01'),
      status: 'ACTIVE',
      createdBy: superAdminUserId,
      updatedBy: superAdminUserId,
    });

    const resTeacherConflict = await request(app)
      .post('/api/v1/timetables')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        academicSessionId,
        classId,
        sectionId: sec2Doc._id,
        dayOfWeek: 'MONDAY',
        timetablePeriodId: periodDoc._id,
        classSubjectId: csDoc._id,
        subjectId,
        teachingAssignmentId: assign2Doc._id,
        teacherId,
        roomId: roomDoc._id,
      });
    expect(resTeacherConflict.status).toBe(409);

    // TEST-CURRICULUM-010: Teacher cannot view DRAFT slots in my-timetable
    const resMyDraft = await request(app)
      .get('/api/v1/timetables/my-timetable')
      .set('Authorization', `Bearer ${teacherToken}`);
    expect(resMyDraft.status).toBe(200);
    expect(resMyDraft.body.data.length).toBe(0);

    // TEST-CURRICULUM-009: Publish timetable slots
    const resPub = await request(app)
      .post('/api/v1/timetables/publish')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        academicSessionId,
        classId,
        sectionId,
      });
    expect(resPub.status).toBe(200);
    expect(resPub.body.data.publishedCount).toBeGreaterThanOrEqual(1);

    // Now teacher can view PUBLISHED slots in my-timetable
    const resMyPub = await request(app)
      .get('/api/v1/timetables/my-timetable')
      .set('Authorization', `Bearer ${teacherToken}`);
    expect(resMyPub.status).toBe(200);
    expect(resMyPub.body.data.length).toBe(1);
    expect(resMyPub.body.data[0].dayOfWeek).toBe('MONDAY');
  });

  it('TEST-CURRICULUM-011: Teacher workload metric calculation', async () => {
    const csDoc = await ClassSubject.create({
      academicSessionId,
      classId,
      subjectId,
      isMandatory: true,
      isOptional: false,
      orderSequence: 1,
      status: 'ACTIVE',
      createdBy: superAdminUserId,
      updatedBy: superAdminUserId,
    });

    const bellDoc = await BellSchedule.create({
      name: 'Workload Bell',
      academicSessionId,
      scheduleType: 'REGULAR',
      isDefault: true,
      status: 'ACTIVE',
      createdBy: superAdminUserId,
      updatedBy: superAdminUserId,
    });

    const periodDoc = await TimetablePeriod.create({
      academicSessionId,
      bellScheduleId: bellDoc._id,
      name: 'Period 1',
      sequence: 1,
      startTime: '08:00',
      endTime: '08:45',
      isBreak: false,
      status: 'ACTIVE',
      createdBy: superAdminUserId,
      updatedBy: superAdminUserId,
    });

    await Timetable.create({
      academicSessionId,
      classId,
      sectionId,
      dayOfWeek: 'TUESDAY',
      timetablePeriodId: periodDoc._id,
      classSubjectId: csDoc._id,
      subjectId,
      teachingAssignmentId,
      teacherId,
      status: 'PUBLISHED',
      createdBy: superAdminUserId,
      updatedBy: superAdminUserId,
    });

    const resWorkload = await request(app)
      .get(`/api/v1/timetables/workload/${teacherId}?academicSessionId=${academicSessionId}`)
      .set('Authorization', `Bearer ${superAdminToken}`);
    expect(resWorkload.status).toBe(200);
    expect(resWorkload.body.data.totalPeriodsPerWeek).toBe(1);
    expect(resWorkload.body.data.periodsPerDay.TUESDAY).toBe(1);
    expect(resWorkload.body.data.freePeriodsPerWeek).toBeGreaterThanOrEqual(0);
    expect(resWorkload.body.data.isOverloaded).toBe(false);
  });

  it('TEST-CURRICULUM-012 & 013: AcademicCalendarEvent, WorkingDayRule, and Holiday management', async () => {
    // Calendar Event
    const resEvent = await request(app)
      .post('/api/v1/academic-calendar')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        academicSessionId,
        title: 'Annual Sports Meet',
        eventType: 'SPECIAL_EVENT',
        startDate: '2026-11-01',
        endDate: '2026-11-03',
        isWorkingDay: true,
        appliesToAllClasses: true,
      });
    expect(resEvent.status).toBe(201);
    expect(resEvent.body.data.title).toBe('Annual Sports Meet');

    // Working Day Rule
    const resRule = await request(app)
      .put('/api/v1/working-day-rules')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        academicSessionId,
        workingDaysPattern: 'MON_TO_SAT',
        customWorkingDays: [],
      });
    expect([200, 201]).toContain(resRule.status);
    expect(resRule.body.data.workingDaysPattern).toBe('MON_TO_SAT');

    // Holiday
    const resHol = await request(app)
      .post('/api/v1/holidays')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        academicSessionId,
        title: 'Independence Day',
        holidayType: 'NATIONAL',
        startDate: '2026-08-15',
        endDate: '2026-08-15',
        isOptionalHoliday: false,
        affectsAttendance: true,
      });
    expect(resHol.status).toBe(201);
    expect(resHol.body.data.title).toBe('Independence Day');
    expect(resHol.body.data.affectsAttendance).toBe(true);
  });
});
