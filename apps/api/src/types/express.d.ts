import { UserRoleCode } from '@laps/shared';

export interface AuthenticatedRequestUser {
  id: string;
  schoolId: string;
  identifier: string;
  role: UserRoleCode;
  userType: UserRoleCode;
  profileRef?: string;
  sessionId: string;
  sessionFamilyId: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedRequestUser;
      id?: string;
    }
  }
}
