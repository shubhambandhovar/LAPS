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

export default router;


