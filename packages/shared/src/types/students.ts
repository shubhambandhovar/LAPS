import { StandardAuditFields } from './academics';

export type StudentStatus = 'ACTIVE' | 'ARCHIVED';
export type GuardianStatus = 'ACTIVE' | 'ARCHIVED';
export type GuardianRelationship = 'FATHER' | 'MOTHER' | 'LEGAL_GUARDIAN' | 'OTHER';
export type EnrollmentStatus =
  | 'ACTIVE'
  | 'PROMOTED'
  | 'TRANSFERRED'
  | 'WITHDRAWN'
  | 'COMPLETED'
  | 'ALUMNI'
  | 'ARCHIVED';

export interface EmergencyContactInfo {
  name: string;
  relationship: string;
  phone: string;
}

export interface StudentDocumentInfo {
  title: string;
  category?: string;
  fileUrl: string;
  uploadedAt?: string;
}

export interface StudentInfo extends StandardAuditFields {
  id: string;
  admissionNumber: string;
  admissionDate: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  dateOfBirth: string;
  bloodGroup?: string;
  category?: 'GENERAL' | 'OBC' | 'SC' | 'ST' | 'OTHER';
  religion?: string;
  nationality: string;
  photoUrl?: string;
  email?: string;
  phone?: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pinCode: string;
  emergencyContacts: EmergencyContactInfo[];
  documents: StudentDocumentInfo[];
  status: StudentStatus;
  currentEnrollment?: EnrollmentInfo;
}

export interface GuardianInfo extends StandardAuditFields {
  id: string;
  name: string;
  relationship: GuardianRelationship;
  phone: string;
  email?: string;
  occupation?: string;
  annualIncome?: number;
  photoUrl?: string;
  sameAsStudentAddress: boolean;
  address?: string;
  emergencyContacts: EmergencyContactInfo[];
  status: GuardianStatus;
  linkedStudents?: Array<{
    studentId: string;
    studentName: string;
    admissionNumber: string;
    isPrimaryGuardian: boolean;
    relationship: GuardianRelationship;
  }>;
}

export interface StudentGuardianInfo {
  id: string;
  studentId: string;
  guardianId: string;
  relationship: GuardianRelationship;
  isPrimaryGuardian: boolean;
  pickupPermission: boolean;
  emergencyContactPermission: boolean;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  guardian?: GuardianInfo;
  student?: StudentInfo;
}

export interface ClassTeacherSummary {
  id: string;
  firstName: string;
  lastName: string;
  employeeId: string;
}

export interface EnrollmentInfo extends StandardAuditFields {
  id: string;
  studentId: string;
  academicSessionId: string;
  classId: string;
  sectionId: string;
  rollNumber: number;
  enrollmentDate: string;
  enrollmentStatus: EnrollmentStatus;
  promotedToEnrollmentId?: string;
  previousEnrollmentId?: string;
  remarks?: string;
  student?: StudentInfo;
  className?: string;
  sectionName?: string;
  sessionName?: string;
  classTeacher?: ClassTeacherSummary;
}
