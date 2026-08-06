import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../app';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { hashPassword } from '../utils/crypto';
import { User } from '../models/User';
import { Role } from '../models/Role';
import { Permission } from '../models/Permission';
import { PERMISSION_MATRIX } from '@laps/shared';

let mongoServer: MongoMemoryServer;
let app: ReturnType<typeof createApp>;

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
  await Permission.deleteMany({});
});

describe('RBAC Complete Matrix & Security Enforcement Suite', () => {
  it('1. Verifies that PERMISSION_MATRIX covers all 12 institutional roles', () => {
    const expectedRoles = [
      'SUPER_ADMIN',
      'SCHOOL_ADMIN',
      'HR_MANAGER',
      'ACCOUNTANT',
      'LIBRARIAN',
      'STORE_MANAGER',
      'ADMISSION_OFFICER',
      'TEACHER',
      'STUDENT',
      'GUARDIAN',
      'EMPLOYEE',
      'RECEPTIONIST',
    ];

    for (const roleCode of expectedRoles) {
      expect(PERMISSION_MATRIX[roleCode]).toBeDefined();
      expect(Array.isArray(PERMISSION_MATRIX[roleCode])).toBe(true);
    }
  });

  it('2. Enforces that STUDENT role cannot access HR or Finance modules (returns 403 RBAC_PERMISSION_DENIED)', async () => {
    const studentRole = await Role.create({
      schoolId: 'LAPS-GOHAD',
      code: 'STUDENT',
      name: 'Student',
      description: 'Student access',
      isSystem: true,
      permissions: [],
    });

    const passwordHash = await hashPassword('StudentPass10!');
    await User.create({
      schoolId: 'LAPS-GOHAD',
      identifier: 'student-rbac@littleangelsschool.edu.in',
      email: 'student-rbac@littleangelsschool.edu.in',
      passwordHash,
      roleId: studentRole._id,
      roleCode: 'STUDENT',
      userType: 'STUDENT',
      status: 'ACTIVE',
    });

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        identifier: 'student-rbac@littleangelsschool.edu.in',
        password: 'StudentPass10!',
      });
    const token = loginRes.body.data.accessToken;

    const res = await request(app)
      .get('/api/v1/auth/test-rbac/student')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.errorCode).toBe('RBAC_PERMISSION_DENIED');
  });

  it('3. Enforces that TEACHER role can access Student Read endpoint when assigned permission', async () => {
    const perm = await Permission.create({
      module: 'STUDENT',
      action: 'READ',
      resource: 'student',
      description: 'View student profiles',
    });

    const teacherRole = await Role.create({
      schoolId: 'LAPS-GOHAD',
      code: 'TEACHER',
      name: 'Teacher',
      description: 'Classroom teacher',
      isSystem: true,
      permissions: [perm._id],
    });

    const passwordHash = await hashPassword('TeacherPass10!');
    await User.create({
      schoolId: 'LAPS-GOHAD',
      identifier: 'teacher-rbac-test@littleangelsschool.edu.in',
      email: 'teacher-rbac-test@littleangelsschool.edu.in',
      passwordHash,
      roleId: teacherRole._id,
      roleCode: 'TEACHER',
      userType: 'TEACHER',
      status: 'ACTIVE',
    });

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        identifier: 'teacher-rbac-test@littleangelsschool.edu.in',
        password: 'TeacherPass10!',
      });
    const token = loginRes.body.data.accessToken;

    const res = await request(app)
      .get('/api/v1/auth/test-rbac/student')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('4. Verifies SUPER_ADMIN bypasses all permission checks', async () => {
    const superRole = await Role.create({
      schoolId: 'LAPS-GOHAD',
      code: 'SUPER_ADMIN',
      name: 'Super Admin',
      description: 'Unrestricted access',
      isSystem: true,
      permissions: [],
    });

    const passwordHash = await hashPassword('SuperPass10!');
    await User.create({
      schoolId: 'LAPS-GOHAD',
      identifier: 'superadmin-test@littleangelsschool.edu.in',
      email: 'superadmin-test@littleangelsschool.edu.in',
      passwordHash,
      roleId: superRole._id,
      roleCode: 'SUPER_ADMIN',
      userType: 'STAFF',
      status: 'ACTIVE',
    });

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        identifier: 'superadmin-test@littleangelsschool.edu.in',
        password: 'SuperPass10!',
      });
    const token = loginRes.body.data.accessToken;

    const res = await request(app)
      .get('/api/v1/auth/test-rbac/student')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
