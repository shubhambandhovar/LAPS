import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../app';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { hashPassword } from '../utils/crypto';
import { User } from '../models/User';
import { Role } from '../models/Role';
import { Permission } from '../models/Permission';
import { CmsPage } from '../models/CmsPage';

let mongoServer: MongoMemoryServer;
let app: ReturnType<typeof createApp>;

let contentEditorToken: string;
let teacherToken: string;

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
  await CmsPage.deleteMany({});

  const cmsPerm = await Permission.create({
    module: 'CMS',
    action: 'UPDATE',
    resource: 'cms',
    description: 'Manage CMS',
  });

  const editorRole = await Role.create({
    schoolId: 'LAPS-GOHAD',
    code: 'CONTENT_EDITOR',
    name: 'Content Editor',
    description: 'Content Editor',
    permissions: [cmsPerm._id],
  });

  const teacherRole = await Role.create({
    schoolId: 'LAPS-GOHAD',
    code: 'TEACHER',
    name: 'Teacher',
    description: 'Teacher',
    permissions: [], // No CMS perm
  });

  const pwHash = await hashPassword('Password123!');

  await User.create({
    schoolId: 'LAPS-GOHAD',
    identifier: 'editor@test.com',
    email: 'editor@test.com',
    passwordHash: pwHash,
    roleId: editorRole._id,
    roleCode: 'CONTENT_EDITOR',
    userType: 'STAFF',
    status: 'ACTIVE',
  });

  await User.create({
    schoolId: 'LAPS-GOHAD',
    identifier: 'teacher@test.com',
    email: 'teacher@test.com',
    passwordHash: pwHash,
    roleId: teacherRole._id,
    roleCode: 'TEACHER',
    userType: 'TEACHER',
    status: 'ACTIVE',
  });

  const res1 = await request(app).post('/api/v1/auth/login').send({ identifier: 'editor@test.com', password: 'Password123!' });
  contentEditorToken = res1.body.data.accessToken;

  const res2 = await request(app).post('/api/v1/auth/login').send({ identifier: 'teacher@test.com', password: 'Password123!' });
  teacherToken = res2.body.data.accessToken;
});

describe('Phase 14: Public Website & CMS Tests', () => {
  it('TEST-CMS-001: Content Editor can create a CMS page', async () => {
    const res = await request(app)
      .post('/api/v1/cms/pages')
      .set('Authorization', `Bearer ${contentEditorToken}`)
      .send({
        title: 'About Us',
        slug: 'about-us',
        content: '<h1>About LAPS</h1>',
        status: 'DRAFT',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('About Us');
    expect(res.body.data.slug).toBe('about-us');
    expect(res.body.data.status).toBe('DRAFT');
  });

  it('TEST-CMS-002: Teacher gets 403 Forbidden when trying to access CMS', async () => {
    const res = await request(app)
      .post('/api/v1/cms/pages')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        title: 'Unauthorized Page',
        slug: 'unauth',
        content: 'Bad',
      });

    expect(res.status).toBe(403);
    expect(res.body.errorCode).toBe('RBAC_PERMISSION_DENIED');
  });

  it('TEST-CMS-003: Public API does not expose DRAFT pages', async () => {
    // 1. Editor creates draft
    await request(app)
      .post('/api/v1/cms/pages')
      .set('Authorization', `Bearer ${contentEditorToken}`)
      .send({
        title: 'Secret Page',
        slug: 'secret-page',
        content: 'Shh',
        status: 'DRAFT',
      });

    // 2. Public API request
    const res = await request(app).get('/api/v1/public/pages/secret-page');
    expect(res.status).toBe(404);
  });

  it('TEST-CMS-004: Public API exposes PUBLISHED pages', async () => {
    // 1. Editor creates draft
    const createRes = await request(app)
      .post('/api/v1/cms/pages')
      .set('Authorization', `Bearer ${contentEditorToken}`)
      .send({
        title: 'Public Page',
        slug: 'public-page',
        content: 'Hello World',
        status: 'DRAFT',
      });
      
    const pageId = createRes.body.data.id;

    // 2. Editor publishes it
    const pubRes = await request(app)
      .post(`/api/v1/cms/pages/${pageId}/publish`)
      .set('Authorization', `Bearer ${contentEditorToken}`);
      
    expect(pubRes.status).toBe(200);

    // 3. Public API request
    const res = await request(app).get('/api/v1/public/pages/public-page');
    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Public Page');
    expect(res.body.data.content).toBe('Hello World');
  });
});
