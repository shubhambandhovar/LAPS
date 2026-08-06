import { Types } from 'mongoose';
import {
  IdSequence,
  User,
  Role,
  Student,
  Teacher,
  Employee,
  StudentGuardian,
  Notification,
} from '../models';
import { hashPassword } from '../utils/crypto';
import { logger } from '../config/logger';
import { AppError } from '../utils/errors';
import { ErrorCodes } from '@laps/shared';

export interface GeneratedAccountResult {
  user: any;
  generatedId: string;
  username: string;
  temporaryPassword: string;
}

export class IdentityAutomationService {
  /**
   * Generates an atomic sequential ID using IdSequence counter.
   * Student format: LAS202600001 (resets yearly)
   * Teacher format: TCH00001
   * Employee format: EMP00001
   */
  public static async generateId(
    sequenceType: 'STUDENT' | 'TEACHER' | 'EMPLOYEE',
    customPrefix?: string,
    schoolId = 'LAPS-GOHAD',
  ): Promise<string> {
    const currentYear = new Date().getFullYear();
    const isYearly = sequenceType === 'STUDENT';
    const year = isYearly ? currentYear : 0;
    const defaultPrefixMap: Record<'STUDENT' | 'TEACHER' | 'EMPLOYEE', string> = {
      STUDENT: 'LAS',
      TEACHER: 'TCH',
      EMPLOYEE: 'EMP',
    };
    const prefix = customPrefix?.toUpperCase() || defaultPrefixMap[sequenceType];

    const sequence = await IdSequence.findOneAndUpdate(
      { schoolId, sequenceType, year, prefix },
      { $inc: { currentValue: 1 } },
      { upsert: true, new: true },
    );

    const paddedNum = sequence.currentValue.toString().padStart(5, '0');
    if (isYearly) {
      return `${prefix}${year}${paddedNum}`;
    }
    return `${prefix}${paddedNum}`;
  }

  /**
   * Generates a secure random 12-character password.
   * Requires Uppercase, Lowercase, Numbers, and Special characters.
   */
  public static generateSecurePassword(): string {
    const uppers = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lowers = 'abcdefghijkmnopqrstuvwxyz';
    const numbers = '23456789';
    const specials = '@!#$*&^%';

    const pick = (charset: string) =>
      charset[Math.floor(Math.random() * charset.length)];

    const required = [
      pick(uppers),
      pick(uppers),
      pick(lowers),
      pick(lowers),
      pick(numbers),
      pick(numbers),
      pick(specials),
      pick(specials),
    ];

    const allChars = uppers + lowers + numbers + specials;
    while (required.length < 12) {
      required.push(pick(allChars));
    }

    for (let i = required.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [required[i], required[j]] = [required[j], required[i]];
    }

    return required.join('');
  }

  /**
   * Generates a unique username based on default base string (ID).
   */
  private static async ensureUniqueUsername(
    baseUsername: string,
    schoolId = 'LAPS-GOHAD',
  ): Promise<string> {
    let candidate = baseUsername.trim().toLowerCase();
    let attempt = 0;
    while (true) {
      const existing = await User.findOne({
        schoolId,
        identifier: candidate,
      });
      if (!existing) {
        return candidate;
      }
      attempt++;
      candidate = `${baseUsername.trim().toLowerCase()}${attempt}`;
    }
  }

  /**
   * Automatic account generation for Student.
   * Triggered on Admission status -> APPROVED.
   */
  public static async generateStudentAccount(
    studentId: string | Types.ObjectId,
    guardianId?: string | Types.ObjectId,
    schoolId = 'LAPS-GOHAD',
    sendNotification = true,
  ): Promise<GeneratedAccountResult> {
    const student = await Student.findById(studentId);
    if (!student) {
      throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Student not found');
    }

    // Check if user account already exists for this student
    const existingUser = await User.findOne({ profileRef: student._id });
    if (existingUser) {
      return {
        user: existingUser,
        generatedId: student.admissionNumber || '',
        username: existingUser.identifier,
        temporaryPassword: '[ALREADY_GENERATED]',
      };
    }

    const generatedId = await this.generateId('STUDENT', undefined, schoolId);
    const username = await this.ensureUniqueUsername(generatedId, schoolId);
    const temporaryPassword = this.generateSecurePassword();
    const passwordHash = await hashPassword(temporaryPassword);

    const role = await Role.findOne({ schoolId, code: 'STUDENT' });
    if (!role) {
      throw new AppError(500, ErrorCodes.INTERNAL_SERVER_ERROR, 'STUDENT role not found');
    }

    const user = await User.create({
      schoolId,
      identifier: username,
      email: student.email || `${username}@littleangelsschool.edu.in`,
      passwordHash,
      roleId: role._id,
      roleCode: 'STUDENT',
      userType: 'STUDENT',
      profileRef: student._id,
      status: 'PASSWORD_RESET_REQUIRED',
      forcePasswordChange: true,
      passwordChangedAt: new Date(),
    });

    if (!student.admissionNumber) {
      student.admissionNumber = generatedId;
      await student.save();
    }

    if (guardianId) {
      await StudentGuardian.findOneAndUpdate(
        { studentId: student._id, guardianId },
        { $set: { isPrimaryGuardian: true } },
        { upsert: false },
      );
    }

    if (sendNotification) {
      await this.sendCredentialNotification(user._id, username, temporaryPassword, 'STUDENT');
    }

    logger.info(
      { userId: user._id, identifier: username, entityType: 'STUDENT', entityId: student._id },
      'AUDIT: Automatic Student ERP Account Generated',
    );

    return {
      user,
      generatedId,
      username,
      temporaryPassword,
    };
  }

  /**
   * Automatic account generation for Teacher.
   */
  public static async generateTeacherAccount(
    teacherId: string | Types.ObjectId,
    schoolId = 'LAPS-GOHAD',
    sendNotification = true,
  ): Promise<GeneratedAccountResult> {
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Teacher not found');
    }

    if (teacher.userId) {
      const existingUser = await User.findById(teacher.userId);
      if (existingUser) {
        return {
          user: existingUser,
          generatedId: teacher.employeeId,
          username: existingUser.identifier,
          temporaryPassword: '[ALREADY_GENERATED]',
        };
      }
    }

    const generatedId = await this.generateId('TEACHER', undefined, schoolId);
    const username = await this.ensureUniqueUsername(
      teacher.email ? teacher.email.split('@')[0] : generatedId,
      schoolId,
    );
    const temporaryPassword = this.generateSecurePassword();
    const passwordHash = await hashPassword(temporaryPassword);

    const role = await Role.findOne({ schoolId, code: 'TEACHER' });
    if (!role) {
      throw new AppError(500, ErrorCodes.INTERNAL_SERVER_ERROR, 'TEACHER role not found');
    }

    const user = await User.create({
      schoolId,
      identifier: username,
      email: teacher.email,
      phone: teacher.phone,
      passwordHash,
      roleId: role._id,
      roleCode: 'TEACHER',
      userType: 'TEACHER',
      profileRef: teacher._id,
      status: 'PASSWORD_RESET_REQUIRED',
      forcePasswordChange: true,
      passwordChangedAt: new Date(),
    });

    teacher.userId = user._id;
    if (!teacher.employeeId) {
      teacher.employeeId = generatedId;
    }
    await teacher.save();

    if (sendNotification) {
      await this.sendCredentialNotification(user._id, username, temporaryPassword, 'TEACHER');
    }

    logger.info(
      { userId: user._id, identifier: username, entityType: 'TEACHER', entityId: teacher._id },
      'AUDIT: Automatic Teacher ERP Account Generated',
    );

    return {
      user,
      generatedId,
      username,
      temporaryPassword,
    };
  }

  /**
   * Automatic account generation for Employee.
   */
  public static async generateEmployeeAccount(
    employeeId: string | Types.ObjectId,
    email?: string,
    phone?: string,
    schoolId = 'LAPS-GOHAD',
    sendNotification = true,
  ): Promise<GeneratedAccountResult> {
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Employee not found');
    }

    if (employee.userId) {
      const existingUser = await User.findById(employee.userId);
      if (existingUser) {
        return {
          user: existingUser,
          generatedId: employee.employeeId,
          username: existingUser.identifier,
          temporaryPassword: '[ALREADY_GENERATED]',
        };
      }
    }

    const generatedId = await this.generateId('EMPLOYEE', undefined, schoolId);
    const username = await this.ensureUniqueUsername(
      email ? email.split('@')[0] : generatedId,
      schoolId,
    );
    const temporaryPassword = this.generateSecurePassword();
    const passwordHash = await hashPassword(temporaryPassword);

    const roleCode = 'STAFF';
    const role = await Role.findOne({ schoolId, code: roleCode });
    if (!role) {
      throw new AppError(500, ErrorCodes.INTERNAL_SERVER_ERROR, `${roleCode} role not found`);
    }

    const user = await User.create({
      schoolId,
      identifier: username,
      email: email || `${username}@littleangelsschool.edu.in`,
      phone,
      passwordHash,
      roleId: role._id,
      roleCode: 'STAFF',
      userType: 'STAFF',
      profileRef: employee._id,
      status: 'PASSWORD_RESET_REQUIRED',
      forcePasswordChange: true,
      passwordChangedAt: new Date(),
    });

    employee.userId = user._id;
    if (!employee.employeeId) {
      employee.employeeId = generatedId;
    }
    await employee.save();

    if (sendNotification) {
      await this.sendCredentialNotification(user._id, username, temporaryPassword, 'EMPLOYEE');
    }

    logger.info(
      { userId: user._id, identifier: username, entityType: 'EMPLOYEE', entityId: employee._id },
      'AUDIT: Automatic Employee ERP Account Generated',
    );

    return {
      user,
      generatedId,
      username,
      temporaryPassword,
    };
  }

  /**
   * Resets password for an existing account and enforces password change on next login.
   */
  public static async resetPassword(
    userId: string | Types.ObjectId,
    sendNotification = true,
  ): Promise<{ temporaryPassword: string }> {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'User not found');
    }

    const temporaryPassword = this.generateSecurePassword();
    const passwordHash = await hashPassword(temporaryPassword);

    user.passwordHash = passwordHash;
    user.forcePasswordChange = true;
    user.status = 'PASSWORD_RESET_REQUIRED';
    user.passwordChangedAt = new Date();
    await user.save();

    if (sendNotification) {
      await this.sendCredentialNotification(user._id, user.identifier, temporaryPassword, user.roleCode);
    }

    logger.info({ userId: user._id, identifier: user.identifier }, 'AUDIT: User Password Reset by Admin');

    return { temporaryPassword };
  }

  /**
   * Regenerates username for an existing account.
   */
  public static async regenerateUsername(
    userId: string | Types.ObjectId,
    customUsername?: string,
  ): Promise<any> {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'User not found');
    }

    const baseName = customUsername || user.identifier.replace(/\d+$/, '');
    const newUsername = await this.ensureUniqueUsername(baseName, user.schoolId);

    user.identifier = newUsername;
    await user.save();

    logger.info(
      { userId: user._id, oldIdentifier: user.identifier, newUsername },
      'AUDIT: Username Regenerated',
    );

    return user;
  }

  /**
   * Sends automated welcome/temporary credential notification.
   */
  private static async sendCredentialNotification(
    recipientId: Types.ObjectId,
    username: string,
    temporaryPassword: string,
    roleName: string,
  ): Promise<void> {
    try {
      await Notification.create({
        title: 'ERP Account Created - Temporary Credentials',
        message: `Welcome! Your ${roleName} ERP account is ready. Username: ${username}, Temporary Password: ${temporaryPassword}. Please log in and change your password immediately.`,
        priority: 'HIGH',
        category: 'SYSTEM',
        recipientId,
        readStatus: 'UNREAD',
        isArchived: false,
      });
    } catch (error) {
      logger.error({ error, recipientId }, 'Failed to send credential notification');
    }
  }
}
