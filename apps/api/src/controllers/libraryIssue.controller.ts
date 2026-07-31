import { Request, Response } from 'express';
import { BookCopy, BookIssue, Reservation } from '../models';
import { sendSuccess, sendError } from '../utils/response';
import { IssueBookSchema, ReturnBookSchema } from '@laps/shared';
import { isValidObjectId } from 'mongoose';

export class LibraryIssueController {
  
  static async getIssues(req: Request, res: Response) {
    try {
      const query: any = { schoolId: req.user?.schoolId };

      // Self-scoping for Students & Employees
      if (req.user?.userType === 'STUDENT') {
        query.studentId = req.user.profileRef;
      } else if (req.user?.userType === 'STAFF' || req.user?.userType === 'TEACHER') {
        // Only LIBRARIAN / ADMIN can see all. Regular employees see only their own.
        if (req.user?.role !== 'SUPER_ADMIN' && req.user?.role !== 'SCHOOL_ADMIN' && req.user?.role !== 'LIBRARIAN') {
            query.employeeId = req.user.profileRef;
        }
      }

      const issues = await BookIssue.find(query)
        .populate('bookCopyId')
        .sort({ issueDate: -1 });
        
      return sendSuccess(res, 200, 'Success', { issues });
    } catch (error) {
      return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Failed to fetch issues');
    }
  }

  static async issueBook(req: Request, res: Response) {
    try {
      const data = IssueBookSchema.parse(req.body);
      
      const copy = await BookCopy.findOne({ _id: data.bookCopyId, schoolId: req.user?.schoolId });
      if (!copy) return sendError(res, 404, 'RESOURCE_NOT_FOUND', 'Book copy not found');
      if (copy.status !== 'AVAILABLE') return sendError(res, 400, 'BUSINESS_RULE_VIOLATION', 'Book copy is not available');

      // Check max limits (hardcoded here for simplicity, typically would come from a rule)
      const maxIssues = data.issuedToUserType === 'STUDENT' ? 3 : 5;
      
      const activeIssuesCount = await BookIssue.countDocuments({
        schoolId: req.user?.schoolId,
        issuedToUserType: data.issuedToUserType,
        studentId: data.studentId,
        employeeId: data.employeeId,
        status: 'ISSUED'
      });

      if (activeIssuesCount >= maxIssues) {
        return sendError(res, 400, 'BUSINESS_RULE_VIOLATION', `User has reached the maximum issue limit of ${maxIssues}`);
      }

      const issue = new BookIssue({
        ...data,
        schoolId: req.user?.schoolId,
        issuedByUserId: req.user?.id as any,
        issueDate: new Date(),
        dueDate: new Date(data.dueDate),
        status: 'ISSUED',
        fineAmount: 0,
        fineStatus: 'NONE'
      });

      await issue.save();
      
      // Update book copy status
      copy.status = 'ISSUED';
      await copy.save();

      // Check if this fulfills a pending reservation for this exact book
      const pendingRes = await Reservation.findOne({
        schoolId: req.user?.schoolId,
        bookId: copy.bookId,
        status: 'PENDING',
        reservedByUserType: data.issuedToUserType,
        studentId: data.studentId,
        employeeId: data.employeeId
      });

      if (pendingRes) {
        pendingRes.status = 'FULFILLED';
        await pendingRes.save();
      }

      return sendSuccess(res, 201, 'Success', { issue });
    } catch (error) {
      return sendError(res, 400, 'BUSINESS_RULE_VIOLATION', 'Failed to issue book');
    }
  }

  static async returnBook(req: Request, res: Response) {
    try {
      if (!isValidObjectId(req.params.id)) return sendError(res, 400, 'BUSINESS_RULE_VIOLATION', 'Invalid Issue ID');
      const data = ReturnBookSchema.parse(req.body);
      
      const issue = await BookIssue.findOne({ _id: req.params.id, schoolId: req.user?.schoolId });
      if (!issue) return sendError(res, 404, 'RESOURCE_NOT_FOUND', 'Book issue record not found');
      if (issue.status !== 'ISSUED' && issue.status !== 'OVERDUE') return sendError(res, 400, 'BUSINESS_RULE_VIOLATION', 'Book is not currently issued');

      const now = new Date();
      issue.returnDate = now;
      issue.status = 'RETURNED';

      // Calculate Fine (e.g., 5 per day overdue)
      if (now > issue.dueDate) {
        const diffTime = Math.abs(now.getTime() - issue.dueDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        issue.fineAmount = diffDays * 5; // Example 5 units per day
        issue.fineStatus = 'PENDING';
      }

      await issue.save();

      // Update Copy
      const copy = await BookCopy.findById(issue.bookCopyId);
      if (copy) {
        copy.status = 'AVAILABLE';
        copy.condition = data.returnCondition;
        await copy.save();
      }

      return sendSuccess(res, 200, 'Success', { issue });
    } catch (error) {
      return sendError(res, 400, 'BUSINESS_RULE_VIOLATION', 'Failed to return book');
    }
  }
}
