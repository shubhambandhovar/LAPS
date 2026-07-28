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

### 5.2. Academic Sessions & Institutional Config (`/api/v1/academic-sessions`)
* `GET  /api/v1/academic-sessions`: List all academic years.
* `POST /api/v1/academic-sessions`: Create a new academic session with **configurable start and end dates**.
* `PATCH /api/v1/academic-sessions/:id/activate`: Set session as current active school session.
* `PATCH /api/v1/academic-sessions/:id/lock-promotions`: Lock/unlock end-of-term promotion wizard.

### 5.3. Classes, Sections & Subjects (`/api/v1/academics`)
* `GET  /api/v1/academics/classes`: List all classes with their sections.
* `POST /api/v1/academics/classes`: Create a class (`Pre-Primary`, `Class 1`..`Class 10`).
* `POST /api/v1/academics/classes/:classId/sections`: Add a section (`A`, `B`, `C`).
* `GET  /api/v1/academics/classes/:classId/subjects`: List subjects for a class.
* `POST /api/v1/academics/subjects`: Create/map a new subject.

### 5.4. Teaching Assignments (`/api/v1/teaching-assignments`)
* `GET  /api/v1/teaching-assignments`: List teacher assignments (filterable by session/class/teacher).
* `POST /api/v1/teaching-assignments`: Assign a teacher to a `Session + Class + Section + Subject`.
* `DELETE /api/v1/teaching-assignments/:id`: Revoke teaching assignment.

### 5.5. Student & Guardian Relationship Management (`/api/v1/students`, `/api/v1/guardians`)
* `GET  /api/v1/students`: Paginated list of students (filtered by active session/class/section).
* `POST /api/v1/students`: Enroll a new student (creates `Student`, `Guardian`, `StudentGuardian` join row, and initial `Enrollment`).
* `GET  /api/v1/students/:studentId`: Complete student dossier (profile, enrollment history, linked guardians).
* `POST /api/v1/students/:studentId/guardians`: Link a guardian to a student via `StudentGuardian` (specifying relationship type & permissions).
* `PATCH /api/v1/students/:studentId/guardians/:guardianId`: Update `StudentGuardian` relationship permissions or primary flag.
* `PATCH /api/v1/students/:studentId`: Update biographical or contact details.
* `POST /api/v1/students/:studentId/promote`: Promote student enrollment to a target class/session.
* `GET  /api/v1/guardians/:guardianId/children`: List all active child enrollments for a guardian via `StudentGuardian`.

### 5.6. Attendance Management (`/api/v1/attendance`)
* `GET  /api/v1/attendance/sheet`: Retrieve daily class roster with attendance status for a date.
* `POST /api/v1/attendance/batch`: Submit daily attendance batch for a section (scoped to Class Teacher or Admin).
* `GET  /api/v1/attendance/student/:studentId`: Retrieve monthly attendance percentage and calendar for a student.

### 5.7. Homework & Study Material (`/api/v1/homework`, `/api/v1/materials`)
* `GET  /api/v1/homework`: List homework assignments (scoped to teacher assignments, student class, or parent children).
* `POST /api/v1/homework`: Create homework assignment with optional attachment URLs.
* `POST /api/v1/homework/:homeworkId/submit`: Student submits homework attachment/remarks.
* `PATCH /api/v1/homework/submissions/:submissionId/evaluate`: Teacher grades/reviews homework submission.
* `POST /api/v1/materials`: Teacher uploads study material PDF/resource for assigned class.

### 5.8. Examinations, Marks & Report Cards (`/api/v1/exams`)
* `GET  /api/v1/exams`: List examination schedules for the current session.
* `POST /api/v1/exams`: Create an examination (`Mid-Term 2026`, `Annual Examination`).
* `POST /api/v1/exams/:examId/subjects`: Configure maximum marks and passing marks for an exam subject.
* `GET  /api/v1/exams/:examId/marks-sheet`: Get marks entry sheet for a subject/section.
* `POST /api/v1/exams/:examId/marks`: Batch save/update marks (scoped to authorized subject teacher).
* `POST /api/v1/exams/:examId/compile-results`: System calculates overall grades and ranks for a class.
* `GET  /api/v1/exams/:examId/report-cards/:studentId`: Retrieve compiled Report Card JSON and PDF download link.

### 5.9. Fee Management & Accounting (`/api/v1/fees`)
* `GET  /api/v1/fees/structures`: List configured fee structures per class/session.
* `POST /api/v1/fees/structures`: Create fee structure item.
* `GET  /api/v1/fees/student/:studentId`: Retrieve student fee dues, discounts, and payment history.
* `POST /api/v1/fees/payments`: Record offline fee payment transaction (Cash, Cheque, DD, Bank Transfer).
* `GET  /api/v1/fees/receipts/:receiptNumber`: Download/view official fee receipt PDF.
* `GET  /api/v1/fees/defaulters`: Admin report of students with overdue pending fee balances.

### 5.10. Communication & Public CMS (`/api/v1/communication`, `/api/v1/cms`)
* `GET  /api/v1/communication/notices`: List circulars and notices scoped to user audience.
* `POST /api/v1/communication/notices`: Admin create and publish circular.
* `GET  /api/v1/cms/gallery/albums`: Public/Admin view photo gallery albums.
* `POST /api/v1/cms/gallery/albums`: Admin create gallery album and upload images.
* `PATCH /api/v1/cms/homepage`: Update homepage hero banners, announcement ticker, and principal message.

### 5.11. Admission Enquiries (`/api/v1/admissions`)
* `POST /api/v1/admissions/enquiries`: Public website endpoint to submit online admission inquiry.
* `GET  /api/v1/admissions/enquiries`: Admin/Receptionist paginated Kanban view of enquiries.
* `PATCH /api/v1/admissions/enquiries/:id/status`: Update inquiry pipeline status and append follow-up notes.

### 5.12. Audit System & Security Logs (`/api/v1/audit-logs`)
* `GET  /api/v1/audit-logs`: Super Admin search across immutable audit logs (filterable by actor, action code, date range, entity).
