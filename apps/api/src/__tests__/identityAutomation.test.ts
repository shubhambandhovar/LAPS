import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Types } from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { IdSequence, User, Role, Student, Teacher, Employee } from '../models';
import { IdentityAutomationService } from '../services/identityAutomation.service';
import { verifyPassword } from '../utils/crypto';

let mongoServer: MongoMemoryServer;
const dummyId = new Types.ObjectId();

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await connectDatabase(uri);
});

afterAll(async () => {
  await disconnectDatabase();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

beforeEach(async () => {
  await IdSequence.deleteMany({});
  await User.deleteMany({});
  await Role.deleteMany({});
  await Student.deleteMany({});
  await Teacher.deleteMany({});
  await Employee.deleteMany({});

  await Role.create([
    {
      schoolId: 'LAPS-GOHAD',
      code: 'STUDENT',
      name: 'Student',
      description: 'Student role',
      isSystem: true,
      permissions: [],
    },
    {
      schoolId: 'LAPS-GOHAD',
      code: 'TEACHER',
      name: 'Teacher',
      description: 'Teacher role',
      isSystem: true,
      permissions: [],
    },
    {
      schoolId: 'LAPS-GOHAD',
      code: 'STAFF',
      name: 'Staff',
      description: 'Staff role',
      isSystem: true,
      permissions: [],
    },
  ]);
});

describe('IdentityAutomationService', () => {
  it('should generate collision-free sequential IDs using IdentityAutomationService.generateId', async () => {
    const id1 = await IdentityAutomationService.generateId('STUDENT');
    const id2 = await IdentityAutomationService.generateId('STUDENT');
    const tchId = await IdentityAutomationService.generateId('TEACHER');
    const empId = await IdentityAutomationService.generateId('EMPLOYEE');

    const year = new Date().getFullYear();
    expect(id1).toBe(`LAS${year}00001`);
    expect(id2).toBe(`LAS${year}00002`);
    expect(tchId).toBe('TCH00001');
    expect(empId).toBe('EMP00001');
  });

  it('should automatically generate a Student ERP account and hash password securely', async () => {
    const student = await Student.create({
      schoolId: 'LAPS-GOHAD',
      admissionNumber: 'ADM-100',
      firstName: 'Aarav',
      lastName: 'Sharma',
      gender: 'MALE',
      dateOfBirth: new Date('2015-05-15'),
      currentClassId: new Types.ObjectId(),
      currentSectionId: new Types.ObjectId(),
      address: '123 Main Street, Gohad',
      pinCode: '477116',
      status: 'ACTIVE',
      createdBy: dummyId,
      updatedBy: dummyId,
    });

    const result = await IdentityAutomationService.generateStudentAccount(student._id);

    expect(result.user).toBeDefined();
    expect(result.user.roleCode).toBe('STUDENT');
    expect(result.user.status).toBe('PASSWORD_RESET_REQUIRED');
    expect(result.user.forcePasswordChange).toBe(true);
    expect(result.username.toUpperCase()).toBe(result.generatedId.toUpperCase());

    const isMatch = await verifyPassword(result.temporaryPassword, result.user.passwordHash);
    expect(isMatch).toBe(true);

    const linkedUser = await User.findOne({ profileRef: student._id });
    expect(linkedUser?._id.toString()).toBe(result.user._id.toString());
  });

  it('should automatically generate a Teacher ERP account with TCH sequence', async () => {
    const teacher = await Teacher.create({
      schoolId: 'LAPS-GOHAD',
      employeeId: 'EMP-T1',
      firstName: 'Anjali',
      lastName: 'Gupta',
      email: 'anjali@little.edu',
      phone: '9876543210',
      designation: 'PRT',
      qualification: 'B.Ed, M.Sc',
      joiningDate: new Date('2023-04-01'),
      status: 'ACTIVE',
      createdBy: dummyId,
      updatedBy: dummyId,
    });

    const result = await IdentityAutomationService.generateTeacherAccount(teacher._id);

    expect(result.user).toBeDefined();
    expect(result.user.roleCode).toBe('TEACHER');
    expect(result.username).toBe('anjali');
    expect(result.user.status).toBe('PASSWORD_RESET_REQUIRED');
    expect(result.user.forcePasswordChange).toBe(true);

    const isMatch = await verifyPassword(result.temporaryPassword, result.user.passwordHash);
    expect(isMatch).toBe(true);

    const updatedTeacher = await Teacher.findById(teacher._id);
    expect(updatedTeacher?.userId?.toString()).toBe(result.user._id.toString());
  });

  it('should reset an existing user password and enforce forced password change', async () => {
    const teacher = await Teacher.create({
      schoolId: 'LAPS-GOHAD',
      employeeId: 'EMP-T2',
      firstName: 'Ravi',
      lastName: 'Verma',
      email: 'ravi@little.edu',
      phone: '9876543211',
      designation: 'TGT',
      qualification: 'B.Ed, B.Sc',
      joiningDate: new Date('2023-04-01'),
      status: 'ACTIVE',
      createdBy: dummyId,
      updatedBy: dummyId,
    });

    const initialResult = await IdentityAutomationService.generateTeacherAccount(teacher._id);

    const resetResult = await IdentityAutomationService.resetPassword(initialResult.user._id, false);

    expect(resetResult.temporaryPassword).toBeDefined();
    expect(resetResult.temporaryPassword).not.toBe(initialResult.temporaryPassword);

    const updatedUser = await User.findById(initialResult.user._id).select('+passwordHash');
    expect(updatedUser?.forcePasswordChange).toBe(true);
    expect(updatedUser?.status).toBe('PASSWORD_RESET_REQUIRED');

    if (updatedUser && updatedUser.passwordHash) {
      const isMatch = await verifyPassword(resetResult.temporaryPassword, updatedUser.passwordHash);
      expect(isMatch).toBe(true);
    }
  });
});
