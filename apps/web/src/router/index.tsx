import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { PublicLayout } from '../layouts/PublicLayout';
import { ERPLayout } from '../layouts/ERPLayout';
import { HomeShell } from '../modules/public/HomeShell';
import { LoginPage } from '../modules/auth/LoginPage';
import { CmsDashboard } from '../modules/cms/CmsDashboard';
import { CmsPageViewer } from '../modules/public/CmsPageViewer';
import { PublicNews } from '../modules/public/PublicNews';
import { PublicNotices } from '../modules/public/PublicNotices';
import { PublicGallery } from '../modules/public/PublicGallery';
import { AdmissionsLanding } from '../modules/public/AdmissionsLanding';
import { AdmissionApplicationForm } from '../modules/public/AdmissionApplicationForm';
import { ApplicationStatus } from '../modules/public/ApplicationStatus';
import { AdmissionDashboard } from '../modules/admissions/AdmissionDashboard';
import { AdmissionCycleManager } from '../modules/admissions/AdmissionCycleManager';
import { ApplicationReviewer } from '../modules/admissions/ApplicationReviewer';
import { PortalHomeShell } from '../modules/portal/PortalHomeShell';
import { UnauthorizedShell } from '../modules/portal/UnauthorizedShell';
import { NotFoundShell } from '../modules/errors/NotFoundShell';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';

import {
  AcademicSessionsPage,
  ClassesPage,
  SectionsPage,
  SubjectsPage,
  TeachersPage,
  TeachingAssignmentsPage,
} from '../modules/academics';
import {
  StudentsPage,
  StudentDetailPage,
  GuardiansPage,
  EnrollmentsPage,
} from '../modules/students';
import {
  CurriculumPage,
  TimetablePage,
  AcademicCalendarPage,
} from '../modules/curriculum';
import {
  AttendanceMarkPage,
  AttendanceRegisterPage,
  BulkAttendancePage,
  LeaveManagementPage,
  AttendanceCorrectionsPage,
  AttendanceDashboardPage,
} from '../modules/attendance';
import {
  HomeworkDashboardPage,
  HomeworkListPage,
  HomeworkSubmissionsPage,
  StudyMaterialPage,
  RubricLibraryPage,
} from '../modules/homework';
import {
  ExamDashboardPage,
  ExamSchedulePage,
  MarksEntryPage,
  ResultsPage,
  StudentResultPage,
  ReEvaluationPage,
} from '../modules/exams';
import {
  ReportCardDashboardPage,
  TemplateBuilderPage,
  GeneratePublishPage,
  PromotionManagementPage,
  MyReportCardsPage,
} from '../modules/report-cards';
import {
  NotificationCenter,
  NoticeBoard,
  NoticeManager,
  TemplateManager,
  DeliveryDashboard,
  ScheduledNotifications,
  NotificationPreferences,
} from '../modules/communication';
import {
  CalendarDashboard,
  HolidayManagement,
  EventManagement,
  CalendarAnalytics,
  EventReminders,
} from '../modules/calendar';

const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      {
        index: true,
        element: <HomeShell />,
      },
      {
        path: 'login',
        element: <LoginPage />,
      },
      { path: 'news', element: <PublicNews /> },
      { path: 'notices', element: <PublicNotices /> },
      { path: 'gallery', element: <PublicGallery /> },
      { path: 'admissions', element: <AdmissionsLanding /> },
      { path: 'apply', element: <ProtectedRoute><AdmissionApplicationForm /></ProtectedRoute> },
      { path: 'application-status', element: <ProtectedRoute><ApplicationStatus /></ProtectedRoute> },
      { path: 'page/:slug', element: <CmsPageViewer /> },
    ],
  },
  {
    path: '/portal',
    element: (
      <ProtectedRoute>
        <ERPLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <PortalHomeShell />,
      },
      {
        path: 'unauthorized',
        element: <UnauthorizedShell />,
      },
      {
        path: 'academic-sessions',
        element: <AcademicSessionsPage />,
      },
      {
        path: 'classes',
        element: <ClassesPage />,
      },
      {
        path: 'admissions',
        children: [
          { index: true, element: <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'SCHOOL_ADMIN', 'ADMISSION_OFFICER']}><AdmissionDashboard /></ProtectedRoute> },
          { path: 'cycles', element: <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'SCHOOL_ADMIN', 'ADMISSION_OFFICER']}><AdmissionCycleManager /></ProtectedRoute> },
          { path: 'review/:id', element: <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'SCHOOL_ADMIN', 'ADMISSION_OFFICER']}><ApplicationReviewer /></ProtectedRoute> },
        ],
      },
      {
        path: 'sections',
        element: <SectionsPage />,
      },
      {
        path: 'subjects',
        element: <SubjectsPage />,
      },
      {
        path: 'teachers',
        element: <TeachersPage />,
      },
      {
        path: 'teaching-assignments',
        element: <TeachingAssignmentsPage />,
      },
      {
        path: 'students',
        element: <StudentsPage />,
      },
      {
        path: 'students/:id',
        element: <StudentDetailPage />,
      },
      {
        path: 'guardians',
        element: <GuardiansPage />,
      },
      {
        path: 'enrollments',
        element: <EnrollmentsPage />,
      },
      {
        path: 'curriculum',
        element: <CurriculumPage />,
      },
      {
        path: 'timetable',
        element: <TimetablePage />,
      },
      {
        path: 'academic-calendar',
        element: <AcademicCalendarPage />,
      },
      // Phase 6: Attendance & Leave Management
      {
        path: 'attendance/dashboard',
        element: <AttendanceDashboardPage />,
      },
      {
        path: 'attendance/mark',
        element: <AttendanceMarkPage />,
      },
      {
        path: 'attendance/register',
        element: <AttendanceRegisterPage />,
      },
      {
        path: 'attendance/bulk',
        element: <BulkAttendancePage />,
      },
      {
        path: 'attendance/corrections',
        element: <AttendanceCorrectionsPage />,
      },
      {
        path: 'attendance/leaves',
        element: <LeaveManagementPage />,
      },
      // Phase 7: Homework, Assignments & Study Material
      {
        path: 'homework/dashboard',
        element: <HomeworkDashboardPage />,
      },
      {
        path: 'homework/list',
        element: <HomeworkListPage />,
      },
      {
        path: 'homework/submissions',
        element: <HomeworkSubmissionsPage />,
      },
      {
        path: 'homework/study-material',
        element: <StudyMaterialPage />,
      },
      {
        path: 'homework/rubrics',
        element: <RubricLibraryPage />,
      },
      // Phase 8: Examination, Assessment & Marks Management
      {
        path: 'exams/dashboard',
        element: <ExamDashboardPage />,
      },
      {
        path: 'exams/schedule',
        element: <ExamSchedulePage />,
      },
      {
        path: 'exams/marks-entry',
        element: <MarksEntryPage />,
      },
      {
        path: 'exams/results',
        element: <ResultsPage />,
      },
      {
        path: 'exams/my-results',
        element: <StudentResultPage />,
      },
      {
        path: 'exams/re-evaluations',
        element: <ReEvaluationPage />,
      },
      // Phase 9: Report Cards, Academic Transcripts & Promotion Management
      {
        path: 'report-cards/dashboard',
        element: <ReportCardDashboardPage />,
      },
      {
        path: 'report-cards/templates',
        element: <TemplateBuilderPage />,
      },
      {
        path: 'report-cards/generate',
        element: <GeneratePublishPage />,
      },
      {
        path: 'report-cards/promotions',
        element: <PromotionManagementPage />,
      },
      {
        path: 'report-cards/my-report-cards',
        element: <MyReportCardsPage />,
      },
      // Phase 11: Communication & Notification System
      {
        path: 'communication/notifications',
        element: <NotificationCenter />,
      },
      {
        path: 'communication/notices',
        element: <NoticeBoard />,
      },
      {
        path: 'communication/notices/manage',
        element: <NoticeManager />,
      },
      {
        path: 'communication/templates',
        element: <TemplateManager />,
      },
      {
        path: 'communication/delivery-logs',
        element: <DeliveryDashboard />,
      },
      {
        path: 'communication/scheduled',
        element: <ScheduledNotifications />,
      },
      {
        path: 'communication/preferences',
        element: <NotificationPreferences />,
      },
      // Phase 12 Event & Holiday Calendar Routes
      {
        path: 'calendar',
        element: <CalendarDashboard />,
      },
      {
        path: 'calendar/holidays',
        element: <HolidayManagement />,
      },
      {
        path: 'calendar/events',
        element: <EventManagement />,
      },
      {
        path: 'calendar/analytics',
        element: <CalendarAnalytics />,
      },
      {
        path: 'calendar/reminders',
        element: <EventReminders />,
      },
      // Phase 14: CMS Dashboard
      {
        path: 'cms/dashboard',
        element: <CmsDashboard />,
      },
    ],
  },

  {
    path: '*',
    element: <PublicLayout />,
    children: [
      {
        path: '*',
        element: <NotFoundShell />,
      },
    ],
  },
]);

export const AppRouter: React.FC = () => {
  return <RouterProvider router={router} />;
};
