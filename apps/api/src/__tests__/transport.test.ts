/**
 * Transport, Fleet & GPS Tracking Verification Suite — Phase 13
 *
 * Implements verification tests TEST-TRN-001 through TEST-TRN-010:
 * 1. TEST-TRN-001: Create Vehicle, Driver, Route, and Stop
 * 2. TEST-TRN-002: Student Transport Assignment & Stop Counter
 * 3. TEST-TRN-003: Duplicate Assignment Prevention
 * 4. TEST-TRN-004: Vehicle Capacity Validation
 * 5. TEST-TRN-005: Maintenance Scheduling
 * 6. TEST-TRN-006: GPS Telemetry & Live Tracking
 * 7. TEST-TRN-007: Teacher Dismissal & Bus Duty Scoping
 * 8. TEST-TRN-008: Student & Guardian RBAC Isolation
 * 9. TEST-TRN-009: Transport Analytics & Summary KPI Calculation
 * 10. TEST-TRN-010: Route Overlap & Archiving Validation
 */

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
import { Guardian } from '../models/Guardian';
import { StudentGuardian } from '../models/StudentGuardian';
import { Vehicle } from '../models/Vehicle';
import { Permission } from '../models/Permission';
import { Stop } from '../models/Stop';
import { Route } from '../models/Route';

let mongoServer: MongoMemoryServer;
let app: ReturnType<typeof createApp>;
let adminToken: string;
let teacherToken: string;
let studentToken: string;
let guardianToken: string;
let driverToken: string;

let schoolId = 'LAPS-GOHAD';
let sessionId: string;
let classId: string;
let sectionId: string;
let unassignedClassId: string;
let studentId: string;
let secondStudentId: string;
let enrollmentId: string;
let secondEnrollmentId: string;
let driverUserId: string;
let adminUserId: string;

let vehicleId: string;
let smallVehicleId: string;
let driverDocId: string;
let stopId: string;
let routeId: string;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await connectDatabase(mongoServer.getUri());
  app = createApp();

  const passwordHash = await hashPassword('TestPass@123');
  // Ensure Roles exist
  const superAdminRole = await Role.create({
    schoolId,
    code: 'SUPER_ADMIN',
    name: 'Super Admin Role',
    description: 'System Super Admin',
    isSystem: true,
  });

  const permReadAssignment = await Permission.create({
    module: 'TRANSPORT',
    action: 'READ',
    resource: 'assignment',
    description: 'Read transport assignments',
  });

  const permCreateTelemetry = await Permission.create({
    module: 'TRANSPORT',
    action: 'CREATE',
    resource: 'telemetry',
    description: 'Submit telemetry',
  });

  const permReadTelemetry = await Permission.create({
    module: 'TRANSPORT',
    action: 'READ',
    resource: 'telemetry',
    description: 'Read telemetry',
  });

  const teacherRole = await Role.create({
    schoolId,
    code: 'TEACHER',
    name: 'Teacher Role',
    description: 'Teacher access',
    isSystem: true,
    permissions: [permReadAssignment._id],
  });

  const studentRole = await Role.create({
    schoolId,
    code: 'STUDENT',
    name: 'Student Role',
    description: 'Student access',
    isSystem: true,
    permissions: [permReadAssignment._id, permReadTelemetry._id],
  });

  const guardianRole = await Role.create({
    schoolId,
    code: 'GUARDIAN',
    name: 'Guardian Role',
    description: 'Guardian access',
    isSystem: true,
    permissions: [permReadAssignment._id, permReadTelemetry._id],
  });

  const driverRole = await Role.create({
    schoolId,
    code: 'DRIVER',
    name: 'Driver Role',
    description: 'Driver access',
    isSystem: true,
    permissions: [permCreateTelemetry._id],
  });

  // Create Users
  const adminUser = await User.create({
    schoolId,
    identifier: 'admin.transport@laps.in',
    email: 'admin.transport@laps.in',
    passwordHash,
    roleId: superAdminRole._id,
    roleCode: 'SUPER_ADMIN',
    userType: 'SUPER_ADMIN',
    status: 'ACTIVE',
  });
  adminUserId = adminUser._id.toString();

  const teacherUser = await User.create({
    schoolId,
    identifier: 'teacher.transport@laps.in',
    email: 'teacher.transport@laps.in',
    passwordHash,
    roleId: teacherRole._id,
    roleCode: 'TEACHER',
    userType: 'TEACHER',
    status: 'ACTIVE',
  });

  const studentUser = await User.create({
    schoolId,
    identifier: 'student.transport@laps.in',
    email: 'student.transport@laps.in',
    passwordHash,
    roleId: studentRole._id,
    roleCode: 'STUDENT',
    userType: 'STUDENT',
    status: 'ACTIVE',
  });

  const secondStudentUser = await User.create({
    schoolId,
    identifier: 'student2.transport@laps.in',
    email: 'student2.transport@laps.in',
    passwordHash,
    roleId: studentRole._id,
    roleCode: 'STUDENT',
    userType: 'STUDENT',
    status: 'ACTIVE',
  });

  const guardianUser = await User.create({
    schoolId,
    identifier: 'guardian.transport@laps.in',
    email: 'guardian.transport@laps.in',
    passwordHash,
    roleId: guardianRole._id,
    roleCode: 'GUARDIAN',
    userType: 'GUARDIAN',
    status: 'ACTIVE',
  });

  const driverUser = await User.create({
    schoolId,
    identifier: 'driver.transport@laps.in',
    email: 'driver.transport@laps.in',
    passwordHash,
    roleId: driverRole._id,
    roleCode: 'DRIVER',
    userType: 'STAFF',
    status: 'ACTIVE',
  });
  driverUserId = driverUser._id.toString();

  // Login Admin
  const adminLogin = await request(app)
    .post('/api/v1/auth/login')
    .send({ identifier: 'admin.transport@laps.in', password: 'TestPass@123' });
  adminToken = adminLogin.body.data.accessToken;

  // Login Teacher
  const teacherLogin = await request(app)
    .post('/api/v1/auth/login')
    .send({ identifier: 'teacher.transport@laps.in', password: 'TestPass@123' });
  teacherToken = teacherLogin.body.data.accessToken;

  // Login Student
  const studentLogin = await request(app)
    .post('/api/v1/auth/login')
    .send({ identifier: 'student.transport@laps.in', password: 'TestPass@123' });
  studentToken = studentLogin.body.data.accessToken;

  // Login Guardian
  const guardianLogin = await request(app)
    .post('/api/v1/auth/login')
    .send({ identifier: 'guardian.transport@laps.in', password: 'TestPass@123' });
  guardianToken = guardianLogin.body.data.accessToken;

  // Login Driver
  const driverLogin = await request(app)
    .post('/api/v1/auth/login')
    .send({ identifier: 'driver.transport@laps.in', password: 'TestPass@123' });
  driverToken = driverLogin.body.data.accessToken;

  // Create Academic Session
  const session = await AcademicSession.create({
    schoolId,
    name: '2026-2027',
    startDate: new Date('2026-04-01'),
    endDate: new Date('2027-03-31'),
    isCurrent: true,
    createdBy: adminUserId,
    updatedBy: adminUserId,
  });
  sessionId = session._id.toString();

  // Create Classes and Section
  const cls = await Class.create({
    schoolId,
    name: 'Class 8 Transport',
    code: 'CLS8TRN',
    orderSequence: 8,
    level: 'MIDDLE',
    academicSessionId: session._id,
    createdBy: adminUserId,
    updatedBy: adminUserId,
  });
  classId = cls._id.toString();

  const unassignedCls = await Class.create({
    schoolId,
    name: 'Class 10 Transport',
    code: 'CLS10TRN',
    orderSequence: 10,
    level: 'SECONDARY',
    academicSessionId: session._id,
    createdBy: adminUserId,
    updatedBy: adminUserId,
  });
  unassignedClassId = unassignedCls._id.toString();

  const sec = await Section.create({
    schoolId,
    classId: cls._id,
    name: 'A',
    academicSessionId: session._id,
    createdBy: adminUserId,
    updatedBy: adminUserId,
  });
  sectionId = sec._id.toString();

  // Create Student profiles
  const studentDoc = await Student.create({
    schoolId,
    userId: studentUser._id,
    admissionNumber: 'TRN-2026-01',
    firstName: 'Arjun',
    lastName: 'Sharma',
    dateOfBirth: new Date('2012-05-15'),
    gender: 'MALE',
    address: '123 Fort Rd, Gohad',
    pinCode: '477116',
    createdBy: adminUserId,
    updatedBy: adminUserId,
  });
  studentId = studentDoc._id.toString();
  studentUser.profileRef = studentDoc._id as any;
  await studentUser.save();

  const secondStudentDoc = await Student.create({
    schoolId,
    userId: secondStudentUser._id,
    admissionNumber: 'TRN-2026-02',
    firstName: 'Rohan',
    lastName: 'Verma',
    dateOfBirth: new Date('2012-06-20'),
    gender: 'MALE',
    address: '124 Fort Rd, Gohad',
    pinCode: '477116',
    createdBy: adminUserId,
    updatedBy: adminUserId,
  });
  secondStudentId = secondStudentDoc._id.toString();

  // Create Enrollments
  const firstEnrDoc = await Enrollment.create({
    schoolId,
    studentId: studentDoc._id,
    classId: cls._id,
    sectionId: sec._id,
    academicSessionId: session._id,
    rollNumber: 1,
    status: 'ACTIVE',
    createdBy: adminUserId,
    updatedBy: adminUserId,
  });
  enrollmentId = firstEnrDoc._id.toString();

  const secondEnrDoc = await Enrollment.create({
    schoolId,
    studentId: secondStudentDoc._id,
    classId: cls._id,
    sectionId: sec._id,
    academicSessionId: session._id,
    rollNumber: 2,
    status: 'ACTIVE',
    createdBy: adminUserId,
    updatedBy: adminUserId,
  });
  secondEnrollmentId = secondEnrDoc._id.toString();

  // Create Teacher Profile & Assignment
  const teacherDoc = await Teacher.create({
    schoolId,
    userId: teacherUser._id,
    employeeId: 'EMP-TRN-01',
    firstName: 'Vijay',
    lastName: 'Kumar',
    designation: 'PGT',
    department: 'Science',
    email: 'teacher.transport@laps.in',
    phone: '9876543210',
    joiningDate: new Date('2024-01-01'),
    qualification: 'B.Ed',
    status: 'ACTIVE',
    createdBy: adminUserId,
    updatedBy: adminUserId,
  });
  teacherUser.profileRef = teacherDoc._id as any;
  await teacherUser.save();

  await TeachingAssignment.create({
    schoolId,
    teacherId: teacherDoc._id,
    classId: cls._id,
    sectionId: sec._id,
    academicSessionId: session._id,
    subjectId: teacherDoc._id, // placeholder
    role: 'CLASS_TEACHER',
    effectiveFrom: new Date('2026-04-01'),
    status: 'ACTIVE',
    createdBy: adminUserId,
    updatedBy: adminUserId,
  });

  // Create Guardian Profile & Link
  const guardianDoc = await Guardian.create({
    schoolId,
    userId: guardianUser._id,
    name: 'Rajesh Sharma',
    phone: '9876543210',
    relationship: 'FATHER',
    createdBy: adminUserId,
    updatedBy: adminUserId,
  });
  guardianUser.profileRef = guardianDoc._id as any;
  await guardianUser.save();

  await StudentGuardian.create({
    schoolId,
    studentId: studentDoc._id,
    guardianId: guardianDoc._id,
    relationship: 'FATHER',
    isPrimary: true,
    createdBy: adminUserId,
    updatedBy: adminUserId,
  });
});

afterAll(async () => {
  await disconnectDatabase();
  await mongoServer.stop();
});

describe('Phase 13: Transport, Fleet & GPS Tracking Verification Suite', () => {
  it('TEST-TRN-001: Create Vehicle, Driver, Route, and Stop', async () => {
    // 1. Create Vehicle
    const vehicleRes = await request(app)
      .post('/api/v1/vehicles')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        schoolId,
        registrationNumber: 'MP-04-TR-1001',
        vehicleType: 'BUS',
        capacity: 40,
        status: 'ACTIVE',
      });
    expect(vehicleRes.status).toBe(201);
    vehicleId = vehicleRes.body.data._id;

    // Test duplicate registration number -> 409
    const dupRes = await request(app)
      .post('/api/v1/vehicles')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        schoolId,
        registrationNumber: 'MP-04-TR-1001',
        vehicleType: 'BUS',
        capacity: 40,
        status: 'ACTIVE',
      });
    expect(dupRes.status).toBe(409);

    // Create a vehicle with capacity = 1 for TEST-TRN-004
    const smallRes = await request(app)
      .post('/api/v1/vehicles')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        schoolId,
        registrationNumber: 'MP-04-TR-9999',
        vehicleType: 'VAN',
        capacity: 1,
        status: 'ACTIVE',
      });
    expect(smallRes.status).toBe(201);
    smallVehicleId = smallRes.body.data._id;

    // 2. Create Driver
    const driverRes = await request(app)
      .post('/api/v1/drivers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        schoolId,
        userId: driverUserId,
        driverProfile: {
          firstName: 'Ramesh',
          lastName: 'Yadav',
          phone: '9876543211',
          address: 'Gohad Main Rd',
          city: 'Gohad',
          state: 'MP',
          pinCode: '477116',
        },
        licenseDetails: {
          licenseNumber: 'MP-04-2020-0012345',
          licenseType: 'HEAVY_PASSENGER',
          issuingAuthority: 'RTO Gwalior',
          validFrom: '2020-01-01',
          validUntil: '2030-12-31',
        },
        emergencyContact: {
          name: 'Suresh Yadav',
          relationship: 'BROTHER',
          phone: '9876543212',
        },
        medicalExpiry: '2028-12-31',
        status: 'ACTIVE',
      });
    expect(driverRes.status).toBe(201);
    driverDocId = driverRes.body.data._id;

    // Link driver profile to user and re-login to get token with profileRef
    await import('../models/User').then((m) =>
      m.User.updateOne({ _id: driverUserId }, { $set: { profileRef: driverDocId } })
    );
    const newDriverLogin = await request(app).post('/api/v1/auth/login').send({
      identifier: 'driver.transport@laps.in',
      password: 'TestPass@123',
    });
    driverToken = newDriverLogin.body.data.accessToken;

    // 3. Create Stop
    const stopRes = await request(app)
      .post('/api/v1/stops')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        schoolId,
        stopName: 'Gohad Fort Chowk',
        stopCode: 'STP-GHD-01',
        gpsCoordinates: { latitude: 26.4321, longitude: 78.4321 },
        pickupTime: '07:30',
        dropTime: '14:30',
      });
    expect(stopRes.status).toBe(201);
    stopId = stopRes.body.data._id;

    // 4. Create Route
    const routeRes = await request(app)
      .post('/api/v1/routes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        schoolId,
        routeName: 'Route 1 - Fort Chowk',
        routeCode: 'RT-01',
        source: {
          name: 'School Campus',
          gpsCoordinates: { latitude: 26.43, longitude: 78.43 },
        },
        destination: {
          name: 'Gohad Fort Chowk',
          gpsCoordinates: { latitude: 26.4321, longitude: 78.4321 },
        },
        stops: [
          {
            stopId,
            orderSequence: 1,
            estimatedArrivalFromStartMinutes: 15,
            studentCount: 0,
          },
        ],
        estimatedDurationMinutes: 30,
        distanceKm: 12.5,
        status: 'ACTIVE',
      });
    expect(routeRes.status).toBe(201);
    routeId = routeRes.body.data._id;
  });

  it('TEST-TRN-002: Student Transport Assignment', async () => {
    const res = await request(app)
      .post('/api/v1/assignments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        schoolId,
        studentId,
        enrollmentId,
        academicSessionId: sessionId,
        routeId,
        stopId,
        vehicleId,
        status: 'ACTIVE',
      });
    expect(res.status).toBe(201);

    // Asserts automatic increment of studentCount on the Stop document
    const stopCheck = await Stop.findById(stopId);
    expect(stopCheck?.studentCount).toBe(1);
  });

  it('TEST-TRN-003: Duplicate Assignment Prevention', async () => {
    const res = await request(app)
      .post('/api/v1/assignments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        schoolId,
        studentId,
        enrollmentId,
        academicSessionId: sessionId,
        routeId,
        stopId,
        vehicleId,
        status: 'ACTIVE',
      });
    expect(res.status).toBe(409);
    expect(res.body.message).toContain('already has an active transport assignment');
  });

  it('TEST-TRN-004: Vehicle Capacity Validation', async () => {
    // First assign second student to small vehicle (capacity 1)
    const assignRes = await request(app)
      .post('/api/v1/assignments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        schoolId,
        studentId: secondStudentId,
        enrollmentId: secondEnrollmentId,
        academicSessionId: sessionId,
        routeId,
        stopId,
        vehicleId: smallVehicleId,
        status: 'ACTIVE',
      });
    expect(assignRes.status).toBe(201);

    // Create a third student to attempt exceeding capacity
    const thirdStudentDoc = await Student.create({
      schoolId,
      admissionNumber: 'TRN-2026-03',
      firstName: 'Vikram',
      lastName: 'Singh',
      dateOfBirth: new Date('2012-07-20'),
      gender: 'MALE',
      address: '125 Fort Rd, Gohad',
      pinCode: '477116',
      createdBy: adminUserId,
      updatedBy: adminUserId,
    });

    const thirdEnrDoc = await Enrollment.create({
      schoolId,
      studentId: thirdStudentDoc._id,
      classId,
      sectionId,
      academicSessionId: sessionId,
      rollNumber: 3,
      status: 'ACTIVE',
      createdBy: adminUserId,
      updatedBy: adminUserId,
    });

    const exceedRes = await request(app)
      .post('/api/v1/assignments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        schoolId,
        studentId: thirdStudentDoc._id.toString(),
        enrollmentId: thirdEnrDoc._id.toString(),
        academicSessionId: sessionId,
        routeId,
        stopId,
        vehicleId: smallVehicleId,
        status: 'ACTIVE',
      });
    expect(exceedRes.status).toBe(409);
    expect(exceedRes.body.message).toContain('Vehicle capacity exceeded');
  });

  it('TEST-TRN-005: Maintenance Scheduling', async () => {
    const res = await request(app)
      .post('/api/v1/maintenance')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        schoolId,
        vehicleId,
        maintenanceType: 'SERVICE_SCHEDULE',
        serviceDate: '2026-08-01',
        odometerReadingKm: 15000,
        costAmount: 4500,
        serviceProvider: 'Tata Motors Gohad',
        description: 'Routine quarterly engine service and oil change',
        status: 'IN_PROGRESS',
      });
    expect(res.status).toBe(201);

    // Asserts vehicle status transitioned to MAINTENANCE
    const vehicleCheck = await Vehicle.findById(vehicleId);
    expect(vehicleCheck?.status).toBe('MAINTENANCE');

    // Reset vehicle to ACTIVE for subsequent tests
    await Vehicle.findByIdAndUpdate(vehicleId, { status: 'ACTIVE' });
  });

  it('TEST-TRN-006: GPS Telemetry & Live Tracking', async () => {
    const telemetryRes = await request(app)
      .post('/api/v1/gps/telemetry')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({
        vehicleId,
        routeId,
        driverId: driverDocId,
        coordinates: { latitude: 26.431, longitude: 78.431 },
        speedKmh: 40,
        headingDegrees: 180,
      });
    expect(telemetryRes.status).toBe(201);

    const liveRes = await request(app)
      .get(`/api/v1/gps/live?vehicleId=${vehicleId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(liveRes.status).toBe(200);
    expect(liveRes.body.data.speedKmh).toBe(40);
    expect(liveRes.body.data.routeProgress).toBeDefined();
  });

  it('TEST-TRN-007: Teacher Dismissal & Bus Duty Scoping', async () => {
    // Teacher queries assignments for their assigned class -> 200
    const assignedRes = await request(app)
      .get(`/api/v1/assignments?classId=${classId}`)
      .set('Authorization', `Bearer ${teacherToken}`);
    expect(assignedRes.status).toBe(200);

    // Teacher queries unassigned class -> 403
    const unassignedRes = await request(app)
      .get(`/api/v1/assignments?classId=${unassignedClassId}`)
      .set('Authorization', `Bearer ${teacherToken}`);
    expect(unassignedRes.status).toBe(403);

    // Teacher attempts administrative mutation -> 403
    const mutRes = await request(app)
      .post('/api/v1/vehicles')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        schoolId,
        registrationNumber: 'MP-04-TR-8888',
        vehicleType: 'BUS',
        capacity: 40,
      });
    expect(mutRes.status).toBe(403);
  });

  it('TEST-TRN-008: Student & Guardian RBAC Isolation', async () => {
    // Student views live tracking for their assigned bus -> 200
    const studentOk = await request(app)
      .get(`/api/v1/gps/live?vehicleId=${vehicleId}`)
      .set('Authorization', `Bearer ${studentToken}`);
    expect(studentOk.status).toBe(200);

    // Student attempts to view live tracking for another bus -> 403
    const studentDenied = await request(app)
      .get(`/api/v1/gps/live?vehicleId=${smallVehicleId}`)
      .set('Authorization', `Bearer ${studentToken}`);
    expect(studentDenied.status).toBe(403);

    // Guardian views live tracking for their ward's assigned bus -> 200
    const guardianOk = await request(app)
      .get(`/api/v1/gps/live?vehicleId=${vehicleId}`)
      .set('Authorization', `Bearer ${guardianToken}`);
    expect(guardianOk.status).toBe(200);
  });

  it('TEST-TRN-009: Transport Analytics & Summary KPI Calculation', async () => {
    const res = await request(app)
      .get(`/api/v1/transport-summary?academicSessionId=${sessionId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.totalVehicles).toBeGreaterThanOrEqual(2);
    expect(res.body.data.totalDrivers).toBeGreaterThanOrEqual(1);
    expect(res.body.data.totalRoutes).toBeGreaterThanOrEqual(1);
    expect(res.body.data.totalAssignedStudents).toBeGreaterThanOrEqual(2);
    expect(res.body.data.overallOccupancyPercentage).toBeDefined();
  });

  it('TEST-TRN-010: Route Overlap & Archiving Validation', async () => {
    // Archive route via DELETE /api/v1/routes/:id
    const deleteRes = await request(app)
      .delete(`/api/v1/routes/${routeId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(deleteRes.status).toBe(200);

    const routeCheck = await Route.findById(routeId);
    expect(routeCheck?.status).toBe('ARCHIVED');

    // Attempting new assignment to archived route -> 400 Bad Request
    const createRes = await request(app)
      .post('/api/v1/assignments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        schoolId,
        studentId: secondStudentId,
        enrollmentId: secondEnrollmentId,
        academicSessionId: sessionId,
        routeId,
        stopId,
        vehicleId,
        status: 'ACTIVE',
      });
    expect(createRes.status).toBe(400);
    expect(createRes.body.message).toContain('Cannot assign student to an archived route');
  });
});
