import React from 'react';
import {
  LayoutDashboard,
  Shield,
  Calendar,
  BookOpen,
  Users,
  Award,
  GraduationCap,
  UserCheck,
  School,
  CheckSquare,
  FileText,
  DollarSign,
  Briefcase,
  Package,
  BookMarked,
  Bus,
  MessageSquare,
  Globe,
  User,
  Settings,
  QrCode,
  PenTool,
} from 'lucide-react';

export interface NavItemConfig {
  title: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  requiredPermission?: string;
  requiredRole?: string[];
}

export interface NavSectionConfig {
  title?: string;
  items: NavItemConfig[];
}

/**
 * Dynamic ERP Navigation Configuration.
 * Every menu item declares requiredPermission or requiredRole.
 * The sidebar dynamically filters out any module the logged-in user cannot access.
 */
export const ERP_NAVIGATION_CONFIG: NavSectionConfig[] = [
  {
    items: [
      {
        title: 'Dashboard',
        to: '/portal',
        icon: LayoutDashboard,
      },
      {
        title: 'My Profile',
        to: '/portal/profile',
        icon: User,
      },
    ],
  },
  {
    title: 'Admissions & Front Office',
    items: [
      {
        title: 'Admissions Pipeline',
        to: '/portal/admissions',
        icon: UserCheck,
        requiredRole: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'ADMISSION_OFFICER'],
      },
      {
        title: 'Visitor & Desk Log',
        to: '/portal/visitors',
        icon: Users,
        requiredRole: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'RECEPTIONIST'],
      },
      {
        title: 'Inquiries & Follow-ups',
        to: '/portal/admissions/enquiries',
        icon: FileText,
        requiredRole: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'ADMISSION_OFFICER', 'RECEPTIONIST'],
      },
    ],
  },
  {
    title: 'Human Resources & Staff',
    items: [
      {
        title: 'HR & Payroll Admin',
        to: '/portal/hr',
        icon: Briefcase,
        requiredRole: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'HR_MANAGER'],
      },
      {
        title: 'Leave Applications',
        to: '/portal/hr/leaves',
        icon: Calendar,
        requiredRole: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'HR_MANAGER', 'TEACHER', 'EMPLOYEE'],
      },
      {
        title: 'My Payslips & Salary',
        to: '/portal/hr/payslips',
        icon: DollarSign,
        requiredRole: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'HR_MANAGER', 'TEACHER', 'EMPLOYEE'],
      },
    ],
  },
  {
    title: 'Security & Identity',
    items: [
      {
        title: 'Identity & Accounts',
        to: '/portal/identity',
        icon: Shield,
        requiredRole: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'HR_MANAGER'],
        requiredPermission: 'user.all',
      },
    ],
  },
  {
    title: 'Academic Foundation',
    items: [
      {
        title: 'Academic Sessions',
        to: '/portal/academic-sessions',
        icon: Calendar,
        requiredRole: ['SUPER_ADMIN', 'SCHOOL_ADMIN'],
        requiredPermission: 'academics.create',
      },
      {
        title: 'Classes',
        to: '/portal/classes',
        icon: BookOpen,
        requiredRole: ['SUPER_ADMIN', 'SCHOOL_ADMIN'],
        requiredPermission: 'academics.read',
      },
      {
        title: 'Sections',
        to: '/portal/sections',
        icon: Users,
        requiredRole: ['SUPER_ADMIN', 'SCHOOL_ADMIN'],
        requiredPermission: 'academics.read',
      },
      {
        title: 'Global Subjects',
        to: '/portal/subjects',
        icon: Award,
        requiredRole: ['SUPER_ADMIN', 'SCHOOL_ADMIN'],
        requiredPermission: 'academics.read',
      },
    ],
  },
  {
    title: 'Faculty & Assignments',
    items: [
      {
        title: 'Teachers Directory',
        to: '/portal/teachers',
        icon: GraduationCap,
        requiredRole: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'HR_MANAGER', 'TEACHER'],
        requiredPermission: 'teacher.read',
      },
      {
        title: 'Teaching Assignments',
        to: '/portal/teaching-assignments',
        icon: UserCheck,
        requiredRole: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'HR_MANAGER'],
        requiredPermission: 'academics.update',
      },
    ],
  },
  {
    title: 'Students & Enrollment',
    items: [
      {
        title: 'Students Directory',
        to: '/portal/students',
        icon: GraduationCap,
        requiredRole: [
          'SUPER_ADMIN',
          'SCHOOL_ADMIN',
          'TEACHER',
          'ACCOUNTANT',
          'RECEPTIONIST',
          'ADMISSION_OFFICER',
          'LIBRARIAN',
        ],
        requiredPermission: 'student.read',
      },
      {
        title: 'Guardians Directory',
        to: '/portal/guardians',
        icon: Users,
        requiredRole: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'RECEPTIONIST'],
        requiredPermission: 'student.read',
      },
      {
        title: 'Enrollment Matrix',
        to: '/portal/enrollments',
        icon: School,
        requiredRole: ['SUPER_ADMIN', 'SCHOOL_ADMIN'],
        requiredPermission: 'student.update',
      },
    ],
  },
  {
    title: 'Curriculum & Timetable',
    items: [
      {
        title: 'Curriculum & Rooms',
        to: '/portal/curriculum',
        icon: BookOpen,
        requiredRole: ['SUPER_ADMIN', 'SCHOOL_ADMIN'],
      },
      {
        title: 'Timetable & Workload',
        to: '/portal/timetable',
        icon: School,
        requiredRole: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT'],
      },
      {
        title: 'Academic Calendar',
        to: '/portal/academic-calendar',
        icon: Calendar,
      },
    ],
  },
  {
    title: 'Classroom & Learning',
    items: [
      {
        title: 'Attendance',
        to: '/portal/attendance',
        icon: CheckSquare,
        requiredRole: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT', 'GUARDIAN', 'RECEPTIONIST'],
      },
      {
        title: 'Homework',
        to: '/portal/homework',
        icon: FileText,
        requiredRole: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT', 'GUARDIAN'],
      },
      {
        title: 'Assignments',
        to: '/portal/homework',
        icon: FileText,
        requiredRole: ['TEACHER', 'STUDENT'],
      },
      {
        title: 'Study Material',
        to: '/portal/study-material',
        icon: BookOpen,
        requiredRole: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT'],
      },
    ],
  },
  {
    title: 'Exams & Report Cards',
    items: [
      {
        title: 'Examinations',
        to: '/portal/exams/dashboard',
        icon: Award,
        requiredRole: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'],
      },
      {
        title: 'Marks Entry',
        to: '/portal/marks',
        icon: FileText,
        requiredRole: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'],
      },
      {
        title: 'Report Cards Admin',
        to: '/portal/report-cards/dashboard',
        icon: GraduationCap,
        requiredRole: ['SUPER_ADMIN', 'SCHOOL_ADMIN'],
      },
      {
        title: 'Template Builder',
        to: '/portal/report-cards/templates',
        icon: BookOpen,
        requiredRole: ['SUPER_ADMIN', 'SCHOOL_ADMIN'],
      },
      {
        title: 'Generate & Publish',
        to: '/portal/report-cards/generate',
        icon: Award,
        requiredRole: ['SUPER_ADMIN', 'SCHOOL_ADMIN'],
      },
      {
        title: 'Promotion Decisions',
        to: '/portal/report-cards/promotions',
        icon: GraduationCap,
        requiredRole: ['SUPER_ADMIN', 'SCHOOL_ADMIN'],
      },
      {
        title: 'My Report Cards',
        to: '/portal/report-cards/my-report-cards',
        icon: School,
        requiredRole: ['STUDENT', 'GUARDIAN', 'TEACHER'],
      },
    ],
  },
  {
    title: 'Fee Management & Finance',
    items: [
      {
        title: 'Fee Status',
        to: '/portal/fees',
        icon: DollarSign,
        requiredRole: ['STUDENT', 'GUARDIAN'],
      },
      {
        title: 'Fee Management',
        to: '/portal/fees/admin',
        icon: DollarSign,
        requiredRole: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACCOUNTANT'],
      },
      {
        title: 'Finance & Reports',
        to: '/portal/finance',
        icon: DollarSign,
        requiredRole: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACCOUNTANT'],
      },
    ],
  },
  {
    title: 'Library Administration',
    items: [
      {
        title: 'Books & Catalog',
        to: '/portal/library',
        icon: BookOpen,
        requiredRole: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'LIBRARIAN', 'STUDENT', 'TEACHER'],
      },
      {
        title: 'Issues & Returns',
        to: '/portal/library/issues',
        icon: BookMarked,
        requiredRole: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'LIBRARIAN'],
      },
      {
        title: 'Fines & Reservations',
        to: '/portal/library/fines',
        icon: DollarSign,
        requiredRole: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'LIBRARIAN'],
      },
    ],
  },
  {
    title: 'Store & Inventory',
    items: [
      {
        title: 'Inventory & Assets',
        to: '/portal/inventory',
        icon: Package,
        requiredRole: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'STORE_MANAGER'],
      },
      {
        title: 'Vendors & Consumables',
        to: '/portal/inventory/vendors',
        icon: Briefcase,
        requiredRole: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'STORE_MANAGER'],
      },
    ],
  },
  {
    title: 'Transport Management',
    items: [
      {
        title: 'Transport Services',
        to: '/portal/transport',
        icon: Bus,
        requiredRole: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'STUDENT', 'GUARDIAN'],
      },
    ],
  },
  {
    title: 'Digital Identity',
    items: [
      {
        title: 'QR Center',
        to: '/portal/qr',
        icon: QrCode,
        requiredPermission: 'qr.scan',
      },
      {
        title: 'ID Card System',
        to: '/portal/id-cards',
        icon: User,
      },
      {
        title: 'Document Center',
        to: '/portal/documents',
        icon: FileText,
      },
      {
        title: 'Approval Queue',
        to: '/portal/documents/approval-queue',
        icon: CheckSquare,
      },
      {
        title: 'My Signatures',
        to: '/portal/signatures',
        icon: PenTool,
      },
    ],
  },
  {
    title: 'Communication & Settings',
    items: [
      {
        title: 'Messages & Notices',
        to: '/portal/messages',
        icon: MessageSquare,
      },
      {
        title: 'Settings',
        to: '/portal/settings',
        icon: Settings,
      },
    ],
  },
  {
    title: 'Public Website (CMS)',
    items: [
      {
        title: 'CMS Dashboard',
        to: '/cms/dashboard',
        icon: Globe,
        requiredRole: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'CONTENT_EDITOR', 'MEDIA_MANAGER'],
      },
    ],
  },
];
