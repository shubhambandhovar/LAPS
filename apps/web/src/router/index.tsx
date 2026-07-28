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
