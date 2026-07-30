import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../app';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { hashPassword } from '../utils/crypto';
import { User } from '../models/User';
import { Role } from '../models/Role';
import { AcademicSession } from '../models/AcademicSession';
import { AcademicTerm } from '../models/AcademicTerm';
import { Class } from '../models/Class';
import { Section } from '../models/Section';
import { Subject } from '../models/Subject';
import { ClassSubject } from '../models/ClassSubject';
import { Teacher } from '../models/Teacher';
import { TeachingAssignment } from '../models/TeachingAssignment';
import { Student } from '../models/Student';
import { Enrollment } from '../models/Enrollment';
import { MarksEntry } from '../models/MarksEntry';

let mongoServer: MongoMemoryServer;
let app: ReturnType<typeof createApp>;
let adminToken: string;
let teacherToken: string;
let unassignedTeacherToken: string;
let studentToken: string;

let teacherUserId: string;

let academicSessionId: string;
let academicTermId: string;
let classId: string;
let sectionId: string;
let subjectId: string;
let classSubjectId: string;
let teachingAssignmentId: string;
let studentId: string;
let enrollmentId: string;

let createdExamId: string;
let createdComponentId: string;
let createdMarksEntryId: string;
let createdReEvalId: string;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await connectDatabase(uri);
  app = createApp();

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

  // Create Users
  const passwordHash = await hashPassword('Test@1234!');
  const adminUser = await User.create({
    schoolId: 'LAPS-GOHAD',
    identifier: 'admin_exam@laps.local',
    email: 'admin_exam@laps.local',
    passwordHash,
    roleId: adminRole._id,
    roleCode: 'SCHOOL_ADMIN',
    userType: 'SCHOOL_ADMIN',
    status: 'ACTIVE',
  });

  // Teacher Profile & User
  const teacherProfileDoc = await Teacher.create({
    employeeId: 'EMP-EXAM-01',
    firstName: 'Exam',
    lastName: 'Teacher',
    email: 'teacher_exam@laps.local',
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
    identifier: 'teacher_exam@laps.local',
    email: 'teacher_exam@laps.local',
    passwordHash,
    roleId: teacherRole._id,
    roleCode: 'TEACHER',
    userType: 'TEACHER',
    status: 'ACTIVE',
    profileRef: teacherProfileDoc._id,
  });
  teacherUserId = teacherUser._id.toString();
  teacherProfileDoc.userId = teacherUser._id;
  await teacherProfileDoc.save();

  // Unassigned Teacher
  await User.create({
    schoolId: 'LAPS-GOHAD',
    identifier: 'teacher_other_exam@laps.local',
    email: 'teacher_other_exam@laps.local',
    passwordHash,
    roleId: teacherRole._id,
    roleCode: 'TEACHER',
    userType: 'TEACHER',
    status: 'ACTIVE',
  });

  // Student Profile & User
  const studentProfileDoc = await Student.create({
    admissionNumber: 'ADM-EXAM-001',
    firstName: 'Exam',
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
  studentId = studentProfileDoc._id.toString();

  await User.create({
    schoolId: 'LAPS-GOHAD',
    identifier: 'student_exam@laps.local',
    email: 'student_exam@laps.local',
    passwordHash,
    roleId: studentRole._id,
    roleCode: 'STUDENT',
    userType: 'STUDENT',
    status: 'ACTIVE',
    profileRef: studentProfileDoc._id,
  });

  // Login tokens
  const adminRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ identifier: 'admin_exam@laps.local', password: 'Test@1234!' });
  adminToken = adminRes.body.data.accessToken;

  const teacherRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ identifier: 'teacher_exam@laps.local', password: 'Test@1234!' });
  teacherToken = teacherRes.body.data.accessToken;

  const unassignedRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ identifier: 'teacher_other_exam@laps.local', password: 'Test@1234!' });
  unassignedTeacherToken = unassignedRes.body.data.accessToken;

  const studentRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ identifier: 'student_exam@laps.local', password: 'Test@1234!' });
  studentToken = studentRes.body.data.accessToken;

  // Create Academic Session & Term
  const sessionDoc = await AcademicSession.create({
    schoolId: 'LAPS-GOHAD',
    code: 'SESS-2026',
    name: '2026-2027 Exam Session',
    startDate: new Date('2026-04-01'),
    endDate: new Date('2027-03-31'),
    status: 'ACTIVE',
    createdBy: adminUser._id,
    updatedBy: adminUser._id,
  });
  academicSessionId = sessionDoc._id.toString();

  const termDoc = await AcademicTerm.create({
    schoolId: 'LAPS-GOHAD',
    code: 'TERM-1-2026',
    academicSessionId,
    name: 'Term 1',
    orderSequence: 1,
    startDate: new Date('2026-04-01'),
    endDate: new Date('2026-09-30'),
    status: 'ACTIVE',
    createdBy: adminUser._id,
    updatedBy: adminUser._id,
  });
  academicTermId = termDoc._id.toString();

  // Create Class, Section, Subject, ClassSubject
  const classDoc = await Class.create({
    name: 'Class 10 Exam',
    code: 'CLS10_EXAM',
    orderSequence: 10,
    displayOrder: 10,
    level: 'SECONDARY',
    academicSessionId,
    createdBy: adminUser._id,
    updatedBy: adminUser._id,
  });
  classId = classDoc._id.toString();

  const sectionDoc = await Section.create({
    classId,
    name: 'Section A Exam',
    code: 'SEC-10A-EXAM',
    roomNumber: '101',
    capacity: 40,
    academicSessionId,
    createdBy: adminUser._id,
    updatedBy: adminUser._id,
  });
  sectionId = sectionDoc._id.toString();

  const subjectDoc = await Subject.create({
    name: 'Exam Mathematics',
    code: 'MATH_EXAM',
    shortName: 'MATH',
    subjectType: 'THEORY',
    department: 'MATH',
    status: 'ACTIVE',
    isActive: true,
    createdBy: adminUser._id,
    updatedBy: adminUser._id,
  });
  subjectId = subjectDoc._id.toString();

  const csDoc = await ClassSubject.create({
    classId,
    subjectId,
    academicSessionId,
    isOptional: false,
    status: 'ACTIVE',
    createdBy: adminUser._id,
    updatedBy: adminUser._id,
  });
  classSubjectId = csDoc._id.toString();

  // Create TeachingAssignment & Enrollment
  const taDoc = await TeachingAssignment.create({
    teacherId: teacherProfileDoc._id,
    academicSessionId,
    classId,
    sectionId,
    subjectId,
    classSubjectId,
    effectiveFrom: new Date('2026-04-01'),
    workloadWeight: 1,
    isPrimary: true,
    status: 'ACTIVE',
    createdBy: adminUser._id,
    updatedBy: adminUser._id,
  });
  teachingAssignmentId = taDoc._id.toString();

  const enrollmentDoc = await Enrollment.create({
    admissionNumber: 'ADM-EXAM-001',
    studentId: studentProfileDoc._id,
    academicSessionId,
    classId,
    sectionId,
    rollNumber: '101',
    enrollmentDate: new Date('2026-04-01'),
    enrollmentStatus: 'ACTIVE',
    createdBy: adminUser._id,
    updatedBy: adminUser._id,
  });
  enrollmentId = enrollmentDoc._id.toString();
});

afterAll(async () => {
  await disconnectDatabase();
  await mongoServer.stop();
});

describe('Phase 8: Examination, Assessment & Marks Management (18 verification tests)', () => {
  it('1. Create Exam (POST /api/v1/exams) as Admin', async () => {
    const res = await request(app)
      .post('/api/v1/exams')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Mid-Term Assessment 2026',
        academicSessionId,
        academicTermId,
        examType: 'MID_TERM',
        startDate: new Date('2026-08-01').toISOString(),
        endDate: new Date('2026-08-10').toISOString(),
        description: 'Mid term theoretical exam',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Mid-Term Assessment 2026');
    expect(res.body.data.status).toBe('DRAFT');
    createdExamId = res.body.data._id;
  });

  it('2. List Exams (GET /api/v1/exams)', async () => {
    const res = await request(app)
      .get('/api/v1/exams')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.pagination.totalRecords).toBeGreaterThan(0);
  });

  it('3. Prevent duplicate Exam name in same session (409 conflict)', async () => {
    const res = await request(app)
      .post('/api/v1/exams')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Mid-Term Assessment 2026',
        academicSessionId,
        academicTermId,
        examType: 'MID_TERM',
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('4. Publish Exam (PATCH /api/v1/exams/:id/publish)', async () => {
    const res = await request(app)
      .patch(`/api/v1/exams/${createdExamId}/publish`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('PUBLISHED');
  });

  it('5. Create Exam Schedule slot (POST /api/v1/exam-schedules)', async () => {
    const res = await request(app)
      .post('/api/v1/exam-schedules')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        examId: createdExamId,
        academicSessionId,
        academicTermId,
        classSubjectId,
        classId,
        sectionId,
        subjectId,
        date: new Date('2026-08-02').toISOString(),
        startTime: '09:00',
        endTime: '12:00',
        durationMinutes: 180,
        room: 'Hall A',
        invigilatorId: teacherUserId,
        maximumMarks: 100,
        passingMarks: 33,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.room).toBe('Hall A');
    expect(res.body.data._id).toBeDefined();
  });

  it('6. Detect Exam Schedule conflict for room/invigilator overlap (409 conflict)', async () => {
    const res = await request(app)
      .post('/api/v1/exam-schedules')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        examId: createdExamId,
        academicSessionId,
        academicTermId,
        classSubjectId,
        classId,
        sectionId,
        subjectId,
        date: new Date('2026-08-02').toISOString(),
        startTime: '10:00', // Overlaps with 09:00 - 12:00
        endTime: '13:00',
        durationMinutes: 180,
        room: 'Hall A', // Same room overlap
        invigilatorId: teacherUserId,
        maximumMarks: 100,
        passingMarks: 33,
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('7. List Exam Schedules (GET /api/v1/exam-schedules)', async () => {
    const res = await request(app)
      .get(`/api/v1/exam-schedules?examId=${createdExamId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('8. Create Assessment Component (POST /api/v1/assessment-components)', async () => {
    const res = await request(app)
      .post('/api/v1/assessment-components')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        examId: createdExamId,
        classSubjectId,
        componentName: 'THEORY',
        maximumMarks: 100,
        passingMarks: 33,
        weightage: 70,
        orderSequence: 1,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.componentName).toBe('THEORY');
    createdComponentId = res.body.data._id;
  });

  it('9. Prevent Assessment Components exceeding 100% total weightage (400 error)', async () => {
    const res = await request(app)
      .post('/api/v1/assessment-components')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        examId: createdExamId,
        classSubjectId,
        componentName: 'PRACTICAL',
        maximumMarks: 50,
        passingMarks: 15,
        weightage: 50, // 70 + 50 = 120% (> 100%)
        orderSequence: 2,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('10. Bulk enter Marks as Teacher (POST /api/v1/marks/bulk)', async () => {
    const res = await request(app)
      .post('/api/v1/marks/bulk')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        examId: createdExamId,
        academicSessionId,
        academicTermId,
        classSubjectId,
        teachingAssignmentId,
        submit: false,
        entries: [
          {
            enrollmentId,
            studentId,
            componentMarks: [
              {
                assessmentComponentId: createdComponentId,
                componentName: 'THEORY',
                marksObtained: 85,
                isAbsent: false,
                isMedical: false,
                isExempt: false,
              },
            ],
            isAbsent: false,
            isMedical: false,
            isExempt: false,
            remarks: 'Good performance',
          },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data[0].totalMarksObtained).toBe(85);
    expect(res.body.data[0].status).toBe('DRAFT');
    createdMarksEntryId = res.body.data[0]._id;
  });

  it('11. Prevent Teacher entering marks for unassigned ClassSubject (403 RBAC)', async () => {
    const res = await request(app)
      .post('/api/v1/marks/bulk')
      .set('Authorization', `Bearer ${unassignedTeacherToken}`)
      .send({
        examId: createdExamId,
        academicSessionId,
        academicTermId,
        classSubjectId,
        teachingAssignmentId,
        submit: false,
        entries: [
          {
            enrollmentId,
            studentId,
            componentMarks: [
              {
                assessmentComponentId: createdComponentId,
                componentName: 'THEORY',
                marksObtained: 90,
              },
            ],
          },
        ],
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('12. Submit Marks (POST /api/v1/marks/submit)', async () => {
    const res = await request(app)
      .post('/api/v1/marks/submit')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        examId: createdExamId,
        teachingAssignmentId,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.submittedCount).toBe(1);

    const check = await MarksEntry.findById(createdMarksEntryId);
    expect(check?.status).toBe('SUBMITTED');
  });

  it('13. Award Grace Marks as Admin (POST /api/v1/marks/:id/grace)', async () => {
    const res = await request(app)
      .post(`/api/v1/marks/${createdMarksEntryId}/grace`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        graceMarksAwarded: 5,
        reason: 'Question 4 ambiguity compensation',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.graceMarksAwarded).toBe(5);
    expect(res.body.data.totalMarksObtained).toBe(90); // 85 + 5
  });

  it('14. Create Grade Scale with default flag (POST /api/v1/grade-scales)', async () => {
    const res = await request(app)
      .post('/api/v1/grade-scales')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        academicSessionId,
        name: 'Standard 10-Point Grading Scale',
        description: 'Default scale for 2026',
        isDefault: true,
        scaleType: 'PERCENTAGE',
        grades: [
          { grade: 'A+', gradePoint: 10, minPercentage: 90, maxPercentage: 100, description: 'Outstanding' },
          { grade: 'A', gradePoint: 9, minPercentage: 80, maxPercentage: 89.99, description: 'Excellent' },
          { grade: 'B+', gradePoint: 8, minPercentage: 70, maxPercentage: 79.99, description: 'Very Good' },
          { grade: 'B', gradePoint: 7, minPercentage: 60, maxPercentage: 69.99, description: 'Good' },
          { grade: 'C', gradePoint: 6, minPercentage: 50, maxPercentage: 59.99, description: 'Average' },
          { grade: 'P', gradePoint: 5, minPercentage: 33, maxPercentage: 49.99, description: 'Pass' },
          { grade: 'F', gradePoint: 0, minPercentage: 0, maxPercentage: 32.99, description: 'Fail' },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isDefault).toBe(true);
    expect(res.body.data._id).toBeDefined();
  });

  it('15. Calculate Results (POST /api/v1/results/calculate) with ranking engine', async () => {
    const res = await request(app)
      .post('/api/v1/results/calculate')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        examId: createdExamId,
        classId,
        sectionId,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].overallTotalObtained).toBe(90);
    expect(res.body.data[0].overallGrade).toBe('A+');
    expect(res.body.data[0].rankInClass).toBe(1);
    expect(res.body.data[0].status).toBe('CALCULATED');
    expect(res.body.data[0]._id).toBeDefined();
  });

  it('16. Publish Results (PATCH /api/v1/results/publish)', async () => {
    const res = await request(app)
      .patch('/api/v1/results/publish')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        examId: createdExamId,
        classId,
        sectionId,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.publishedCount).toBe(1);

    await MarksEntry.findByIdAndUpdate(createdMarksEntryId, { status: 'PUBLISHED' });
  });

  it('17. Get published results as Student (GET /api/v1/results/my)', async () => {
    const res = await request(app)
      .get('/api/v1/results/my')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].overallPercentage).toBe(90);
    expect(res.body.data[0].status).toBe('PUBLISHED');
  });

  it('18. Create Re-Evaluation request (POST /api/v1/re-evaluations) and complete evaluation (PATCH /api/v1/re-evaluations/:id/complete)', async () => {
    const createRes = await request(app)
      .post('/api/v1/re-evaluations')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        examId: createdExamId,
        academicSessionId,
        academicTermId,
        marksEntryId: createdMarksEntryId,
        enrollmentId,
        studentId,
        classSubjectId,
        requestType: 'RE_EVALUATION',
        reason: 'Requesting script scrutiny for Question 2',
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);
    expect(createRes.body.data.status).toBe('SUBMITTED');
    createdReEvalId = createRes.body.data._id;

    const reviewRes = await request(app)
      .patch(`/api/v1/re-evaluations/${createdReEvalId}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'APPROVED_FOR_EVALUATION',
        reviewRemarks: 'Approved for script re-checking',
        evaluatorTeacherId: teacherUserId,
      });
    expect(reviewRes.status).toBe(200);
    expect(reviewRes.body.data.status).toBe('APPROVED_FOR_EVALUATION');

    const compRes = await request(app)
      .patch(`/api/v1/re-evaluations/${createdReEvalId}/complete`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        revisedMarks: 95,
        revisedGrade: 'A+',
        evaluationRemarks: 'Found 5 additional marks uncounted in Question 2',
      });

    expect(compRes.status).toBe(200);
    expect(compRes.body.success).toBe(true);
    expect(compRes.body.data.status).toBe('COMPLETED');
    expect(compRes.body.data.revisedMarks).toBe(95);

    const checkMarks = await MarksEntry.findById(createdMarksEntryId);
    expect(checkMarks?.totalMarksObtained).toBe(95);
  });
});
