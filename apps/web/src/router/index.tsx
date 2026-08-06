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
import { AdmissionApplicationForm } from '../modules/public/AdmissionApplicationForm';
import { ApplicationStatus } from '../modules/public/ApplicationStatus';
import { AboutUs } from '../modules/public/AboutUs';
import { AcademicsPublic } from '../modules/public/AcademicsPublic';
import { FacilitiesPublic } from '../modules/public/FacilitiesPublic';
import { ContactPublic } from '../modules/public/ContactPublic';
import { AdmissionsPublic } from '../modules/public/AdmissionsPublic';
import { AdmissionDashboard } from '../modules/admissions/AdmissionDashboard';
import { AdmissionCycleManager } from '../modules/admissions/AdmissionCycleManager';
import { ApplicationReviewer } from '../modules/admissions/ApplicationReviewer';
import { PortalHomeShell } from '../modules/portal/PortalHomeShell';
import { UnauthorizedShell } from '../modules/portal/UnauthorizedShell';
import { NotFoundShell } from '../modules/errors/NotFoundShell';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import {
  IdentityDashboard,
  UserAccountsPage,
  LoginHistoryPage,
} from '../modules/identity';

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
import {
  QrDashboard,
  IdCardGenerator,
  QrScanner,
  ScanHistory,
} from '../modules/portal/qr';
import {
  IdCardDashboard,
  TemplateBuilder,
  BulkGenerator,
  DownloadCenter,
} from '../modules/portal/id-cards';
import {
  DocumentDashboard,
  DocumentTemplateBuilder,
  DocumentGenerator,
  DocumentHistory,
} from '../modules/portal/documents';
import { ApprovalQueue } from '../modules/portal/documents/ApprovalQueue';
import { SignatureManager } from '../modules/portal/signatures/SignatureManager';

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
      { path: 'admissions', element: <AdmissionsPublic /> },
      { path: 'apply', element: <ProtectedRoute><AdmissionApplicationForm /></ProtectedRoute> },
      { path: 'application-status', element: <ProtectedRoute><ApplicationStatus /></ProtectedRoute> },
      { path: 'about', element: <AboutUs /> },
      { path: 'academics', element: <AcademicsPublic /> },
      { path: 'facilities', element: <FacilitiesPublic /> },
      { path: 'contact', element: <ContactPublic /> },
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
        path: 'identity',
        children: [
          { index: true, element: <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'SCHOOL_ADMIN', 'HR_MANAGER']}><IdentityDashboard /></ProtectedRoute> },
          { path: 'accounts', element: <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'SCHOOL_ADMIN', 'HR_MANAGER']}><UserAccountsPage /></ProtectedRoute> },
          { path: 'history', element: <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'SCHOOL_ADMIN', 'HR_MANAGER']}><LoginHistoryPage /></ProtectedRoute> },
        ],
      },
      {
        path: 'qr',
        children: [
          { index: true, element: <QrDashboard /> },
          { path: 'id-cards', element: <ProtectedRoute requiredPermission="qr.create"><IdCardGenerator /></ProtectedRoute> },
          { path: 'scan', element: <ProtectedRoute requiredPermission="qr.scan"><QrScanner /></ProtectedRoute> },
          { path: 'history', element: <ProtectedRoute requiredPermission="qr.read"><ScanHistory /></ProtectedRoute> },
        ],
      },
      {
        path: 'id-cards',
        children: [
          { index: true, element: <IdCardDashboard /> },
          { path: 'templates', element: <ProtectedRoute requiredPermission="id_card.create"><TemplateBuilder /></ProtectedRoute> },
          { path: 'bulk-generate', element: <ProtectedRoute requiredPermission="id_card.create"><BulkGenerator /></ProtectedRoute> },
          { path: 'my-card', element: <DownloadCenter /> },
          { path: 'downloads', element: <ProtectedRoute requiredPermission="id_card.read"><DownloadCenter /></ProtectedRoute> },
        ],
      },
      {
        path: 'documents',
        children: [
          { index: true, element: <DocumentDashboard /> },
          { path: 'templates', element: <ProtectedRoute requiredPermission="document.template.manage"><DocumentTemplateBuilder /></ProtectedRoute> },
          { path: 'generate', element: <ProtectedRoute requiredPermission="document.issue"><DocumentGenerator /></ProtectedRoute> },
          { path: 'history', element: <ProtectedRoute requiredPermission="document.read"><DocumentHistory /></ProtectedRoute> },
          { path: 'approval-queue', element: <ProtectedRoute requiredPermission="document.approve"><ApprovalQueue /></ProtectedRoute> },
        ],
      },
      {
        path: 'signatures',
        element: <ProtectedRoute requiredPermission="signature.manage"><SignatureManager /></ProtectedRoute>,
      },
      {
        path: 'academic-sessions',
        element: <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'SCHOOL_ADMIN']}><AcademicSessionsPage /></ProtectedRoute>,
      },
      {
        path: 'classes',
        element: <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER']}><ClassesPage /></ProtectedRoute>,
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
        element: <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER']}><SectionsPage /></ProtectedRoute>,
      },
      {
        path: 'subjects',
        element: <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER']}><SubjectsPage /></ProtectedRoute>,
      },
      {
        path: 'teachers',
        element: <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'SCHOOL_ADMIN', 'HR_MANAGER', 'TEACHER']}><TeachersPage /></ProtectedRoute>,
      },
      {
        path: 'teaching-assignments',
        element: <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'SCHOOL_ADMIN', 'HR_MANAGER']}><TeachingAssignmentsPage /></ProtectedRoute>,
      },
      {
        path: 'students',
        element: <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'ACCOUNTANT', 'RECEPTIONIST', 'ADMISSION_OFFICER', 'LIBRARIAN']}><StudentsPage /></ProtectedRoute>,
      },
      {
        path: 'students/:id',
        element: <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'ACCOUNTANT', 'RECEPTIONIST', 'ADMISSION_OFFICER', 'LIBRARIAN']}><StudentDetailPage /></ProtectedRoute>,
      },
      {
        path: 'guardians',
        element: <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'SCHOOL_ADMIN', 'RECEPTIONIST']}><GuardiansPage /></ProtectedRoute>,
      },
      {
        path: 'enrollments',
        element: <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'SCHOOL_ADMIN']}><EnrollmentsPage /></ProtectedRoute>,
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
