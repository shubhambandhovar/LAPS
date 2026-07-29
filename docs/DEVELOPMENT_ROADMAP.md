# COMPLETE DEVELOPMENT ROADMAP: LITTLE ANGELS SCHOOL

## Overview of the 20-Phase Engineering Lifecycle
The engineering roadmap progresses from core architectural foundations through domain modules, public web presentation, security hardening, automated quality assurance, and production deployment.

### Core Principle: Incremental Security Architecture
Security controls are **never postponed**. From Phase 1 through Phase 16, every domain module integrates strict HTTP headers (Helmet), environment-configurable CORS allowlists, NoSQL injection sanitization (`express-mongo-sanitize`), Zod schema validation, and RBAC middleware. Phase 17 is reserved for **final security hardening, penetration testing, and audit verification**.

---

### Phase 0 — Architecture & Product Planning (CURRENT PHASE)
* **Objective**: Define comprehensive system architecture, database schemas, RBAC models, REST API specifications, and quality strategies before writing application code.
* **Dependencies**: None.
* **Deliverables**: Complete `/docs` documentation suite (11 markdown documents).
* **Acceptance Criteria**: Architectural risks identified and mitigated; database schema solves historical promotion data loss; all CRUD/action permissions mapped.
* **Tests Required**: Architecture documentation review and schema validation.

---

### Phase 1 — Project Foundation & Modular Monolith Setup (with Core Security Layer)
* **Objective**: Initialize full-stack TypeScript workspace (Vite React frontend + Node/Express backend monolith) with structured logging, Docker Compose dev environment, Mongo connection pooling, **and foundational HTTP security middleware (Helmet, CORS allowlist, NoSQL injection sanitization, basic rate limiting)**.
* **Dependencies**: Phase 0 approval.
* **Deliverables**: `package.json` workspaces, Mongoose ODM database connection wrapper, Pino logger, foundational security middleware (`Helmet`, `cors`, `express-mongo-sanitize`, `express-rate-limit`), Vite UI shell, and `/api/v1/health` endpoint.
* **Acceptance Criteria**: Both backend API and frontend dev server boot cleanly; environment variables validated via Zod; database connects with automated index creation; health check returns `200 OK`.
* **Tests Required**: Unit test for logger/error handlers and environment schema validation; Supertest API health endpoint test.

---

### Phase 2 — Authentication, Multi-Device Sessions (`RefreshSession`) & RBAC Engine
* **Objective**: Implement secure authentication (Bcrypt/Argon2i, HTTP-Only Refresh cookies, short-lived JWT access tokens), **multi-device token rotation via the `RefreshSession` collection**, and backend permission/scope enforcement middleware.
* **Dependencies**: Phase 1.
* **Deliverables**: `User`, `RefreshSession`, `Role`, `Permission` collections; `/api/v1/auth/*` endpoints (including `/sessions` inspection and revocation); `requirePermission()` and `enforceScope()` middleware; Frontend `<ProtectedRoute />` guard.
* **Acceptance Criteria**: User login generates valid HTTP-only cookies and a `RefreshSession` row; revoking a session instantly denies access; unauthorized roles trigger HTTP `403 Forbidden`.
* **Tests Required**: Auth endpoint Supertest suite; multi-device session revocation test (`TEST-AUTH-005`); negative RBAC permission tests (`TEST-AUTH-001..004`).

---

### Phase 3 — Academic Foundation & Master Data
* **Objective**: Establish the core academic domain model and master data required by all future academic modules (`Student`, `Attendance`, `Homework`, `Timetable`, `Exam`, `Fees`). Includes CRUD, pagination, filtering, search, sorting, and validation for Academic Sessions (with configurable start/end dates and transaction-safe current session switching), configurable Classes (`Nursery` to `Class 10`), Sections, Subjects, Teacher profiles (excluding payroll/salary/leave), and foundational Teaching Assignments (`Teacher -> Academic Session -> Class -> Section -> Subject`).
* **Dependencies**: Phase 2.
* **Deliverables**:
  * Zod validation schemas & TypeScript types in `@laps/shared`.
  * `AcademicSession`, `Class`, `Section`, `Subject`, `Teacher`, and `TeachingAssignment` Mongoose models in `@laps/api`.
  * REST API endpoints: `/api/v1/academic-sessions`, `/api/v1/classes`, `/api/v1/sections`, `/api/v1/subjects`, `/api/v1/teachers`, and `/api/v1/teaching-assignments`.
  * Admin & ERP Portal management pages in `@laps/web` with search, filters, pagination, create/edit modals, confirmation dialogs, and loading/empty states.
* **Acceptance Criteria**:
  * Super Admin and School Admin can manage academic sessions, configurable classes, sections, subjects, teacher profiles, and teaching assignments.
  * Teachers can view their own profile (`READ (Self)`), view their own teaching assignments (`READ (Self)`), and read active academic sessions, classes, sections, and subjects.
  * Duplicate section, duplicate class, duplicate subject, duplicate teacher ID, and conflicting teaching assignments are rejected with structured validation errors.
* **Tests Required**: Comprehensive Vitest suite covering duplicate class/section/subject/teacher validation, assignment conflict prevention, and RBAC authorization.

---

### Phase 4 — Student, Guardian & Normalized `StudentGuardian` Profiles
* **Objective**: Build immutable `Student` and `Guardian` collections, family linking via the **normalized `StudentGuardian` join collection**, and session-scoped `Enrollment` creation.
* **Dependencies**: Phase 3.
* **Deliverables**: `Student`, `Guardian`, `StudentGuardian`, and `Enrollment` models and API endpoints; Student admission wizard; Guardian relationship selector.
* **Acceptance Criteria**: Enrolling a student generates unique `admissionNumber`, creates a `StudentGuardian` join row with primary flag and granular permissions, and creates an active `Enrollment` for the current session.
* **Tests Required**: Student enrollment integration tests; Guardian-child IDOR security tests (`TEST-AUTH-002`).

---

### Phase 5 — Curriculum, Timetable & Academic Calendar (IN PLANNING)
* **Objective**: Build academic terms (`AcademicTerm`), curriculum mapping (`ClassSubject` with period constraints), dedicated room catalog (`Room`), bell schedules (global/class/date-range scoped), periods, conflict-checked versioned weekly timetable scheduling (`Timetable` with draft/published versioning and teacher workload metrics), recurring academic calendar events, working day rules, and holiday management.
* **Dependencies**: Phase 4.
* **Deliverables**: `AcademicTerm`, `ClassSubject`, `Room`, `BellSchedule`, `TimetablePeriod`, `Timetable`, `AcademicCalendarEvent`, `WorkingDayRule`, and `Holiday` models and APIs; Curriculum mapping UI, Room directory, interactive Timetable Builder with versioning and conflict detection, Teacher Workload dashboard, and Academic Calendar/Holiday management UI.
* **Acceptance Criteria**: System maps elective/mandatory subjects per class with min/max period constraints, validates teacher assignment compatibility, detects and rejects teacher/room/section timetable conflicts (`409 Conflict`), isolates teachers to `PUBLISHED` schedules and `MY_TIMETABLE_ONLY`, calculates workload metrics, and establishes the attendance integration contract for future modules.
* **Tests Required**: Comprehensive suite covering duplicate periods, teacher conflict, room conflict, section conflict, assignment compatibility, calendar validation, RBAC scoping, academic terms, room catalog, bell schedule scoping, timetable versioning, workload computation, and recurring events (`TEST-CURRICULUM-001` to `013`).

---

### Phase 6 — Attendance & Leave Management
* **Objective**: Establish the complete Attendance & Leave Management domain for students and teachers, including daily and period-wise attendance sessions, attendance entries with historical snapshot fields and arrival delay tracking, leave approval workflows with controlled enum types, teacher correction requests, configurable auto-lock rules, attendance freeze after report-card generation, and attendance analytics with a materialized summary strategy.
* **Dependencies**: Phase 5 (requires `AcademicSession`, `PUBLISHED` `Timetable`, `TeachingAssignment`, `Enrollment`, `AcademicCalendarEvent`, `WorkingDayRule`, and `Holiday`).
* **Deliverables**:
  * **Shared Schemas & Types (`@laps/shared`)**: Zod validation schemas and TypeScript types for `Attendance` (lifecycle `DRAFT` -> `SUBMITTED` -> `LOCKED` -> `FROZEN`), `AttendanceEntry` (`attendanceSource`, historical snapshots `studentName`, `rollNumber`, `className`, `sectionName`, `lateMinutes`), `LeaveRequest` (`CASUAL`, `MEDICAL`, `EMERGENCY`, `SPORTS`, `OFFICIAL`, `OTHER`), `AttendanceCorrection`, and `AttendanceLockRule`.
  * **Backend Domain Models & APIs (`apps/api`)**: Collections `#25` to `#29`; REST endpoints under `/api/v1/attendance` and `/api/v1/leaves`; freeze and explicit admin reopen endpoints (`PATCH /api/v1/attendance/:id/freeze`, `/reopen`); RBAC scoping for Teachers (`ATTENDANCE_LEAVE_SCOPE`), School Admins, and Super Admins.
  * **Frontend UI Module (`apps/web`)**: Navigation and pages for Take Attendance (`<AttendanceSheet />`), Attendance Register, Bulk Attendance, Leave Requests, Attendance Corrections, and Attendance Analytics Dashboard.
* **Acceptance Criteria**:
  * Attendance marking dynamically resolves period, subject, teacher, and student roster from `PUBLISHED` Timetable without maintaining its own schedule.
  * Attempting to mark attendance on an official holiday or emergency closure date is blocked (`400` / `409`).
  * Teachers can only mark attendance for their assigned sections/subjects (`403 Forbidden` for unauthorized sections/subjects).
  * Lifecycle progresses `DRAFT` -> `SUBMITTED` -> `LOCKED`; post-lock modifications by Teachers require an approved `AttendanceCorrection` request.
  * Generating report cards freezes attendance (`FROZEN`); frozen sessions cannot be edited without an authorized Admin explicitly invoking `/reopen` with an audit reason.
  * Student leave approval by Class Teacher automatically updates corresponding attendance entries to `APPROVED_LEAVE` or `MEDICAL_LEAVE` (`attendanceSource: "LEAVE"`).
  * Historical snapshot fields preserve student and section names at the time of attendance.
* **Tests Required**: Verification suite `TEST-ATTENDANCE-001` through `TEST-ATTENDANCE-014` covering duplicate prevention, wrong teacher denial, archived timetable denial, holidays, emergency closures, lock & freeze enforcement, correction workflow, leave linkage, teacher leave scoping, bulk marking, register queries, RBAC scoping, analytics computation, and historical snapshots / arrival delay tracking.

---

### Phase 7 — Homework, Assignments & Study Material (IN PROGRESS / DESIGN)
* **Objective**: Build Homework assignment creation with `SCHEDULED` release, multi-attempt submission tracking (`maxAttempts`), extended attachment metadata (storing URLs only), automatic arrival delay/late calculation, reserved `plagiarismStatus` field, teacher grading with reusable `RubricTemplate` evaluation and resubmission workflows, study material distribution with version history preservation and release/expiration windows (`publishAt`, `expireAt`), notification event hooks (planning only), and materialized summary analytics.
* **Dependencies**: Phase 6 (requires `AcademicSession`, `PUBLISHED` `Timetable`, `TeachingAssignment`, `Enrollment`, `ClassSubject`).
* **Deliverables**:
  * **Shared Schemas & Types (`@laps/shared`)**: Zod validation schemas and TypeScript types for `Homework` (lifecycle `DRAFT` -> `SCHEDULED` -> `PUBLISHED` -> `CLOSED` -> `ARCHIVED`, `maxAttempts`, extended attachment metadata), `HomeworkSubmission` (`currentAttempt`, `plagiarismStatus`, `DRAFT` -> `SUBMITTED` -> `EVALUATED` -> `RETURNED`), `HomeworkEvaluation` (`rubricTemplateId`, `marks`, `grade`, `rubric`, `returnedForResubmission`), `RubricTemplate` (`isShared`), and `StudyMaterial` (`publishAt`, `expireAt`, `versionHistory`).
  * **Backend Domain Models & APIs (`apps/api`)**: Collections `#30` to `#33`; REST endpoints under `/api/v1/homework`, `/api/v1/study-material`, `/api/v1/rubrics`, and `/api/v1/homework/analytics/summary`; RBAC scoping for Teachers (`HOMEWORK_STUDY_MATERIAL_SCOPE`), Students, and Admins; notification event hooks documentation (planning only).
  * **Frontend UI Module (`apps/web`)**: Interactive pages for Homework Dashboard, Homework List & Create Wizard (with scheduled release & rubric template selector), Student Submission Page (with attempt counter), Teacher Evaluation Page (with rubric template grading), Study Material Library (with release/expire badge), and Homework Analytics Dashboard.
* **Acceptance Criteria**:
  * Homework creation dynamically validates teacher assignment against `TeachingAssignment` and `PUBLISHED` Timetable without maintaining its own class-subject mapping; supports `SCHEDULED` automatic release.
  * Students can submit only for their own active enrollments up to `maxAttempts`; late submissions are automatically flagged with arrival delay (`lateMinutes`).
  * Teacher grading references reusable `RubricTemplate` or custom rubrics, records marks/grades, and supports returning for resubmission.
  * Study material updates preserve immutable version history snapshots (`versionHistory`) and enforce `publishAt`/`expireAt` windows.
  * Homework analytics uses a Materialized Summary Cache for high-performance reporting.
* **Tests Required**: Comprehensive suite `TEST-HOMEWORK-001` to `TEST-HOMEWORK-016` covering duplicate & multi-attempt submission prevention, late submission tracking, evaluation/resubmission workflow, Teacher RBAC, Student RBAC, extended attachment metadata validation, version history preservation, materialized analytics, unpublished timetable blocking, scheduled release auto-publication, rubric template sharing, and study material windows.

---

### Phase 8 — Non-Teaching Staff & Administrative Directory
* **Objective**: Build non-teaching administrative staff profile records (`Staff` collection for Receptionist, Accountant, Librarian) and departmental access scoping.
* **Dependencies**: Phase 7.
* **Deliverables**: `Staff` model and APIs; administrative department directory.
* **Acceptance Criteria**: Admin can manage non-teaching staff profiles and assign departmental roles.
* **Tests Required**: Staff employee ID uniqueness test and departmental scope test.

---

### Phase 9 — Examination Configuration & Mark Entry
* **Objective**: Build examination schedules, subject mark allocations, and secure teacher mark entry sheets.
* **Dependencies**: Phase 5.
* **Deliverables**: `Exam`, `ExamSubject`, `Mark`, `GradeRule` models and APIs; UI `<MarkEntryTable />` with tabular numbers.
* **Acceptance Criteria**: Authorized subject teacher can input marks out of configured maximum; system prevents entries exceeding `maxMarks`.
* **Tests Required**: Mark entry authorization test (`TEST-AUTH-004`); boundary mark validation unit tests.

---

### Phase 10 — Grade Calculation, Results & Printable Report Cards
* **Objective**: Automate end-of-term grade calculation, class ranking, and printable PDF report card generation.
* **Dependencies**: Phase 9.
* **Deliverables**: `ReportCard` model and compilation engine; PDF report generator (Puppeteer / PDFKit); Report card viewer UI.
* **Acceptance Criteria**: Executing result compilation accurately maps percentage to `GradeRule` letter; parent can download clean PDF report card.
* **Tests Required**: Result compilation workflow test (`TEST-FLOW-EXAM`); grade rule threshold unit tests.

---

### Phase 11 — Fee Structure, Billing & Payment Receipts
* **Objective**: Build configurable fee structures, student fee billing, offline payment transaction ledger, and receipt PDFs.
* **Dependencies**: Phase 4.
* **Deliverables**: `FeeStructure`, `StudentFee`, `Payment`, `Receipt` models and APIs; Financial UI dashboard and receipt PDF generator.
* **Acceptance Criteria**: Staff records offline Cash payment; system updates `StudentFee.paidAmount`, transforms status to `PAID`, and issues immutable Receipt number.
* **Tests Required**: Fee payment transaction workflow test (`TEST-FLOW-FEE`); ACID transaction rollback test.

---

### Phase 12 — Communication: Circulars, Notices & Holiday Calendar
* **Objective**: Build audience-scoped notices, emergency announcements, and interactive school holiday calendar.
* **Dependencies**: Phase 2.
* **Deliverables**: `Notice`, `Event`, `Holiday` models and APIs; Circular publisher modal; Notification bell alert bar.
* **Acceptance Criteria**: Publishing a circular scoped to `"PARENTS"` makes it visible in Parent Portal but invisible in Teacher Portal.
* **Tests Required**: Circular audience filtering unit and integration tests.

---

### Phase 13 — Public School Website (SEO-Optimized Presentation)
* **Objective**: Build responsive public school website (`Home`, `About`, `Academics`, `Facilities`, `Contact`, `Admissions`) with Little Angels School branding.
* **Dependencies**: Phase 1.
* **Deliverables**: Public pages, responsive navigation bar, hero sections, Google Maps embed, SEO title/meta tags, and portal login CTA.
* **Acceptance Criteria**: Website achieves clean visual aesthetic across mobile (< 640px) and desktop; zero layout overflow; SEO meta descriptions present.
* **Tests Required**: Responsive design visual regression tests; SEO HTML tag verification.

---

### Phase 14 — Website Content Management System (CMS)
* **Objective**: Build Admin-facing dynamic CMS controls for homepage hero banners, announcements, principal message, and photo gallery albums.
* **Dependencies**: Phase 13.
* **Deliverables**: `GalleryAlbum`, `GalleryImage` models and APIs; Admin CMS UI panel; Cloudinary CDN image upload integration.
* **Acceptance Criteria**: Principal updates homepage welcome text and uploads Annual Sports Day photo gallery; public website reflects changes instantly.
* **Tests Required**: CMS content update integration test; image upload compression verification.

---

### Phase 15 — Online Admission Enquiry Pipeline
* **Objective**: Build public online admission inquiry form and Admin/Receptionist Kanban pipeline management dashboard.
* **Dependencies**: Phase 13.
* **Deliverables**: `AdmissionEnquiry` model and APIs; Public web enquiry form; Receptionist Kanban board (`New` -> `Admitted`).
* **Acceptance Criteria**: Prospective parent submits inquiry on website; lead appears instantly in Admin Kanban board; staff can log follow-up notes.
* **Tests Required**: Enquiry form validation test; status progression API test.

---

### Phase 16 — Historical Academic Promotion & Session Transition Wizard
* **Objective**: Build the end-of-year Student Promotion Wizard that creates new session enrollments while preserving historical academic records.
* **Dependencies**: Phase 10, Phase 11.
* **Deliverables**: `/api/v1/students/:id/promote` transaction endpoint; Admin UI session transition wizard.
* **Acceptance Criteria**: Promoting a student from Class 1 to Class 2 creates a new `Enrollment` for the target session without modifying or overwriting previous session attendance or marks.
* **Tests Required**: Promotion chain workflow test (`TEST-FLOW-PROMO`); historical query integrity test.

---

### Phase 17 — Final Security Hardening, Penetration Testing & Complete Audit Verification
* **Objective**: Perform comprehensive security auditing, penetration testing (NoSQL injection, CORS/CSRF boundary checks, rate-limit throttling tests), and verify that all sensitive administrative operations trigger immutable `AuditLog` writes.
* **Dependencies**: All functional modules (Phases 1-16).
* **Deliverables**: Security Penetration & Hardening Audit Report; Verified `AuditLog` coverage across all sensitive mutations; Production CORS/CSP policy tune-up.
* **Acceptance Criteria**: All automated penetration tests pass; zero IDOR or privilege escalation vulnerabilities detected; 100% of sensitive financial/academic mutations produce immutable audit log entries.
* **Tests Required**: Execution of full security test matrix (`TEST-AUTH-001..005`) and OWASP penetration test suites.

---

### Phase 18 — Complete Automated Test Suite & CI/CD Pipeline
* **Objective**: Implement automated CI/CD GitHub Actions pipeline running Vitest unit tests, Supertest integration tests, and Playwright E2E tests.
* **Dependencies**: Phase 17.
* **Deliverables**: Full test codebase coverage for all critical flows (`TEST-FLOW-HW`, `ATT`, `EXAM`, `FEE`, `PROMO`); GitHub Actions `.yml` pipeline.
* **Acceptance Criteria**: All automated tests pass in CI/CD pipeline on Linux/Windows containers; code coverage meets >= 80% on domain services.
* **Tests Required**: Execution of the complete automated testing pyramid.

---

### Phase 19 — Performance Optimization & Accessibility (a11y)
* **Objective**: Optimize frontend bundle splitting, TanStack Query caching, database indexes, and ensure WCAG 2.1 AA accessibility compliance.
* **Dependencies**: Phase 18.
* **Deliverables**: Optimized production bundles; Lighthouse report >= 90 across Performance, Accessibility, and SEO.
* **Acceptance Criteria**: All interactive form controls have accessible ARIA labels; database queries execute in < 50ms with compound indexes.
* **Tests Required**: Lighthouse automated performance and accessibility audits.

---

### Phase 20 — Production Deployment & User Handover
* **Objective**: Prepare production Docker container images, NGINX SSL reverse proxy config, automated MongoDB backup scripts, and administrator handover manuals.
* **Dependencies**: Phase 19.
* **Deliverables**: Production `docker-compose.prod.yml`, NGINX SSL config, automated daily DB backup script, and Administrator Operational Guide.
* **Acceptance Criteria**: Application deployed securely with SSL termination; database daily backups verified; zero console runtime errors in production.
* **Tests Required**: Production smoke testing and SSL certificate validation.
