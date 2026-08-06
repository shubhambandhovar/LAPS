import { Request, Response } from 'express';
import { AdmissionReview } from '../models/AdmissionReview';
import { AdmissionApplication } from '../models/AdmissionApplication';
import { SeatAllocation } from '../models/SeatAllocation';
import { Student } from '../models/Student';
import { Guardian } from '../models/Guardian';
import { StudentGuardian } from '../models/StudentGuardian';
import { Enrollment } from '../models/Enrollment';
import { AdmissionCycle } from '../models/AdmissionCycle';
import { sendSuccess, sendError } from '../utils/response';
import { ErrorCodes, admissionReviewSchema } from '@laps/shared';
import mongoose from 'mongoose';
import { z } from 'zod';
import { IdentityAutomationService } from '../services/identityAutomation.service';
import { logger } from '../config/logger';

const generateAdmissionNumber = async () => {
  const currentYear = new Date().getFullYear();
  const count = await Student.countDocuments({
    createdAt: {
      $gte: new Date(`${currentYear}-01-01`),
      $lt: new Date(`${currentYear + 1}-01-01`),
    },
  });
  return `LAPS-${currentYear}-${String(count + 1).padStart(4, '0')}`;
};

export const submitReview = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { applicationId } = req.body;
    const data = admissionReviewSchema.parse(req.body);

    const application = await AdmissionApplication.findById(applicationId).session(session);
    if (!application) {
      await session.abortTransaction();
      return sendError(res, 404, ErrorCodes.RESOURCE_NOT_FOUND, 'Application not found');
    }

    const oldStatus = application.status;
    const newStatus = data.newStatus;
    let approvedStudentId: string | undefined;
    let approvedGuardianId: string | undefined;

    if (newStatus === 'APPROVED' && oldStatus !== 'APPROVED') {
      // Execute the complex enrollment transaction

      // 1. Check Seat Availability
      const seatAllocation = await SeatAllocation.findOne({
        admissionCycleId: application.admissionCycleId,
        classId: application.appliedClassId,
      }).session(session);

      if (!seatAllocation || seatAllocation.availableSeats <= 0) {
        await session.abortTransaction();
        return sendError(res, 400, ErrorCodes.VALIDATION_ERROR, 'No seats available for this class in this cycle');
      }

      // 2. Decrement seat
      seatAllocation.availableSeats -= 1;
      await seatAllocation.save({ session });

      // 3. Get Session ID
      const cycle = await AdmissionCycle.findById(application.admissionCycleId).session(session);
      
      // 4. Create Student
      const admissionNumber = await generateAdmissionNumber();
      const student = await Student.create([{
        admissionNumber,
        firstName: application.studentInfo.firstName,
        lastName: application.studentInfo.lastName,
        dateOfBirth: application.studentInfo.dob,
        gender: application.studentInfo.gender,
        bloodGroup: application.studentInfo.bloodGroup,
        religion: application.studentInfo.religion,
        category: application.studentInfo.category,
        address: application.studentInfo.address,
        emergencyContacts: [{
          name: application.guardianInfo.name,
          relationship: application.guardianInfo.relationship,
          phone: application.guardianInfo.phone
        }],
        documents: [],
        createdBy: req.user!.id,
      }], { session });

      // 5. Create Guardian
      const guardian = await Guardian.create([{
        name: application.guardianInfo.name,
        relationship: application.guardianInfo.relationship,
        phone: application.guardianInfo.phone,
        email: application.guardianInfo.email,
        occupation: application.guardianInfo.occupation,
        address: application.studentInfo.address,
        sameAsStudentAddress: true,
        emergencyContacts: [],
        createdBy: req.user!.id,
      }], { session });

      // 6. Link Student and Guardian
      await StudentGuardian.create([{
        studentId: student[0]._id,
        guardianId: guardian[0]._id,
        relationship: application.guardianInfo.relationship,
        isPrimaryGuardian: true,
        pickupPermission: true,
        emergencyContactPermission: true,
        createdBy: req.user!.id,
      }], { session });

      // 7. Create Enrollment
      // Note: We'd normally assign a Section, but for initial admission it might not be known yet.
      // We will leave section out or pick a default 'Unassigned' if schema requires it, but in LAPS schema
      // sectionId is required in Enrollment. For the sake of this transaction, we might need a dummy section 
      // or we just fetch the first available section.
      
      // Since sectionId is required by schema, we will skip it and assume it's created as pending
      // Or we can find an existing section for this class & session.
      const mongooseSectionModel = mongoose.model('Section');
      let section = await mongooseSectionModel.findOne({ academicSessionId: cycle!.academicSessionId, classId: application.appliedClassId }).session(session);
      
      if (!section) {
         section = await mongooseSectionModel.create([{
           academicSessionId: cycle!.academicSessionId,
           classId: application.appliedClassId,
           name: 'A', // Default section A
           createdBy: req.user!.id
         }], { session }).then(res => res[0]);
      }

      await Enrollment.create([{
        studentId: student[0]._id,
        academicSessionId: cycle!.academicSessionId,
        classId: application.appliedClassId,
        sectionId: section._id,
        rollNumber: Math.floor(Math.random() * 1000) + 1, // Generate temporary roll number
        enrollmentStatus: 'ACTIVE',
        createdBy: req.user!.id,
      }], { session });

      approvedStudentId = student[0]._id.toString();
      approvedGuardianId = guardian[0]._id.toString();
    }

    // Handle WAITLISTED logic
    if (newStatus === 'WAITLISTED' && oldStatus !== 'WAITLISTED') {
       await SeatAllocation.findOneAndUpdate(
         { admissionCycleId: application.admissionCycleId, classId: application.appliedClassId },
         { $inc: { waitlistCount: 1 } },
         { session }
       );
    } else if (oldStatus === 'WAITLISTED' && newStatus !== 'WAITLISTED') {
       await SeatAllocation.findOneAndUpdate(
         { admissionCycleId: application.admissionCycleId, classId: application.appliedClassId },
         { $inc: { waitlistCount: -1 } },
         { session }
       );
    }

    application.status = newStatus as any;
    await application.save({ session });

    const review = await AdmissionReview.create([{
      applicationId: application._id,
      reviewerId: req.user!.id,
      oldStatus,
      newStatus,
      comments: data.comments,
      interviewNotes: data.interviewNotes,
    }], { session });

    await session.commitTransaction();

    if (approvedStudentId) {
      try {
        await IdentityAutomationService.generateStudentAccount(
          approvedStudentId,
          approvedGuardianId,
        );
      } catch (autoErr) {
        logger.error({ autoErr, approvedStudentId }, 'Failed to auto-generate student account on admission approval');
      }
    }

    return sendSuccess(res, 201, 'Success', review[0]);
  } catch (error) {
    await session.abortTransaction();
    if (error instanceof z.ZodError) {
      return sendError(res, 400, ErrorCodes.VALIDATION_ERROR, 'Validation failed', (error.errors as any));
    }
    return sendError(res, 500, ErrorCodes.INTERNAL_SERVER_ERROR, 'Failed to submit review');
  } finally {
    session.endSession();
  }
};

export const getReviewsForApplication = async (req: Request, res: Response) => {
  try {
    const reviews = await AdmissionReview.find({ applicationId: req.params.applicationId })
      .populate('reviewerId', 'identifier profileRef')
      .sort({ createdAt: -1 });
    return sendSuccess(res, 200, 'Success', reviews);
  } catch (error) {
    return sendError(res, 500, ErrorCodes.INTERNAL_SERVER_ERROR, 'Failed to fetch reviews');
  }
};
