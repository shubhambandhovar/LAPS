import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { PasswordPolicySchema } from '@laps/shared';
import { createApp } from '../app';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { hashPassword, verifyPassword } from '../utils/crypto';
import { User } from '../models/User';
import { Role } from '../models/Role';
import { RefreshSession } from '../models/RefreshSession';

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
  await RefreshSession.deleteMany({});
  await User.deleteMany({});
  await Role.deleteMany({});

  const role = await Role.create({
    schoolId: 'LAPS-GOHAD',
    code: 'TEACHER',
    name: 'Teacher',
    description: 'Faculty member',
    isSystem: true,
    permissions: [],
  });

  const passwordHash = await hashPassword('TeacherPassword10!');
  await User.create({
    schoolId: 'LAPS-GOHAD',
    identifier: 'teacher1@littleangelsschool.edu.in',
    email: 'teacher1@littleangelsschool.edu.in',
    passwordHash,
    roleId: role._id,
    roleCode: 'TEACHER',
    userType: 'TEACHER',
    status: 'ACTIVE',
  });

  await User.create({
    schoolId: 'LAPS-GOHAD',
    identifier: 'teacher2@littleangelsschool.edu.in',
    email: 'teacher2@littleangelsschool.edu.in',
    passwordHash,
    roleId: role._id,
    roleCode: 'TEACHER',
    userType: 'TEACHER',
    status: 'ACTIVE',
  });
});

describe('Phase 2 — Authentication, Session Families & Multi-Device Security Tests', () => {
  it('1. Bcrypt Password Hashing & NIST SP 800-63B Policy Enforcement', async () => {
    // NIST SP 800-63B validation
    expect(() => PasswordPolicySchema.parse('short')).toThrow(
      /at least 10 characters/,
    );
    expect(PasswordPolicySchema.parse('ValidLongPassword123')).toBe(
      'ValidLongPassword123',
    );

    // Bcrypt hash verification
    const plain = 'SecretPassword10!';
    const hash = await hashPassword(plain);
    expect(hash).not.toBe(plain);
    expect(await verifyPassword(plain, hash)).toBe(true);
    expect(await verifyPassword('WrongPassword', hash)).toBe(false);
  });

  it('2. Multi-Device Logins Create Independent Session Families (sessionFamilyId)', async () => {
    // Device A Login
    const resA = await request(app)
      .post('/api/v1/auth/login')
      .set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0')
      .send({
        identifier: 'teacher1@littleangelsschool.edu.in',
        password: 'TeacherPassword10!',
      });

    expect(resA.status).toBe(200);
    expect(resA.body.data.sessionFamilyId).toBeDefined();
    const familyA = resA.body.data.sessionFamilyId;

    // Device B Login
    const resB = await request(app)
      .post('/api/v1/auth/login')
      .set('User-Agent', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Safari/604.1')
      .send({
        identifier: 'teacher1@littleangelsschool.edu.in',
        password: 'TeacherPassword10!',
      });

    expect(resB.status).toBe(200);
    const familyB = resB.body.data.sessionFamilyId;

    // Verify independent families
    expect(familyA).not.toBe(familyB);

    const activeCount = await RefreshSession.countDocuments({
      userId: resA.body.data.user.id,
      isRevoked: false,
    });
    expect(activeCount).toBe(2);
  });

  it('3. Targeted Family Revocation on Replay: Device A Replay Revokes Only Family A, Leaving Device B Valid', async () => {
    // Device A Login
    const loginA = await request(app)
      .post('/api/v1/auth/login')
      .set('User-Agent', 'Chrome on Windows 11')
      .send({
        identifier: 'teacher1@littleangelsschool.edu.in',
        password: 'TeacherPassword10!',
      });
    const cookieA = loginA.headers['set-cookie'][0];
    const familyA = loginA.body.data.sessionFamilyId;

    // Device B Login
    const loginB = await request(app)
      .post('/api/v1/auth/login')
      .set('User-Agent', 'Safari on iPhone')
      .send({
        identifier: 'teacher1@littleangelsschool.edu.in',
        password: 'TeacherPassword10!',
      });
    const cookieB = loginB.headers['set-cookie'][0];
    const familyB = loginB.body.data.sessionFamilyId;

    // Rotate token on Device A
    const rotateA = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', cookieA)
      .set('X-Requested-With', 'XMLHttpRequest');

    expect(rotateA.status).toBe(200);
    expect(rotateA.body.data.sessionFamilyId).toBe(familyA);

    // Simulate suspicious replay of OLD token from Device A (outside grace window)
    const oldSession = await RefreshSession.findOne({ sessionFamilyId: familyA, isRevoked: true });
    if (oldSession) {
      oldSession.revokedAt = new Date(Date.now() - 30000); // 30s ago
      await oldSession.save();
    }

    const replayA = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', cookieA)
      .set('X-Requested-With', 'XMLHttpRequest');

    expect(replayA.status).toBe(401);
    expect(replayA.body.message).toContain('Session revoked');

    // Verify that ONLY Family A was revoked
    const revokedCountA = await RefreshSession.countDocuments({
      sessionFamilyId: familyA,
      isRevoked: true,
    });
    expect(revokedCountA).toBeGreaterThan(0);

    // CRITICAL SECURITY ASSERTION: Device B MUST remain valid!
    const activeB = await RefreshSession.findOne({
      sessionFamilyId: familyB,
      isRevoked: false,
    });
    expect(activeB).not.toBeNull();

    const refreshB = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', cookieB)
      .set('X-Requested-With', 'XMLHttpRequest');

    expect(refreshB.status).toBe(200);
  });

  it('4. Logout & Logout-All Across Multi-Device Session Families', async () => {
    // Login A and B
    const loginA = await request(app)
      .post('/api/v1/auth/login')
      .send({
        identifier: 'teacher1@littleangelsschool.edu.in',
        password: 'TeacherPassword10!',
      });
    const tokenA = loginA.body.data.accessToken;
    const cookieA = loginA.headers['set-cookie'][0];

    const loginB = await request(app)
      .post('/api/v1/auth/login')
      .send({
        identifier: 'teacher1@littleangelsschool.edu.in',
        password: 'TeacherPassword10!',
      });
    const cookieB = loginB.headers['set-cookie'][0];

    // Single Logout on Device A
    await request(app)
      .post('/api/v1/auth/logout')
      .set('Cookie', cookieA)
      .set('X-Requested-With', 'XMLHttpRequest');

    const checkA = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', cookieA)
      .set('X-Requested-With', 'XMLHttpRequest');
    expect(checkA.status).toBe(401);

    // Device B is still valid before logoutAll
    const checkB = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', cookieB)
      .set('X-Requested-With', 'XMLHttpRequest');
    expect(checkB.status).toBe(200);

    // Logout All from account
    const resLogoutAll = await request(app)
      .post('/api/v1/auth/logout-all')
      .set('Authorization', `Bearer ${tokenA}`)
      .set('X-Requested-With', 'XMLHttpRequest');

    expect(resLogoutAll.status).toBe(200);

    const totalActive = await RefreshSession.countDocuments({
      isRevoked: false,
    });
    expect(totalActive).toBe(0);
  });

  it('5. Layered Authentication Rate Limiting Does Not Lock Out Unrelated Users on Same IP', async () => {
    // Enable rate limiter for this test
    const customHeaders = { 'x-test-rate-limit': 'true' };

    // Teacher 1 enters wrong password 5 times
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/api/v1/auth/login')
        .set(customHeaders)
        .send({
          identifier: 'teacher1@littleangelsschool.edu.in',
          password: 'WrongPassword!',
        });
    }

    // 6th attempt by Teacher 1 should be rate-limited (429)
    const blockedA = await request(app)
      .post('/api/v1/auth/login')
      .set(customHeaders)
      .send({
        identifier: 'teacher1@littleangelsschool.edu.in',
        password: 'WrongPassword!',
      });
    expect(blockedA.status).toBe(429);
    expect(blockedA.body.errorCode).toBe('RATE_LIMIT_EXCEEDED');

    // CRITICAL TEST: Teacher 2 logging in from the SAME IP address must NOT be blocked by Teacher 1's account limiter!
    const successB = await request(app)
      .post('/api/v1/auth/login')
      .set(customHeaders)
      .send({
        identifier: 'teacher2@littleangelsschool.edu.in',
        password: 'TeacherPassword10!',
      });

    expect(successB.status).toBe(200);
  });

  it('6. Zero Secret Leakage: No passwordHash or tokenHash in API Responses', async () => {
    const resLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({
        identifier: 'teacher1@littleangelsschool.edu.in',
        password: 'TeacherPassword10!',
      });

    expect(resLogin.status).toBe(200);
    expect(resLogin.body.data.user.passwordHash).toBeUndefined();
    expect(resLogin.body.data.user.tokenHash).toBeUndefined();
    expect(resLogin.body.data.user.refreshTokenHash).toBeUndefined();

    const accessToken = resLogin.body.data.accessToken;
    const resMe = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(resMe.status).toBe(200);
    expect(resMe.body.data.user.passwordHash).toBeUndefined();
    expect(resMe.body.data.user.tokenHash).toBeUndefined();

    const resSessions = await request(app)
      .get('/api/v1/auth/sessions')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(resSessions.status).toBe(200);
    for (const session of resSessions.body.data) {
      expect(session.tokenHash).toBeUndefined();
      expect(session.refreshTokenHash).toBeUndefined();
    }
  });

  it('7. IDOR Protection: User Cannot Revoke Another User Session', async () => {
    const resA = await request(app)
      .post('/api/v1/auth/login')
      .send({
        identifier: 'teacher1@littleangelsschool.edu.in',
        password: 'TeacherPassword10!',
      });
    const sessionIdA = resA.body.data.sessionId;

    const resB = await request(app)
      .post('/api/v1/auth/login')
      .send({
        identifier: 'teacher2@littleangelsschool.edu.in',
        password: 'TeacherPassword10!',
      });
    const tokenB = resB.body.data.accessToken;

    // Teacher 2 attempts to delete Teacher 1's session ID
    const attemptIdor = await request(app)
      .delete(`/api/v1/auth/sessions/${sessionIdA}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .set('X-Requested-With', 'XMLHttpRequest');

    expect(attemptIdor.status).toBe(403);
    expect(attemptIdor.body.errorCode).toBe('AUTH_SCOPE_FORBIDDEN');
  });
});
