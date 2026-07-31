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

### Phase 7 — Homework, Assignments & Study Material (COMPLETED)
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

### Phase 8 — Examination, Assessment & Marks Management (COMPLETED)
* **Objective**: Build comprehensive examination management (`Exam`), conflict-checked schedule slots (`ExamSchedule`), granular assessment component breakdowns (`AssessmentComponent`), teacher marks entry sheets with strict teacher scoping (`MarksEntry`), configurable grading scales (`GradeScale`), automated result processing with CGPA/GPA and ranking (`Result`), formal re-evaluation workflows (`ReEvaluationRequest`), and materialized analytics summary cache (`ExamAnalyticsSummary`).
* **Dependencies**: Phase 7 (requires `AcademicSession`, `AcademicTerm`, `ClassSubject`, `TeachingAssignment`, `Enrollment`).
* **Deliverables**:
  * **Shared Schemas & Types (`@laps/shared`)**: Zod schemas and TypeScript types for `Exam`, `ExamSchedule`, `AssessmentComponent`, `MarksEntry`, `GradeScale`, `Result`, `ReEvaluationRequest`, and `ExamAnalyticsSummary`.
  * **Backend Domain Models & APIs (`apps/api`)**: Collections `#34` to `#41`; REST endpoints under `/api/v1/exams`, `/api/v1/exam-schedules`, `/api/v1/marks`, `/api/v1/results`, `/api/v1/grade-scales`, and `/api/v1/re-evaluations`; RBAC scoping for Teachers (`EXAM_MARKS_SCOPE`), Students/Guardians, and Admins.
  * **Frontend UI Module (`apps/web`)**: Interactive pages for Exam Dashboard, Exam Scheduler (with real-time conflict warnings), Marks Entry & Bulk Entry (with tabular spreadsheet tab-key navigation), Result Processing & Calculation Workbench, Grade Scale Configuration, Re-evaluation Portal, Exam Analytics Dashboard, and Student Result View.
* **Acceptance Criteria**:
  * Marks depend strictly on `AcademicSession -> AcademicTerm -> ClassSubject -> TeachingAssignment -> Enrollment` without duplicating academic mappings.
  * Teachers can enter and submit marks only for their active `TeachingAssignment` sections/subjects; locking prevents unauthorized modification.
  * Exam scheduling enforces real-time conflict detection across room, invigilator, and student class/section overlaps.
  * Re-evaluation workflow maintains an immutable audit trail of mark revisions.
  * Exam analytics uses a Materialized Summary Cache for high-performance reporting.
* **Tests Required**: Verification suite `TEST-EXAM-001` to `TEST-EXAM-018` covering exam creation, conflict detection, teacher scoping, draft/submit/lock transitions, grace marks, automated calculation, result publication, re-evaluation audit trails, and materialized analytics.

---

### Phase 9 — Report Cards, Academic Transcripts & Promotion Management (COMPLETED)
* **Objective**: Automate end-of-term printable report card generation (`ReportCard`), customizable report card branding and signatures (`ReportCardTemplate`), audit version history on re-generation (`ReportCardVersion`), and end-of-term student promotion decisions (`PromotionDecision`).
* **Dependencies**: Phase 8.
* **Deliverables**:
  * **Shared Schemas & Types (`@laps/shared`)**: Zod schemas and TypeScript types for `ReportCard`, `ReportCardTemplate`, `ReportCardVersion`, and `PromotionDecision`.
  * **Backend Domain Models & APIs (`apps/api`)**: Collections `#42` to `#45`; REST endpoints under `/api/v1/report-cards`, `/api/v1/report-card-templates`, and `/api/v1/promotions`; RBAC scoping for Teachers (`REPORT_CARD_PROMOTION_SCOPE`), Students/Guardians, and Admins.
  * **ERP Web UI (`apps/web`)**: Report Card Dashboard (`/erp/report-cards/dashboard`), Report Card Template Builder (`/erp/report-cards/templates`), Generate & Publish Report Cards (`/erp/report-cards/generate`), Promotion Management (`/erp/promotions`), Student Report Card View (`/erp/report-cards/my-reports`), and PDF preview modal.
* **Acceptance Criteria**:
  * Report Cards strictly depend on `AcademicSession -> AcademicTerm -> Enrollment -> Exam -> Assessment Components -> Marks -> Grade Scale -> Attendance Summary` without duplicating marks or attendance records.
  * Custom branding (logo, headers, footers) and signatures (Principal, Class Teacher) configure dynamically via `ReportCardTemplate`.
  * Re-generating a report card increments `versionNumber` and stores an immutable audit snapshot in `ReportCardVersion`.
  * Promotion recommendation engine evaluates pass/fail status and attendance percentage to recommend `PROMOTED`, `PROMOTED_CONDITIONALLY`, or `DETAINED`.
  * Students and Guardians can access only their own published report cards (`GET /api/v1/report-cards/my`).
* **Tests Required**: Verification suite `TEST-RC-001` to `TEST-RC-014` covering template creation, validation, draft generation, data accuracy, versioning, remarks, bulk publication, student retrieval, RBAC isolation, promotion evaluation, promotion approval, teacher class scoping, PDF download, and archiving.

---

### Phase 10 — Fee Management & Finance (COMPLETED)
* **Objective**: Design and build comprehensive Fee Management & Finance module covering optional Financial Years (`FinancialYear`), Fee Heads (`FeeHead`), Fee Structures (`FeeStructure`), Discounts & Scholarships (`FeeDiscount`), Late Fee Rules (`LateFeeRule`), 8-state Invoices (`Invoice`), Payments supporting reversals (`Payment`), printable PDF Receipts with reserved verification fields (`Receipt`), immutable Receipt Versions (`ReceiptVersion`), Student Fee Ledger (`StudentFeeLedger`), and Materialized Financial Summary Cache (`FinancialSummary`) without duplicating student or enrollment data.
* **Dependencies**: Phase 9 (requires `AcademicSession`, `Enrollment`, `Student`, `Class`).
* **Deliverables**:
  * **Shared Schemas & Types (`@laps/shared`)**: Zod schemas and TypeScript types for `FinancialYear`, `FeeHead`, `FeeStructure`, `FeeDiscount`, `LateFeeRule`, `Invoice`, `Payment`, `Receipt`, `ReceiptVersion`, `StudentFeeLedger`, and `FinancialSummary`.
  * **Backend Domain Models & APIs (`apps/api`)**: Collections `#46` to `#56`; REST endpoints under `/api/v1/fee-heads`, `/api/v1/fee-structures`, `/api/v1/discounts`, `/api/v1/late-fee-rules`, `/api/v1/invoices`, `/api/v1/payments`, `/api/v1/receipts`, `/api/v1/student-ledger`, and `/api/v1/fee-reports`; RBAC scoping (`FEE_FINANCE_SCOPE`).
  * **ERP Web UI (`apps/web`)**: Interactive pages for Fee Dashboard, Fee Heads & Structures Builder, Discounts & Scholarships, Late Fee Rules, Invoice Management, Payment Collection Desk & Receipts, Student Fee Ledger, and Financial Reports.
* **Acceptance Criteria**:
  * Fee billing strictly depends on `AcademicSession -> Enrollment -> Student -> Class` without duplicating student or enrollment data, supporting an optional `FinancialYear` reference.
  * Single-school architecture is preserved (zero `schoolId` fields across collections).
  * Invoices enforce an 8-state lifecycle (`DRAFT -> GENERATED -> ISSUED -> PARTIALLY_PAID -> PAID -> OVERDUE -> WAIVED -> CANCELLED`) and snapshot line items (`feeHeadName`, `feeHeadCode`, `baseAmount`, `discountAmount`, `discountName`, `netAmount`) so historical invoices remain unchanged even if fee structures are modified later.
  * Payments support `ACTIVE` and `REVERSED` operational statuses instead of deleting payment records.
  * Refunds, payment reversals, invoice waivers, and invoice cancellations require mandatory `auditReason` and `approvedBy` metadata.
  * Receipts link 1-to-1 with Payment transactions, reserve `verificationHash` and `qrCodeUrl` for digital verification, and generate immutable `ReceiptVersion` snapshots on correction.
  * StudentFeeLedger provides a chronological double-entry audit trail across invoices, payments, waivers, adjustments, and refunds.
  * Financial reporting utilizes a materialized `FinancialSummary` cache for dashboards and reports instead of calculating on every request.
* **Tests Required**: Verification suite `TEST-FEE-001` to `TEST-FEE-015` covering fee head creation, fee structure calculations, discount rules, late fee rules, invoice generation & line item snapshots, discount application & approval, full payment recording & receipt verification fields, partial payment handling, multi-invoice allocation, duplicate payment prevention, late fee calculation, refund/reversal workflow & receipt versioning, waiver/cancellation audit metadata & materialized summary cache, Student/Guardian RBAC isolation, and soft-archiving.

---

### Phase 11 — Communication & Notification System (IN PROGRESS / PLANNING)
* **Objective**: Design and build a comprehensive, multi-channel Communication & Notification System covering individual user notifications (`Notification`), audience-scoped school notices & circulars (`Notice`), localization-ready dynamic templates (`NotificationTemplate`), delivery telemetry (`DeliveryLog`), user opt-in/opt-out preferences (`NotificationPreference`), and scheduled/recurring broadcast jobs (`ScheduledNotification`) without duplicating ERP data.
* **Dependencies**: Phase 10 (integrates with Authentication, Attendance, Homework, Examinations, Report Cards, and Fee Management).
* **Deliverables**:
  * **Shared Schemas & Types (`@laps/shared`)**: Zod schemas and TypeScript types for `Notification`, `Notice`, `NotificationTemplate`, `DeliveryLog`, `NotificationPreference`, and `ScheduledNotification`.
  * **Backend Domain Models & APIs (`apps/api`)**: Collections `#57` to `#62`; REST endpoints under `/api/v1/notifications`, `/api/v1/notices`, `/api/v1/templates`, `/api/v1/preferences`, `/api/v1/delivery-logs`, and `/api/v1/scheduled-notifications`; RBAC scoping for Teachers (`enforceTeacherNoticeScope`), Students/Guardians, and Admins.
  * **ERP Web UI (`apps/web`)**: Notification Center (`/erp/communication/notifications`), Notice Board (`/erp/communication/notices`), Notice Manager (`/erp/communication/notices/manage`), Template Manager (`/erp/communication/templates`), Delivery Dashboard (`/erp/communication/delivery-logs`), Scheduled Notifications (`/erp/communication/scheduled`), and Notification Preferences (`/erp/communication/preferences`).
* **Acceptance Criteria**:
  * Notifications and notices consume events from Auth, Attendance, Homework, Exams, Report Cards, and Fees via standardized reference pointers (`referenceId`, `referenceType`) without duplicating domain data.
  * Single-school architecture is preserved (zero `schoolId` fields across collections).
  * Templates support Mustache/Handlebars variable interpolation (`{{studentName}}`, `{{dueDate}}`) and preview rendering (`POST /api/v1/templates/:id/preview`).
  * User preferences enforce opt-in / opt-out controls across 7 categories (`ATTENDANCE`, `HOMEWORK`, `EXAM`, `RESULT`, `FEE`, `GENERAL`, `SYSTEM`) and 3 channels (`IN_APP`, `EMAIL`, `SMS`).
  * Notice queries automatically filter by user role and class/section membership, excluding expired notices (`expiryDate < now`).
  * DeliveryLog tracks delivery attempts, retry counts, and failure reasons across channels without external third-party SDK dependencies (local logging/placeholder transport in Phase 11).
  * Teachers can only broadcast notices or send notifications to students and guardians in their assigned classes/sections.
* **Tests Required**: Verification suite `TEST-COMM-001` to `TEST-COMM-015` covering template creation, variable interpolation preview, notice draft/publish lifecycle, role & class audience scoping, teacher RBAC assignment scoping, immediate direct notifications, bulk notifications with template interpolation, read badge count tracking, mark-all-read & archiving, user preference opt-out enforcement, scheduled notification queue creation, scheduler execution, job cancellation, delivery log failure retry handling, and self-service RBAC isolation.

---

### Phase 12 — Event & Holiday Calendar (COMPLETED & VERIFIED)
* **Objective**: Design and build a comprehensive Event & Holiday Calendar system providing a unified view of holidays, school events, exams, and homework deadlines. Enable recurring holidays, event reminders, and attendance block integration.
* **Dependencies**: Phase 11.
* **Deliverables**:
  * **Shared Schemas & Types (`@laps/shared`)**: Zod schemas and TypeScript types for `Holiday`, `SchoolEvent`, `CalendarEvent`, `AcademicCalendarSummary`, and `EventReminder`.
  * **Backend Domain Models & APIs (`apps/api`)**: Collections `#63` to `#67`; REST endpoints under `/api/v1/calendar`, `/api/v1/events`, `/api/v1/holidays`, and `/api/v1/reminders`; strict RBAC scoping for Teachers and audience-aware event visibility.
  * **ERP Web UI (`apps/web`)**: Calendar Dashboard (`/erp/calendar/dashboard`), Holiday Management (`/erp/calendar/holidays`), Event Management (`/erp/calendar/events`), Calendar Analytics (`/erp/calendar/analytics`), and Event Reminders (`/erp/calendar/reminders`).
* **Acceptance Criteria**:
  * The unified calendar feed seamlessly aggregates holidays, events, exams, and homework.
  * Role-based visibility ensures students only see events published for their role or enrolled classes.
  * Holiday scheduling automatically blocks attendance marking for affected days.
  * Teachers can only create events for their assigned classes.
* **Tests Required**: Verification suite `TEST-CAL-001` to `TEST-CAL-010` covering holiday creation, overlap prevention, school event visibility scoping, teacher class scoping, calendar feed filtering, reminders, recurring holiday generation, academic term calendar summary calculations, attendance blocks, and cross-module references.
---

### Phase 13 — Transport, Fleet & GPS Tracking Module (IN PROGRESS / PLANNING)
* **Objective**: Design and build a comprehensive Transport, Fleet & GPS Tracking system supporting fleet vehicle management, driver profile & license compliance, geocoded bus route & stop sequencing, student transport assignments, simulated live GPS telemetry, vehicle maintenance logs, and transport KPI summary analytics.
* **Dependencies**: Phase 12.
* **Deliverables**:
  * **Shared Schemas & Types (`@laps/shared`)**: Zod schemas and TypeScript types for `Vehicle`, `Driver`, `Route`, `Stop`, `StudentTransportAssignment`, `GpsLocation`, `MaintenanceRecord`, and `TransportSummary`.
  * **Backend Domain Models & APIs (`apps/api`)**: Collections `#74` to `#81`; REST endpoints under `/api/v1/vehicles`, `/api/v1/drivers`, `/api/v1/routes`, `/api/v1/stops`, `/api/v1/assignments`, `/api/v1/gps`, `/api/v1/maintenance`, and `/api/v1/transport-summary`; strict RBAC scoping for drivers, teachers, students, and guardians.
  * **ERP Web UI (`apps/web`)**: Transport Dashboard (`/erp/transport/dashboard`), Vehicle Management (`/erp/transport/vehicles`), Driver Management (`/erp/transport/drivers`), Route Builder (`/erp/transport/routes`), Stop Management (`/erp/transport/stops`), Assignment Management (`/erp/transport/assignments`), GPS Dashboard (`/erp/transport/gps`), Maintenance Dashboard (`/erp/transport/maintenance`), and Transport Analytics (`/erp/transport/analytics`).
* **Acceptance Criteria**:
  * Complete lifecycle management for vehicles, drivers, routes, stops, and student assignments.
  * Vehicle capacity validation prevents over-assignment (`409 Conflict`).
  * Self-service telemetry ingestion and live tracking coordinates without any third-party GPS or mapping dependency.
  * Role-based isolation ensures students/guardians see only their assigned bus location and ETA.
* **Tests Required**: Verification suite `TEST-TRN-001` to `TEST-TRN-010` covering vehicle/driver/route/stop creation, assignment capacity checks, duplicate assignment prevention, maintenance scheduling, GPS telemetry ingestion & ETA retrieval, teacher bus duty scoping, student/guardian isolation, and transport analytics KPI calculation.

---

### Phase 14 — Public School Website (SEO-Optimized Presentation)
* **Objective**: Build responsive public school website (`Home`, `About`, `Academics`, `Facilities`, `Contact`, `Admissions`) with Little Angels School branding.
* **Dependencies**: Phase 1.
* **Deliverables**: Public pages, responsive navigation bar, hero sections, Google Maps embed, SEO title/meta tags, and portal login CTA.
* **Acceptance Criteria**: Website achieves clean visual aesthetic across mobile (< 640px) and desktop; zero layout overflow; SEO meta descriptions present.
* **Tests Required**: Responsive design visual regression tests; SEO HTML tag verification.

---

### Phase 15 — Website Content Management System (CMS)
* **Objective**: Build Admin-facing dynamic CMS controls for homepage hero banners, announcements, principal message, and photo gallery albums.
* **Dependencies**: Phase 14.
* **Deliverables**: `GalleryAlbum`, `GalleryImage` models and APIs; Admin CMS UI panel; Cloudinary CDN image upload integration.
* **Acceptance Criteria**: Principal updates homepage welcome text and uploads Annual Sports Day photo gallery; public website reflects changes instantly.
* **Tests Required**: CMS content update integration test; image upload compression verification.

---

### Phase 16 — Online Admission Enquiry Pipeline
* **Objective**: Build public online admission inquiry form and Admin/Receptionist Kanban pipeline management dashboard.
* **Dependencies**: Phase 14.
* **Deliverables**: `AdmissionEnquiry` model and APIs; Public web enquiry form; Receptionist Kanban board (`New` -> `Admitted`).
* **Acceptance Criteria**: Prospective parent submits inquiry on website; lead appears instantly in Admin Kanban board; staff can log follow-up notes.
* **Tests Required**: Enquiry form validation test; status progression API test.

---

### Phase 17 — Historical Academic Promotion & Session Transition Wizard
* **Objective**: Build the end-of-year Student Promotion Wizard that creates new session enrollments while preserving historical academic records.
* **Dependencies**: Phase 10, Phase 11.
* **Deliverables**: `/api/v1/students/:id/promote` transaction endpoint; Admin UI session transition wizard.
* **Acceptance Criteria**: Promoting a student from Class 1 to Class 2 creates a new `Enrollment` for the target session without modifying or overwriting previous session attendance or marks.
* **Tests Required**: Promotion chain workflow test (`TEST-FLOW-PROMO`); historical query integrity test.

---


### Phase 18 — Reports & Analytics
* **Objective**: Design a comprehensive Reports & Analytics module consuming data from all existing ERP modules.
* **Dependencies**: All preceding functional modules (Phases 1-17).
* **Deliverables**: Executive Dashboard, Academic, Attendance, Fee, HR, Library, Inventory, Transport, Admission, and Communication reports. Export support for PDF/Excel/CSV, and Scheduled Reports via email.
* **Acceptance Criteria**: Reports generate accurately without duplicating business logic. Scheduled reports execute reliably via cron jobs. RBAC is enforced strictly for report access.
* **Tests Required**: Report generation unit tests, large dataset aggregation performance tests, and RBAC isolation tests.

---

### Phase 19 — Final Security Hardening, Penetration Testing & Complete Audit Verification
* **Objective**: Perform comprehensive security auditing, penetration testing (NoSQL injection, CORS/CSRF boundary checks, rate-limit throttling tests), and verify that all sensitive administrative operations trigger immutable `AuditLog` writes.
* **Dependencies**: All functional modules (Phases 1-17).
* **Deliverables**: Security Penetration & Hardening Audit Report; Verified `AuditLog` coverage across all sensitive mutations; Production CORS/CSP policy tune-up.
* **Acceptance Criteria**: All automated penetration tests pass; zero IDOR or privilege escalation vulnerabilities detected; 100% of sensitive financial/academic mutations produce immutable audit log entries.
* **Tests Required**: Execution of full security test matrix (`TEST-AUTH-001..005`) and OWASP penetration test suites.

---

### Phase 20 — Complete Automated Test Suite & CI/CD Pipeline
* **Objective**: Implement automated CI/CD GitHub Actions pipeline running Vitest unit tests, Supertest integration tests, and Playwright E2E tests.
* **Dependencies**: Phase 19.
* **Deliverables**: Full test codebase coverage for all critical flows (`TEST-FLOW-HW`, `ATT`, `EXAM`, `FEE`, `PROMO`); GitHub Actions `.yml` pipeline.
* **Acceptance Criteria**: All automated tests pass in CI/CD pipeline on Linux/Windows containers; code coverage meets >= 80% on domain services.
* **Tests Required**: Execution of the complete automated testing pyramid.

---

### Phase 21 — Performance Optimization & Accessibility (a11y)
* **Objective**: Optimize frontend bundle splitting, TanStack Query caching, database indexes, and ensure WCAG 2.1 AA accessibility compliance.
* **Dependencies**: Phase 20.
* **Deliverables**: Optimized production bundles; Lighthouse report >= 90 across Performance, Accessibility, and SEO.
* **Acceptance Criteria**: All interactive form controls have accessible ARIA labels; database queries execute in < 50ms with compound indexes.
* **Tests Required**: Lighthouse automated performance and accessibility audits.

---

### Phase 22 — Production Deployment & User Handover
* **Objective**: Prepare production Docker container images, NGINX SSL reverse proxy config, automated MongoDB backup scripts, and administrator handover manuals.
* **Dependencies**: Phase 21.
* **Deliverables**: Production `docker-compose.prod.yml`, NGINX SSL config, automated daily DB backup script, and Administrator Operational Guide.
* **Acceptance Criteria**: Application deployed securely with SSL termination; database daily backups verified; zero console runtime errors in production.
* **Tests Required**: Production smoke testing and SSL certificate validation.
