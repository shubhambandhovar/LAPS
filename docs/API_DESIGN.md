# REST API DESIGN SPECIFICATION: LITTLE ANGELS SCHOOL — SCHOOL ERP

## 1. Architectural Style & Versioning Strategy
All backend REST APIs adhere to **RESTful Resource-Oriented Architecture** and are prefix-versioned at `/api/v1/`.
* Base URL (Local Dev): `http://localhost:5000/api/v1`
* Base URL (Production): Configured dynamically via `process.env.API_BASE_URL` (no hardcoded domain strings in source code).
* CORS Allowed Origins: Dynamically validated against environment variables (`process.env.ALLOWED_ORIGINS`).

---

## 2. Standardized API Envelopes

To ensure predictable parsing in the React/TanStack Query frontend, every endpoint returns a standardized JSON envelope.

### 2.1. Success Envelope (`2xx`)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Attendance marked successfully for 38 students.",
  "data": {
    "attendanceBatchId": "64ca8f1...b901",
    "markedCount": 38,
    "date": "2026-07-27T00:00:00.000Z"
  },
  "meta": {
    "timestamp": "2026-07-27T15:30:12.104Z",
    "requestId": "req-9823-a8f1"
  }
}
```

### 2.2. Paginated Collection Success Envelope (`200 OK`)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Students retrieved successfully.",
  "data": [
    { "admissionNumber": "LAPS-2026-0001", "firstName": "Aarav", "lastName": "Sharma" },
    { "admissionNumber": "LAPS-2026-0002", "firstName": "Ananya", "lastName": "Verma" }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalRecords": 420,
    "totalPages": 21,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "meta": {
    "timestamp": "2026-07-27T15:30:15.002Z"
  }
}
```

### 2.3. Error Envelope (`4xx / 5xx`)
```json
{
  "success": false,
  "statusCode": 403,
  "errorCode": "AUTH_SCOPE_FORBIDDEN",
  "message": "Teacher is not authorized to submit marks for Class 8 Section B Mathematics.",
  "errors": [
    {
      "field": "sectionId",
      "issue": "No matching TeachingAssignment found for user LAPS-EMP-101 in this section."
    }
  ],
  "meta": {
    "timestamp": "2026-07-27T15:30:20.402Z",
    "path": "/api/v1/marks",
    "requestId": "req-9824-c109"
  }
}
```

---

## 3. Standardized Error Codes & HTTP Status Conventions

| HTTP Status | Standard Error Code | Trigger Condition |
| :--- | :--- | :--- |
| **400 Bad Request** | `VALIDATION_ERROR` | Payload fails Zod schema validation or data type casting. |
| **401 Unauthorized** | `AUTH_TOKEN_EXPIRED` | JWT access token missing, expired, or signature invalid. |
| **401 Unauthorized** | `AUTH_SESSION_REVOKED` | RefreshSession revoked, expired, or user logged out. |
| **403 Forbidden** | `RBAC_PERMISSION_DENIED`| User role lacks required atomic permission (`Permission` table check). |
| **403 Forbidden** | `AUTH_SCOPE_FORBIDDEN` | IDOR check failed (e.g., Parent accessing unauthorized child via `StudentGuardian`). |
| **404 Not Found** | `RESOURCE_NOT_FOUND` | Requested entity ID does not exist in the database. |
| **409 Conflict** | `DUPLICATE_RESOURCE` | Uniqueness violation (e.g., duplicate `username` or `admissionNumber`). |
| **422 Unprocessable**| `BUSINESS_RULE_VIOLATION`| e.g., Attempting to promote an already promoted student enrollment. |
| **429 Too Many Req** | `RATE_LIMIT_EXCEEDED` | Exceeded API throttling bucket (e.g., > 5 login attempts / minute). |
| **500 Server Error** | `INTERNAL_SERVER_ERROR`| Uncaught server exception or MongoDB transaction failure. |

---

## 4. Pagination, Sorting & Filtering Query Syntax

Standard collection endpoints accept uniform URL query parameters:
* `?page=1&limit=25` (Default: `page=1`, `limit=20`, max `limit=100`)
* `?sortBy=lastName&sortOrder=asc` (`asc` or `desc`)
* `?search=Sharma` (Applies regex text search on indexed searchable fields)
* `?filter[classId]=64c...&filter[enrollmentStatus]=ACTIVE` (Exact match filtering)
* `?dateFrom=2026-07-01&dateTo=2026-07-31` (Date range bounds)

---

## 5. Comprehensive API Endpoints Catalog

### 5.1. Authentication & Session Security (`/api/v1/auth`)
* `POST /api/v1/auth/login`: Authenticate with username/email and password. Implements **Layered Rate Limiting** (account-level throttling by `identifier + IP` max 5/15m, and broader IP abuse protection max 100/15m). Always returns generic `"Invalid credentials"` errors on failure. On success, returns access JWT (~15m) and sets `Secure, HTTP-Only, SameSite=Strict` refresh cookie (`~7 days`), creating a new `RefreshSession` row with an independent `sessionFamilyId`.
* `POST /api/v1/auth/refresh`: Exchange valid refresh token cookie for a new short-lived access JWT and rotate the refresh cookie within the same `sessionFamilyId`. Implements a dedicated refresh rate limiter. Reusing a revoked token triggers `SUSPICIOUS_REFRESH_REUSE` and revokes only that `sessionFamilyId`.
* `POST /api/v1/auth/logout`: Revoke active `RefreshSession` and clear HTTP-only cookies.
* `POST /api/v1/auth/logout-all`: Revoke all active `RefreshSession` rows across all session families for the user account across all devices.
* `GET  /api/v1/auth/sessions`: List all active multi-device `RefreshSession` rows (showing `sessionFamilyId`, OS, browser, IP, last used, and current session flag).
* `DELETE /api/v1/auth/sessions/:sessionId`: Revoke a specific remote device session family. Enforces strict IDOR checks.
* `POST /api/v1/auth/forgot-password`: Initiate password reset flow (sends secure time-bound reset OTP/link).
* `POST /api/v1/auth/reset-password`: Complete password reset using OTP/token. Enforces **NIST SP 800-63B** system password policy (min 10 chars, max 128 chars, length over arbitrary complexity).
* `GET  /api/v1/auth/me`: Retrieve currently authenticated user profile, active role, permissions, and session context. Never returns password hashes or refresh token hashes.

### 5.2. Academic Sessions (`/api/v1/academic-sessions`)
* `GET  /api/v1/academic-sessions`: Paginated list of academic years. Supports sorting (`sortBy=startDate`, `sortOrder=desc`) and status filtering (`?status=ACTIVE`).
* `POST /api/v1/academic-sessions`: Create a new academic session (`name`, `startDate`, `endDate`, `status`). Validates non-overlapping dates and end > start.
* `GET  /api/v1/academic-sessions/:id`: Retrieve session details.
* `PATCH /api/v1/academic-sessions/:id`: Update session details or status (`PLANNED`, `ACTIVE`, `ARCHIVED`).
* `PATCH /api/v1/academic-sessions/:id/activate`: Set session as current active school session (atomically unsetting previous active session in transaction).
* `PATCH /api/v1/academic-sessions/:id/archive`: Archive academic session (soft delete; prevented if active or referenced by historical records).

### 5.3. Classes, Sections & Subjects (`/api/v1/classes`, `/api/v1/sections`, `/api/v1/subjects`)
* `GET  /api/v1/classes`: Paginated list of classes (`Nursery` to `Class 10`). Supports sorting by `orderSequence` and search by `name`/`code`.
* `POST /api/v1/classes`: Create a new class (`name`, `code` [optional, auto-generated if omitted], `level`, `orderSequence`, `status`). Enforces unique code constraint.
* `GET  /api/v1/classes/:id`: Retrieve class details.
* `PATCH /api/v1/classes/:id`: Update class properties.
* `PATCH /api/v1/classes/:id/archive`: Soft-archive class (`status: "ARCHIVED"`, records `archivedBy` and `archivedAt`).
* `GET  /api/v1/sections`: Paginated list of sections filtered by `?academicSessionId=&classId=`.
* `POST /api/v1/sections`: Create section (`academicSessionId`, `classId`, `name`, `roomNumber`, `maxCapacity`). Enforces unique `(session + class + name)` constraint.
* `GET  /api/v1/sections/:id`: Retrieve section details.
* `PATCH /api/v1/sections/:id`: Update section properties.
* `PATCH /api/v1/sections/:id/archive`: Soft-archive section (`status: "ARCHIVED"`).
* `GET  /api/v1/subjects`: Paginated list of global master subjects. Supports search by `name`/`code`/`shortName` and filter by `subjectType` or `status`. **Not bound directly to Class.**
* `POST /api/v1/subjects`: Create global master subject (`name`, `code` [optional, auto-generated if omitted], `shortName`, `subjectType`, `isOptional`).
* `GET  /api/v1/subjects/:id`: Retrieve subject details.
* `PATCH /api/v1/subjects/:id`: Update subject details.
* `PATCH /api/v1/subjects/:id/archive`: Soft-archive subject (`status: "ARCHIVED"`).

### 5.4. Teachers & Teaching Assignments (`/api/v1/teachers`, `/api/v1/teaching-assignments`)
* `GET  /api/v1/teachers`: Paginated list of teacher profiles. Supports full-text regex search (`?search=Sharma`), filter by `designation` or `status`, and sorting (`sortBy=lastName`).
* `POST /api/v1/teachers`: Create teacher profile linked to `User` (`userId` [optional], `employeeId` [optional, auto-generated if omitted], `firstName`, `lastName`, `email`, `phone`, `qualification`, `designation`, `joiningDate`, `photoUrl`, `isClassTeacher`). **No payroll, salary, or leave management fields included**.
* `GET  /api/v1/teachers/:id`: Retrieve teacher profile and assigned teaching scopes.
* `PATCH /api/v1/teachers/:id`: Update teacher profile or status (`ACTIVE`, `ON_LEAVE`, `INACTIVE`, `ARCHIVED`).
* `PATCH /api/v1/teachers/:id/archive`: Soft-archive teacher profile (transitions status to `ARCHIVED`, sets `archivedBy` and `archivedAt`).
* `GET  /api/v1/teaching-assignments`: Paginated list of teaching assignments. Supports filtering by `?academicSessionId=&teacherId=&classId=&sectionId=&subjectId=`.
* `POST /api/v1/teaching-assignments`: Assign a teacher to a `Session + Class + Section + Subject` with `isClassTeacher` flag. Enforces unique assignment constraints.
* `GET  /api/v1/teaching-assignments/:id`: Retrieve teaching assignment details.
* `PATCH /api/v1/teaching-assignments/:id`: Update assignment flags (`isClassTeacher`, `status`).
* `PATCH /api/v1/teaching-assignments/:id/archive`: Soft-archive teaching assignment (`status: "ARCHIVED"`, records `archivedBy` and `archivedAt`).

### 5.5. Student, Guardian & Enrollment Management (`/api/v1/students`, `/api/v1/guardians`, `/api/v1/student-guardians`, `/api/v1/enrollments`)
* **Students (`/api/v1/students`)**:
  * `GET  /api/v1/students`: Paginated list of students. Supports filtering (`status`, `gender`, `category`) and sorting. **Expanded Multi-Field Search (`?search=`)**: Searches across `admissionNumber`, student full name (`firstName`, `lastName`), linked guardian name (via `StudentGuardian` -> `Guardian.name`), and phone number (`Student.phone` or `Guardian.phone`).
  * `POST /api/v1/students`: Create new independent student profile (`admissionNumber` [optional, auto-generated `LAPS-YYYY-XXXX` if omitted], `firstName`, `middleName`, `lastName`, `gender`, `dateOfBirth`, `bloodGroup`, `category`, `religion`, `nationality`, `photoUrl`, `email`, `phone`, `address`, `city`, `state`, `country`, `pinCode`, `emergencyContacts`, `documents` metadata array, `status: "ACTIVE" | "ARCHIVED"`). **No class or section stored inside Student.**
  * `GET  /api/v1/students/:id`: Complete student dossier (profile, linked guardians via `StudentGuardian`, chronological enrollment history).
  * `PATCH /api/v1/students/:id`: Update student demographic, emergency contact, or address properties.
  * `PATCH /api/v1/students/:id/archive`: Soft-archive student profile (`status: "ARCHIVED"`, records `archivedBy` and `archivedAt`). **Archive Protection Rule**: Prevents archiving (`400 Bad Request` / `409 Conflict`) if the student has an active enrollment (`enrollmentStatus: "ACTIVE"`).
  * `PATCH /api/v1/students/:id/status`: Transition student status (`"ACTIVE" | "ARCHIVED"` only — **Promotion, transfer, withdrawal, completion, and alumni status are tracked ONLY in Enrollment**).
* **Guardians (`/api/v1/guardians`)**:
  * `GET  /api/v1/guardians`: Paginated list of guardian profiles. Supports search by `name`/`phone`/`email`.
  * `POST /api/v1/guardians`: Create guardian profile (`name`, `relationship` default category, `phone`, `email`, `occupation`, `annualIncome`, `photoUrl`, `sameAsStudentAddress`, `address`, `emergencyContacts`, `status`).
  * `GET  /api/v1/guardians/:id`: Retrieve guardian profile and linked students via `StudentGuardian`.
  * `PATCH /api/v1/guardians/:id`: Update guardian profile properties.
  * `PATCH /api/v1/guardians/:id/archive`: Soft-archive guardian profile (`status: "ARCHIVED"`). **Archive Protection Rule**: Prevents archiving (`400 Bad Request` / `409 Conflict`) if the guardian is the sole linked guardian (`StudentGuardian` count == 1) for a student who has an active enrollment.
* **Student-Guardians (`/api/v1/student-guardians`)**:
  * `GET  /api/v1/student-guardians`: List normalized student-guardian relationships filtered by `?studentId=` or `?guardianId=`.
  * `POST /api/v1/student-guardians`: Link a `Student` and `Guardian` (`studentId`, `guardianId`, `relationship`, `isPrimaryGuardian`, `pickupPermission`, `emergencyContactPermission`). Enforces single primary guardian per student.
  * `PATCH /api/v1/student-guardians/:id`: Update relationship type, primary designation, or pickup/emergency permissions.
  * `DELETE /api/v1/student-guardians/:id`: Unlink guardian from student (hard delete join record or soft archive).
* **Enrollments (`/api/v1/enrollments`)**:
  * `GET  /api/v1/enrollments`: Paginated list of enrollments filtered by `?academicSessionId=&classId=&sectionId=&studentId=&enrollmentStatus=`. **Dynamic Class Teacher Enrichment**: Responses automatically expose the current section's class teacher (`classTeacher: { id, firstName, lastName, employeeId }`) by joining through the active `TeachingAssignment` (`isClassTeacher: true`) without duplicating teacher data inside `Enrollment`.
  * `POST /api/v1/enrollments`: Enroll a student into an academic session, class, and section (`studentId`, `academicSessionId`, `classId`, `sectionId`, `rollNumber` [optional, auto-generated sequentially if omitted]). Enforces unique active enrollment per student per session and unique roll number per section.
  * `GET  /api/v1/enrollments/:id`: Retrieve enrollment details, promotion chain, and dynamically populated current class teacher.
  * `PATCH /api/v1/enrollments/:id`: Update enrollment section or roll number.
  * `PATCH /api/v1/enrollments/:id/archive`: Soft-archive enrollment (`enrollmentStatus: "ARCHIVED"`).
  * `POST /api/v1/enrollments/promote`: Promotion Wizard endpoint — creates a new enrollment in target session/class/section, sets old enrollment `enrollmentStatus: "PROMOTED"` and links `promotedToEnrollmentId`.
  * `POST /api/v1/enrollments/:id/transfer`: Transfer Wizard endpoint — marks enrollment `enrollmentStatus: "TRANSFERRED"` with remarks and transfer date.
  * `POST /api/v1/enrollments/:id/withdraw`: Withdrawal Wizard endpoint — marks enrollment `enrollmentStatus: "WITHDRAWN"` with remarks.

### 5.6. Curriculum, Timetable & Academic Calendar (`/api/v1/academic-terms`, `/api/v1/class-subjects`, `/api/v1/rooms`, `/api/v1/bell-schedules`, `/api/v1/periods`, `/api/v1/timetables`, `/api/v1/academic-calendar`, `/api/v1/holidays`, `/api/v1/working-day-rules`)
* **Academic Term Management**:
  * `GET  /api/v1/academic-terms`: List academic terms beneath an academic session (`Term 1`, `Term 2`).
  * `POST /api/v1/academic-terms`: Create an academic term (`name`, `code`, `startDate`, `endDate`, `orderSequence`).
  * `PATCH /api/v1/academic-terms/:id`: Update term dates or sequence.
  * `PATCH /api/v1/academic-terms/:id/archive`: Soft-archive academic term (`status: "ARCHIVED"`).
* **ClassSubject Mapping & Constraints**:
  * `GET  /api/v1/class-subjects`: List class-subject mappings (filterable by `academicSessionId`, `classId`, `isMandatory`, `isOptional`).
  * `POST /api/v1/class-subjects`: Create mapping between a global `Subject` and a `Class` for an `AcademicSession` with optional `minPeriodsPerWeek` and `maxPeriodsPerWeek` constraints. Validates Teacher Assignment Compatibility.
  * `PATCH /api/v1/class-subjects/:id`: Update mandatory/optional flag, period constraints, elective group, or order sequence.
  * `PATCH /api/v1/class-subjects/:id/archive`: Soft-archive class-subject mapping (`status: "ARCHIVED"`).
* **Room & Laboratory Catalog**:
  * `GET  /api/v1/rooms`: List institutional rooms and laboratories (filterable by `roomType`, `building`).
  * `POST /api/v1/rooms`: Create a dedicated room entry (`name`, `code`, `capacity`, `roomType`).
  * `PATCH /api/v1/rooms/:id`: Update room details or capacity.
  * `PATCH /api/v1/rooms/:id/archive`: Soft-archive room (`status: "ARCHIVED"`).
* **Bell Schedule Management**:
  * `GET  /api/v1/bell-schedules`: List bell schedules for an academic session (filterable by `scopeType: "GLOBAL" | "CLASS"`, target class, or date range).
  * `POST /api/v1/bell-schedules`: Create a bell schedule (`REGULAR`, `EXAM`, `HALF_DAY`, `SPECIAL_EVENT`) assigned globally, by class (`targetClassIds`), and/or by date range (`validFrom`, `validTo`).
  * `PATCH /api/v1/bell-schedules/:id`: Update schedule name, type, scope, date range, or toggle default status (`isDefault: true`).
  * `PATCH /api/v1/bell-schedules/:id/archive`: Soft-archive bell schedule (`status: "ARCHIVED"`).
* **Period Management**:
  * `GET  /api/v1/periods`: List periods for a bell schedule ordered sequentially.
  * `POST /api/v1/periods`: Create a period with sequence, start time, end time, and break flag. Enforces time-overlap prevention.
  * `PATCH /api/v1/periods/:id`: Update period sequence, times, or break status.
  * `PATCH /api/v1/periods/:id/archive`: Soft-archive period (`status: "ARCHIVED"`).
* **Timetable Scheduling (Versioned Weekly Matrix & Teacher Workload)**:
  * `GET  /api/v1/timetables/my-timetable`: Teacher-scoped endpoint returning active `PUBLISHED` weekly schedule matrix for the authenticated Teacher profile (`MY_TIMETABLE_ONLY`).
  * `GET  /api/v1/timetables`: Admin query for weekly timetable matrix by `academicSessionId`, `classId`, `sectionId`, or `teacherId` (filterable by `status: "DRAFT" | "PUBLISHED"`).
  * `GET  /api/v1/timetables/workload/:teacherId`: Compute teacher workload metrics (daily periods, weekly periods, free periods, and overload status against configurable thresholds).
  * `POST /api/v1/timetables`: Create timetable slot assignment referencing dedicated `roomId`. Automatically detects and blocks Teacher Conflicts, Room Conflicts, and Section Conflicts (`409 Conflict`).
  * `PATCH /api/v1/timetables/:id`: Reassign slot room (`roomId`), teacher, or subject with full conflict validation.
  * `POST /api/v1/timetables/publish`: Batch publish drafted timetable slots (`status: "PUBLISHED"`), making them accessible to teachers and operational for attendance.
  * `PATCH /api/v1/timetables/:id/archive`: Soft-archive timetable slot (`status: "ARCHIVED"`).
* **Academic Calendar**:
  * `GET  /api/v1/academic-calendar`: List institutional calendar events by date range or `eventType`.
  * `POST /api/v1/academic-calendar`: Create calendar event (`WORKING_DAY`, `HOLIDAY`, `HALF_DAY`, `EXAM_BLOCK`, `VACATION`, `SPECIAL_EVENT`, `EMERGENCY_CLOSURE`) with optional recurring rules (`isRecurring: true`, `recurrenceRule`: frequency weekly/monthly/yearly).
  * `PATCH /api/v1/academic-calendar/:id`: Update event dates, description, recurrence rules, or target class scope.
  * `PATCH /api/v1/academic-calendar/:id/archive`: Soft-archive calendar event (`status: "ARCHIVED"`).
* **Holiday Management**:
  * `GET  /api/v1/holidays`: List official institutional holidays (filterable by `holidayType`, date range, `isOptionalHoliday`).
  * `POST /api/v1/holidays`: Create holiday catalog entry (`NATIONAL`, `STATE`, `SCHOOL`, `OPTIONAL`, `EMERGENCY_CLOSURE`).
  * `PATCH /api/v1/holidays/:id`: Update holiday title, dates, or attendance impact flag.
  * `PATCH /api/v1/holidays/:id/archive`: Soft-archive holiday (`status: "ARCHIVED"`).
* **Working Day Rules**:
  * `GET  /api/v1/working-day-rules`: Retrieve active working day rule configuration for an academic session.
  * `PUT  /api/v1/working-day-rules`: Create or update working day rules (`MON_TO_FRI`, `MON_TO_SAT`, `CUSTOM`, half-days, emergency closures).

### 5.7. Attendance & Leave Management (`/api/v1/attendance`, `/api/v1/leaves` — Phase 6)
* **Attendance Integration Contract**: Daily and period-wise attendance marking endpoints do not maintain their own schedule or calendar. They must dynamically consume `PUBLISHED` Timetable slots (`status: "PUBLISHED"`), active `TeachingAssignment` scopes, and active `Enrollment` records, cross-referenced with `Holiday`, `WorkingDayRule`, and `AcademicCalendarEvent` status.
* **Attendance Sessions & Register (`/api/v1/attendance`)**:
  * `GET  /api/v1/attendance/session-context`: Given `date`, `classId`, `sectionId`, and optional `timetablePeriodId`, automatically resolve the authorized `Teacher`, current period, subject, and student roster (`Enrollment`) using the `PUBLISHED` Timetable. Rejects with `400` / `409` if the date is a holiday or emergency closure.
  * `POST /api/v1/attendance`: Mark or update attendance batch for a class/section/period (initial save creates session in `DRAFT` state). Payloads capture `attendanceSource` (`MANUAL`, `LEAVE`, `SYSTEM`, `IMPORT`, `BIOMETRIC_RESERVED`), historical snapshot fields (`studentName`, `rollNumber`, `className`, `sectionName`), and optional `lateMinutes` for punctuality reporting. Validates Teacher RBAC scope against `TeachingAssignment` and `PUBLISHED` timetable slots.
  * `POST /api/v1/attendance/:id/submit`: Transition attendance session lifecycle from `DRAFT` to `SUBMITTED`.
  * `POST /api/v1/attendance/bulk`: Bulk-mark attendance across multiple sections or periods (Admin only or Teacher for their assigned multi-period block).
  * `GET  /api/v1/attendance/register`: Retrieve structured daily, weekly, monthly, or yearly attendance register matrix filtered by student, class, section, subject, or teacher.
  * `PATCH /api/v1/attendance/:id/lock`: Manually lock an attendance session (`sessionStatus: "LOCKED"` — Admin only).
  * `PATCH /api/v1/attendance/:id/freeze`: Freeze attendance session (`sessionStatus: "FROZEN"` — invoked after report-card generation).
  * `PATCH /api/v1/attendance/:id/reopen`: Reopen a frozen attendance session (`FROZEN` -> `LOCKED` / `SUBMITTED` — Admin only, requires mandatory audit reason).
  * `PATCH /api/v1/attendance/:id/archive`: Soft-archive an attendance session and its entries (`status: "ARCHIVED"`).
* **Attendance Corrections (`/api/v1/attendance/corrections`)**:
  * `POST /api/v1/attendance/corrections`: Submit a formal correction request by a Teacher or Admin to change an attendance entry after submission or lock. Requires mandatory `reason`.
  * `GET  /api/v1/attendance/corrections`: List pending, approved, or rejected correction requests (filterable by class, section, teacher, status).
  * `PATCH /api/v1/attendance/corrections/:id/review`: Admin approve or reject a correction request. When approved, automatically mutates `AttendanceEntry.attendanceStatus` and records an immutable audit entry in `statusHistory`.
* **Leave Management (`/api/v1/leaves`)**:
  * `POST /api/v1/leaves`: Submit a leave application (`applicantType`: `STUDENT` or `TEACHER`) with date range, controlled `leaveType` (`CASUAL`, `MEDICAL`, `EMERGENCY`, `SPORTS`, `OFFICIAL`, `OTHER`), reason, and optional attachment URL.
  * `GET  /api/v1/leaves`: Retrieve paginated leave requests (filterable by student, teacher, class, section, status, date range).
  * `GET  /api/v1/leaves/:id`: Get detailed leave request with reviewer notes.
  * `PATCH /api/v1/leaves/:id/review`: Admin or Class Teacher approve/reject leave request. When approved for a Student, automatically links to existing or future `AttendanceEntry` records with status `APPROVED_LEAVE` or `MEDICAL_LEAVE` (`attendanceSource: "LEAVE"`).
  * `PATCH /api/v1/leaves/:id/cancel`: Applicant cancels pending leave application.
  * `PATCH /api/v1/leaves/:id/archive`: Soft-archive leave request (`status: "ARCHIVED"`).
* **Attendance Lock Rules (`/api/v1/attendance/lock-rules`)**:
  * `GET  /api/v1/attendance/lock-rules`: Retrieve active attendance lock rule configuration for an academic session.
  * `PUT  /api/v1/attendance/lock-rules`: Create or update auto-lock rules (`lockAfterHours`, `lockAfterTimeOfDay`, admin override settings).
* **Attendance Analytics (`/api/v1/attendance/analytics`)**:
  * `GET  /api/v1/attendance/analytics/summary`: Retrieve aggregate attendance percentage statistics for students, classes, sections, and teachers across monthly or academic session scopes. Employs a materialized summary aggregation cache (`(academicSessionId, studentId, month, year)`) for scalable reporting.

### 5.8. Homework, Assignments & Study Material (`/api/v1/homework`, `/api/v1/study-material`, `/api/v1/rubrics` — Phase 7)
* **Homework Dependency Contract**: Homework endpoints do not maintain their own schedule or class-subject mapping. They must dynamically validate against active `AcademicSession`, `PUBLISHED` Timetable slots (`Timetable.status === "PUBLISHED"`), active `TeachingAssignment` scopes, and `Enrollment` records.
* **Homework Management (`/api/v1/homework`)**:
  * `GET  /api/v1/homework`: List homework assignments with pagination, filtering (`classId`, `sectionId`, `subjectId`, `teacherId`, `status: "DRAFT" | "SCHEDULED" | "PUBLISHED" | "CLOSED" | "ARCHIVED"`, `homeworkType`, `dueDate` range), and searching (`title`, `description`). Scoped by RBAC (Teacher: assigned classes only; Student: own enrollments only).
  * `GET  /api/v1/homework/:id`: Retrieve detailed homework assignment including extended attachment metadata (`url`, `type`, `title`, `fileName`, `fileSize`, `mimeType`, `uploadedAt` — storing URLs only) and submission summary statistics.
  * `POST /api/v1/homework`: Create homework assignment (`title`, `description`, `instructions`, `homeworkType`, `maxAttempts`, `subjectId`, `classId`, `sectionId`, `academicSessionId`, `assignedDate`, `dueDate`, `scheduledPublishAt`, `maxMarks`, `attachments` Array with extended metadata, `status`). Rejects with `403 RBAC_PERMISSION_DENIED` if teacher lacks `TeachingAssignment` for that section/subject or if timetable is not `PUBLISHED`.
  * `PUT  /api/v1/homework/:id`: Update homework assignment details, instructions, due date, scheduled publish time, attachments, or status (`SCHEDULED` auto-publishes when `scheduledPublishAt <= now`).
  * `PATCH /api/v1/homework/:id/archive`: Soft-archive homework assignment (`status: "ARCHIVED"`).
* **Student Submissions (`/api/v1/homework/:homeworkId/submissions`, `/api/v1/homework/submissions/my`)**:
  * `GET  /api/v1/homework/:homeworkId/submissions`: List all student submissions for a homework assignment (with pagination, filtering by evaluation status `SUBMITTED` | `EVALUATED` | `RETURNED`, attempt number `currentAttempt`, late status, and reserved `plagiarismStatus: "NOT_CHECKED" | "CHECKED"`).
  * `GET  /api/v1/homework/submissions/my`: Student list of own homework submissions across assignments.
  * `POST /api/v1/homework/:homeworkId/submissions`: Student submit homework (`attachments` Array with extended metadata, `remarks`, `submittedAt`). Automatically increments `currentAttempt` (up to `homework.maxAttempts`), sets `plagiarismStatus: "NOT_CHECKED"`, and calculates `isLate: boolean` and `lateMinutes: number` based on `homework.dueDate`.
  * `PUT  /api/v1/homework/submissions/:id`: Student update draft or resubmit a returned submission (`currentAttempt + 1` if within `maxAttempts`).
  * `PATCH /api/v1/homework/submissions/:id/archive`: Soft-archive submission (`status: "ARCHIVED"`).
* **Teacher Evaluation (`/api/v1/homework/submissions/:submissionId/evaluate`)**:
  * `PATCH /api/v1/homework/submissions/:submissionId/evaluate`: Teacher evaluate student submission (`rubricTemplateId` optional template reference, `marks`, `grade`, `remarks`, `rubric: Array<{ criterion, marksAwarded, maxMarks, comment }>`, `returnedForResubmission: boolean`). Updates submission status to `EVALUATED` or `RETURNED`.
* **Rubric Templates (`/api/v1/rubrics`)**:
  * `GET  /api/v1/rubrics`: List reusable rubric templates scoped to teacher or shared departmental subject templates.
  * `POST /api/v1/rubrics`: Create reusable rubric template (`title`, `description`, `subjectId`, `criteria: Array<{ criterion, maxMarks, description }>`, `isShared`).
  * `PUT  /api/v1/rubrics/:id`: Update rubric template criteria or sharing status.
  * `PATCH /api/v1/rubrics/:id/archive`: Soft-archive rubric template (`status: "ARCHIVED"`).
* **Study Material (`/api/v1/study-material`)**:
  * `GET  /api/v1/study-material`: List study materials with pagination, filtering (`classId`, `sectionId`, `subjectId`, `teacherId`, `materialType`), and searching (`title`, `description`). Respects release/expiration windows (`publishAt`, `expireAt`).
  * `GET  /api/v1/study-material/:id`: Retrieve study material details including complete `versionHistory` array.
  * `POST /api/v1/study-material`: Upload/create study material (`title`, `description`, `materialType`, `fileUrl`, `fileMimeType`, `publishAt`, `expireAt`, `classId`, `sectionId`, `subjectId`, `academicSessionId`). Scoped to assigned teacher classes.
  * `PUT  /api/v1/study-material/:id`: Update study material or upload a new file version. Automatically appends previous state to `versionHistory` (`version`, `fileUrl`, `materialType`, `changedAt`, `changedBy`, `changelog`) and increments `currentVersion`.
  * `PATCH /api/v1/study-material/:id/archive`: Soft-archive study material (`status: "ARCHIVED"`).
* **Notification Event Hooks (Planning Only — No Implementation)**:
  * System defines event hooks for `HOMEWORK_PUBLISHED` (triggered when homework moves from `DRAFT`/`SCHEDULED` to `PUBLISHED`), `HOMEWORK_DUE_REMINDER` (triggered 24h before `dueDate`), and `HOMEWORK_EVALUATED` (triggered when submission is graded) for future SMS/Email/Push integrations.
* **Homework & Study Material Analytics (`/api/v1/homework/analytics/summary`)**:
  * `GET  /api/v1/homework/analytics/summary`: Retrieve aggregate homework analytics including `submission percentage`, `pending percentage`, `late percentage`, `average marks`, `class summary`, and `teacher summary`. Uses a Materialized Summary Cache (`HomeworkSummaryCache` keyed by `(academicSessionId, teacherId, classId, subjectId, month, year)`) to support high-scale real-time reporting.

### 5.9. Examination, Assessment & Marks Management (`/api/v1/exams`, `/api/v1/exam-schedules`, `/api/v1/marks`, `/api/v1/results`, `/api/v1/grade-scales`, `/api/v1/re-evaluations` — Phase 8)
* **Academic Dependency Contract**: Marks depend strictly on `AcademicSession` -> `AcademicTerm` -> `ClassSubject` -> `TeachingAssignment` -> `Enrollment`. Endpoints do not duplicate any academic mapping and strictly verify teacher scope against active `TeachingAssignment` records.
* **Examination Management (`/api/v1/exams`)**:
  * `GET    /api/v1/exams`: List examinations filtered by `academicSessionId`, `academicTermId`, `examType`, `status`, and `search`.
  * `GET    /api/v1/exams/:id`: Retrieve single examination with summary metrics.
  * `POST   /api/v1/exams`: Create a new examination (`status: "DRAFT"`).
  * `PUT    /api/v1/exams/:id`: Update examination details.
  * `PATCH  /api/v1/exams/:id/publish`: Publish examination (`status: "PUBLISHED"`).
  * `PATCH  /api/v1/exams/:id/lock`: Lock examination (`status: "COMPLETED"`).
  * `PATCH  /api/v1/exams/:id/archive`: Soft-archive examination (`status: "ARCHIVED"`).
* **Exam Schedule & Conflict Detection (`/api/v1/exam-schedules`)**:
  * `GET    /api/v1/exam-schedules`: List schedule slots filtered by `examId`, `classId`, `sectionId`, `subjectId`, and `date`.
  * `GET    /api/v1/exam-schedules/:id`: Retrieve single exam schedule slot.
  * `POST   /api/v1/exam-schedules`: Create single or bulk schedule slots with mandatory real-time conflict detection (room overlap, invigilator overlap, and student class/section overlap). Returns `409 CONFLICT` if overlap detected.
  * `PUT    /api/v1/exam-schedules/:id`: Reschedule or update schedule slot.
  * `PATCH  /api/v1/exam-schedules/:id/archive`: Soft-archive schedule slot (`status: "ARCHIVED"`).
* **Marks Entry & Locking (`/api/v1/marks`)**:
  * `GET    /api/v1/marks`: List student marks entries filtered by `examId`, `classSubjectId`, `teachingAssignmentId`, `enrollmentId`, and `status`.
  * `GET    /api/v1/marks/:id`: Retrieve single marks record with assessment component breakdown and revision audit history.
  * `POST   /api/v1/marks/bulk`: Bulk enter/save draft marks (`status: "DRAFT"`) for an `examId + teachingAssignmentId`. Strictly validates teacher authorization against `TeachingAssignment`.
  * `POST   /api/v1/marks/submit`: Teacher submits marks (`status: "SUBMITTED"`); prevents further edits by teacher.
  * `PATCH  /api/v1/marks/lock`: Admin locks submitted marks (`status: "LOCKED"`).
  * `PATCH  /api/v1/marks/publish`: Admin publishes locked marks (`status: "PUBLISHED"`).
  * `PATCH  /api/v1/marks/:id/grace`: Admin applies grace marks rule with audit remark.
  * `PATCH  /api/v1/marks/:id/archive`: Soft-archive marks entry.
* **Result Processing & Analytics (`/api/v1/results`)**:
  * `GET    /api/v1/results`: List compiled exam results filtered by `examId`, `classId`, `sectionId`, `enrollmentId`, and `resultStatus`.
  * `GET    /api/v1/results/my`: Student/Guardian views their own published exam results (`status: "PUBLISHED"`).
  * `GET    /api/v1/results/:id`: Retrieve single compiled result sheet.
  * `POST   /api/v1/results/calculate`: Admin triggers automated calculation, grade resolution, CGPA/GPA, and ranking engine for an `examId + classId`.
  * `PATCH  /api/v1/results/publish`: Admin publishes calculated results (`status: "PUBLISHED"`).
  * `PATCH  /api/v1/results/:id/archive`: Soft-archive result.
  * `GET    /api/v1/results/analytics/summary`: Retrieve aggregate exam analytics from materialized cache (`ExamAnalyticsSummary`).
* **Grade Scales (`/api/v1/grade-scales`)**:
  * `GET    /api/v1/grade-scales`: List configured grade scales for an academic session.
  * `GET    /api/v1/grade-scales/:id`: Retrieve single grade scale.
  * `POST   /api/v1/grade-scales`: Create a custom or default percentage/ABSOLUTE/GPA grade scale.
  * `PUT    /api/v1/grade-scales/:id`: Update grade scale intervals.
  * `PATCH  /api/v1/grade-scales/:id/archive`: Soft-archive grade scale.
* **Re-evaluation Workflow (`/api/v1/re-evaluations`)**:
  * `GET    /api/v1/re-evaluations`: List re-evaluation requests filtered by `examId`, `studentId`, `requestType`, and `status`.
  * `GET    /api/v1/re-evaluations/:id`: Retrieve single re-evaluation request with full audit trail.
  * `POST   /api/v1/re-evaluations`: Student/Guardian submits formal re-evaluation request (`status: "SUBMITTED"`).
  * `PATCH  /api/v1/re-evaluations/:id/review`: Admin approves or rejects request (`status: "APPROVED_FOR_EVALUATION" | "REJECTED"`).
  * `PATCH  /api/v1/re-evaluations/:id/complete`: Assigned teacher re-evaluates, updates marks, and records immutable audit trail (`status: "COMPLETED"`).
  * `PATCH  /api/v1/re-evaluations/:id/archive`: Soft-archive request.

### 5.10. Report Cards, Academic Transcripts & Promotion Management (`/api/v1/report-cards`, `/api/v1/report-card-templates`, `/api/v1/promotions` — Phase 9)

#### A. Report Cards (`/api/v1/report-cards`)
* `GET    /api/v1/report-cards`: List compiled report cards (filterable by `academicSessionId`, `academicTermId`, `examId`, `classId`, `sectionId`, `enrollmentId`, `studentId`, `status`).
* `GET    /api/v1/report-cards/my`: Retrieve published report cards for logged-in Student or Guardian (`status: "PUBLISHED"`).
* `GET    /api/v1/report-cards/:id`: Retrieve detailed report card including active `versionHistory` and attendance summary.
* `POST   /api/v1/report-cards/generate`: Trigger automated report card generation or re-generation for an exam/class/enrollment (creates `ReportCardVersion` snapshot on re-generation).
* `PATCH  /api/v1/report-cards/publish`: Bulk publish generated report cards (`status: "PUBLISHED"`).
* `GET    /api/v1/report-cards/:id/download`: Retrieve printable PDF report card URL and binary payload.
* `PATCH  /api/v1/report-cards/:id/remarks`: Update class teacher or principal remarks on a draft report card.
* `PATCH  /api/v1/report-cards/:id/archive`: Soft-archive a report card (`status: "ARCHIVED"`).

#### B. Report Card Templates (`/api/v1/report-card-templates`)
* `GET    /api/v1/report-card-templates`: List configured report card templates.
* `GET    /api/v1/report-card-templates/:id`: Retrieve specific template configuration.
* `POST   /api/v1/report-card-templates`: Create new report card template with custom branding, signature rules, and layout options.
* `PUT    /api/v1/report-card-templates/:id`: Update existing template configuration.
* `PATCH  /api/v1/report-card-templates/:id/default`: Set a template as default for an academic session or class.
* `PATCH  /api/v1/report-card-templates/:id/archive`: Soft-archive template (`status: "ARCHIVED"`).

#### C. Promotion Decisions (`/api/v1/promotions`)
* `GET    /api/v1/promotions`: List student promotion decisions (filterable by `academicSessionId`, `fromClassId`, `fromSectionId`, `status`).
* `POST   /api/v1/promotions/evaluate`: Bulk evaluate promotion eligibility based on term results and attendance thresholds.
* `POST   /api/v1/promotions`: Create or update an individual student promotion decision (`PROMOTED`, `PROMOTED_CONDITIONALLY`, `DETAINED`, `COMPLETED`, `TC_ELIGIBLE`).
* `PATCH  /api/v1/promotions/approve`: Bulk approve draft promotion decisions (`status: "APPROVED"`).
* `PATCH  /api/v1/promotions/:id/archive`: Soft-archive promotion decision (`status: "ARCHIVED"`).

### 5.11. Fee Management & Finance (`/api/v1/fee-heads`, `/api/v1/fee-structures`, `/api/v1/discounts`, `/api/v1/late-fee-rules`, `/api/v1/invoices`, `/api/v1/payments`, `/api/v1/receipts`, `/api/v1/student-ledger`, `/api/v1/fee-reports` — Phase 10)

#### A. Fee Heads (`/api/v1/fee-heads`)
* `GET    /api/v1/fee-heads`: List all fee heads (filterable by `category`, `frequency`, `status`).
* `GET    /api/v1/fee-heads/:id`: Retrieve specific fee head details.
* `POST   /api/v1/fee-heads`: Create a new fee head (Admission Fee, Tuition Fee, Examination Fee, Library Fee, Laboratory Fee, Sports Fee, Development Fee, Custom Fee Heads).
* `PUT    /api/v1/fee-heads/:id`: Update fee head details.
* `PATCH  /api/v1/fee-heads/:id/archive`: Soft-archive a fee head (`status: "ARCHIVED"`).

#### B. Fee Structures (`/api/v1/fee-structures`)
* `GET    /api/v1/fee-structures`: List fee structures (filterable by `academicSessionId`, `classId`, `status`).
* `GET    /api/v1/fee-structures/:id`: Retrieve specific fee structure including components and installment breakdown.
* `POST   /api/v1/fee-structures`: Create a new fee structure for an academic session and class.
* `PUT    /api/v1/fee-structures/:id`: Update existing fee structure.
* `PATCH  /api/v1/fee-structures/:id/status`: Update status (`DRAFT`, `ACTIVE`, `ARCHIVED`).
* `PATCH  /api/v1/fee-structures/:id/archive`: Soft-archive fee structure (`status: "ARCHIVED"`).

#### C. Discounts & Scholarships (`/api/v1/discounts`)
* `GET    /api/v1/discounts`: List configured discounts and scholarships (filterable by `category`, `discountType`, `status`).
* `GET    /api/v1/discounts/:id`: Retrieve specific discount/scholarship configuration.
* `POST   /api/v1/discounts`: Create discount or scholarship rule (Fixed Amount, Percentage, Need Based, Merit Based).
* `PUT    /api/v1/discounts/:id`: Update discount/scholarship rule.
* `POST   /api/v1/discounts/:id/apply`: Apply discount or scholarship to a student enrollment (triggers approval workflow if required).
* `PATCH  /api/v1/discounts/applications/:applicationId/approve`: Approve pending discount/scholarship application.
* `PATCH  /api/v1/discounts/:id/archive`: Soft-archive discount rule (`status: "ARCHIVED"`).

#### D. Late Fee Rules (`/api/v1/late-fee-rules`)
* `GET    /api/v1/late-fee-rules`: List late fee calculation rules (`FIXED`, `PERCENTAGE`, `PER_DAY`, grace period).
* `POST   /api/v1/late-fee-rules`: Create new late fee rule.
* `PUT    /api/v1/late-fee-rules/:id`: Update existing late fee rule.
* `PATCH  /api/v1/late-fee-rules/:id/archive`: Soft-archive late fee rule (`status: "ARCHIVED"`).

#### E. Student Invoices (`/api/v1/invoices`)
* `GET    /api/v1/invoices`: List student fee invoices (filterable by `academicSessionId`, `financialYearId`, `classId`, `enrollmentId`, `studentId`, `status`, `dueDate`).
* `GET    /api/v1/invoices/my`: Retrieve invoices for logged-in Student or Guardian.
* `GET    /api/v1/invoices/:id`: Retrieve detailed invoice including immutable line item snapshots (`feeHeadName`, `feeHeadCode`, `baseAmount`, `discountAmount`, `discountName`, `netAmount`), discounts, late fee, paid amount, and outstanding amount across the 8-state lifecycle (`DRAFT -> GENERATED -> ISSUED -> PARTIALLY_PAID -> PAID -> OVERDUE -> WAIVED -> CANCELLED`).
* `POST   /api/v1/invoices/generate`: Batch generate fee invoices for an academic session, class, and installment/term.
* `POST   /api/v1/invoices`: Create an individual or custom ad-hoc invoice for a student enrollment.
* `PATCH  /api/v1/invoices/:id/waive`: Apply a full or partial waiver to an invoice (requires mandatory `auditReason` and `approvedBy` in request payload).
* `PATCH  /api/v1/invoices/:id/cancel`: Cancel an invoice (`status: "CANCELLED"`, requires mandatory `auditReason` and `approvedBy` in request payload).

#### F. Payments & Receipts (`/api/v1/payments`, `/api/v1/receipts`)
* `GET    /api/v1/payments`: List fee payment transactions (filterable by `academicSessionId`, `financialYearId`, `studentId`, `paymentMode`, `status`, `fromDate`, `toDate`).
* `POST   /api/v1/payments`: Record a fee payment transaction (Cash, UPI, Card, Bank Transfer, Cheque, Online Gateway placeholder) supporting partial payments and allocation across multiple invoices (`status: "ACTIVE"`).
* `GET    /api/v1/payments/:id`: Retrieve specific payment transaction details and allocations.
* `POST   /api/v1/payments/:id/refund`: Initiate a full or partial refund for a completed payment transaction (requires mandatory `auditReason` and `approvedBy` in request payload).
* `POST   /api/v1/payments/:id/reverse`: Reverse a payment transaction (`status: "REVERSED"` instead of deleting payment records, requires mandatory `auditReason` and `approvedBy` in request payload).
* `GET    /api/v1/receipts`: List generated payment receipts.
* `GET    /api/v1/receipts/:receiptNumber/download`: Download printable PDF receipt for a payment transaction.
* `GET    /api/v1/receipts/:receiptNumber/verify`: Verify digital receipt authenticity via cryptographic `verificationHash` and QR code URL lookup (planning only).
* `GET    /api/v1/receipts/:receiptNumber/versions`: Retrieve immutable historical receipt versions (`ReceiptVersion`) to view receipt correction audit history.

#### G. Student Fee Ledger (`/api/v1/student-ledger`)
* `GET    /api/v1/student-ledger`: List student account balances across enrollments (filterable by `academicSessionId`, `financialYearId`, `classId`, `outstandingBalance`).
* `GET    /api/v1/student-ledger/my`: Retrieve ledger summary and transactions for logged-in Student or Guardian.
* `GET    /api/v1/student-ledger/:enrollmentId`: Retrieve complete chronological fee ledger for a student enrollment (invoices, payments, waivers, adjustments, refunds, advance balance, outstanding balance).

#### H. Financial Reports (`/api/v1/fee-reports`)
* `GET    /api/v1/fee-reports/summary`: Retrieve executive financial dashboard metrics from materialized `FinancialSummary` cache instead of calculating on every request.
* `GET    /api/v1/fee-reports/daily-collection`: Retrieve daily collection summary report grouped by payment mode and fee head.
* `GET    /api/v1/fee-reports/monthly-collection`: Retrieve monthly collection analytics report.
* `GET    /api/v1/fee-reports/outstanding`: Retrieve defaulters and outstanding fee report by class and section.
* `GET    /api/v1/fee-reports/class-summary`: Retrieve class-wise fee collection and due summary.
* `GET    /api/v1/fee-reports/student-statement/:enrollmentId`: Generate printable comprehensive financial statement for an individual student.


### 5.12. Communication & Notification System (`/api/v1/notifications`, `/api/v1/notices`, `/api/v1/templates`, `/api/v1/preferences`, `/api/v1/delivery-logs`, `/api/v1/scheduled-notifications`)

#### A. Notifications (`/api/v1/notifications`)
* `GET    /api/v1/notifications`: List current user's notifications (filterable by `readStatus`, `category`, `priority`, `isArchived`, paginated).
* `GET    /api/v1/notifications/unread-count`: Get badge count of unread notifications for current user.
* `PATCH  /api/v1/notifications/:id/read`: Mark a single notification as read (`readStatus: "READ"`).
* `PATCH  /api/v1/notifications/read-all`: Mark all unread notifications as read for current user.
* `PATCH  /api/v1/notifications/:id/archive`: Archive a notification (`isArchived: true`) so it is hidden from main feed.
* `DELETE /api/v1/notifications/:id`: Delete/soft-delete a notification from current user's feed.
* `POST   /api/v1/notifications/send`: (Admin/Teacher) Send an immediate direct notification to specified users, classes, or sections.
* `POST   /api/v1/notifications/bulk-send`: (Admin) Send bulk notifications with template variable interpolation.

#### B. Notices (`/api/v1/notices`)
* `GET    /api/v1/notices`: List published notices available to the current user (based on role/class/section audience scoping and non-expired status).
* `GET    /api/v1/notices/admin`: (Admin/Teacher) List all notices including DRAFT, EXPIRED, and ARCHIVED.
* `GET    /api/v1/notices/:id`: Retrieve detailed notice information including attachments and target audience.
* `POST   /api/v1/notices`: Create a new notice (Draft or Published) with target audience and attachments.
* `PATCH  /api/v1/notices/:id`: Update notice title, content, target audience, attachments, or expiry date.
* `PATCH  /api/v1/notices/:id/publish`: Publish a DRAFT notice (`status: "PUBLISHED"`).
* `PATCH  /api/v1/notices/:id/archive`: Archive a notice (`status: "ARCHIVED"`).
* `DELETE /api/v1/notices/:id`: Delete a notice.

#### C. Notification Templates (`/api/v1/templates`)
* `GET    /api/v1/templates`: List all notification templates (filterable by `category`, `channel`, `isActive`).
* `GET    /api/v1/templates/:code`: Retrieve template by code and locale.
* `POST   /api/v1/templates`: Create a new SMS, Email, or In-App template with variable placeholders.
* `PATCH  /api/v1/templates/:id`: Update template body, subject, channels, variables, or active status.
* `POST   /api/v1/templates/:id/preview`: Preview rendered template output given a sample JSON variables payload.

#### D. Notification Preferences (`/api/v1/preferences`)
* `GET    /api/v1/preferences/my`: Retrieve current user's category/channel opt-in and opt-out preferences.
* `PUT    /api/v1/preferences/my`: Update current user's category/channel opt-in and opt-out preferences.
* `GET    /api/v1/preferences/:userId`: (Admin) Retrieve any user's notification preferences.

#### E. Delivery Logs (`/api/v1/delivery-logs`)
* `GET    /api/v1/delivery-logs`: (Admin) List notification delivery logs (filterable by `status`, `channel`, `recipientId`, `notificationId`, `noticeId`).
* `GET    /api/v1/delivery-logs/stats`: (Admin) Retrieve aggregate delivery metrics (sent, delivered, failed counts by channel).
* `POST   /api/v1/delivery-logs/:id/retry`: (Admin) Retry a failed delivery log entry.

#### F. Scheduled Notifications (`/api/v1/scheduled-notifications`)
* `GET    /api/v1/scheduled-notifications`: (Admin) List scheduled and recurring notification jobs.
* `POST   /api/v1/scheduled-notifications`: (Admin) Schedule a future or recurring notification dispatch job.
* `PATCH  /api/v1/scheduled-notifications/:id/cancel`: (Admin) Cancel a pending scheduled notification job (`status: "CANCELLED"`).


### 5.13. Event & Holiday Calendar (`/api/v1/calendar`, `/api/v1/events`, `/api/v1/holidays`, `/api/v1/reminders`)

#### A. Unified Calendar (`/api/v1/calendar`)
* `GET    /api/v1/calendar`: Retrieve unified calendar feed combining Holidays, Events, Exams, and Homework for the requested date range.
* `GET    /api/v1/calendar/my`: Retrieve filtered personalized calendar feed for the logged-in user.
* `GET    /api/v1/calendar/summary`: Retrieve `AcademicCalendarSummary` analytics for the specified session or term (Working Days, Teaching Days, Holidays).

#### B. School Events (`/api/v1/events`)
* `GET    /api/v1/events`: List school events (filterable by `eventType`, `startDate`, `endDate`, `visibility`).
* `POST   /api/v1/events`: (Admin/Teacher) Create a new school event (Teachers can only create events for their classes).
* `GET    /api/v1/events/:id`: Retrieve detailed event information.
* `PATCH  /api/v1/events/:id`: Update event details.
* `DELETE /api/v1/events/:id`: Delete a school event.

#### C. Holidays (`/api/v1/holidays`)
* `GET    /api/v1/holidays`: List holidays for an academic session.
* `POST   /api/v1/holidays`: (Admin) Add a new holiday (supports multi-day and recurring generation).
* `GET    /api/v1/holidays/:id`: Retrieve holiday details.
* `PATCH  /api/v1/holidays/:id`: Update holiday details.
* `DELETE /api/v1/holidays/:id`: Delete a holiday.

#### D. Event Reminders (`/api/v1/reminders`)
* `GET    /api/v1/reminders`: List upcoming event reminders for the current user.
* `POST   /api/v1/reminders`: Set a personal or broadcast reminder for an event.
* `DELETE /api/v1/reminders/:id`: Cancel an event reminder.


### 5.14. Transport, Fleet & GPS Tracking (`/api/v1/vehicles`, `/api/v1/drivers`, `/api/v1/routes`, `/api/v1/stops`, `/api/v1/assignments`, `/api/v1/gps`, `/api/v1/maintenance`, `/api/v1/transport-summary`)

#### A. Fleet Vehicles (`/api/v1/vehicles`)
* `GET    /api/v1/vehicles`: List fleet vehicles (filterable by `status`, `vehicleType`, min/max capacity, and expiring insurance/fitness).
* `POST   /api/v1/vehicles`: (Super Admin / School Admin / Transport Manager) Create a new fleet vehicle with insurance and fitness certificate details.
* `GET    /api/v1/vehicles/:id`: Retrieve detailed vehicle information including active assignments and maintenance history.
* `PATCH  /api/v1/vehicles/:id`: Update vehicle details, capacity, status, or renew insurance/fitness certificates.
* `DELETE /api/v1/vehicles/:id`: Archive/retire a vehicle (blocked if active student assignments exist).

#### B. Transport Drivers (`/api/v1/drivers`)
* `GET    /api/v1/drivers`: List transport drivers (filterable by `status`, license type, verification status, and medical expiry).
* `POST   /api/v1/drivers`: Create a new driver profile with license, background verification, and emergency contact details.
* `GET    /api/v1/drivers/:id`: Retrieve driver profile and assigned vehicle/route history.
* `PATCH  /api/v1/drivers/:id`: Update driver profile, license renewal, or background verification status.
* `DELETE /api/v1/drivers/:id`: Deactivate driver profile.

#### C. Bus Routes (`/api/v1/routes`)
* `GET    /api/v1/routes`: List all bus routes with stop count, total distance, and estimated duration.
* `POST   /api/v1/routes`: Create a new route with source, destination, and ordered stop sequence (`[ { stopId, orderSequence, estimatedArrivalFromStartMinutes } ]`).
* `GET    /api/v1/routes/:id`: Retrieve route details including populated stops and assigned student roster.
* `PATCH  /api/v1/routes/:id`: Update route details or stop ordering sequence.
* `DELETE /api/v1/routes/:id`: Archive route (blocked if active assignments exist).

#### D. Bus Stops (`/api/v1/stops`)
* `GET    /api/v1/stops`: List all geocoded bus stops (filterable by status and route inclusion).
* `POST   /api/v1/stops`: Create a new bus stop with GPS latitude/longitude, pickup time, and drop time.
* `GET    /api/v1/stops/:id`: Retrieve stop details and list of assigned students.
* `PATCH  /api/v1/stops/:id`: Update stop name, GPS coordinates, or timetable.
* `DELETE /api/v1/stops/:id`: Archive bus stop.

#### E. Student Transport Assignments (`/api/v1/assignments`)
* `GET    /api/v1/assignments`: Retrieve student transport assignments (scoped by RBAC: Students/Guardians view only their own assignment; Teachers view assignments for students in their assigned classes; Admins view all).
* `POST   /api/v1/assignments`: Assign a student to a `Route`, `Stop`, and `Vehicle` for an `AcademicSession`. Validates vehicle capacity and prevents duplicate active assignments.
* `GET    /api/v1/assignments/:id`: Retrieve assignment details.
* `PATCH  /api/v1/assignments/:id`: Update assignment (change stop, vehicle, or effective dates).
* `PATCH  /api/v1/assignments/:id/cancel`: Terminate/cancel transport assignment.

#### F. GPS Telemetry & Live Tracking (`/api/v1/gps`)
* `POST   /api/v1/gps/telemetry`: Record live GPS coordinates, speed, heading, and route progress for a vehicle (ERP simulator/telemetry ingestion).
* `GET    /api/v1/gps/live`: Retrieve real-time last-known coordinates and ETA for active fleet vehicles (Students/Guardians see only their assigned vehicle).
* `GET    /api/v1/gps/history/:vehicleId`: Retrieve historical breadcrumb trail for a vehicle within a time window.

#### G. Vehicle Maintenance Logs (`/api/v1/maintenance`)
* `GET    /api/v1/maintenance`: List maintenance records (filterable by `vehicleId`, `maintenanceType`, and `status`).
* `POST   /api/v1/maintenance`: Log a new maintenance event (`SERVICE_SCHEDULE`, `FUEL_LOG`, `REPAIR`, `INSURANCE_RENEWAL`, `FITNESS_RENEWAL`).
* `GET    /api/v1/maintenance/:id`: Retrieve maintenance record details.
* `PATCH  /api/v1/maintenance/:id`: Update maintenance record status, odometer reading, or costs.
* `DELETE /api/v1/maintenance/:id`: Delete/cancel maintenance record.

#### H. Transport Summary & KPI Analytics (`/api/v1/transport-summary`)
* `GET    /api/v1/transport-summary?academicSessionId=...`: Retrieve comprehensive Transport Summary KPIs (fleet occupancy, active vehicle count, maintenance spend, route utilization).
* `POST   /api/v1/transport-summary/recalculate`: Admin action to recalculate and refresh materialized transport summary metrics.


### 5.15. Public CMS & Website Content (`/api/v1/cms`)
* `GET  /api/v1/cms/gallery/albums`: Public/Admin view photo gallery albums.
* `POST /api/v1/cms/gallery/albums`: Admin create gallery album and upload images.
* `PATCH /api/v1/cms/homepage`: Update homepage hero banners, announcement ticker, and principal message.

### 5.16. Admission Enquiries (`/api/v1/admissions`)
* `POST /api/v1/admissions/enquiries`: Public website endpoint to submit online admission inquiry.
* `GET  /api/v1/admissions/enquiries`: Admin/Receptionist paginated Kanban view of enquiries.
* `PATCH /api/v1/admissions/enquiries/:id/status`: Update inquiry pipeline status and append follow-up notes.

### 5.17. Audit System & Security Logs (`/api/v1/audit-logs`)
* `GET  /api/v1/audit-logs`: Super Admin search across immutable audit logs (filterable by actor, action code, date range, entity).
