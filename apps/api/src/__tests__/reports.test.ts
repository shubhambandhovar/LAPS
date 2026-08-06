import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../app';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { hashPassword } from '../utils/crypto';
import { User } from '../models/User';
import { Role } from '../models/Role';

let mongoServer: MongoMemoryServer;
let app: ReturnType<typeof createApp>;
let adminToken: string;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await connectDatabase(uri);
  app = createApp();

  const role = await Role.create({
    schoolId: 'LAPS-GOHAD',
    code: 'SUPER_ADMIN',
    name: 'Super Admin',
    description: 'Admin role',
    isSystem: true,
    permissions: [],
  });

  const passwordHash = await hashPassword('AdminPass10!');
  await User.create({
    schoolId: 'LAPS-GOHAD',
    identifier: 'admin-reports@littleangelsschool.edu.in',
    email: 'admin-reports@littleangelsschool.edu.in',
    passwordHash,
    roleId: role._id,
    roleCode: 'SUPER_ADMIN',
    userType: 'STAFF',
    status: 'ACTIVE',
  });

  const loginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({
      identifier: 'admin-reports@littleangelsschool.edu.in',
      password: 'AdminPass10!',
    });
  adminToken = loginRes.body.data.accessToken;
});

afterAll(async () => {
  await disconnectDatabase();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

describe('Reports API', () => {
  it('GET /api/v1/reports/dashboard/executive - should fetch executive dashboard', async () => {
    const res = await request(app)
      .get('/api/v1/reports/dashboard/executive')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('totalStudents');
    expect(res.body.data).toHaveProperty('totalFees');
  });

  it('GET /api/v1/reports/analytics/:module - should fetch module analytics', async () => {
    const res = await request(app)
      .get('/api/v1/reports/analytics/fees')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('module', 'fees');
    expect(res.body.data).toHaveProperty('analytics');
  });
});
