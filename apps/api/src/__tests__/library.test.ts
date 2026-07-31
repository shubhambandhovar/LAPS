declare const describe: any;
declare const it: any;
declare const expect: any;
declare const beforeAll: any;
declare const afterAll: any;
import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../app';
import { Book, BookCopy, BookIssue, Reservation, Student, User } from '../models';
import { generateAccessToken as generateToken } from '../utils/jwt';

describe('Library API', () => {
  let adminToken: string;
  let studentToken: string;
  let bookId: mongoose.Types.ObjectId;
  let copyId: mongoose.Types.ObjectId;
  let studentRefId: mongoose.Types.ObjectId;
  let adminId: mongoose.Types.ObjectId;
  let studentUserId: mongoose.Types.ObjectId;

  beforeAll(async () => {
    adminId = new mongoose.Types.ObjectId();
    const admin = await User.create({
      _id: adminId,
      schoolId: 'LAPS-GOHAD',
      identifier: 'lib_admin',
      passwordHash: 'hashed',
      roleId: new mongoose.Types.ObjectId(),
      roleCode: 'SUPER_ADMIN',
      userType: 'SUPER_ADMIN',
      status: 'ACTIVE'
    });
    adminToken = generateToken(admin as any, 'sid', 'sfid');

    studentRefId = new mongoose.Types.ObjectId();
    const student = await Student.create({
      _id: studentRefId,
      schoolId: 'LAPS-GOHAD',
      admissionNumber: 'LIB-STU-001',
      firstName: 'Lib',
      lastName: 'Stu',
      status: 'ACTIVE'
    });

    studentUserId = new mongoose.Types.ObjectId();
    await User.create({
      _id: studentUserId,
      schoolId: 'LAPS-GOHAD',
      identifier: 'lib_stu',
      passwordHash: 'hashed',
      roleId: new mongoose.Types.ObjectId(),
      roleCode: 'STUDENT',
      userType: 'STUDENT',
      profileRef: student._id,
      status: 'ACTIVE'
    });
    studentToken = generateToken(admin as any, 'sid', 'sfid');
  });

  afterAll(async () => {
    await Book.deleteMany({ schoolId: 'LAPS-GOHAD' });
    await BookCopy.deleteMany({ schoolId: 'LAPS-GOHAD' });
    await BookIssue.deleteMany({ schoolId: 'LAPS-GOHAD' });
    await Reservation.deleteMany({ schoolId: 'LAPS-GOHAD' });
    await User.deleteMany({ _id: { $in: [adminId, studentUserId] } });
    await Student.deleteMany({ _id: studentRefId });
  });

  it('should create a book catalog entry', async () => {
    const res = await request(app)
      .post('/api/v1/library/books')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        bookCode: 'BK-001',
        title: 'Introduction to Algorithms',
        authors: ['Thomas H. Cormen'],
      });
    
    expect(res.status).toBe(201);
    expect(res.body.data.book.title).toBe('Introduction to Algorithms');
    bookId = res.body.data.book._id;
  });

  it('should add a book copy', async () => {
    const res = await request(app)
      .post(`/api/v1/library/books/${bookId}/copies`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        accessionNumber: 'ACC-001'
      });
    
    expect(res.status).toBe(201);
    expect(res.body.data.copy.status).toBe('AVAILABLE');
    copyId = res.body.data.copy._id;
  });

  it('should prevent duplicate accession numbers', async () => {
    const res = await request(app)
      .post(`/api/v1/library/books/${bookId}/copies`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        accessionNumber: 'ACC-001'
      });
    
    expect(res.status).toBe(409);
  });

  it('should issue a book to a student', async () => {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);

    const res = await request(app)
      .post('/api/v1/library/issues')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        bookCopyId: copyId,
        issuedToUserType: 'STUDENT',
        studentId: studentRefId,
        dueDate: dueDate.toISOString().split('T')[0]
      });
    
    expect(res.status).toBe(201);
    expect(res.body.data.issue.status).toBe('ISSUED');

    // Verify copy is ISSUED
    const copy = await BookCopy.findById(copyId);
    expect(copy?.status).toBe('ISSUED');
  });

  it('should allow student to view their own issues', async () => {
    const res = await request(app)
      .get('/api/v1/library/issues')
      .set('Authorization', `Bearer ${studentToken}`);
    
    expect(res.status).toBe(200);
    expect(res.body.data.issues.length).toBe(1);
    expect(res.body.data.issues[0].studentId.toString()).toBe(studentRefId.toString());
  });

  it('should allow reserving an issued book', async () => {
    const res = await request(app)
      .post('/api/v1/library/reservations')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        bookId,
        reservedByUserType: 'STUDENT',
        studentId: studentRefId
      });
    
    expect(res.status).toBe(201);
    expect(res.body.data.reservation.queuePosition).toBe(1);
  });

});
