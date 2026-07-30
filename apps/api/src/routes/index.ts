import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';
import academicSessionRoutes from './academicSessions.routes';
import classRoutes from './classes.routes';
import sectionRoutes from './sections.routes';
import subjectRoutes from './subjects.routes';
import teacherRoutes from './teachers.routes';
import teachingAssignmentRoutes from './teachingAssignments.routes';
import studentRoutes from './students.routes';
import guardianRoutes from './guardians.routes';
import studentGuardianRoutes from './studentGuardians.routes';
import enrollmentRoutes from './enrollments.routes';
import academicTermRoutes from './academicTerms.routes';
import classSubjectRoutes from './classSubjects.routes';
import roomRoutes from './rooms.routes';
import bellScheduleRoutes from './bellSchedules.routes';
import periodRoutes from './periods.routes';
import timetableRoutes from './timetables.routes';
import academicCalendarRoutes from './academicCalendar.routes';
import workingDayRuleRoutes from './workingDayRules.routes';
import holidayRoutes from './holidays.routes';
import attendanceRoutes from './attendance.routes';
import leaveRoutes from './leaves.routes';
import homeworkRoutes from './homework.routes';
import rubricRoutes from './rubric.routes';
import studyMaterialRoutes from './studyMaterial.routes';
import examRoutes from './exam.routes';
import examScheduleRoutes from './examSchedule.routes';
import assessmentComponentRoutes from './assessmentComponent.routes';
import marksRoutes from './marks.routes';
import gradeScaleRoutes from './gradeScale.routes';
import resultRoutes from './result.routes';
import reEvaluationRoutes from './reEvaluation.routes';
import reportCardTemplateRoutes from './reportCardTemplate.routes';
import reportCardRoutes from './reportCard.routes';
import promotionRoutes from './promotion.routes';
import financialYearRoutes from './financialYear.routes';
import feeHeadRoutes from './feeHead.routes';
import feeStructureRoutes from './feeStructure.routes';
import feeDiscountRoutes from './feeDiscount.routes';
import lateFeeRuleRoutes from './lateFeeRule.routes';
import invoiceRoutes from './invoice.routes';
import paymentRoutes from './payment.routes';
import receiptRoutes from './receipt.routes';
import studentLedgerRoutes from './studentLedger.routes';
import feeReportRoutes from './feeReport.routes';
import notificationRoutes from './notification.routes';
import noticeRoutes from './notice.routes';
import templateRoutes from './template.routes';
import preferenceRoutes from './preference.routes';
import deliveryLogRoutes from './deliveryLog.routes';
import scheduledNotificationRoutes from './scheduledNotification.routes';
import eventRoutes from './events.routes';
import reminderRoutes from './reminders.routes';
import calendarViewRoutes from './calendar.routes';
import vehicleRoutes from './vehicle.routes';
import driverRoutes from './driver.routes';
import routeRoutes from './route.routes';
import stopRoutes from './stop.routes';
import assignmentRoutes from './assignment.routes';
import gpsRoutes from './gps.routes';
import maintenanceRoutes from './maintenance.routes';
import transportSummaryRoutes from './transportSummary.routes';

const router = Router();

// Phase 1 Foundation: Mount Health Check endpoint
router.use('/health', healthRoutes);

// Phase 2: Mount Authentication & Multi-Device Session Security endpoints
router.use('/auth', authRoutes);

// Phase 3: Mount Academic Foundation & Master Data endpoints
router.use('/academic-sessions', academicSessionRoutes);
router.use('/classes', classRoutes);
router.use('/sections', sectionRoutes);
router.use('/subjects', subjectRoutes);
router.use('/teachers', teacherRoutes);
router.use('/teaching-assignments', teachingAssignmentRoutes);

// Phase 4: Mount Student, Guardian & Enrollment Management endpoints
router.use('/students', studentRoutes);
router.use('/guardians', guardianRoutes);
router.use('/student-guardians', studentGuardianRoutes);
router.use('/enrollments', enrollmentRoutes);

// Phase 5: Mount Curriculum, Timetable & Academic Calendar endpoints
router.use('/academic-terms', academicTermRoutes);
router.use('/class-subjects', classSubjectRoutes);
router.use('/rooms', roomRoutes);
router.use('/bell-schedules', bellScheduleRoutes);
router.use('/periods', periodRoutes);
router.use('/timetables', timetableRoutes);
router.use('/academic-calendar', academicCalendarRoutes);
router.use('/working-day-rules', workingDayRuleRoutes);
router.use('/holidays', holidayRoutes);

// Phase 6: Mount Attendance & Leave Management endpoints
router.use('/attendance', attendanceRoutes);
router.use('/leaves', leaveRoutes);

// Phase 7: Mount Homework, Rubrics & Study Material endpoints
router.use('/homework', homeworkRoutes);
router.use('/rubrics', rubricRoutes);
router.use('/study-material', studyMaterialRoutes);

// Phase 8: Mount Examination, Assessment & Marks Management endpoints
router.use('/exams', examRoutes);
router.use('/exam-schedules', examScheduleRoutes);
router.use('/assessment-components', assessmentComponentRoutes);
router.use('/marks', marksRoutes);
router.use('/grade-scales', gradeScaleRoutes);
router.use('/results', resultRoutes);
router.use('/re-evaluations', reEvaluationRoutes);

// Phase 9: Mount Report Cards, Academic Transcripts & Promotion Management endpoints
router.use('/report-card-templates', reportCardTemplateRoutes);
router.use('/report-cards', reportCardRoutes);
router.use('/promotions', promotionRoutes);

// Phase 10: Mount Fee Management & Finance endpoints
router.use('/financial-years', financialYearRoutes);
router.use('/fee-heads', feeHeadRoutes);
router.use('/fee-structures', feeStructureRoutes);
router.use('/discounts', feeDiscountRoutes);
router.use('/late-fee-rules', lateFeeRuleRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/payments', paymentRoutes);
router.use('/receipts', receiptRoutes);
router.use('/student-ledger', studentLedgerRoutes);
router.use('/fee-reports', feeReportRoutes);

// Phase 11: Mount Communication & Notification System endpoints
router.use('/notifications', notificationRoutes);
router.use('/notices', noticeRoutes);
router.use('/templates', templateRoutes);
router.use('/preferences', preferenceRoutes);
router.use('/delivery-logs', deliveryLogRoutes);
router.use('/scheduled-notifications', scheduledNotificationRoutes);

// Phase 12: Mount Event & Holiday Calendar endpoints
router.use('/calendar', calendarViewRoutes);
router.use('/events', eventRoutes);
router.use('/reminders', reminderRoutes);

// Phase 13: Mount Transport, Fleet & GPS Tracking endpoints
router.use('/vehicles', vehicleRoutes);
router.use('/drivers', driverRoutes);
router.use('/routes', routeRoutes);
router.use('/stops', stopRoutes);
router.use('/assignments', assignmentRoutes);
router.use('/gps', gpsRoutes);
router.use('/maintenance', maintenanceRoutes);
router.use('/transport-summary', transportSummaryRoutes);

export default router;



