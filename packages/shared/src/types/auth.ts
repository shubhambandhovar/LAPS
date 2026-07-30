export type UserRoleCode =
  | 'SUPER_ADMIN'
  | 'SCHOOL_ADMIN'
  | 'TEACHER'
  | 'STUDENT'
  | 'GUARDIAN'
  | 'STAFF'
  | 'ACCOUNTANT'
  | 'RECEPTIONIST'
  | 'LIBRARIAN'
  | 'TRANSPORT_MANAGER'
  | 'DRIVER'
  | 'ADMISSION_OFFICER'
  | 'APPLICANT';

export interface PermissionRule {
  module: string;
  action: string;
  resource?: string;
}

export interface UserAccount {
  id: string;
  schoolId: string;
  identifier: string;
  email?: string;
  phone?: string;
  role: UserRoleCode;
  userType: UserRoleCode;
  profileRef?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  lastLoginAt?: string;
  permissions?: PermissionRule[];
}

export interface RefreshSessionInfo {
  id: string;
  sessionFamilyId: string;
  deviceInfo: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  lastUsedAt?: string;
  isCurrent: boolean;
}

export interface AuthResponse {
  user: UserAccount;
  accessToken: string;
  expiresIn: number;
  sessionId?: string;
  sessionFamilyId?: string;
}
