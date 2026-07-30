import { describe, it, expect, beforeAll, afterAll } from 'vitest';
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
import { Student } from '../models/Student';
import { Enrollment } from '../models/Enrollment';
import { Teacher } from '../models/Teacher';
import { TeachingAssignment } from '../models/TeachingAssignment';
import { Subject } from '../models/Subject';
import { ClassSubject } from '../models/ClassSubject';
import { DeliveryLog } from '../models/DeliveryLog';

let mongoServer: MongoMemoryServer;
let app: ReturnType<typeof createApp>;
let adminToken: string;
let teacherToken: string;
let studentToken: string;

let studentUserId: string;

let academicSessionId: string;
let classId: string;
let sectionId: string;
let subjectId: string;
let classSubjectId: string;
let templateId: string;
let noticeId: string;
let notificationId: string;
let scheduledJobId: string;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await connectDatabase(uri);
  app = createApp();

  const passwordHash = await hashPassword('Test@1234!');

  // Create Roles
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

  // Create Admin User
  const adminUser = await User.create({
    schoolId: 'LAPS-GOHAD',
    identifier: 'admin_comm@laps.local',
    email: 'admin_comm@laps.local',
    passwordHash,
    roleId: adminRole._id,
    roleCode: 'SCHOOL_ADMIN',
    userType: 'SCHOOL_ADMIN',
    status: 'ACTIVE',
  });

  const adminLogin = await request(app)
    .post('/api/v1/auth/login')
    .send({ identifier: 'admin_comm@laps.local', password: 'Test@1234!' });
  adminToken = adminLogin.body.data.accessToken;

  // Create Teacher
  const teacherProfile = await Teacher.create({
    employeeId: 'EMP-COMM-01',
    firstName: 'Ravi',
    lastName: 'Teacher',
    email: 'teacher_comm@laps.local',
    phone: '9876543210',
    joiningDate: new Date('2024-01-01'),
    qualification: 'M.Ed',
    designation: 'PGT',
    status: 'ACTIVE',
    createdBy: adminUser._id,
    updatedBy: adminUser._id,
  });

  const teacherUser = await User.create({
    schoolId: 'LAPS-GOHAD',
    identifier: 'teacher_comm@laps.local',
    email: 'teacher_comm@laps.local',
    passwordHash,
    roleId: teacherRole._id,
    roleCode: 'TEACHER',
    userType: 'TEACHER',
    status: 'ACTIVE',
    profileRef: teacherProfile._id,
  });
  teacherProfile.userId = teacherUser._id;
  await teacherProfile.save();

  const teacherLogin = await request(app)
    .post('/api/v1/auth/login')
    .send({ identifier: 'teacher_comm@laps.local', password: 'Test@1234!' });
  teacherToken = teacherLogin.body.data.accessToken;

  // Create Student
  const studentProfile = await Student.create({
    admissionNumber: 'ADM-COMM-001',
    firstName: 'Aarav',
    lastName: 'Student',
    gender: 'MALE',
    dateOfBirth: '2011-05-15',
    address: '123 Main St',
    city: 'Gohad',
    state: 'MP',
    pinCode: '477116',
    status: 'ACTIVE',
    createdBy: adminUser._id,
    updatedBy: adminUser._id,
  });

  const studentUser = await User.create({
    schoolId: 'LAPS-GOHAD',
    identifier: 'student_comm@laps.local',
    email: 'student_comm@laps.local',
    passwordHash,
    roleId: studentRole._id,
    roleCode: 'STUDENT',
    userType: 'STUDENT',
    status: 'ACTIVE',
    profileRef: studentProfile._id,
  });
  studentUserId = studentUser._id.toString();

  const studentLogin = await request(app)
    .post('/api/v1/auth/login')
    .send({ identifier: 'student_comm@laps.local', password: 'Test@1234!' });
  studentToken = studentLogin.body.data.accessToken;

  // Create Academic Session, Class, Section, Subject, Enrollment, TeachingAssignment
  const session = await AcademicSession.create({
    schoolId: 'LAPS-GOHAD',
    code: 'SESS-2026-COMM',
    name: '2026-2027 Comm Session',
    startDate: new Date('2026-04-01'),
    endDate: new Date('2027-03-31'),
    status: 'ACTIVE',
    createdBy: adminUser._id,
    updatedBy: adminUser._id,
  });
  academicSessionId = session._id.toString();

  const cls = await Class.create({
    name: 'Class 10 Comm',
    code: 'CLS10_COMM',
    orderSequence: 10,
    displayOrder: 10,
    level: 'SECONDARY',
    academicSessionId,
    createdBy: adminUser._id,
    updatedBy: adminUser._id,
  });
  classId = cls._id.toString();

  const sec = await Section.create({
    classId,
    name: 'Section A Comm',
    code: 'SEC-10A-COMM',
    roomNumber: '101',
    capacity: 40,
    academicSessionId,
    createdBy: adminUser._id,
    updatedBy: adminUser._id,
  });
  sectionId = sec._id.toString();

  const subjectDoc = await Subject.create({
    name: 'English Comm',
    code: 'ENG101_COMM',
    shortName: 'ENG',
    department: 'Languages',
    subjectType: 'THEORY',
    status: 'ACTIVE',
    isActive: true,
    createdBy: adminUser._id,
    updatedBy: adminUser._id,
  });
  subjectId = subjectDoc._id.toString();

  const classSubDoc = await ClassSubject.create({
    classId,
    subjectId,
    academicSessionId,
    credits: 4,
    isOptional: false,
    status: 'ACTIVE',
    createdBy: adminUser._id,
    updatedBy: adminUser._id,
  });
  classSubjectId = classSubDoc._id.toString();

  await Enrollment.create({
    admissionNumber: 'ADM-COMM-001',
    studentId: studentProfile._id,
    academicSessionId,
    classId,
    sectionId,
    rollNumber: 1,
    enrollmentDate: new Date('2026-04-01'),
    enrollmentStatus: 'ACTIVE',
    createdBy: adminUser._id,
    updatedBy: adminUser._id,
  });

  await TeachingAssignment.create({
    teacherId: teacherProfile._id,
    academicSessionId,
    classId,
    sectionId,
    subjectId,
    classSubjectId,
    effectiveFrom: new Date('2026-04-01'),
    workloadWeight: 1,
    isPrimary: true,
    isClassTeacher: true,
    status: 'ACTIVE',
    createdBy: adminUser._id,
    updatedBy: adminUser._id,
  });
}, 30000);

afterAll(async () => {
  await disconnectDatabase();
  await mongoServer.stop();
});

describe('Phase 11 — Communication & Notification System Integration Tests', () => {
  describe('1. NotificationPreference Management (#61)', () => {
    it('GET /api/v1/preferences/my - should generate default opt-in preferences for new user', async () => {
      const res = await request(app)
        .get('/api/v1/preferences/my')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.userId).toBe(studentUserId);
      expect(res.body.data.preferences.attendance.inApp).toBe(true);
      expect(res.body.data.preferences.fee.email).toBe(true);
    });

    it('PUT /api/v1/preferences/my - should update category channel opt-out settings', async () => {
      const res = await request(app)
        .put('/api/v1/preferences/my')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          fee: {
            inApp: true,
            email: false, // Opt out of fee email
            sms: false,
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.data.preferences.fee.email).toBe(false);
      expect(res.body.data.preferences.fee.inApp).toBe(true);
    });

    it('GET /api/v1/preferences/:userId - Admin can inspect any user preferences', async () => {
      const res = await request(app)
        .get(`/api/v1/preferences/${studentUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.preferences.fee.email).toBe(false);
    });
  });

  describe('2. NotificationTemplate Management (#59)', () => {
    it('POST /api/v1/templates - Admin can create a localization-ready Mustache template', async () => {
      const res = await request(app)
        .post('/api/v1/templates')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: 'FEE_DUE_REMINDER',
          name: 'Fee Due Reminder',
          category: 'FEE',
          channels: ['IN_APP', 'EMAIL', 'SMS'],
          subjectTemplate: 'Installment Due: {{invoiceNumber}}',
          bodyTemplate: 'Dear {{studentName}}, installment of {{amount}} is due on {{dueDate}}.',
          variables: ['invoiceNumber', 'studentName', 'amount', 'dueDate'],
          locale: 'en',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.code).toBe('FEE_DUE_REMINDER');
      templateId = res.body.data._id;
    });

    it('POST /api/v1/templates - should prevent duplicate code-locale pairs', async () => {
      const res = await request(app)
        .post('/api/v1/templates')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: 'FEE_DUE_REMINDER',
          name: 'Fee Due Reminder Duplicate',
          category: 'FEE',
          channels: ['IN_APP'],
          bodyTemplate: 'Duplicate test',
          locale: 'en',
        });

      expect(res.status).toBe(409);
    });

    it('POST /api/v1/templates/:id/preview - should interpolate Mustache variables dynamically', async () => {
      const res = await request(app)
        .post(`/api/v1/templates/${templateId}/preview`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          variables: {
            invoiceNumber: 'INV-2026-001',
            studentName: 'Bob Student',
            amount: '$500',
            dueDate: '2026-08-15',
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.data.renderedSubject).toBe('Installment Due: INV-2026-001');
      expect(res.body.data.renderedBody).toContain('Dear Bob Student');
      expect(res.body.data.renderedBody).toContain('$500');
    });
  });

  describe('3. Notice & Circular Board (#58)', () => {
    it('POST /api/v1/notices - Teacher can create a draft school notice targeting assigned class', async () => {
      const res = await request(app)
        .post('/api/v1/notices')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          title: 'Class 10 Exam Timetable Announcement',
          content: 'Please find attached the midterm schedule for Class 10.',
          type: 'CIRCULAR',
          status: 'DRAFT',
          targetRoles: ['STUDENT'],
          targetClassIds: [classId],
          targetSectionIds: [sectionId],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('DRAFT');
      noticeId = res.body.data._id;
    });

    it('PATCH /api/v1/notices/:id/publish - Teacher can publish their own notice', async () => {
      const res = await request(app)
        .patch(`/api/v1/notices/${noticeId}/publish`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('PUBLISHED');
      expect(res.body.data.publishDate).toBeDefined();
    });

    it('GET /api/v1/notices - Student can view published notice matching their class/section enrollment', async () => {
      const res = await request(app)
        .get('/api/v1/notices')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.notices.length).toBeGreaterThanOrEqual(1);
      const matched = res.body.data.notices.find((n: any) => n._id === noticeId);
      expect(matched).toBeDefined();
      expect(matched.title).toBe('Class 10 Exam Timetable Announcement');
    });

    it('POST /api/v1/notices - Teacher attempting to target unassigned class should be denied (RBAC)', async () => {
      const unassignedClassId = '66f0a1b2c3d4e5f60718293a'; // Random ObjectID
      const res = await request(app)
        .post('/api/v1/notices')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          title: 'Unauthorized Class Circular',
          content: 'Should fail',
          type: 'CIRCULAR',
          status: 'DRAFT',
          targetClassIds: [unassignedClassId],
        });

      expect(res.status).toBe(403);
    });
  });

  describe('4. Notification Delivery Hub & Bulk Sending (#57 & #60)', () => {
    it('POST /api/v1/notifications/send - Admin can dispatch direct notification with multi-channel logging', async () => {
      const res = await request(app)
        .post('/api/v1/notifications/send')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Direct Academic Alert',
          message: 'Your attendance dropped below 75%',
          priority: 'HIGH',
          category: 'ATTENDANCE',
          recipientIds: [studentUserId],
          channels: ['IN_APP', 'EMAIL', 'SMS'],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.totalRecipients).toBe(1);
      expect(res.body.data.notificationsCreated).toBe(1);
      expect(res.body.data.deliveryLogsCreated).toBeGreaterThanOrEqual(1);
    });

    it('POST /api/v1/notifications/bulk-send - Admin can broadcast template notification to target role', async () => {
      const res = await request(app)
        .post('/api/v1/notifications/bulk-send')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          templateCode: 'FEE_DUE_REMINDER',
          locale: 'en',
          category: 'FEE',
          priority: 'NORMAL',
          targetRoles: ['STUDENT'],
          variables: {
            invoiceNumber: 'INV-101',
            studentName: 'Bob Student',
            amount: '$500',
            dueDate: '2026-08-30',
          },
        });

      expect(res.status).toBe(201);
      expect(res.body.data.templateUsed).toBe('FEE_DUE_REMINDER');
      expect(res.body.data.totalRecipients).toBeGreaterThanOrEqual(1);
    });

    it('GET /api/v1/notifications - Student can view their alert feed and unread count', async () => {
      const listRes = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.data.notifications.length).toBeGreaterThanOrEqual(2);
      notificationId = listRes.body.data.notifications[0]._id;

      const countRes = await request(app)
        .get('/api/v1/notifications/unread-count')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(countRes.status).toBe(200);
      expect(countRes.body.data.unreadCount).toBeGreaterThanOrEqual(2);
    });

    it('PATCH /api/v1/notifications/:id/read - Student can mark a single notification as read', async () => {
      const res = await request(app)
        .patch(`/api/v1/notifications/${notificationId}/read`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.readStatus).toBe('READ');
      expect(res.body.data.readAt).toBeDefined();
    });

    it('PATCH /api/v1/notifications/read-all - Student can mark all unread notifications as read', async () => {
      const res = await request(app)
        .patch('/api/v1/notifications/read-all')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);

      const countRes = await request(app)
        .get('/api/v1/notifications/unread-count')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(countRes.body.data.unreadCount).toBe(0);
    });

    it('PATCH /api/v1/notifications/:id/archive - Student can archive a notification', async () => {
      const res = await request(app)
        .patch(`/api/v1/notifications/${notificationId}/archive`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.isArchived).toBe(true);
    });
  });

  describe('5. Delivery Telemetry & Retry Management (#60)', () => {
    it('GET /api/v1/delivery-logs/stats - Admin can retrieve multi-channel telemetry breakdown', async () => {
      const res = await request(app)
        .get('/api/v1/delivery-logs/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.IN_APP).toBeDefined();
      expect(res.body.data.EMAIL).toBeDefined();
      expect(res.body.data.SMS).toBeDefined();
    });

    it('POST /api/v1/delivery-logs/:id/retry - Admin can retry a FAILED delivery log', async () => {
      const failedLog = await DeliveryLog.create({
        recipientId: studentUserId,
        channel: 'SMS',
        status: 'FAILED',
        retryCount: 0,
        maxRetries: 3,
        failureReason: 'SMS Gateway Timeout',
      });

      const res = await request(app)
        .post(`/api/v1/delivery-logs/${failedLog._id}/retry`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('DELIVERED');
      expect(res.body.data.retryCount).toBe(1);
      expect(res.body.data.deliveredAt).toBeDefined();
    });
  });

  describe('6. ScheduledNotification Queue Manager (#62)', () => {
    it('POST /api/v1/scheduled-notifications - Admin can queue a scheduled broadcast job', async () => {
      const res = await request(app)
        .post('/api/v1/scheduled-notifications')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Monthly Exam Review Reminder',
          message: 'Please review marks before 15th of the month.',
          category: 'EXAM',
          priority: 'NORMAL',
          targetType: 'ROLE',
          targetRoles: ['TEACHER'],
          scheduleType: 'SCHEDULED',
          scheduledAt: new Date(Date.now() + 86400000).toISOString(),
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('PENDING');
      scheduledJobId = res.body.data._id;
    });

    it('PATCH /api/v1/scheduled-notifications/:id/cancel - Admin can cancel a pending scheduled job', async () => {
      const res = await request(app)
        .patch(`/api/v1/scheduled-notifications/${scheduledJobId}/cancel`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('CANCELLED');
    });
  });
});
