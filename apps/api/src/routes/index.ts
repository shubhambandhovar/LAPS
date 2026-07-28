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

export default router;
