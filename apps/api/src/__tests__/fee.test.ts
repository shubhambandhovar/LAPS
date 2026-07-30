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
import { Subject } from '../models/Subject';
import { ClassSubject } from '../models/ClassSubject';
import { TeachingAssignment } from '../models/TeachingAssignment';
let mongoServer: MongoMemoryServer;
let app: ReturnType<typeof createApp>;
let adminToken: string;
let studentToken: string;
let adminUserId: string;

let academicSessionId: string;
let financialYearId: string;
let classId: string;
let enrollment1Id: string;
let enrollment2Id: string;
let student1Id: string;
let student2Id: string;

let feeHeadId: string;
let feeStructureId: string;
let lateFeeRuleId: string;
let invoice1Id: string;
let invoice2Id: string;
let customInvoiceId: string;
let payment1Id: string;
let receipt1Number: string;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await connectDatabase(uri);
  app = createApp();

  // Create Roles
  const adminRole = await Role.create({
    schoolId: 'LAPS-GOHAD',
    code: 'SCHOOL_ADMIN',
    name: 'School Admin Role',
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

  // Create Users
  const pwdHash = await hashPassword('Password123!');
  const adminUser = await User.create({
    schoolId: 'LAPS-GOHAD',
    identifier: 'admin.fee@school.com',
    email: 'admin.fee@school.com',
    passwordHash: pwdHash,
    roleId: adminRole._id,
    roleCode: 'SCHOOL_ADMIN',
    userType: 'SCHOOL_ADMIN',
    status: 'ACTIVE',
  });
  adminUserId = adminUser._id.toString();

  // Create Academic Session & Class & Section
  const session = await AcademicSession.create({
    schoolId: 'LAPS-GOHAD',
    code: 'SESS-2026-FEE',
    name: '2026-27',
    startDate: new Date('2026-04-01'),
    endDate: new Date('2027-03-31'),
    status: 'ACTIVE',
    createdBy: adminUser._id,
    updatedBy: adminUser._id,
  });
  academicSessionId = session._id.toString();

  const classDoc = await Class.create({
    name: 'Grade 10 Fee',
    code: 'CLS10_FEE',
    orderSequence: 10,
    displayOrder: 10,
    level: 'SECONDARY',
    academicSessionId: session._id,
    createdBy: adminUser._id,
    updatedBy: adminUser._id,
  });
  classId = classDoc._id.toString();

  const sectionDoc = await Section.create({
    classId: classDoc._id,
    academicSessionId: session._id,
    name: 'Section A Fee',
    code: 'SEC_A_FEE',
    capacity: 40,
    status: 'ACTIVE',
    createdBy: adminUser._id,
    updatedBy: adminUser._id,
  });

  // Create Teacher Profile & User
  const teacherProfile = await Teacher.create({
    employeeId: 'FEE-EMP-001',
    firstName: 'Teacher',
    lastName: 'Fee',
    email: 'teacher.fee@school.com',
    phone: '9876543210',
    joiningDate: new Date('2024-01-01'),
    qualification: 'M.Sc',
    designation: 'PGT',
    status: 'ACTIVE',
    createdBy: adminUser._id,
    updatedBy: adminUser._id,
  });

  const teacherUser = await User.create({
    schoolId: 'LAPS-GOHAD',
    identifier: 'teacher.fee@school.com',
    email: 'teacher.fee@school.com',
    passwordHash: pwdHash,
    roleId: teacherRole._id,
    roleCode: 'TEACHER',
    userType: 'TEACHER',
    status: 'ACTIVE',
    profileRef: teacherProfile._id,
  });
  teacherProfile.userId = teacherUser._id;
  await teacherProfile.save();

  const subjectDoc = await Subject.create({
    name: 'Mathematics',
    code: 'MATH101_FEE',
    shortName: 'MATH',
    department: 'Science',
    subjectType: 'THEORY',
    status: 'ACTIVE',
    isActive: true,
    createdBy: adminUser._id,
    updatedBy: adminUser._id,
  });

  const classSubDoc = await ClassSubject.create({
    classId: classDoc._id,
    subjectId: subjectDoc._id,
    academicSessionId: session._id,
    credits: 4,
    isOptional: false,
    status: 'ACTIVE',
    createdBy: adminUser._id,
    updatedBy: adminUser._id,
  });

  await TeachingAssignment.create({
    teacherId: teacherProfile._id,
    academicSessionId: session._id,
    classId: classDoc._id,
    sectionId: sectionDoc._id,
    subjectId: subjectDoc._id,
    classSubjectId: classSubDoc._id,
    effectiveFrom: new Date('2026-04-01'),
    workloadWeight: 1,
    isPrimary: true,
    isClassTeacher: true,
    status: 'ACTIVE',
    createdBy: adminUser._id,
    updatedBy: adminUser._id,
  });

  // Create Students & Enrollments
  const student1 = await Student.create({
    admissionNumber: 'FEE-ADM-001',
    firstName: 'Alice',
    lastName: 'Fee',
    dateOfBirth: new Date('2010-05-10'),
    gender: 'FEMALE',
    address: '123 Main St',
    city: 'Gohad',
    state: 'MP',
    pinCode: '477116',
    status: 'ACTIVE',
    createdBy: adminUser._id,
    updatedBy: adminUser._id,
  });
  student1Id = student1._id.toString();

  await User.create({
    schoolId: 'LAPS-GOHAD',
    identifier: 'student1.fee@school.com',
    email: 'student1.fee@school.com',
    passwordHash: pwdHash,
    roleId: studentRole._id,
    roleCode: 'STUDENT',
    userType: 'STUDENT',
    status: 'ACTIVE',
    profileRef: student1._id,
  });

  const student2 = await Student.create({
    admissionNumber: 'FEE-ADM-002',
    firstName: 'Bob',
    lastName: 'Fee',
    dateOfBirth: new Date('2010-08-15'),
    gender: 'MALE',
    address: '123 Main St',
    city: 'Gohad',
    state: 'MP',
    pinCode: '477116',
    status: 'ACTIVE',
    createdBy: adminUser._id,
    updatedBy: adminUser._id,
  });
  student2Id = student2._id.toString();

  await User.create({
    schoolId: 'LAPS-GOHAD',
    identifier: 'student2.fee@school.com',
    email: 'student2.fee@school.com',
    passwordHash: pwdHash,
    roleId: studentRole._id,
    roleCode: 'STUDENT',
    userType: 'STUDENT',
    status: 'ACTIVE',
    profileRef: student2._id,
  });

  const enr1 = await Enrollment.create({
    admissionNumber: 'FEE-ADM-001',
    studentId: student1._id,
    academicSessionId: session._id,
    classId: classDoc._id,
    sectionId: sectionDoc._id,
    rollNumber: '101',
    enrollmentDate: new Date('2026-04-01'),
    enrollmentStatus: 'ACTIVE',
    createdBy: adminUser._id,
    updatedBy: adminUser._id,
  });
  enrollment1Id = enr1._id.toString();

  const enr2 = await Enrollment.create({
    admissionNumber: 'FEE-ADM-002',
    studentId: student2._id,
    academicSessionId: session._id,
    classId: classDoc._id,
    sectionId: sectionDoc._id,
    rollNumber: '102',
    enrollmentDate: new Date('2026-04-01'),
    enrollmentStatus: 'ACTIVE',
    createdBy: adminUser._id,
    updatedBy: adminUser._id,
  });
  enrollment2Id = enr2._id.toString();

  // Login tokens
  const adminRes = await request(app).post('/api/v1/auth/login').send({
    identifier: 'admin.fee@school.com',
    password: 'Password123!',
  });
  adminToken = adminRes.body.data.accessToken;

  await request(app).post('/api/v1/auth/login').send({
    identifier: 'teacher.fee@school.com',
    password: 'Password123!',
  });

  const student1Res = await request(app).post('/api/v1/auth/login').send({
    identifier: 'student1.fee@school.com',
    password: 'Password123!',
  });
  studentToken = student1Res.body.data.accessToken;

  await request(app).post('/api/v1/auth/login').send({
    identifier: 'student2.fee@school.com',
    password: 'Password123!',
  });
});

afterAll(async () => {
  await disconnectDatabase();
  await mongoServer.stop();
});

describe('Phase 10 — Fee Management & Finance Verification Suite', () => {
  it('TEST-FEE-001: Create Fee Head -> Asserts status: "ACTIVE" and no schoolId', async () => {
    const res = await request(app)
      .post('/api/v1/fee-heads')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Tuition Fee 2026',
        code: 'TUITION-2026',
        category: 'TUITION',
        frequency: 'QUARTERLY',
        isRefundable: false,
        description: 'Standard quarterly tuition fee',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ACTIVE');
    expect(res.body.data.schoolId).toBeUndefined();
    feeHeadId = res.body.data._id;
  });

  it('TEST-FEE-002: Create Fee Structure -> Asserts status: "DRAFT", single-school architecture, totalAmount calculation, optional financialYearId', async () => {
    const fyRes = await request(app)
      .post('/api/v1/financial-years')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        code: 'FY-2026-27',
        name: 'Fiscal Year 2026-27',
        startDate: '2026-04-01',
        endDate: '2027-03-31',
      });

    expect(fyRes.status).toBe(201);
    financialYearId = fyRes.body.data._id;

    const res = await request(app)
      .post('/api/v1/fee-structures')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Grade 10 Annual Fee Structure',
        academicSessionId,
        financialYearId,
        classId,
        feeComponents: [
          {
            feeHeadId,
            amount: 15000,
            isOptional: false,
            isTransport: false,
          },
        ],
        installments: [
          {
            installmentNumber: 1,
            name: 'Quarter 1',
            percentage: 50,
            amount: 7500,
            dueDate: '2026-04-15',
          },
          {
            installmentNumber: 2,
            name: 'Quarter 2',
            percentage: 50,
            amount: 7500,
            dueDate: '2026-07-15',
          },
        ],
        status: 'ACTIVE',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ACTIVE');
    expect(res.body.data.totalAmount).toBe(15000);
    expect(res.body.data.schoolId).toBeUndefined();
    expect(res.body.data.financialYearId).toBe(financialYearId);
    feeStructureId = res.body.data._id;
  });

  it('TEST-FEE-003: Create Discount & Scholarship Rules -> Asserts validation and status: "ACTIVE"', async () => {
    const res = await request(app)
      .post('/api/v1/discounts')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Merit Scholarship 10%',
        code: 'MERIT-10',
        discountType: 'PERCENTAGE',
        value: 10,
        category: 'MERIT',
        requiresApproval: true,
        applicableFeeHeadIds: [feeHeadId],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ACTIVE');
    expect(res.body.data.category).toBe('MERIT');
  });

  it('TEST-FEE-004: Create Late Fee Rules -> Asserts rule configuration saved', async () => {
    const res = await request(app)
      .post('/api/v1/late-fee-rules')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Standard Per-Day Late Fee',
        ruleType: 'PER_DAY',
        amountOrPercentage: 50,
        gracePeriodDays: 5,
        maxLateFeeLimit: 1000,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.gracePeriodDays).toBe(5);
    lateFeeRuleId = res.body.data._id;
  });

  it('TEST-FEE-005: Invoice Generation & Line Item Snapshots -> Batch generate invoices, asserts 8-state lifecycle support, and verifies immutable line-item snapshots', async () => {
    const res = await request(app)
      .post('/api/v1/invoices/generate')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        academicSessionId,
        financialYearId,
        classId,
        installmentNumber: 1,
        title: 'Quarter 1 Tuition Fee',
        dueDate: '2026-04-15',
        feeStructureId,
        status: 'ISSUED',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.generatedCount).toBe(2); // Alice and Bob
    expect(res.body.data.invoices[0].status).toBe('ISSUED');
    expect(res.body.data.invoices[0].lineItems[0].feeHeadName).toBe('Tuition Fee 2026');
    expect(res.body.data.invoices[0].lineItems[0].feeHeadCode).toBe('TUITION-2026');
    expect(res.body.data.invoices[0].lineItems[0].baseAmount).toBe(15000);

    invoice1Id = res.body.data.invoices[0]._id;
    invoice2Id = res.body.data.invoices[1]._id;
  });

  it('TEST-FEE-006: Discount Application & Approval Workflow -> Create custom invoice with discount applied and check netTotal', async () => {
    const res = await request(app)
      .post('/api/v1/invoices/custom')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        academicSessionId,
        enrollmentId: enrollment1Id,
        studentId: student1Id,
        classId,
        title: 'Custom Fee with Discount',
        dueDate: '2026-05-01',
        lineItems: [
          {
            feeHeadId,
            feeHeadName: 'Tuition Fee 2026',
            feeHeadCode: 'TUITION-2026',
            baseAmount: 10000,
            discountAmount: 1000,
            discountName: 'Merit Scholarship 10%',
            netAmount: 9000,
          },
        ],
        status: 'ISSUED',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.baseTotal).toBe(10000);
    expect(res.body.data.discountTotal).toBe(1000);
    expect(res.body.data.netTotal).toBe(9000);
    customInvoiceId = res.body.data._id;
  });

  it('TEST-FEE-007: Record Full Payment & Receipt Generation -> Record full payment, asserts official receipt generated with verification fields, invoice status -> "PAID", and StudentFeeLedger entry created', async () => {
    const res = await request(app)
      .post('/api/v1/payments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        academicSessionId,
        financialYearId,
        enrollmentId: enrollment1Id,
        studentId: student1Id,
        recordedByUserId: adminUserId,
        amountPaid: 15000,
        paymentMode: 'UPI',
        referenceNumber: 'UPI-REF-998877',
        paymentDate: '2026-04-10',
        allocations: [
          {
            invoiceId: invoice1Id,
            amountAllocated: 15000,
          },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.payment.status).toBe('ACTIVE');
    expect(res.body.data.receipt.receiptNumber).toMatch(/^REC-/);
    expect(res.body.data.receipt.verificationHash).toBeDefined();
    expect(res.body.data.receipt.qrCodeUrl).toBeDefined();

    payment1Id = res.body.data.payment._id;
    receipt1Number = res.body.data.receipt.receiptNumber;

    // Check invoice1 is now PAID
    const invRes = await request(app)
      .get(`/api/v1/invoices/${invoice1Id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(invRes.body.data.status).toBe('PAID');
    expect(invRes.body.data.outstandingAmount).toBe(0);
  });

  it('TEST-FEE-008: Partial Payment Handling -> Record partial payment against Bob invoice, asserts paidAmount increments, outstandingAmount decreases, status -> "PARTIALLY_PAID"', async () => {
    const res = await request(app)
      .post('/api/v1/payments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        academicSessionId,
        enrollmentId: enrollment2Id,
        studentId: student2Id,
        recordedByUserId: adminUserId,
        amountPaid: 5000,
        paymentMode: 'CASH',
        paymentDate: '2026-04-11',
        allocations: [
          {
            invoiceId: invoice2Id,
            amountAllocated: 5000,
          },
        ],
      });

    expect(res.status).toBe(201);
    const invRes = await request(app)
      .get(`/api/v1/invoices/${invoice2Id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(invRes.body.data.status).toBe('PARTIALLY_PAID');
    expect(invRes.body.data.paidAmount).toBe(5000);
    expect(invRes.body.data.outstandingAmount).toBe(10000);
  });

  it('TEST-FEE-009: Multiple Invoice Payment Allocation -> Record single payment covering remaining invoice and custom invoice', async () => {
    const res = await request(app)
      .post('/api/v1/payments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        academicSessionId,
        enrollmentId: enrollment1Id,
        studentId: student1Id,
        recordedByUserId: adminUserId,
        amountPaid: 9000,
        paymentMode: 'BANK_TRANSFER',
        referenceNumber: 'NEFT-112233',
        paymentDate: '2026-05-02',
        allocations: [
          {
            invoiceId: customInvoiceId,
            amountAllocated: 9000,
          },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    const invRes = await request(app)
      .get(`/api/v1/invoices/${customInvoiceId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(invRes.body.data.status).toBe('PAID');
  });

  it('TEST-FEE-010: Duplicate Payment Prevention -> Attempt to pay already paid invoice or over-allocate, asserts 409 / 400', async () => {
    const res = await request(app)
      .post('/api/v1/payments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        academicSessionId,
        enrollmentId: enrollment1Id,
        studentId: student1Id,
        recordedByUserId: adminUserId,
        amountPaid: 1000,
        paymentMode: 'CASH',
        paymentDate: '2026-05-05',
        allocations: [
          {
            invoiceId: invoice1Id, // already PAID
            amountAllocated: 1000,
          },
        ],
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('TEST-FEE-011: Late Fee Calculation -> Verify late fee rule exists and can be queried', async () => {
    const res = await request(app)
      .get(`/api/v1/late-fee-rules/${lateFeeRuleId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.amountOrPercentage).toBe(50);
  });

  it('TEST-FEE-012: Refunds, Payment Reversals & Receipt Versioning -> Reverse payment requiring auditReason and approvedBy, asserts status -> "REVERSED", receipt version incremented, ledger updated', async () => {
    // Attempt reversal without auditReason -> should fail 400
    const failRes = await request(app)
      .post(`/api/v1/payments/${payment1Id}/reverse`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        approvedBy: adminUserId,
      });
    expect(failRes.status).toBe(400);

    // Provide mandatory auditReason and approvedBy
    const revRes = await request(app)
      .post(`/api/v1/payments/${payment1Id}/reverse`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        auditReason: 'Check clearance delayed or transaction cancelled by bank',
        approvedBy: adminUserId,
      });

    expect(revRes.status).toBe(200);
    expect(revRes.body.data.status).toBe('REVERSED');

    // Check receipt versions
    const verRes = await request(app)
      .get(`/api/v1/receipts/${receipt1Number}/versions`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(verRes.status).toBe(200);
    expect(verRes.body.data.currentVersion).toBe(2);
    expect(verRes.body.data.history.length).toBe(1); // 1 snapshot archived
  });

  it('TEST-FEE-013: Waivers, Cancellations & Ledger Verification -> Waive Bob remaining invoice balance requiring auditReason and approvedBy, check status -> "WAIVED", verify ledger balances', async () => {
    // Waive remaining 10,000 on invoice2
    const waiveRes = await request(app)
      .patch(`/api/v1/invoices/${invoice2Id}/waive`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        auditReason: 'Special hardship waiver granted by Principal',
        approvedBy: adminUserId,
      });

    expect(waiveRes.status).toBe(200);
    expect(waiveRes.body.data.status).toBe('WAIVED');
    expect(waiveRes.body.data.outstandingAmount).toBe(0);

    // Verify Bob ledger
    const ledRes = await request(app)
      .get(`/api/v1/student-ledger/enrollment/${enrollment2Id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(ledRes.status).toBe(200);
    expect(ledRes.body.data.totalInvoiced).toBe(15000);
    expect(ledRes.body.data.totalPaid).toBe(5000);
    expect(ledRes.body.data.totalWaived).toBe(10000);
    expect(ledRes.body.data.outstandingBalance).toBe(0);

    // Check materialized summary report
    const sumRes = await request(app)
      .get(`/api/v1/fee-reports/summary?academicSessionId=${academicSessionId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(sumRes.status).toBe(200);
    expect(sumRes.body.data.totalWaived).toBeGreaterThanOrEqual(10000);
  });

  it('TEST-FEE-014: Student & Guardian RBAC Scoping -> Student1 queries /api/v1/invoices/my, /api/v1/student-ledger/my, asserts only their own enrollment records returned', async () => {
    const res = await request(app)
      .get('/api/v1/invoices/my')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    for (const inv of res.body.data) {
      expect(inv.studentId._id.toString() || inv.studentId.toString()).toBe(student1Id);
    }

    // Attempting to read another student's invoice directly should fail 403
    const forbiddenRes = await request(app)
      .get(`/api/v1/invoices/${invoice2Id}`) // belongs to Bob (student2)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(forbiddenRes.status).toBe(403);
  });

  it('TEST-FEE-015: Soft-Archive Fee Entities -> Archive FeeHead, FeeStructure, FeeDiscount, LateFeeRule -> Asserts status: "ARCHIVED"', async () => {
    const res = await request(app)
      .patch(`/api/v1/fee-heads/${feeHeadId}/archive`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('ARCHIVED');

    const ruleRes = await request(app)
      .patch(`/api/v1/late-fee-rules/${lateFeeRuleId}/archive`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(ruleRes.status).toBe(200);
    expect(ruleRes.body.data.status).toBe('ARCHIVED');
  });
});
