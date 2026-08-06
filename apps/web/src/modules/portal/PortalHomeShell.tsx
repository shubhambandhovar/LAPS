import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import {
  AdminDashboard,
  SchoolAdminDashboard,
  TeacherDashboard,
  StudentDashboard,
  GuardianDashboard,
  HRDashboard,
  FinanceDashboard,
  LibraryDashboard,
  InventoryDashboard,
  AdmissionOfficerDashboard,
  ReceptionistDashboard,
  EmployeeDashboard,
} from './dashboards';

export const PortalHomeShell: React.FC = () => {
  const { user } = useAuth();

  if (!user || !user.role) {
    return <AdminDashboard />;
  }

  const role = user.role.toUpperCase();

  switch (role) {
    case 'SUPER_ADMIN':
      return <AdminDashboard />;
    case 'SCHOOL_ADMIN':
      return <SchoolAdminDashboard />;
    case 'TEACHER':
      return <TeacherDashboard />;
    case 'STUDENT':
      return <StudentDashboard />;
    case 'GUARDIAN':
      return <GuardianDashboard />;
    case 'HR_MANAGER':
      return <HRDashboard />;
    case 'ACCOUNTANT':
      return <FinanceDashboard />;
    case 'LIBRARIAN':
      return <LibraryDashboard />;
    case 'STORE_MANAGER':
      return <InventoryDashboard />;
    case 'ADMISSION_OFFICER':
      return <AdmissionOfficerDashboard />;
    case 'RECEPTIONIST':
      return <ReceptionistDashboard />;
    case 'EMPLOYEE':
      return <EmployeeDashboard />;
    default:
      return <AdminDashboard />;
  }
};
