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
import { Teacher } from '../models/Teacher';
import { TeachingAssignment } from '../models/TeachingAssignment';
import { Student } from '../models/Student';
import { Guardian } from '../models/Guardian';
import { StudentGuardian } from '../models/StudentGuardian';
import { Enrollment } from '../models/Enrollment';

let mongoServer: MongoMemoryServer;
let app: ReturnType<typeof createApp>;
let superAdminToken: string;
let teacherToken: string;
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
  await Teacher.deleteMany({});
  await TeachingAssignment.deleteMany({});
  await Student.deleteMany({});
  await Guardian.deleteMany({});
  await StudentGuardian.deleteMany({});
  await Enrollment.deleteMany({});

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
  await User.create({
    schoolId: 'LAPS-GOHAD',
    identifier: 'admin@littleangelsschool.edu.in',
    email: 'admin@littleangelsschool.edu.in',
    passwordHash: pwHash,
    roleId: superRole._id,
    roleCode: 'SUPER_ADMIN',
    userType: 'SUPER_ADMIN',
    status: 'ACTIVE',
  });

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

describe('Phase 4 — Student, Guardian & Enrollment Management Verification Suite', () => {
  it('1. Verifies student creation with auto-generated admission number and multi-field search', async () => {
    const resCreate = await request(app)
      .post('/api/v1/students')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        firstName: 'Aarav',
        lastName: 'Sharma',
        gender: 'MALE',
        dateOfBirth: '2015-05-15',
        phone: '9876543210',
        address: 'Ward 12, Main Road',
        city: 'Gohad',
        state: 'Madhya Pradesh',
        country: 'India',
        pinCode: '477116',
        emergencyContacts: [
          {
            name: 'Rajesh Sharma',
            relationship: 'Father',
            phone: '9876543210',
          },
        ],
      });

    expect(resCreate.status).toBe(201);
    expect(resCreate.body.success).toBe(true);
    const student = resCreate.body.data;
    expect(student.admissionNumber).toMatch(/^LAPS-\d{4}-0001$/);

    // Test Multi-Field Search by Phone
    const resSearch = await request(app)
      .get('/api/v1/students?search=9876543210')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(resSearch.status).toBe(200);
    expect(resSearch.body.data.length).toBe(1);
    expect(resSearch.body.data[0].id).toBe(student.id);
  });

  it('2. Verifies guardian creation, linking, and primary guardian automatic toggle', async () => {
    // Create Student
    const stRes = await request(app)
      .post('/api/v1/students')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        firstName: 'Riya',
        lastName: 'Verma',
        gender: 'FEMALE',
        dateOfBirth: '2016-08-10',
        address: 'MG Road',
        city: 'Gohad',
        state: 'Madhya Pradesh',
        country: 'India',
        pinCode: '477116',
        emergencyContacts: [
          { name: 'Suresh Verma', relationship: 'Father', phone: '9111111111' },
        ],
      });
    const studentId = stRes.body.data.id;

    // Create Father Guardian
    const g1Res = await request(app)
      .post('/api/v1/guardians')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        name: 'Suresh Verma',
        relationship: 'FATHER',
        phone: '9111111111',
        sameAsStudentAddress: true,
      });
    const guardian1Id = g1Res.body.data.id;

    // Create Mother Guardian
    const g2Res = await request(app)
      .post('/api/v1/guardians')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        name: 'Sunita Verma',
        relationship: 'MOTHER',
        phone: '9222222222',
        sameAsStudentAddress: true,
      });
    const guardian2Id = g2Res.body.data.id;

    // Link Father as Primary Guardian
    const link1Res = await request(app)
      .post('/api/v1/student-guardians')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        studentId,
        guardianId: guardian1Id,
        relationship: 'FATHER',
        isPrimaryGuardian: true,
        pickupPermission: true,
        emergencyContactPermission: true,
      });
    expect(link1Res.status).toBe(201);
    expect(link1Res.body.data.isPrimaryGuardian).toBe(true);

    // Link Mother as Primary Guardian -> should automatically toggle Father to false
    const link2Res = await request(app)
      .post('/api/v1/student-guardians')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        studentId,
        guardianId: guardian2Id,
        relationship: 'MOTHER',
        isPrimaryGuardian: true,
        pickupPermission: true,
        emergencyContactPermission: true,
      });
    expect(link2Res.status).toBe(201);
    expect(link2Res.body.data.isPrimaryGuardian).toBe(true);

    // Verify Father is no longer primary
    const sgList = await request(app)
      .get(`/api/v1/student-guardians?studentId=${studentId}`)
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(sgList.status).toBe(200);
    const getGId = (sg: any) => String(sg.guardian?.id || sg.guardian?._id || sg.guardianId);
    const fatherRel = sgList.body.data.find((sg: any) => getGId(sg) === guardian1Id);
    const motherRel = sgList.body.data.find((sg: any) => getGId(sg) === guardian2Id);

    expect(fatherRel.isPrimaryGuardian).toBe(false);
    expect(motherRel.isPrimaryGuardian).toBe(true);
  });

  it('3. Verifies roll number auto-generation and dynamic Class Teacher enrichment via TeachingAssignment', async () => {
    // 1. Create Academic Session
    const sessRes = await request(app)
      .post('/api/v1/academic-sessions')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        name: '2026-2027',
        startDate: '2026-04-01',
        endDate: '2027-03-31',
        isCurrent: true,
      });
    const sessionId = sessRes.body.data.id;

    // 2. Create Class & Section
    const clsRes = await request(app)
      .post('/api/v1/classes')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        name: 'Class 5',
        level: 'PRIMARY',
        orderSequence: 5,
      });
    const classId = clsRes.body.data.id;

    const secRes = await request(app)
      .post('/api/v1/sections')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        name: 'Section A',
        classId,
        academicSessionId: sessionId,
        capacity: 40,
      });
    const sectionId = secRes.body.data.id;

    // 3. Create Teacher Profile and assign as Class Teacher
    const tRes = await request(app)
      .post('/api/v1/teachers')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        userId: teacherUserId,
        firstName: 'Anjali',
        lastName: 'Gupta',
        email: 'teacher1@littleangelsschool.edu.in',
        phone: '9888888888',
        qualification: 'B.Ed',
        designation: 'PRT',
        joiningDate: '2025-06-01',
      });
    const teacherProfileId = tRes.body.data.id;

    const subRes = await request(app)
      .post('/api/v1/subjects')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        code: 'ENG-01',
        name: 'English',
        shortName: 'ENG',
        type: 'THEORY',
      });
    const subjectId = subRes.body.data.id;

    await request(app)
      .post('/api/v1/teaching-assignments')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        academicSessionId: sessionId,
        teacherId: teacherProfileId,
        classId,
        sectionId,
        subjectId,
        effectiveFrom: '2026-04-01',
        isClassTeacher: true,
      });

    // 4. Create Student and Enroll
    const stRes = await request(app)
      .post('/api/v1/students')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        firstName: 'Karan',
        lastName: 'Patel',
        gender: 'MALE',
        dateOfBirth: '2015-11-20',
        address: 'Station Road',
        city: 'Gohad',
        state: 'Madhya Pradesh',
        country: 'India',
        pinCode: '477116',
        emergencyContacts: [
          { name: 'Parent Patel', relationship: 'Father', phone: '9888888888' },
        ],
      });
    const studentId = stRes.body.data.id;

    const enrRes = await request(app)
      .post('/api/v1/enrollments')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        studentId,
        academicSessionId: sessionId,
        classId,
        sectionId,
      });

    expect(enrRes.status).toBe(201);
    expect(enrRes.body.data.rollNumber).toBe(1);

    // 5. Retrieve Enrollment -> check dynamic Class Teacher enrichment
    const getEnr = await request(app)
      .get(`/api/v1/enrollments/${enrRes.body.data.id}`)
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(getEnr.status).toBe(200);
    expect(getEnr.body.data.classTeacher).toBeDefined();
    expect(getEnr.body.data.classTeacher.firstName).toBe('Anjali');
    expect(getEnr.body.data.classTeacher.employeeId).toBe('TCH-0001');
  });

  it('4. Verifies student promotion wizard and archive protection guards', async () => {
    // Setup Session 1, Class 1, Section 1
    const sess1Res = await request(app)
      .post('/api/v1/academic-sessions')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        name: '2025-2026',
        startDate: '2025-04-01',
        endDate: '2026-03-31',
        isCurrent: false,
      });
    const session1Id = sess1Res.body.data.id;

    // Session 2
    const sess2Res = await request(app)
      .post('/api/v1/academic-sessions')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        name: '2026-2027',
        startDate: '2026-04-01',
        endDate: '2027-03-31',
        isCurrent: true,
      });
    const session2Id = sess2Res.body.data.id;

    const clsRes = await request(app)
      .post('/api/v1/classes')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ name: 'Class 6', level: 'MIDDLE', orderSequence: 6 });
    const classId = clsRes.body.data.id;

    const secRes = await request(app)
      .post('/api/v1/sections')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ name: 'Section A', classId, academicSessionId: session1Id, capacity: 40 });
    const sectionId = secRes.body.data.id;

    // Student & Guardian
    const stRes = await request(app)
      .post('/api/v1/students')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        firstName: 'Divya',
        lastName: 'Singh',
        gender: 'FEMALE',
        dateOfBirth: '2014-02-14',
        address: 'Bhind Road',
        city: 'Gohad',
        state: 'Madhya Pradesh',
        country: 'India',
        pinCode: '477116',
        emergencyContacts: [
          { name: 'Vikram Singh', relationship: 'Father', phone: '9555555555' },
        ],
      });
    const studentId = stRes.body.data.id;

    const gRes = await request(app)
      .post('/api/v1/guardians')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        name: 'Vikram Singh',
        relationship: 'FATHER',
        phone: '9555555555',
        sameAsStudentAddress: true,
      });
    const guardianId = gRes.body.data.id;

    await request(app)
      .post('/api/v1/student-guardians')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        studentId,
        guardianId,
        relationship: 'FATHER',
        isPrimaryGuardian: true,
      });

    // Enroll in Session 1
    const enr1Res = await request(app)
      .post('/api/v1/enrollments')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        studentId,
        academicSessionId: session1Id,
        classId,
        sectionId,
      });
    const enr1Id = enr1Res.body.data.id;

    // Verify protection guard: attempting to archive student with ACTIVE enrollment must fail
    const archStRes = await request(app)
      .patch(`/api/v1/students/${studentId}/archive`)
      .set('Authorization', `Bearer ${superAdminToken}`);
    expect(archStRes.status).toBe(409);
    expect(archStRes.body.errorCode).toBe('BUSINESS_RULE_VIOLATION');

    // Verify protection guard: attempting to archive sole guardian of active student must fail
    const archGRes = await request(app)
      .patch(`/api/v1/guardians/${guardianId}/archive`)
      .set('Authorization', `Bearer ${superAdminToken}`);
    expect(archGRes.status).toBe(409);
    expect(archGRes.body.errorCode).toBe('BUSINESS_RULE_VIOLATION');

    // Execute Promote Wizard to Session 2
    const promoteRes = await request(app)
      .post(`/api/v1/enrollments/${enr1Id}/promote`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        targetAcademicSessionId: session2Id,
        targetClassId: classId,
        targetSectionId: sectionId,
        remarks: 'Promoted to 2026-2027',
      });

    expect(promoteRes.status).toBe(201);
    expect(promoteRes.body.data.enrollmentStatus).toBe('ACTIVE');

    // Verify original enrollment is marked PROMOTED
    const getEnr1 = await request(app)
      .get(`/api/v1/enrollments/${enr1Id}`)
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(getEnr1.status).toBe(200);
    expect(getEnr1.body.data.enrollmentStatus).toBe('PROMOTED');
  });

  it('5. Verifies Teacher Scoping Enforcement (requireStudentReadScope)', async () => {
    // 1. Setup Session, Class, Section A and Section B
    const sessRes = await request(app)
      .post('/api/v1/academic-sessions')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        name: '2026-2027-SCOPE',
        startDate: '2026-04-01',
        endDate: '2027-03-31',
        isCurrent: false,
      });
    const sessionId = sessRes.body.data.id;

    const clsRes = await request(app)
      .post('/api/v1/classes')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ name: 'Class 7', level: 'MIDDLE', orderSequence: 7 });
    const classId = clsRes.body.data.id;

    const secARes = await request(app)
      .post('/api/v1/sections')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ name: 'Section A', classId, academicSessionId: sessionId, capacity: 40 });
    const sectionAId = secARes.body.data.id;

    const secBRes = await request(app)
      .post('/api/v1/sections')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ name: 'Section B', classId, academicSessionId: sessionId, capacity: 40 });
    const sectionBId = secBRes.body.data.id;

    // 2. Teacher profile -> assigned ONLY to Section A
    const tRes = await request(app)
      .post('/api/v1/teachers')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        userId: teacherUserId,
        firstName: 'Ramesh',
        lastName: 'Kumar',
        email: 'teacher1@littleangelsschool.edu.in',
        phone: '9777777777',
        qualification: 'M.Sc',
        designation: 'TGT',
        joiningDate: '2025-01-01',
      });
    const teacherId = tRes.body.data.id;

    const subRes5 = await request(app)
      .post('/api/v1/subjects')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        code: 'ENG-02',
        name: 'English II',
        shortName: 'ENG2',
        type: 'THEORY',
      });
    const subjectId5 = subRes5.body.data.id;

    await request(app)
      .post('/api/v1/teaching-assignments')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        academicSessionId: sessionId,
        teacherId,
        classId,
        sectionId: sectionAId,
        subjectId: subjectId5,
        effectiveFrom: '2026-04-01',
        isClassTeacher: true,
      });

    // 3. Create Student A in Section A and Student B in Section B
    const stARes = await request(app)
      .post('/api/v1/students')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        firstName: 'Student',
        lastName: 'Alpha',
        gender: 'MALE',
        dateOfBirth: '2013-01-01',
        address: 'Gohad',
        city: 'Gohad',
        state: 'Madhya Pradesh',
        country: 'India',
        pinCode: '477116',
        emergencyContacts: [
          { name: 'Alpha Parent', relationship: 'Parent', phone: '9000000001' },
        ],
      });
    const studentAId = stARes.body.data.id;

    const stBRes = await request(app)
      .post('/api/v1/students')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        firstName: 'Student',
        lastName: 'Beta',
        gender: 'FEMALE',
        dateOfBirth: '2013-02-01',
        address: 'Gohad',
        city: 'Gohad',
        state: 'Madhya Pradesh',
        country: 'India',
        pinCode: '477116',
        emergencyContacts: [
          { name: 'Beta Parent', relationship: 'Parent', phone: '9000000002' },
        ],
      });
    const studentBId = stBRes.body.data.id;

    await request(app)
      .post('/api/v1/enrollments')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        studentId: studentAId,
        academicSessionId: sessionId,
        classId,
        sectionId: sectionAId,
      });

    await request(app)
      .post('/api/v1/enrollments')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({
        studentId: studentBId,
        academicSessionId: sessionId,
        classId,
        sectionId: sectionBId,
      });

    // 4. Test Teacher Read Scope: Teacher accessing Student A (Section A) succeeds
    const teacherGetA = await request(app)
      .get(`/api/v1/students/${studentAId}`)
      .set('Authorization', `Bearer ${teacherToken}`);
    expect(teacherGetA.status).toBe(200);
    expect(teacherGetA.body.data.student.id).toBe(studentAId);

    // 5. Test Teacher Read Scope: Teacher accessing Student B (Section B) is FORBIDDEN (403)
    const teacherGetB = await request(app)
      .get(`/api/v1/students/${studentBId}`)
      .set('Authorization', `Bearer ${teacherToken}`);
    expect(teacherGetB.status).toBe(403);
    expect(teacherGetB.body.errorCode).toBe('RBAC_PERMISSION_DENIED');
  });
});
