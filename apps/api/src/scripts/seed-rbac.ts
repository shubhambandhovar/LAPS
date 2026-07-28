import { connectDatabase, disconnectDatabase } from '../config/database';
import { Role } from '../models/Role';
import { Permission, IPermissionDocument } from '../models/Permission';
import { logger } from '../config/logger';

interface PermDef {
  module: string;
  action: string;
  resource: string;
  description: string;
}

const PERMISSIONS_LIST: PermDef[] = [
  // ALL / GLOBAL
  {
    module: 'USER',
    action: 'ALL',
    resource: 'all',
    description: 'Full institutional administrative access',
  },
  // SCHOOL_ADMIN / ACADEMICS
  {
    module: 'ACADEMIC_SESSION',
    action: 'CREATE',
    resource: 'academic-session',
    description: 'Create academic years',
  },
  {
    module: 'ACADEMIC_SESSION',
    action: 'READ',
    resource: 'academic-session',
    description: 'View academic years',
  },
  {
    module: 'ACADEMIC_SESSION',
    action: 'UPDATE',
    resource: 'academic-session',
    description: 'Update academic sessions',
  },
  {
    module: 'STUDENT',
    action: 'CREATE',
    resource: 'student',
    description: 'Admit new student',
  },
  {
    module: 'STUDENT',
    action: 'READ',
    resource: 'student',
    description: 'View student profile',
  },
  {
    module: 'STUDENT',
    action: 'UPDATE',
    resource: 'student',
    description: 'Edit student records',
  },
  {
    module: 'TEACHER',
    action: 'READ',
    resource: 'teacher',
    description: 'View teacher profile',
  },
  {
    module: 'ATTENDANCE',
    action: 'CREATE',
    resource: 'attendance',
    description: 'Mark class attendance',
  },
  {
    module: 'ATTENDANCE',
    action: 'READ',
    resource: 'attendance',
    description: 'View attendance records',
  },
  {
    module: 'HOMEWORK',
    action: 'CREATE',
    resource: 'homework',
    description: 'Assign class homework',
  },
  {
    module: 'HOMEWORK',
    action: 'READ',
    resource: 'homework',
    description: 'View homework assignments',
  },
  {
    module: 'EXAM',
    action: 'CREATE',
    resource: 'exam',
    description: 'Schedule examinations',
  },
  {
    module: 'EXAM',
    action: 'READ',
    resource: 'exam',
    description: 'View exam schedule',
  },
  {
    module: 'MARKS',
    action: 'CREATE',
    resource: 'mark',
    description: 'Enter exam marks',
  },
  {
    module: 'MARKS',
    action: 'READ',
    resource: 'mark',
    description: 'View marks',
  },
  {
    module: 'REPORT_CARD',
    action: 'READ',
    resource: 'report-card',
    description: 'View report card',
  },
  {
    module: 'FEE',
    action: 'READ',
    resource: 'fee',
    description: 'View fee dues and receipts',
  },
  {
    module: 'CMS',
    action: 'UPDATE',
    resource: 'cms',
    description: 'Manage public website content',
  },
];

export async function seedRbac(): Promise<void> {
  await connectDatabase();

  logger.info('Starting idempotent RBAC permission and role seeding...');

  const permMap = new Map<string, IPermissionDocument>();

  for (const p of PERMISSIONS_LIST) {
    const doc = await Permission.findOneAndUpdate(
      { module: p.module, action: p.action, resource: p.resource },
      { $set: p },
      { upsert: true, new: true },
    );
    permMap.set(`${p.module}_${p.action}_${p.resource}`, doc);
  }

  const superAdminPerms = Array.from(permMap.values()).map((doc) => doc._id);

  const teacherPerms = [
    permMap.get('STUDENT_READ_student')?._id,
    permMap.get('TEACHER_READ_teacher')?._id,
    permMap.get('ATTENDANCE_CREATE_attendance')?._id,
    permMap.get('ATTENDANCE_READ_attendance')?._id,
    permMap.get('HOMEWORK_CREATE_homework')?._id,
    permMap.get('HOMEWORK_READ_homework')?._id,
    permMap.get('EXAM_READ_exam')?._id,
    permMap.get('MARKS_CREATE_mark')?._id,
    permMap.get('MARKS_READ_mark')?._id,
  ].filter(Boolean);

  const studentPerms = [
    permMap.get('STUDENT_READ_student')?._id,
    permMap.get('ATTENDANCE_READ_attendance')?._id,
    permMap.get('HOMEWORK_READ_homework')?._id,
    permMap.get('EXAM_READ_exam')?._id,
    permMap.get('MARKS_READ_mark')?._id,
    permMap.get('REPORT_CARD_READ_report-card')?._id,
  ].filter(Boolean);

  const guardianPerms = [
    permMap.get('STUDENT_READ_student')?._id,
    permMap.get('ATTENDANCE_READ_attendance')?._id,
    permMap.get('HOMEWORK_READ_homework')?._id,
    permMap.get('EXAM_READ_exam')?._id,
    permMap.get('MARKS_READ_mark')?._id,
    permMap.get('REPORT_CARD_READ_report-card')?._id,
    permMap.get('FEE_READ_fee')?._id,
  ].filter(Boolean);

  const schoolAdminPerms = Array.from(permMap.values()).map((doc) => doc._id);

  const ROLES_DEFINITIONS = [
    {
      code: 'SUPER_ADMIN',
      name: 'Super Admin',
      description: 'System owner with unrestricted institutional control',
      isSystem: true,
      permissions: superAdminPerms,
    },
    {
      code: 'SCHOOL_ADMIN',
      name: 'School Admin / Principal',
      description: 'Principal and head administrative staff',
      isSystem: true,
      permissions: schoolAdminPerms,
    },
    {
      code: 'TEACHER',
      name: 'Teacher',
      description: 'Classroom and subject teacher',
      isSystem: true,
      permissions: teacherPerms,
    },
    {
      code: 'STUDENT',
      name: 'Student',
      description: 'Enrolled student of Little Angels School',
      isSystem: true,
      permissions: studentPerms,
    },
    {
      code: 'GUARDIAN',
      name: 'Parent / Guardian',
      description: 'Parent or guardian of enrolled student(s)',
      isSystem: true,
      permissions: guardianPerms,
    },
    {
      code: 'ACCOUNTANT',
      name: 'Accountant',
      description: 'Fee collection and financial manager',
      isSystem: true,
      permissions: [permMap.get('FEE_READ_fee')?._id].filter(Boolean),
    },
    {
      code: 'RECEPTIONIST',
      name: 'Receptionist',
      description: 'Front desk and communication coordinator',
      isSystem: true,
      permissions: [],
    },
    {
      code: 'LIBRARIAN',
      name: 'Librarian',
      description: 'Library resource manager',
      isSystem: true,
      permissions: [],
    },
  ];

  for (const r of ROLES_DEFINITIONS) {
    await Role.findOneAndUpdate(
      { schoolId: 'LAPS-GOHAD', code: r.code },
      { $set: r },
      { upsert: true },
    );
  }

  logger.info('✅ RBAC seeding completed successfully.');
}

if (require.main === module) {
  seedRbac()
    .then(async () => {
      await disconnectDatabase();
      process.exit(0);
    })
    .catch(async (err) => {
      logger.error({ err }, '❌ Error seeding RBAC data');
      await disconnectDatabase();
      process.exit(1);
    });
}
