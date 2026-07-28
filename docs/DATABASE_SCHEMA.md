# DATABASE SCHEMA & DATA MODELING: LITTLE ANGELS SCHOOL — SCHOOL ERP

## 1. Data Architecture Principles

The database layer is designed for **MongoDB (Mongoose ODM)** using a **Hybrid Relational-Document Data Model**. 

### Key Design Anti-Pattern Avoidance: "The Giant Student Document"
A naive MongoDB schema embeds attendance, homework, exams, and fee payments inside a single `Student` document. This anti-pattern leads to:
* Document size exceeding the 16MB BSON limit over a student's 12-year academic journey (Pre-Primary to Class 10).
* Unindexable arrays and expensive concurrent write contention.
* Loss of historical data when a student is promoted to a new class.

### Our Solution: Session-Scoped Normalized Enrollments & Normalized Relationships
1. **Immutable Core Identity**: The `Student` collection stores only static profile information (name, DOB, blood group, admission number).
2. **Normalized Family Relationships (`StudentGuardian`)**: Rather than duplicating guardian arrays on Student and children arrays on Guardian, a dedicated `StudentGuardian` join collection models relationship type, primary guardian designation, and granular permissions (`canPickup`, `canReceiveFinancialNotices`, `canViewAcademicReports`).
3. **Multi-Device Auth Sessions (`RefreshSession`)**: Instead of storing a single token hash on `User`, a dedicated `RefreshSession` collection supports multiple devices, IP/User-Agent tracking, TTL expiration, and targeted/global token revocation.
4. **Session-Scoped Academic History**: The `Enrollment` collection represents a student's membership in a specific `AcademicSession + Class + Section`. Attendance, Homework Submissions, Examination Marks, and Student Fee structures reference `Enrollment`, ensuring complete historical preservation.

---

## 2. Entity Relationship & Data Flow Diagram

```mermaid
erDiagram
    User ||--o| Teacher : "authenticates as"
    User ||--o| Student : "authenticates as"
    User ||--o| Guardian : "authenticates as"
    User }|--|| Role : "assigned"
    User ||--|{ RefreshSession : "maintains active"
    Role ||--|{ Permission : "grants"

    Guardian ||--|{ StudentGuardian : "links via"
    Student ||--|{ StudentGuardian : "links via"
    Student ||--|{ Enrollment : "enrolls in session"
    AcademicSession ||--|{ Enrollment : "scopes"
    Class ||--|{ Section : "subdivides into"
    Class ||--|{ Enrollment : "assigns class"
    Section ||--|{ Enrollment : "assigns section"

    Teacher ||--|{ TeachingAssignment : "teaches"
    AcademicSession ||--|{ TeachingAssignment : "scopes"
    Class ||--|{ TeachingAssignment : "targets class"
    Section ||--|{ TeachingAssignment : "targets section"
    Subject ||--|{ TeachingAssignment : "targets subject"

    Enrollment ||--|{ Attendance : "records daily"
    TeachingAssignment ||--|{ Homework : "creates"
    Homework ||--|{ HomeworkSubmission : "receives"
    Enrollment ||--|{ HomeworkSubmission : "submits"

    AcademicSession ||--|{ Exam : "scopes"
    Exam ||--|{ ExamSubject : "includes"
    Subject ||--|{ ExamSubject : "evaluated in"
    ExamSubject ||--|{ Mark : "records marks"
    Enrollment ||--|{ Mark : "receives mark"
    Enrollment ||--|{ ReportCard : "receives term report"

    AcademicSession ||--|{ FeeStructure : "defines"
    Class ||--|{ FeeStructure : "applies to"
    Enrollment ||--|{ StudentFee : "billed via"
    FeeStructure ||--|{ StudentFee : "instantiates"
    StudentFee ||--|{ Payment : "paid through"
    Payment ||--|| Receipt : "generates"
```

---

## 3. Comprehensive Entity Dictionary & Schema Definitions

Every collection includes standard timestamp fields (`createdAt`, `updatedAt`) and an indexed `schoolId` identifier (`default: "LAPS-GOHAD"`) for single-school extensibility.

### 3.1. Identity, Authentication & Session Collections

#### 1. `User`
Central authentication identity for all system actors.
* **Fields**:
  * `_id`: ObjectId
  * `schoolId`: String (Indexed, required, default `"LAPS-GOHAD"`)
  * `username`: String (Unique, lowercase, trimmed)
  * `email`: String (Unique sparse index, lowercase)
  * `phone`: String (Indexed, E.164 format)
  * `passwordHash`: String (Bcrypt/Argon2i hashed, `select: false`)
  * `roleId`: ObjectId -> `Role` (Indexed)
  * `userType`: Enum (`"SUPER_ADMIN" | "SCHOOL_ADMIN" | "TEACHER" | "STUDENT" | "GUARDIAN" | "STAFF"`)
  * `profileRef`: ObjectId (Polymorphic reference to Student/Teacher/Guardian/Staff `_id`)
  * `isActive`: Boolean (Default `true`)
  * `lastLoginAt`: Date
* **Indexes**:
  * `{ schoolId: 1, username: 1 }` (Unique)
  * `{ schoolId: 1, email: 1 }` (Unique sparse)
  * `{ schoolId: 1, userType: 1, isActive: 1 }`

#### 2. `RefreshSession` (Multi-Device Authentication Session)
Manages multi-device refresh tokens, session families, rotation, revocation, and security auditing.
* **Fields**:
  * `_id`: ObjectId
  * `userId`: ObjectId -> `User` (Indexed, required)
  * `sessionFamilyId`: String (UUID, indexed — groups token rotations for a single device/login session)
  * `refreshTokenHash`: String (Hashed secure token, `select: false`)
  * `expiresAt`: Date (Indexed for MongoDB TTL automatic cleanup)
  * `isRevoked`: Boolean (Default `false`)
  * `deviceInfo`: String (e.g., `"Chrome on Windows 11"`, `"Safari on iPhone"`)
  * `ipAddress`: String
  * `userAgent`: String
  * `createdAt`: Date (Default `Date.now`)
* **Indexes**:
  * `{ userId: 1, isRevoked: 1 }`
  * `{ sessionFamilyId: 1 }`
  * `{ expiresAt: 1 }` (TTL Index — automatically removes expired sessions)
* **Rotation & Reuse Detection**: Each device login creates a new `sessionFamilyId`. On refresh, a new token is issued with the same `sessionFamilyId` and the previous token is marked `isRevoked = true`. If an already-revoked token is replayed, the system logs `SUSPICIOUS_REFRESH_REUSE` and revokes only that `sessionFamilyId` (`isRevoked: true` for all records with that `sessionFamilyId`), without revoking unrelated valid device sessions. `logout-all` remains the explicit mechanism for revoking every session family belonging to the account.

#### 3. `Role`
RBAC role definition.
* **Fields**:
  * `_id`: ObjectId
  * `schoolId`: String (Indexed)
  * `name`: String (e.g., `"SUPER_ADMIN"`, `"TEACHER"`, `"STUDENT"`, `"GUARDIAN"`, `"ACCOUNTANT"`)
  * `description`: String
  * `isSystemRole`: Boolean (Default `false` — cannot be deleted if true)
* **Indexes**:
  * `{ schoolId: 1, name: 1 }` (Unique)

#### 4. `Permission`
Atomic authorization capabilities mapped to roles.
* **Fields**:
  * `_id`: ObjectId
  * `roleId`: ObjectId -> `Role` (Indexed)
  * `module`: Enum (`"ACADEMIC" | "ATTENDANCE" | "HOMEWORK" | "EXAM" | "FEE" | "COMMUNICATION" | "USER" | "CMS" | "AUDIT"`)
  * `action`: Enum (`"CREATE" | "READ" | "UPDATE" | "DELETE" | "PUBLISH" | "APPROVE" | "EXPORT"`)
  * `resource`: String (e.g., `"homework"`, `"attendance"`, `"marks"`, `"fee_payment"`)
  * `scope`: Enum (`"GLOBAL" | "ASSIGNED_CLASS" | "ASSIGNED_SUBJECT" | "OWN_CHILD" | "SELF"`)
* **Indexes**:
  * `{ roleId: 1, resource: 1, action: 1 }` (Unique)

---

### 3.2. Institutional & Academic Organization Collections

#### 5. `AcademicSession`
Defines school academic years with **configurable start and end dates** (no hardcoded April–March assumption) and historical preservation.
* **Fields**:
  * `_id`: ObjectId
  * `name`: String (e.g., `"2026-2027"`, `"2027-2028"`)
  * `startDate`: Date (Configurable)
  * `endDate`: Date (Configurable)
  * `isCurrent`: Boolean (Default `false`)
  * `status`: Enum (`"PLANNED" | "ACTIVE" | "ARCHIVED"`) (Default `"PLANNED"`)
  * `isPromotionLocked`: Boolean (Default `false`)
  * `createdBy`: ObjectId -> `User`
  * `updatedBy`: ObjectId -> `User`
  * `archivedBy`: ObjectId -> `User` (Optional)
  * `archivedAt`: Date (Optional)
  * `createdAt`: Date (Default `Date.now`)
  * `updatedAt`: Date (Default `Date.now`)
* **Indexes**:
  * `{ name: 1 }` (Unique)
  * `{ isCurrent: 1 }`
  * `{ status: 1 }`
* **Session Activation Rule**: When a session is activated (`status = "ACTIVE"`, `isCurrent = true`), the backend atomically unsets `isCurrent: false` on any previously active session within a MongoDB transaction.
* **Soft-Delete Only & Archive Behavior**: Master data is **never physically deleted** from the database. Endpoints perform soft-deletion (`status: "ARCHIVED"`, setting `archivedBy` and `archivedAt`).

#### 6. `Class`
Academic grade levels configurable from Pre-Primary up to Class 10 (no hardcoded enum constraints).
* **Fields**:
  * `_id`: ObjectId
  * `name`: String (e.g., `"Nursery"`, `"LKG"`, `"UKG"`, `"Class 1"`, `"Class 10"`)
  * `code`: String (Auto-generated if not provided, e.g., `"CLS-NUR"`, `"CLS-LKG"`, `"CLS-01"`, `"CLS-10"`)
  * `level`: Enum (`"PRE_PRIMARY" | "PRIMARY" | "MIDDLE" | "SECONDARY"`)
  * `orderSequence`: Number (For sorted UI rendering, e.g., 1 for Nursery, 2 for LKG, 3 for UKG, 4 for Class 1 ... 13 for Class 10)
  * `status`: Enum (`"ACTIVE" | "ARCHIVED"`) (Default `"ACTIVE"`)
  * `createdBy`: ObjectId -> `User`
  * `updatedBy`: ObjectId -> `User`
  * `archivedBy`: ObjectId -> `User` (Optional)
  * `archivedAt`: Date (Optional)
  * `createdAt`: Date (Default `Date.now`)
  * `updatedAt`: Date (Default `Date.now`)
* **Indexes**:
  * `{ code: 1 }` (Unique)
  * `{ name: 1 }` (Unique)
  * `{ orderSequence: 1 }`
  * `{ status: 1 }`

#### 7. `Section`
Subdivision of a class scoped to an academic session (`Academic Session -> Class -> Section`).
* **Fields**:
  * `_id`: ObjectId
  * `academicSessionId`: ObjectId -> `AcademicSession` (Indexed, required)
  * `classId`: ObjectId -> `Class` (Indexed, required)
  * `name`: String (e.g., `"A"`, `"B"`, `"C"`)
  * `roomNumber`: String (Optional)
  * `maxCapacity`: Number (Default `40`)
  * `status`: Enum (`"ACTIVE" | "ARCHIVED"`) (Default `"ACTIVE"`)
  * `createdBy`: ObjectId -> `User`
  * `updatedBy`: ObjectId -> `User`
  * `archivedBy`: ObjectId -> `User` (Optional)
  * `archivedAt`: Date (Optional)
  * `createdAt`: Date (Default `Date.now`)
  * `updatedAt`: Date (Default `Date.now`)
* **Indexes**:
  * `{ academicSessionId: 1, classId: 1, name: 1 }` (Unique — prevents duplicate section names within a class for a session)
  * `{ classId: 1, status: 1 }`

#### 8. `Subject`
Global master curriculum subjects prepared for Homework, Attendance, Timetable, and Marks integration. **Subject is a global master entity not bound directly to Class; class-subject mapping will be introduced separately.**
* **Fields**:
  * `_id`: ObjectId
  * `name`: String (e.g., `"Mathematics"`, `"General Science"`, `"Hindi"`)
  * `code`: String (Auto-generated if not provided, e.g., `"SUB-MATH"`, `"SUB-SCI"`, `"SUB-ENG"`)
  * `shortName`: String (e.g., `"MATH"`, `"SCI"`, `"ENG"`, `"HIN"`)
  * `subjectType`: Enum (`"THEORY" | "PRACTICAL" | "CO_CURRICULAR"`) (Default `"THEORY"`)
  * `isOptional`: Boolean (Default `false`)
  * `status`: Enum (`"ACTIVE" | "ARCHIVED"`) (Default `"ACTIVE"`)
  * `createdBy`: ObjectId -> `User`
  * `updatedBy`: ObjectId -> `User`
  * `archivedBy`: ObjectId -> `User` (Optional)
  * `archivedAt`: Date (Optional)
  * `createdAt`: Date (Default `Date.now`)
  * `updatedAt`: Date (Default `Date.now`)
* **Indexes**:
  * `{ code: 1 }` (Unique global subject code)
  * `{ name: 1 }` (Unique)
  * `{ status: 1 }`

---

### 3.3. Student, Guardian & Teacher Core Profiles

#### 9. `Student`
Immutable student demographic and biographical record.
* **Fields**:
  * `_id`: ObjectId
  * `schoolId`: String (Indexed)
  * `admissionNumber`: String (Unique institutional ID, e.g., `"LAPS-2026-0042"`)
  * `admissionDate`: Date
  * `firstName`: String
  * `lastName`: String
  * `dateOfBirth`: Date
  * `gender`: Enum (`"MALE" | "FEMALE" | "OTHER"`)
  * `bloodGroup`: String (Optional)
  * `address`: { street, city: `"Gohad"`, district: `"Bhind"`, state: `"Madhya Pradesh"`, pincode }
  * `primaryContactPhone`: String
  * `medicalNotes`: String (Protected)
  * `profilePhotoUrl`: String
* **Indexes**:
  * `{ schoolId: 1, admissionNumber: 1 }` (Unique)
  * `{ schoolId: 1, firstName: 1, lastName: 1 }`

#### 10. `Guardian`
Parent/guardian biographical profile.
* **Fields**:
  * `_id`: ObjectId
  * `schoolId`: String
  * `primaryName`: String
  * `phone`: String (Unique within school)
  * `email`: String (Optional)
  * `occupation`: String
  * `address`: Object
* **Indexes**:
  * `{ schoolId: 1, phone: 1 }` (Unique)

#### 11. `StudentGuardian` (Normalized Relationship Model)
**CRITICAL ENTITY**: Normalized join entity replacing array duplication, linking students to guardians with rich relationship metadata and granular permissions.
* **Fields**:
  * `_id`: ObjectId
  * `schoolId`: String (Indexed)
  * `studentId`: ObjectId -> `Student` (Indexed, required)
  * `guardianId`: ObjectId -> `Guardian` (Indexed, required)
  * `relationshipType`: Enum (`"FATHER" | "MOTHER" | "LEGAL_GUARDIAN" | "OTHER"`)
  * `isPrimaryGuardian`: Boolean (Default `true` for first guardian)
  * `canPickup`: Boolean (Default `true`)
  * `canReceiveFinancialNotices`: Boolean (Default `true`)
  * `canViewAcademicReports`: Boolean (Default `true`)
* **Indexes**:
  * `{ studentId: 1, guardianId: 1 }` (Unique — prevents duplicate relationship rows)
  * `{ guardianId: 1, isPrimaryGuardian: 1 }`

#### 12. `Teacher`
Academic teacher profile linked to `User` account (Demographic & professional profile only — **does NOT include payroll, salary, or leave management fields**). `Teacher` is an academic profile entity, not the authentication account itself.
* **Fields**:
  * `_id`: ObjectId
  * `userId`: ObjectId -> `User` (Indexed, optional sparse — links to authentication account)
  * `employeeId`: String (Unique, auto-generated if not provided, e.g., `"TCH-0001"`, `"TCH-0002"`)
  * `firstName`: String
  * `lastName`: String
  * `email`: String (Indexed, unique sparse)
  * `phone`: String
  * `qualification`: String (e.g., `"B.Ed, M.Sc Mathematics"`)
  * `designation`: Enum (`"PRT" | "TGT" | "PGT" | "HEAD_MISTRESS" | "ASSISTANT_TEACHER"`)
  * `joiningDate`: Date
  * `isClassTeacher`: Boolean (Default `false`)
  * `photoUrl`: String (Optional avatar URL)
  * `status`: Enum (`"ACTIVE" | "ON_LEAVE" | "INACTIVE" | "ARCHIVED"`) (Default `"ACTIVE"`)
  * `createdBy`: ObjectId -> `User`
  * `updatedBy`: ObjectId -> `User`
  * `archivedBy`: ObjectId -> `User` (Optional)
  * `archivedAt`: Date (Optional)
  * `createdAt`: Date (Default `Date.now`)
  * `updatedAt`: Date (Default `Date.now`)
* **Indexes**:
  * `{ employeeId: 1 }` (Unique)
  * `{ email: 1 }` (Unique sparse)
  * `{ userId: 1 }` (Unique sparse)
  * `{ status: 1 }`

#### 13. `Staff`
Non-teaching administrative staff (Receptionist, Accountant, Librarian).
* **Fields**:
  * `_id`: ObjectId
  * `schoolId`: String
  * `employeeId`: String (Unique)
  * `firstName`: String
  * `lastName`: String
  * `department`: Enum (`"FINANCE" | "RECEPTION" | "LIBRARY" | "TRANSPORT" | "ADMIN"`)
  * `phone`: String
* **Indexes**:
  * `{ schoolId: 1, employeeId: 1 }` (Unique)

---

### 3.4. Enrollment & Teaching Assignment Architecture (Historical Core)

#### 14. `Enrollment`
**CRITICAL ENTITY**: Represents a student's membership in a specific class/section for a single academic session.
* **Fields**:
  * `_id`: ObjectId
  * `schoolId`: String
  * `studentId`: ObjectId -> `Student` (Indexed)
  * `academicSessionId`: ObjectId -> `AcademicSession` (Indexed)
  * `classId`: ObjectId -> `Class` (Indexed)
  * `sectionId`: ObjectId -> `Section` (Indexed)
  * `rollNumber`: Number
  * `enrollmentStatus`: Enum (`"ACTIVE" | "PROMOTED" | "DETAINED" | "TRANSFERRED" | "ALUMNI"`)
  * `promotedToEnrollmentId`: ObjectId -> `Enrollment` (Self-reference for tracking promotion chain)
* **Indexes**:
  * `{ schoolId: 1, academicSessionId: 1, studentId: 1 }` (Unique — a student can only have one active enrollment per session)
  * `{ schoolId: 1, academicSessionId: 1, classId: 1, sectionId: 1, rollNumber: 1 }` (Unique roll number per class/section)

#### 15. `TeachingAssignment`
**CRITICAL FOUNDATIONAL ANCHOR**: Maps authorization scopes for teachers per academic session (`Teacher -> Academic Session -> Class -> Section -> Subject`). Every future module (Homework, Attendance, Marks, Timetable) relies on this entity for scoped access control.
* **Fields**:
  * `_id`: ObjectId
  * `teacherId`: ObjectId -> `Teacher` (Indexed, required)
  * `academicSessionId`: ObjectId -> `AcademicSession` (Indexed, required)
  * `classId`: ObjectId -> `Class` (Indexed, required)
  * `sectionId`: ObjectId -> `Section` (Indexed, required)
  * `subjectId`: ObjectId -> `Subject` (Indexed, required)
  * `isClassTeacher`: Boolean (Default `false` — grants section-wide attendance and report card rights)
  * `status`: Enum (`"ACTIVE" | "ARCHIVED"`) (Default `"ACTIVE"`)
  * `createdBy`: ObjectId -> `User`
  * `updatedBy`: ObjectId -> `User`
  * `archivedBy`: ObjectId -> `User` (Optional)
  * `archivedAt`: Date (Optional)
  * `createdAt`: Date (Default `Date.now`)
  * `updatedAt`: Date (Default `Date.now`)
* **Indexes**:
  * `{ academicSessionId: 1, classId: 1, sectionId: 1, subjectId: 1 }` (Unique for active assignments — ensures exactly one primary subject teacher per section per session)
  * `{ academicSessionId: 1, teacherId: 1, classId: 1, sectionId: 1, subjectId: 1 }` (Unique — prevents assigning the same teacher twice to the same subject/section)
  * `{ teacherId: 1, academicSessionId: 1, status: 1 }`

---

### 3.5. Academic Operations & Classroom Collections

#### 16. `Attendance`
Daily attendance record per student enrollment.
* **Fields**:
  * `_id`: ObjectId
  * `schoolId`: String
  * `academicSessionId`: ObjectId -> `AcademicSession` (Indexed)
  * `enrollmentId`: ObjectId -> `Enrollment` (Indexed)
  * `studentId`: ObjectId -> `Student` (Indexed)
  * `classId`: ObjectId -> `Class`
  * `sectionId`: ObjectId -> `Section`
  * `date`: Date (Normalized to midnight UTC)
  * `status`: Enum (`"PRESENT" | "ABSENT" | "LATE" | "LEAVE"`)
  * `markedByUserId`: ObjectId -> `User`
  * `remarks`: String (Optional)
* **Indexes**:
  * `{ schoolId: 1, enrollmentId: 1, date: 1 }` (Unique — one attendance mark per student per day)
  * `{ schoolId: 1, academicSessionId: 1, classId: 1, sectionId: 1, date: 1 }`

#### 17. `Homework`
Homework assigned by an authorized teacher.
* **Fields**:
  * `_id`: ObjectId
  * `schoolId`: String
  * `academicSessionId`: ObjectId -> `AcademicSession`
  * `teachingAssignmentId`: ObjectId -> `TeachingAssignment` (Indexed)
  * `classId`: ObjectId -> `Class`
  * `sectionId`: ObjectId -> `Section`
  * `subjectId`: ObjectId -> `Subject`
  * `teacherId`: ObjectId -> `Teacher`
  * `title`: String
  * `description`: String
  * `attachmentUrls`: Array<String>
  * `assignedDate`: Date
  * `dueDate`: Date
  * `status`: Enum (`"DRAFT" | "PUBLISHED" | "ARCHIVED"`)
* **Indexes**:
  * `{ schoolId: 1, classId: 1, sectionId: 1, status: 1, dueDate: 1 }`
  * `{ teacherId: 1, academicSessionId: 1 }`

#### 18. `HomeworkSubmission`
Student submission record for a homework assignment.
* **Fields**:
  * `_id`: ObjectId
  * `homeworkId`: ObjectId -> `Homework` (Indexed)
  * `enrollmentId`: ObjectId -> `Enrollment` (Indexed)
  * `studentId`: ObjectId -> `Student`
  * `submissionDate`: Date
  * `contentUrl`: String (Attachment)
  * `comment`: String
  * `teacherEvaluationStatus`: Enum (`"PENDING" | "CHECKED" | "REDO_REQUIRED"`)
  * `teacherRemarks`: String
* **Indexes**:
  * `{ homeworkId: 1, enrollmentId: 1 }` (Unique)

#### 19. `StudyMaterial`
Downloadable learning notes and study resources.
* **Fields**:
  * `_id`: ObjectId
  * `schoolId`: String
  * `academicSessionId`: ObjectId -> `AcademicSession`
  * `classId`: ObjectId -> `Class` (Indexed)
  * `subjectId`: ObjectId -> `Subject` (Indexed)
  * `uploaderTeacherId`: ObjectId -> `Teacher`
  * `title`: String
  * `description`: String
  * `fileUrl`: String (Protected resource URL)
  * `fileMimeType`: String
* **Indexes**:
  * `{ schoolId: 1, classId: 1, subjectId: 1 }`

#### 20. `Timetable`
Class weekly schedule matrix.
* **Fields**:
  * `_id`: ObjectId
  * `schoolId`: String
  * `academicSessionId`: ObjectId -> `AcademicSession`
  * `classId`: ObjectId -> `Class`
  * `sectionId`: ObjectId -> `Section`
  * `dayOfWeek`: Enum (`"MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY"`)
  * `periodNumber`: Number (1 to 8)
  * `startTime`: String (`"08:30"`)
  * `endTime`: String (`"09:15"`)
  * `subjectId`: ObjectId -> `Subject`
  * `teacherId`: ObjectId -> `Teacher`
  * `room`: String
* **Indexes**:
  * `{ schoolId: 1, academicSessionId: 1, classId: 1, sectionId: 1, dayOfWeek: 1, periodNumber: 1 }` (Unique period per section)
  * `{ schoolId: 1, academicSessionId: 1, teacherId: 1, dayOfWeek: 1, periodNumber: 1 }` (Unique — prevents teacher double-booking)

---

### 3.6. Examination & Evaluation Collections

#### 21. `Exam`
Top-level examination definition.
* **Fields**:
  * `_id`: ObjectId
  * `schoolId`: String
  * `academicSessionId`: ObjectId -> `AcademicSession` (Indexed)
  * `name`: String (e.g., `"Mid-Term Examination 2026"`, `"Annual Exam"`)
  * `startDate`: Date
  * `endDate`: Date
  * `isPublished`: Boolean (Default `false`)
  * `resultPublishedAt`: Date
* **Indexes**:
  * `{ schoolId: 1, academicSessionId: 1, name: 1 }`

#### 22. `ExamSubject`
Configured maximum and passing marks for a subject in an exam.
* **Fields**:
  * `_id`: ObjectId
  * `examId`: ObjectId -> `Exam` (Indexed)
  * `classId`: ObjectId -> `Class` (Indexed)
  * `subjectId`: ObjectId -> `Subject` (Indexed)
  * `examDate`: Date
  * `maxMarks`: Number (e.g., `100`)
  * `passingMarks`: Number (e.g., `33`)
  * `weightagePercentage`: Number (Default `100`)
* **Indexes**:
  * `{ examId: 1, classId: 1, subjectId: 1 }` (Unique)

#### 23. `Mark`
Individual student score in an ExamSubject.
* **Fields**:
  * `_id`: ObjectId
  * `examSubjectId`: ObjectId -> `ExamSubject` (Indexed)
  * `enrollmentId`: ObjectId -> `Enrollment` (Indexed)
  * `studentId`: ObjectId -> `Student`
  * `marksObtained`: Number
  * `isAbsent`: Boolean (Default `false`)
  * `grade`: String (Calculated automatically via GradeRule, e.g., `"A+"`, `"B"`)
  * `enteredByTeacherId`: ObjectId -> `Teacher`
  * `isLocked`: Boolean (Default `false` — locked after approval)
* **Indexes**:
  * `{ examSubjectId: 1, enrollmentId: 1 }` (Unique)

#### 24. `GradeRule`
Configurable grading scale per session/school.
* **Fields**:
  * `_id`: ObjectId
  * `schoolId`: String
  * `academicSessionId`: ObjectId -> `AcademicSession`
  * `gradeLetter`: String (e.g., `"A+"`, `"A"`, `"B"`, `"F"`)
  * `minPercentage`: Number (e.g., `90`)
  * `maxPercentage`: Number (e.g., `100`)
  * `gradePoint`: Number (e.g., `10.0`)
  * `description`: String (`"Outstanding"`, `"Fail"`)
* **Indexes**:
  * `{ schoolId: 1, academicSessionId: 1, gradeLetter: 1 }` (Unique)

#### 25. `ReportCard`
Compiled end-of-term student result sheet.
* **Fields**:
  * `_id`: ObjectId
  * `schoolId`: String
  * `academicSessionId`: ObjectId -> `AcademicSession`
  * `examId`: ObjectId -> `Exam` (Indexed)
  * `enrollmentId`: ObjectId -> `Enrollment` (Indexed)
  * `studentId`: ObjectId -> `Student`
  * `totalMarksObtained`: Number
  * `totalMaxMarks`: Number
  * `percentage`: Number
  * `overallGrade`: String
  * `classRank`: Number
  * `attendancePercentage`: Number
  * `classTeacherRemarks`: String
  * `principalRemarks`: String
  * `status`: Enum (`"DRAFT" | "APPROVED" | "PUBLISHED"`)
  * `pdfReportUrl`: String
* **Indexes**:
  * `{ examId: 1, enrollmentId: 1 }` (Unique)

---

### 3.7. Financial Management Collections (Fees & Accounting)

#### 26. `FeeStructure`
Master template of fee charges per class and session.
* **Fields**:
  * `_id`: ObjectId
  * `schoolId`: String
  * `academicSessionId`: ObjectId -> `AcademicSession` (Indexed)
  * `classId`: ObjectId -> `Class` (Indexed)
  * `feeHeadName`: String (e.g., `"Tuition Fee - Q1"`, `"Annual Computer Lab Fee"`)
  * `amount`: Number (in INR)
  * `dueDate`: Date
  * `isOptional`: Boolean (Default `false`)
* **Indexes**:
  * `{ schoolId: 1, academicSessionId: 1, classId: 1, feeHeadName: 1 }` (Unique)

#### 27. `StudentFee`
Applicable fee billing item assigned to a specific student enrollment.
* **Fields**:
  * `_id`: ObjectId
  * `schoolId`: String
  * `enrollmentId`: ObjectId -> `Enrollment` (Indexed)
  * `studentId`: ObjectId -> `Student` (Indexed)
  * `feeStructureId`: ObjectId -> `FeeStructure`
  * `baseAmount`: Number
  * `discountAmount`: Number (Default `0`)
  * `concessionReason`: String (e.g., `"Sibling Discount"`, `"Merit Scholarship"`)
  * `netAmount`: Number (`baseAmount - discountAmount`)
  * `paidAmount`: Number (Default `0`)
  * `status`: Enum (`"UNPAID" | "PARTIAL" | "PAID" | "OVERDUE"`)
  * `dueDate`: Date
* **Indexes**:
  * `{ enrollmentId: 1, feeStructureId: 1 }` (Unique)
  * `{ schoolId: 1, status: 1, dueDate: 1 }`

#### 28. `Payment`
Immutable transaction ledger for fee payments.
* **Fields**:
  * `_id`: ObjectId
  * `schoolId`: String
  * `paymentTransactionId`: String (Unique, e.g., `"PAY-20260727-0019"`)
  * `studentId`: ObjectId -> `Student` (Indexed)
  * `enrollmentId`: ObjectId -> `Enrollment`
  * `paidByGuardianId`: ObjectId -> `Guardian` (Optional)
  * `recordedByStaffId`: ObjectId -> `User`
  * `amountPaid`: Number
  * `paymentMode`: Enum (`"CASH" | "CHEQUE" | "DD" | "ONLINE_BANK_TRANSFER"`)
  * `referenceNumber`: String (Cheque/DD number)
  * `paymentDate`: Date
  * `allocatedFeeIds`: Array<{ studentFeeId: ObjectId, amountAllocated: Number }>
  * `remarks`: String
* **Indexes**:
  * `{ schoolId: 1, paymentTransactionId: 1 }` (Unique)
  * `{ studentId: 1, paymentDate: 1 }`

#### 29. `Receipt`
Generated receipt metadata linking a payment to a printable PDF document.
* **Fields**:
  * `_id`: ObjectId
  * `schoolId`: String
  * `receiptNumber`: String (Unique sequence, e.g., `"REC-2026-00084"`)
  * `paymentId`: ObjectId -> `Payment` (Unique indexed)
  * `studentId`: ObjectId -> `Student`
  * `issuedDate`: Date
  * `pdfReceiptUrl`: String (Protected URL)
* **Indexes**:
  * `{ schoolId: 1, receiptNumber: 1 }` (Unique)

---

### 3.8. Communication, CMS & Admissions Collections

#### 30. `Notice`
Public and portal circulars.
* **Fields**:
  * `_id`: ObjectId
  * `schoolId`: String
  * `title`: String
  * `content`: String
  * `targetAudience`: Array<Enum (`"ALL" | "TEACHERS" | "STUDENTS" | "PARENTS"`)>
  * `targetClassIds`: Array<ObjectId -> `Class`> (Optional scoping)
  * `attachmentUrl`: String
  * `isPublicWebsiteNotice`: Boolean (Default `false`)
  * `publishDate`: Date
  * `expiryDate`: Date (Optional TTL indexing)
* **Indexes**:
  * `{ schoolId: 1, publishDate: -1, isPublicWebsiteNotice: 1 }`

#### 31. `Event`
School event calendar items.
* **Fields**:
  * `_id`: ObjectId
  * `schoolId`: String
  * `title`: String
  * `description`: String
  * `eventStartDate`: Date
  * `eventEndDate`: Date
  * `location`: String (`"School Auditorium"`, `"Sports Ground"`)
  * `isPublic`: Boolean (Default `true`)
  * `coverImageUrl`: String
* **Indexes**:
  * `{ schoolId: 1, eventStartDate: 1 }`

#### 32. `Holiday`
School academic holiday calendar.
* **Fields**:
  * `_id`: ObjectId
  * `schoolId`: String
  * `name`: String (`"Independence Day"`, `"Diwali Break"`)
  * `date`: Date
  * `isAcademicHoliday`: Boolean (Default `true`)
* **Indexes**:
  * `{ schoolId: 1, date: 1 }` (Unique)

#### 33. `AdmissionEnquiry`
Prospective student enquiry leads.
* **Fields**:
  * `_id`: ObjectId
  * `schoolId`: String
  * `enquiryNumber`: String (Unique, e.g., `"ENQ-2026-015"`)
  * `studentFirstName`: String
  * `studentLastName`: String
  * `seekingClass`: String (`"Pre-Primary Nursery"`, `"Class 6"`)
  * `parentName`: String
  * `phone`: String
  * `email`: String
  * `status`: Enum (`"NEW" | "CONTACTED" | "CAMPUS_VISITED" | "APPLICATION_SUBMITTED" | "ADMITTED" | "REJECTED"`)
  * `assignedStaffId`: ObjectId -> `User`
  * `notes`: Array<{ noteText: String, createdBy: ObjectId, createdAt: Date }>
  * `enquiryDate`: Date
* **Indexes**:
  * `{ schoolId: 1, status: 1, enquiryDate: -1 }`

#### 34. `GalleryAlbum`
CMS photo gallery album container.
* **Fields**:
  * `_id`: ObjectId
  * `schoolId`: String
  * `title`: String (`"Annual Sports Day 2025"`, `"Science Exhibition"`)
  * `description`: String
  * `coverImageUrl`: String
  * `isPublished`: Boolean (Default `true`)
* **Indexes**:
  * `{ schoolId: 1, isPublished: 1 }`

#### 35. `GalleryImage`
Individual photos within a GalleryAlbum.
* **Fields**:
  * `_id`: ObjectId
  * `albumId`: ObjectId -> `GalleryAlbum` (Indexed)
  * `imageUrl`: String (Cloudinary CDN URL)
  * `caption`: String
  * `order`: Number
* **Indexes**:
  * `{ albumId: 1, order: 1 }`

#### 36. `Document`
Secure repository for private student/teacher documents.
* **Fields**:
  * `_id`: ObjectId
  * `schoolId`: String
  * `ownerType`: Enum (`"STUDENT" | "TEACHER" | "SCHOOL"`)
  * `ownerId`: ObjectId (Indexed — Student or Teacher ID)
  * `documentType`: Enum (`"BIRTH_CERTIFICATE" | "TRANSFER_CERTIFICATE" | "ID_PROOF" | "MEDICAL_REPORT"`)
  * `fileName`: String
  * `storageKey`: String (Private disk or S3 path)
  * `mimeType`: String
  * `fileSizeBytes`: Number
  * `isVerified`: Boolean (Default `false`)
* **Indexes**:
  * `{ ownerType: 1, ownerId: 1, documentType: 1 }`

#### 37. `AuditLog`
Immutable security and administrative audit ledger.
* **Fields**:
  * `_id`: ObjectId
  * `schoolId`: String (Indexed)
  * `actorUserId`: ObjectId -> `User` (Indexed)
  * `actionCode`: String (e.g., `"FEE_PAYMENT_RECORDED"`, `"MARK_UPDATED"`, `"STUDENT_PROMOTED"`, `"USER_LOGIN"`)
  * `targetEntityType`: String (`"Payment"`, `"Mark"`, `"Enrollment"`)
  * `targetEntityId`: ObjectId
  * `ipAddress`: String
  * `userAgent`: String
  * `timestamp`: Date (Default `Date.now`)
  * `beforeState`: Object (JSON snapshot before mutation)
  * `afterState`: Object (JSON snapshot after mutation)
* **Indexes**:
  * `{ schoolId: 1, timestamp: -1 }`
  * `{ targetEntityType: 1, targetEntityId: 1 }`
  * `{ actorUserId: 1, timestamp: -1 }`

---

## 4. Deep-Dive: Academic History & Promotion Strategy

To solve the "historical data loss" problem when students promote from Class 1 to Class 2, our schema enforces a **Promotion Chain Workflow**:

```mermaid
sequenceDiagram
    actor Admin as Principal / Admin
    participant S as Student Profile (Immutable)
    participant E1 as Enrollment (Session 2025-26, Class 5)
    participant E2 as Enrollment (Session 2026-27, Class 6)
    participant DB as MongoDB (ACID Transaction)

    Admin->>DB: Start Promotion Wizard (Student S, Target Session 2026-27, Class 6)
    DB->>E1: Check enrollmentStatus == 'ACTIVE' & passing marks verified
    DB->>E2: CREATE Enrollment (studentId=S, sessionId='2026-27', classId='Class 6', status='ACTIVE')
    DB->>E1: UPDATE status='PROMOTED', promotedToEnrollmentId=E2._id
    DB-->>Admin: Commit Transaction & Report Success
```

### Key Advantages of this Strategy:
1. **Zero Data Overwriting**: The `Student` profile remains unchanged.
2. **Historical Integrity**: A query for `Attendance.find({ studentId: S._id, academicSessionId: "2025-26" })` correctly returns Class 5 attendance without interference from Class 6 records.
3. **Auditable Transition**: Every promotion is executed inside a MongoDB ACID transaction and generates a `"STUDENT_PROMOTED"` `AuditLog` entry.
