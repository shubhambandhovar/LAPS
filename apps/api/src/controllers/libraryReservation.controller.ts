import { Request, Response } from 'express';
import { Reservation, Book } from '../models';
import { sendSuccess, sendError } from '../utils/response';
import { ReservationSchema } from '@laps/shared';
import { isValidObjectId } from 'mongoose';

export class LibraryReservationController {
  
  static async getReservations(req: Request, res: Response) {
    try {
      const query: any = { schoolId: req.user?.schoolId };

      if (req.user?.userType === 'STUDENT') {
        query.studentId = req.user.profileRef;
      } else if (req.user?.userType === 'STAFF' || req.user?.userType === 'TEACHER') {
        if (req.user?.role !== 'SUPER_ADMIN' && req.user?.role !== 'SCHOOL_ADMIN' && req.user?.role !== 'LIBRARIAN') {
            query.employeeId = req.user.profileRef;
        }
      }

      const reservations = await Reservation.find(query)
        .populate('bookId')
        .sort({ queuePosition: 1, reservationDate: 1 });
        
      return sendSuccess(res, 200, 'Success', { reservations });
    } catch (error) {
      return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Failed to fetch reservations');
    }
  }

  static async reserveBook(req: Request, res: Response) {
    try {
      const data = ReservationSchema.parse(req.body);
      
      const book = await Book.findOne({ _id: data.bookId, schoolId: req.user?.schoolId });
      if (!book) return sendError(res, 404, 'RESOURCE_NOT_FOUND', 'Book not found');

      // Check if user already has a pending reservation for this book
      const existingRes = await Reservation.findOne({
        schoolId: req.user?.schoolId,
        bookId: data.bookId,
        status: 'PENDING',
        reservedByUserType: data.reservedByUserType,
        studentId: data.studentId,
        employeeId: data.employeeId
      });
      if (existingRes) return sendError(res, 409, 'DUPLICATE_RESOURCE', 'You already have a pending reservation for this book');

      // Determine queue position
      const pendingCount = await Reservation.countDocuments({
        schoolId: req.user?.schoolId,
        bookId: data.bookId,
        status: 'PENDING'
      });

      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 7); // Valid for 7 days

      const reservation = new Reservation({
        ...data,
        schoolId: req.user?.schoolId,
        reservationDate: new Date(),
        expiryDate: expiry,
        queuePosition: pendingCount + 1,
        status: 'PENDING'
      });

      await reservation.save();
      
      return sendSuccess(res, 201, 'Success', { reservation });
    } catch (error) {
      return sendError(res, 400, 'BUSINESS_RULE_VIOLATION', 'Failed to reserve book');
    }
  }

  static async cancelReservation(req: Request, res: Response) {
    try {
      if (!isValidObjectId(req.params.id)) return sendError(res, 400, 'BUSINESS_RULE_VIOLATION', 'Invalid Reservation ID');
      
      const reservation = await Reservation.findOne({ _id: req.params.id, schoolId: req.user?.schoolId });
      if (!reservation) return sendError(res, 404, 'RESOURCE_NOT_FOUND', 'Reservation not found');
      if (reservation.status !== 'PENDING') return sendError(res, 400, 'BUSINESS_RULE_VIOLATION', 'Only pending reservations can be cancelled');

      // Scope check: user can only cancel their own unless Librarian/Admin
      if (req.user?.role !== 'SUPER_ADMIN' && req.user?.role !== 'SCHOOL_ADMIN' && req.user?.role !== 'LIBRARIAN') {
        if (req.user?.userType === 'STUDENT' && reservation.studentId?.toString() !== req.user.profileRef?.toString()) {
           return sendError(res, 403, 'RBAC_PERMISSION_DENIED', 'Cannot cancel another user\'s reservation');
        }
        if ((req.user?.userType === 'STAFF' || req.user?.userType === 'TEACHER') && reservation.employeeId?.toString() !== req.user.profileRef?.toString()) {
           return sendError(res, 403, 'RBAC_PERMISSION_DENIED', 'Cannot cancel another user\'s reservation');
        }
      }

      reservation.status = 'CANCELLED';
      await reservation.save();

      return sendSuccess(res, 200, 'Success', { reservation });
    } catch (error) {
      return sendError(res, 400, 'BUSINESS_RULE_VIOLATION', 'Failed to cancel reservation');
    }
  }
}
