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
  | 'HR_MANAGER'
  | 'STORE_MANAGER'
  | 'APPLICANT';

export type AccountStatus =
  | 'PENDING'
  | 'ACTIVE'
  | 'LOCKED'
  | 'DISABLED'
  | 'PASSWORD_RESET_REQUIRED'
  | 'SUSPENDED'
  | 'INACTIVE';

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
  status: AccountStatus;
  lastLoginAt?: string;
  forcePasswordChange?: boolean;
  permissions?: PermissionRule[];
}

export interface IdentityAccount extends UserAccount {
  createdAt?: string;
  updatedAt?: string;
  passwordChangedAt?: string;
  failedLoginAttempts?: number;
  lockedUntil?: string;
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
  forcePasswordChangeRequired?: boolean;
}

export interface LoginHistoryEntry {
  id: string;
  userId?: string;
  identifier: string;
  loginAt: string;
  logoutAt?: string;
  device?: string;
  browser?: string;
  os?: string;
  ipAddress?: string;
  status: 'SUCCESS' | 'FAILURE';
  failureReason?: string;
}
