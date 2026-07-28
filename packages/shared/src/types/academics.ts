export type AcademicSessionStatus = 'PLANNED' | 'ACTIVE' | 'ARCHIVED';
export type ClassLevel = 'PRE_PRIMARY' | 'PRIMARY' | 'MIDDLE' | 'SECONDARY';
export type SubjectType = 'THEORY' | 'PRACTICAL' | 'CO_CURRICULAR';
export type TeacherDesignation =
  | 'PRT'
  | 'TGT'
  | 'PGT'
  | 'HEAD_MISTRESS'
  | 'ASSISTANT_TEACHER';
export type TeacherStatus = 'ACTIVE' | 'ON_LEAVE' | 'INACTIVE' | 'ARCHIVED';
export type EntityStatus = 'ACTIVE' | 'ARCHIVED';

export interface StandardAuditFields {
  createdBy: string;
  updatedBy: string;
  archivedBy?: string;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AcademicSessionInfo extends StandardAuditFields {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  status: AcademicSessionStatus;
  isPromotionLocked: boolean;
}

export interface ClassInfo extends StandardAuditFields {
  id: string;
  name: string;
  code: string;
  level: ClassLevel;
  orderSequence: number;
  status: EntityStatus;
}

export interface SectionInfo extends StandardAuditFields {
  id: string;
  academicSessionId: string;
  classId: string;
  name: string;
  roomNumber?: string;
  maxCapacity: number;
  status: EntityStatus;
  className?: string;
  classCode?: string;
  sessionName?: string;
}

export interface SubjectInfo extends StandardAuditFields {
  id: string;
  name: string;
  code: string;
  shortName: string;
  subjectType: SubjectType;
  isOptional: boolean;
  status: EntityStatus;
}

export interface TeacherInfo extends StandardAuditFields {
  id: string;
  userId?: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  qualification: string;
  designation: TeacherDesignation;
  joiningDate: string;
  isClassTeacher: boolean;
  photoUrl?: string;
  status: TeacherStatus;
}

export interface TeachingAssignmentInfo extends StandardAuditFields {
  id: string;
  teacherId: string;
  academicSessionId: string;
  classId: string;
  sectionId: string;
  subjectId: string;
  isClassTeacher: boolean;
  effectiveFrom: string;
  effectiveTo?: string;
  status: EntityStatus;
  teacherName?: string;
  teacherEmployeeId?: string;
  sessionName?: string;
  className?: string;
  sectionName?: string;
  subjectName?: string;
  subjectCode?: string;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface AcademicSessionQuery extends PaginationQuery {
  status?: AcademicSessionStatus;
  isCurrent?: boolean;
}

export interface ClassQuery extends PaginationQuery {
  level?: ClassLevel;
  status?: EntityStatus;
}

export interface SectionQuery extends PaginationQuery {
  academicSessionId?: string;
  classId?: string;
  status?: EntityStatus;
}

export interface SubjectQuery extends PaginationQuery {
  subjectType?: SubjectType;
  isOptional?: boolean;
  status?: EntityStatus;
}

export interface TeacherQuery extends PaginationQuery {
  designation?: TeacherDesignation;
  status?: TeacherStatus;
}

export interface TeachingAssignmentQuery extends PaginationQuery {
  academicSessionId?: string;
  teacherId?: string;
  classId?: string;
  sectionId?: string;
  subjectId?: string;
  status?: EntityStatus;
}
