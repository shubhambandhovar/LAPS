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

let mongoServer: MongoMemoryServer;
let app: ReturnType<typeof createApp>;
let superAdminToken: string;
let teacherToken: string;
let superAdminUserId: string;
let teacherUserId: string;

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

  const tUser = await User.create({
    schoolId: 'LAPS-GOHAD',
    identifier: 'teacher1@littleangelsschool.edu.in',
    email: 'teacher1@littleangelsschool.edu.in',
    passwordHash: pwHash,
    roleId: teacherRole._id,
    roleCode: 'TEACHER',
    userType: 'TEACHER',
    status: 'ACTIVE',
  });
  teacherUserId = tUser._id.toString();

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
});

describe('Phase 3 — Academic Foundation & Master Data Verification Suite', () => {
  it('1. Academic Session: Creates session, enforces unique name, activates session atomically, and soft archives', async () => {
    // Create 2026-2027
    const resCreate = await request(app)
      .post('/api/v1/academic-sessions')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        name: '2026-2027',
        startDate: '2026-04-01T00:00:00.000Z',
        endDate: '2027-03-31T23:59:59.000Z',
        status: 'PLANNED',
      });

    expect(resCreate.status).toBe(201);
    expect(resCreate.body.data.name).toBe('2026-2027');
    expect(resCreate.body.data.createdBy).toBe(superAdminUserId);
    const sessionId = resCreate.body.data.id;

    // Prevent duplicate name
    const resDup = await request(app)
      .post('/api/v1/academic-sessions')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        name: '2026-2027',
        startDate: '2026-04-01T00:00:00.000Z',
        endDate: '2027-03-31T23:59:59.000Z',
      });
    expect(resDup.status).toBe(409);

    // Activate session
    const resAct = await request(app)
      .patch(`/api/v1/academic-sessions/${sessionId}/activate`)
      .set('Authorization', `Bearer ${superAdminToken}`);
    expect(resAct.status).toBe(200);
    expect(resAct.body.data.isCurrent).toBe(true);
    expect(resAct.body.data.status).toBe('ACTIVE');

    // Soft archive when active should fail
    const resArchFail = await request(app)
      .patch(`/api/v1/academic-sessions/${sessionId}/archive`)
      .set('Authorization', `Bearer ${superAdminToken}`);
    expect(resArchFail.status).toBe(400);

    // Deactivate first then soft archive
    await AcademicSession.findByIdAndUpdate(sessionId, { isCurrent: false, status: 'PLANNED' });
    const resArch = await request(app)
      .patch(`/api/v1/academic-sessions/${sessionId}/archive`)
      .set('Authorization', `Bearer ${superAdminToken}`);
    expect(resArch.status).toBe(200);
    expect(resArch.body.data.status).toBe('ARCHIVED');
    expect(resArch.body.data.archivedBy).toBe(superAdminUserId);
    expect(resArch.body.data.archivedAt).toBeDefined();
  });

  it('2. Class & Auto-Generated Codes: Auto generates code when omitted and prevents duplicate codes/names', async () => {
    // Create class without code
    const resNursery = await request(app)
      .post('/api/v1/classes')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        name: 'Nursery',
        level: 'PRE_PRIMARY',
        orderSequence: 1,
      });

    expect(resNursery.status).toBe(201);
    expect(resNursery.body.data.code).toBe('CLS-NUR');

    const resClass1 = await request(app)
      .post('/api/v1/classes')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        name: 'Class 1',
        level: 'PRIMARY',
        orderSequence: 4,
      });

    expect(resClass1.status).toBe(201);
    expect(resClass1.body.data.code).toBe('CLS-01');

    // Duplicate name
    const resDup = await request(app)
      .post('/api/v1/classes')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        name: 'Nursery',
        level: 'PRE_PRIMARY',
        orderSequence: 2,
      });
    expect(resDup.status).toBe(409);
  });

  it('3. Section: Prevents duplicate (academicSessionId, classId, name) and supports soft archiving', async () => {
    const session = await AcademicSession.create({
      name: '2026-2027',
      startDate: new Date('2026-04-01'),
      endDate: new Date('2027-03-31'),
      createdBy: superAdminUserId,
      updatedBy: superAdminUserId,
    });
    const cls = await Class.create({
      name: 'Class 5',
      code: 'CLS-05',
      level: 'PRIMARY',
      orderSequence: 5,
      createdBy: superAdminUserId,
      updatedBy: superAdminUserId,
    });

    const resSecA = await request(app)
      .post('/api/v1/sections')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        academicSessionId: session._id.toString(),
        classId: cls._id.toString(),
        name: 'A',
        roomNumber: '101',
        maxCapacity: 40,
      });
    expect(resSecA.status).toBe(201);
    const secId = resSecA.body.data.id;

    const resDup = await request(app)
      .post('/api/v1/sections')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        academicSessionId: session._id.toString(),
        classId: cls._id.toString(),
        name: 'A',
      });
    expect(resDup.status).toBe(409);

    const resArch = await request(app)
      .patch(`/api/v1/sections/${secId}/archive`)
      .set('Authorization', `Bearer ${superAdminToken}`);
    expect(resArch.status).toBe(200);
    expect(resArch.body.data.status).toBe('ARCHIVED');
  });

  it('4. Global Master Subject: Auto-generates code from shortName and is not bound to a class', async () => {
    const resSub = await request(app)
      .post('/api/v1/subjects')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        name: 'Mathematics',
        shortName: 'MATH',
        subjectType: 'THEORY',
      });

    expect(resSub.status).toBe(201);
    expect(resSub.body.data.code).toBe('SUB-MATH');
    expect(resSub.body.data.classId).toBeUndefined();
  });

  it('5. Teacher Profile & Auto-Generated EmployeeId: Auto-generates TCH-0001 and enforces self-scoped read for TEACHER role', async () => {
    const resT1 = await request(app)
      .post('/api/v1/teachers')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        userId: teacherUserId,
        firstName: 'Anjali',
        lastName: 'Sharma',
        email: 'anjali@littleangelsschool.edu.in',
        phone: '9876543210',
        qualification: 'B.Ed, M.Sc Mathematics',
        designation: 'TGT',
        joiningDate: '2024-06-01',
        photoUrl: 'https://cdn.example.com/photo.jpg',
      });

    expect(resT1.status).toBe(201);
    expect(resT1.body.data.employeeId).toBe('TCH-0001');
    expect(resT1.body.data.photoUrl).toBe('https://cdn.example.com/photo.jpg');
    const teacherId1 = resT1.body.data.id;

    // Create another teacher without userId
    const resT2 = await request(app)
      .post('/api/v1/teachers')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        firstName: 'Rohit',
        lastName: 'Verma',
        email: 'rohit@littleangelsschool.edu.in',
        phone: '9876543211',
        qualification: 'M.Ed',
        designation: 'PGT',
        joiningDate: '2023-06-01',
      });
    expect(resT2.status).toBe(201);
    expect(resT2.body.data.employeeId).toBe('TCH-0002');
    const teacherId2 = resT2.body.data.id;

    // Teacher can read their own profile
    const resOwn = await request(app)
      .get(`/api/v1/teachers/${teacherId1}`)
      .set('Authorization', `Bearer ${teacherToken}`);
    expect(resOwn.status).toBe(200);

    // Teacher attempting to read another teacher's profile gets 403
    const resOther = await request(app)
      .get(`/api/v1/teachers/${teacherId2}`)
      .set('Authorization', `Bearer ${teacherToken}`);
    expect(resOther.status).toBe(403);
    expect(resOther.body.errorCode).toBe('AUTH_SCOPE_FORBIDDEN');
  });

  it('6. Teaching Assignment: Prevents overlapping active assignments for same section & subject', async () => {
    const session = await AcademicSession.create({
      name: '2026-2027',
      startDate: new Date('2026-04-01'),
      endDate: new Date('2027-03-31'),
      createdBy: superAdminUserId,
      updatedBy: superAdminUserId,
    });
    const cls = await Class.create({
      name: 'Class 6',
      code: 'CLS-06',
      level: 'MIDDLE',
      orderSequence: 6,
      createdBy: superAdminUserId,
      updatedBy: superAdminUserId,
    });
    const sec = await Section.create({
      academicSessionId: session._id,
      classId: cls._id,
      name: 'A',
      createdBy: superAdminUserId,
      updatedBy: superAdminUserId,
    });
    const sub = await Subject.create({
      name: 'General Science',
      code: 'SUB-SCI',
      shortName: 'SCI',
      createdBy: superAdminUserId,
      updatedBy: superAdminUserId,
    });
    const t1 = await Teacher.create({
      employeeId: 'TCH-0010',
      firstName: 'Alok',
      lastName: 'Mishra',
      email: 'alok@littleangelsschool.edu.in',
      phone: '9876543212',
      qualification: 'B.Ed',
      designation: 'PRT',
      joiningDate: new Date('2024-01-01'),
      createdBy: superAdminUserId,
      updatedBy: superAdminUserId,
    });
    const t2 = await Teacher.create({
      employeeId: 'TCH-0011',
      firstName: 'Priya',
      lastName: 'Gupta',
      email: 'priya@littleangelsschool.edu.in',
      phone: '9876543213',
      qualification: 'B.Ed',
      designation: 'PRT',
      joiningDate: new Date('2024-01-01'),
      createdBy: superAdminUserId,
      updatedBy: superAdminUserId,
    });

    const resAssign1 = await request(app)
      .post('/api/v1/teaching-assignments')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        teacherId: t1._id.toString(),
        academicSessionId: session._id.toString(),
        classId: cls._id.toString(),
        sectionId: sec._id.toString(),
        subjectId: sub._id.toString(),
        effectiveFrom: '2026-04-01T00:00:00.000Z',
      });
    expect(resAssign1.status).toBe(201);

    // Try assigning another teacher to same section & subject with overlapping active date
    const resOverlap = await request(app)
      .post('/api/v1/teaching-assignments')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        teacherId: t2._id.toString(),
        academicSessionId: session._id.toString(),
        classId: cls._id.toString(),
        sectionId: sec._id.toString(),
        subjectId: sub._id.toString(),
        effectiveFrom: '2026-06-01T00:00:00.000Z',
      });
    expect(resOverlap.status).toBe(409);
    expect(resOverlap.body.message).toContain('overlapping effective dates');
  });

  it('7. RBAC Security: Teacher role cannot create or archive academic master data (returns 403)', async () => {
    const resCreate = await request(app)
      .post('/api/v1/classes')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        name: 'Class 9',
        level: 'SECONDARY',
        orderSequence: 9,
      });

    expect(resCreate.status).toBe(403);
    expect(resCreate.body.errorCode).toBe('RBAC_PERMISSION_DENIED');
  });
});
