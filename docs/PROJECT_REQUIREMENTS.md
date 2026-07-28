# PROJECT REQUIREMENTS: LITTLE ANGELS SCHOOL — SCHOOL ERP & PUBLIC WEBSITE

## 1. Executive Summary & Project Vision

The **Little Angels School ERP & Public Website** is a production-grade, full-stack educational management platform and web presence built for **Little Angels School**, located in **Gohad, Madhya Pradesh, India** (serving students from Pre-Primary up to Class 10). 

The platform bridges two distinct experiences into a unified architecture:
1. **Public School Website**: A modern, responsive, and trustworthy digital front-door for prospective parents, students, and visitors to explore school academics, facilities, events, and admissions.
2. **School Administration & Management System (ERP)**: A high-density, secure, multi-role operational engine designed to digitize academic administration, attendance, examination grading, fee collection, communication, and historical student records.

---

## 2. Institutional Information & Known Constraints

* **School Name**: Little Angels School
* **Location**: Gohad, Madhya Pradesh, India
* **Address**: Opposite Kisan Rice Mill, Beside ICICI Bank, Gohad, Madhya Pradesh
* **Phone**: 082239 10598
* **Academic Range**: Pre-Primary (Nursery/LKG/UKG) through Class 10
* **Data Policy**: Any institutional facts not explicitly listed above (e.g., board affiliation, principal name, student/staff counts, specific fee structures, establishment year) are treated as **configurable system variables** rather than hardcoded values.
* **Academic Calendar Configuration**: Academic session start and end dates are **100% configurable** by the administration. Standard April–March ranges may be used only as development seed data, never hard-coded in business logic.
* **Environment-Configurable URLs**: All frontend origins, API endpoints, and CDN domains are strictly **environment-configurable** via environment variables (`.env`). No production domains or origins are hard-coded in source files.
* **Single-School Scope with Extensibility**: The system is built for a single school. While `schoolId` is retained on domain collections to prevent future schema refactoring if ever scaled, no multi-tenant SaaS infrastructure (e.g., tenant routing, dynamic schema switching) is implemented.

---

## 3. Core Modules & Functional Scope

### 3.1. Public Website Module
* **Home**: Hero banner, announcements, highlights, school identity.
* **About School**: Mission, vision, institutional history (configurable), leadership.
* **Principal's Message**: Dynamic leadership message block.
* **Academics**: Curriculum structure from Pre-Primary to Class 10, academic methodology.
* **Facilities**: Overview of infrastructure (library, labs, sports, transport — configurable).
* **Activities**: Co-curricular and extracurricular programs.
* **Gallery**: Categorized albums containing institutional images and event media.
* **Events**: Upcoming school events, holidays, and celebrations.
* **Notices**: Public circulars, announcements, and downloadable PDF circulars.
* **Admissions**: Admission criteria, guidelines, and an online admission enquiry form.
* **Contact**: Address, phone numbers, location map, and direct enquiry form.
* **Portal Login**: Centralized gateway for Super Admin, School Admin/Principal, Teachers, Students, and Parents.

### 3.2. Administration Module
* **Dashboard**: System-wide KPI widgets (total students, active teachers, today's attendance summary, fee collection metrics, recent notices).
* **Academic Sessions**: Lifecycle management of academic years with **configurable start/end dates**, including session switching and promotion lock/unlock.
* **Classes & Sections**: Management of classes (`Pre-Primary`, `Class 1` to `Class 10`) and associated sections (`A`, `B`, `C`).
* **Subjects**: Subject repository mapped to specific classes and subject types (`Theory`, `Practical`, `Co-curricular`).
* **Student Management**: Full lifecycle record (personal profile, medical notes, emergency contacts, academic history, documents).
* **Parent/Guardian Management**: Family accounts linked to students via a **normalized `StudentGuardian` relationship model** (supporting relationship type, primary guardian designation, and granular permissions such as pickup and financial notice access).
* **Teacher/Staff Management**: Profile, qualifications, contact data, and employment status.
* **User Accounts & RBAC**: Account provisioning, credential management, role assignment, and granular permission enforcement.

### 3.3. Academic Management Module
* **Teaching Assignments**: Mapping teachers to authorized `Session + Class + Section + Subject` scopes.
* **Timetable**: Class-wise and teacher-wise weekly schedule matrix.
* **Student Attendance**: Daily attendance marking (`Present`, `Absent`, `Late`, `Leave`) with historical tracking and aggregate reports.
* **Homework & Assignments**: Creation, due-date setting, attachment uploads, and publishing to authorized student/parent feeds.
* **Study Materials**: Downloadable academic resources and reference documents organized by subject.
* **Examinations**: Exam definitions (e.g., *Mid-Term*, *Annual Examination*), date sheets, and subject-wise mark allocations.
* **Marks & Grades**: Authorized mark entry by subject teachers, automated grade calculation based on configurable grading rules.
* **Report Cards**: Automated report card compilation and printable PDF report generation.
* **Teacher Remarks**: Qualitative end-of-term assessment comments.
* **Student Promotion**: Session-transition promotion wizard preserving historical academic records while creating new session enrollments.

### 3.4. Financial Management Module (Fees)
* **Fee Structures**: Configurable fee heads (Tuition Fee, Examination Fee, Computer Fee, Library Fee) per class/session.
* **Student Fee Allocation**: Mapping applicable fee structures to student enrollments with customizable due dates.
* **Payment Recording**: Logging manual or offline fee collections (Cash, Cheque, DD, Bank Transfer) by authorized financial staff.
* **Receipt Generation**: Unique receipt numbering, breakdown of payments, and printable receipts.
* **Discounts & Concessions**: Configurable scholarship, sibling discount, or concession records.
* **Pending & Defaulter Tracking**: Automated tracking of overdue installments and balance summary reports.
* **Audit Trail**: Every financial transaction (payment, fee structure edit, concession application) logs an immutable audit entry.

### 3.5. Communication Module
* **Notices & Circulars**: Audience-scoped circulars (`All`, `Teachers`, `Students`, `Parents`, specific `Class/Section`).
* **Announcements**: High-priority alert banner for urgent school announcements.
* **Holiday Calendar**: Configurable holiday list integrated with attendance and event views.
* **Notification Architecture**: Event-driven notification publisher designed to support future SMS (DLT-compliant) and WhatsApp Business API adapters.

### 3.6. Admission Enquiry Module
* **Online Enquiry Submission**: Public web form capturing prospective student details, grade of interest, and parent contact.
* **Enquiry Pipeline Management**: Kanban/table tracking of enquiries (`New`, `Contacted`, `Campus Visited`, `Application Submitted`, `Admitted`, `Closed`).
* **Follow-up Logs**: Staff interaction notes and scheduled follow-up dates.

### 3.7. Website CMS Module
* **Dynamic Content Control**: Admin-facing management of homepage banners, notices, events, gallery albums, and principal message without code deployment.
* **Media Library**: Upload and management of public gallery images and downloadable circular documents.

### 3.8. Reporting & Analytics Module
* **Academic Reports**: Class-wise performance averages, pass/fail ratios, and subject-wise grade distributions.
* **Attendance Reports**: Monthly student attendance summaries, defaulter lists (< 75% attendance), and teacher attendance logs.
* **Financial Reports**: Daily/monthly fee collection summary, head-wise revenue, outstanding fee aging reports.
* **Admission Reports**: Conversion rates by inquiry source and class demand metrics.

### 3.9. Audit System
* **Immutable Security Log**: Comprehensive logging of critical administrative actions (user login/logout, password reset, fee payment, mark edit, promotion, role modification).
* **Metadata Capture**: Actor ID, IP address, user agent, timestamp, action code, target resource, before/after JSON diff.

---

## 4. User Roles & Scope Specifications

| Role | Access Level | Primary Scope | Typical Responsibilities |
| :--- | :--- | :--- | :--- |
| **Super Admin** | System-Wide Full Access | Global / Unrestricted | System configuration, RBAC management, critical security auditing, system fallback. |
| **School Admin / Principal** | Operational & Academic Admin | Entire School | Class/session setup, teacher assignments, exam approval, CMS publishing, fee structure approval. |
| **Teacher** | Scoped Academic Contributor | Assigned Classes & Subjects only | Mark daily attendance, assign homework, upload study materials, enter exam marks for assigned subjects. |
| **Student** | Self-Service Read-Only (with Submissions) | Own Record (`self`) only | View attendance, timetable, homework, exam results, report cards, fee status. |
| **Parent / Guardian** | Family-Scoped Read-Only | Linked Children via `StudentGuardian` | Monitor children's attendance, academic progress, homework, fee dues, and school notices. |
| **Future Roles** | Extensible Custom Roles | Granular Domain Scope | *Accountant* (Fee/Payment module), *Receptionist* (Admissions/Visitors), *Librarian*, *Transport Manager*. |

---

## 5. Architectural Requirement Analysis & Architectural Corrections

### 5.1. Identified Architectural & Security Risks and Corrections
1. **Multi-Device Session Management (`RefreshSession` Collection)**:
   * *Risk*: Storing a single `refreshTokenHash` directly on the `User` document limits users to a single device and prevents granular revocation or security auditing.
   * *Correction*: Implement a dedicated `RefreshSession` (AuthSession) collection in Phase 2 supporting multiple devices, hashed refresh tokens, expiration TTL, revocation status, user-agent/IP metadata, and a **logout-all** capability.
2. **Normalized Relationship Modeling (`StudentGuardian` Collection)**:
   * *Risk*: Duplicated array references (`Student.guardianIds` + `Guardian.childrenIds`) cause synchronization risks and cannot store relationship metadata.
   * *Correction*: Replace array duplication with a normalized `StudentGuardian` join collection supporting relationship type (`FATHER`, `MOTHER`, `LEGAL_GUARDIAN`), primary guardian designation, and future guardian-specific permissions (`canPickup`, `canReceiveFinancialNotices`, `canViewAcademicReports`).
3. **Incremental Security Implementation (No Security Postponement)**:
   * *Risk*: Postponing security controls to a late "Security Hardening" phase leaves development builds vulnerable and requires refactoring completed modules.
   * *Correction*: **Security controls must be implemented incrementally from Phase 1 onward**. Secure HTTP headers (Helmet), CORS, input validation (Zod), NoSQL injection sanitization (`express-mongo-sanitize`), authentication, authorization, and rate limiting are built alongside the modules that require them. Phase 17 is reserved for **final security hardening, penetration testing, and audit verification**.
4. **Configurable Academic Sessions & Configurable URLs**:
   * *Correction*: Academic sessions must never assume a hard-coded April–March cycle; start and end dates remain 100% configurable. Similarly, all frontend/backend production origins and API base URLs are strictly environment-configurable (`process.env.API_BASE_URL`, `import.meta.env.VITE_API_BASE_URL`).
5. **Single-School Focus with SaaS Readiness**:
   * *Correction*: Retain an indexed `schoolId` field on domain entities for future extensibility, but do not implement multi-tenant SaaS infrastructure (tenant subdomain routing, dynamic schema switching) in this single-school version.
