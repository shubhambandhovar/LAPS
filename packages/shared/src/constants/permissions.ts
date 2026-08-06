/**
 * Centralized Permission Matrix for Role-Based Access Control (RBAC).
 * Defines allowed permission scopes and module access for each system role.
 */

export const PERMISSION_MATRIX: Record<string, string[]> = {
  SUPER_ADMIN: ['*'],
  SCHOOL_ADMIN: [
    'academics.*',
    'student.*',
    'teacher.*',
    'attendance.*',
    'homework.*',
    'exam.*',
    'marks.*',
    'report-card.*',
    'admission.*',
    'hr.*',
    'fee.*',
    'fees.*',
    'library.*',
    'inventory.*',
    'transport.*',
    'communication.*',
    'cms.*',
    'calendar.*',
    'qr.*',
    'id_card.*',
    'document.*',
    'signature.*',
  ],
  HR_MANAGER: [
    'hr.*',
    'teacher.*',
    'employee.*',
    'attendance.read',
    'payroll.*',
    'user.read',
    'calendar.read',
    'qr.*',
    'id_card.*',
    'document.issue',
    'document.read',
    'document.approve',
    'signature.manage',
  ],
  ACCOUNTANT: [
    'fees.*',
    'fee.*',
    'finance.*',
    'student.read',
    'report.read',
    'calendar.read',
    'qr.scan',
    'document.issue',
    'document.read',
    'document.approve',
    'signature.manage',
  ],
  LIBRARIAN: [
    'library.*',
    'books.*',
    'issues.*',
    'returns.*',
    'reservations.*',
    'fines.*',
    'report.read',
    'student.read',
    'teacher.read',
    'calendar.read',
    'qr.scan',
  ],
  STORE_MANAGER: [
    'inventory.*',
    'assets.*',
    'consumables.*',
    'vendors.*',
    'stock.*',
    'report.read',
    'calendar.read',
    'qr.scan',
  ],
  ADMISSION_OFFICER: [
    'admission.*',
    'student.create',
    'student.read',
    'communication.create',
    'communication.read',
    'calendar.read',
    'qr.scan',
  ],
  RECEPTIONIST: [
    'student.read',
    'attendance.read',
    'communication.*',
    'admission.read',
    'calendar.read',
    'qr.*',
  ],
  TEACHER: [
    'attendance.view',
    'attendance.create',
    'attendance.update',
    'attendance.read',
    'homework.*',
    'exam.marks',
    'exam.read',
    'marks.*',
    'student.read',
    'teacher.read',
    'timetable.*',
    'study_material.*',
    'communication.read',
    'communication.create',
    'profile.self',
    'settings.self',
    'calendar.read',
    'qr.scan',
    'document.approve',
    'signature.manage',
  ],
  STUDENT: [
    'attendance.self',
    'results.self',
    'profile.self',
    'homework.read',
    'study_material.read',
    'report_card.self',
    'fees.self',
    'library.self',
    'transport.self',
    'communication.read',
    'calendar.read',
    'settings.self',
    'qr.scan',
  ],
  GUARDIAN: [
    'children.*',
    'attendance.children',
    'fees.children',
    'results.children',
    'communication.read',
    'transport.children',
    'calendar.read',
    'settings.self',
    'qr.scan',
  ],
  EMPLOYEE: [
    'profile.self',
    'attendance.self',
    'payroll.self',
    'calendar.read',
    'communication.read',
    'settings.self',
    'qr.scan',
  ],
};

/**
 * Checks if a specific role has a permission string in the centralized matrix.
 * Supports wildcard matching (e.g., 'homework.*' matches 'homework.read').
 */
export function roleHasPermission(role: string, permission: string): boolean {
  if (!role) return false;
  const normalizedRole = role.toUpperCase();
  if (normalizedRole === 'SUPER_ADMIN') return true;

  const allowedPermissions = PERMISSION_MATRIX[normalizedRole];
  if (!allowedPermissions) return false;

  const targetPerm = permission.toLowerCase();
  const targetParts = targetPerm.split('.');

  return allowedPermissions.some((allowed) => {
    if (allowed === '*') return true;
    const allowedParts = allowed.toLowerCase().split('.');
    if (allowedParts[0] === targetParts[0]) {
      if (allowedParts[1] === '*' || allowedParts[1] === targetParts[1]) {
        return true;
      }
    }
    return allowed.toLowerCase() === targetPerm;
  });
}

/**
 * Maps standard module/action checks to permission strings for checking matrix.
 */
export function canRoleAccessModule(
  role: string,
  moduleName: string,
  actionName = 'read',
): boolean {
  if (!role) return false;
  if (role.toUpperCase() === 'SUPER_ADMIN') return true;
  const mod = moduleName.toLowerCase();
  const act = actionName.toLowerCase();

  return (
    roleHasPermission(role, `${mod}.${act}`) ||
    roleHasPermission(role, `${mod}.*`) ||
    roleHasPermission(role, `${mod}.view`)
  );
}
