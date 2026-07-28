import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { PublicLayout } from '../layouts/PublicLayout';
import { ERPLayout } from '../layouts/ERPLayout';
import { HomeShell } from '../modules/public/HomeShell';
import { LoginPage } from '../modules/auth/LoginPage';
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
