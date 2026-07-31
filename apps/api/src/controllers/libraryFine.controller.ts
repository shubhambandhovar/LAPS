import { Request, Response } from 'express';
import { LibraryFine, BookIssue } from '../models';
import { sendSuccess, sendError } from '../utils/response';
import { FinePaymentSchema } from '@laps/shared';
import { isValidObjectId } from 'mongoose';

export class LibraryFineController {
  
  static async getFines(req: Request, res: Response) {
    try {
      const query: any = { schoolId: req.user?.schoolId };

      if (req.user?.userType === 'STUDENT') {
        query.studentId = req.user.profileRef;
      } else if (req.user?.userType === 'STAFF' || req.user?.userType === 'TEACHER') {
        if (req.user?.role !== 'SUPER_ADMIN' && req.user?.role !== 'SCHOOL_ADMIN' && req.user?.role !== 'LIBRARIAN') {
            query.employeeId = req.user.profileRef;
        }
      }

      const fines = await LibraryFine.find(query)
        .populate('bookIssueId')
        .sort({ createdAt: -1 });
        
      return sendSuccess(res, 200, 'Success', { fines });
    } catch (error) {
      return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Failed to fetch fines');
    }
  }

  static async payFine(req: Request, res: Response) {
    try {
      if (!isValidObjectId(req.params.id)) return sendError(res, 400, 'BUSINESS_RULE_VIOLATION', 'Invalid Fine ID');
      const data = FinePaymentSchema.parse(req.body);
      
      const fine = await LibraryFine.findOne({ _id: req.params.id, schoolId: req.user?.schoolId });
      if (!fine) return sendError(res, 404, 'RESOURCE_NOT_FOUND', 'Fine record not found');
      if (fine.status === 'PAID' || fine.status === 'WAIVED') return sendError(res, 400, 'BUSINESS_RULE_VIOLATION', 'Fine is already settled');

      const totalDeduction = data.amountPaid + data.amountWaived;
      if (totalDeduction > fine.outstandingAmount) {
         return sendError(res, 400, 'BUSINESS_RULE_VIOLATION', 'Total deduction (paid + waived) exceeds outstanding amount');
      }

      fine.paidAmount += data.amountPaid;
      fine.waiverAmount += data.amountWaived;
      fine.outstandingAmount -= totalDeduction;

      if (fine.outstandingAmount === 0) {
        fine.status = fine.waiverAmount === fine.fineAmount ? 'WAIVED' : 'PAID';
      } else {
        fine.status = 'PARTIAL';
      }

      await fine.save();

      // Sync back to BookIssue fineStatus
      const issue = await BookIssue.findById(fine.bookIssueId);
      if (issue) {
          issue.fineStatus = fine.status;
          await issue.save();
      }

      return sendSuccess(res, 200, 'Success', { fine });
    } catch (error) {
      return sendError(res, 400, 'BUSINESS_RULE_VIOLATION', 'Failed to record fine payment');
    }
  }
}
