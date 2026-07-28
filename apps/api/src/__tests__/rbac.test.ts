import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../app';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { hashPassword } from '../utils/crypto';
import { User } from '../models/User';
import { Role } from '../models/Role';
import { Permission } from '../models/Permission';

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

describe('Phase 2 — Role-Based Access Control (RBAC) Verification Suite', () => {
  it('1. Returns 401 AUTH_TOKEN_EXPIRED when no token or unauthenticated', async () => {
    const res = await request(app).get('/api/v1/auth/test-rbac/student');

    expect(res.status).toBe(401);
    expect(res.body.errorCode).toBe('AUTH_TOKEN_EXPIRED');
  });

  it('2. Returns 403 RBAC_PERMISSION_DENIED when user lacks required permission', async () => {
    const role = await Role.create({
      schoolId: 'LAPS-GOHAD',
      code: 'RECEPTIONIST',
      name: 'Receptionist',
      description: 'Front desk',
      isSystem: true,
      permissions: [], // No STUDENT READ permission
    });

    const passwordHash = await hashPassword('ReceptionistPass10!');
    await User.create({
      schoolId: 'LAPS-GOHAD',
      identifier: 'receptionist@littleangelsschool.edu.in',
      email: 'reception@littleangelsschool.edu.in',
      passwordHash,
      roleId: role._id,
      roleCode: 'RECEPTIONIST',
      userType: 'RECEPTIONIST',
      status: 'ACTIVE',
    });

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        identifier: 'receptionist@littleangelsschool.edu.in',
        password: 'ReceptionistPass10!',
      });
    const token = loginRes.body.data.accessToken;

    const testRes = await request(app)
      .get('/api/v1/auth/test-rbac/student')
      .set('Authorization', `Bearer ${token}`);

    expect(testRes.status).toBe(403);
    expect(testRes.body.errorCode).toBe('RBAC_PERMISSION_DENIED');
  });

  it('3. Returns 200 OK when user has required permission or is SUPER_ADMIN', async () => {
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
      identifier: 'teacher-auth@littleangelsschool.edu.in',
      email: 'teacher-auth@littleangelsschool.edu.in',
      passwordHash,
      roleId: teacherRole._id,
      roleCode: 'TEACHER',
      userType: 'TEACHER',
      status: 'ACTIVE',
    });

    const loginTeacher = await request(app)
      .post('/api/v1/auth/login')
      .send({
        identifier: 'teacher-auth@littleangelsschool.edu.in',
        password: 'TeacherPass10!',
      });
    const teacherToken = loginTeacher.body.data.accessToken;

    const teacherReq = await request(app)
      .get('/api/v1/auth/test-rbac/student')
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(teacherReq.status).toBe(200);
    expect(teacherReq.body.success).toBe(true);
  });
});
