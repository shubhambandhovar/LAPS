# FRONTEND ARCHITECTURE: LITTLE ANGELS SCHOOL — SCHOOL ERP & PUBLIC WEBSITE

## 1. Core Structural Organization (Vite + React + TypeScript)
The frontend is built as a unified Single-Page Application (SPA) using **Vite**, **React 18+**, and **TypeScript**. It houses two visual layouts within a cohesive route tree:
1. **Public Website Layout**: SEO-optimized, responsive marketing and informational pages.
2. **ERP Portal AppLayout**: High-density SaaS administration dashboard with collapsible sidebar, top navigation bar, breadcrumb trail, and role-based views.

```
src/
├── assets/                 # Static branding, logos, default placeholder graphics
├── components/             # Reusable UI Design System & generic building blocks
│   ├── ui/                 # Atomic design tokens (Button, Card, Modal, Badge, Toast)
│   ├── form/               # Zod-integrated React Hook Form inputs (Input, Select, DatePicker)
│   ├── table/              # Server-driven DataTable with sorting, filtering, and pagination
│   └── feedback/           # Skeletons, empty states, error boundaries, spinners
├── layouts/                # Master UI Layout wrappers
│   ├── PublicLayout.tsx    # Header, Navigation Navbar, Content Outlet, Footer
│   └── ERPLayout.tsx       # Sidebar, Topbar, Session Selector, Breadcrumbs, Content Outlet
├── lib/                    # API client, HTTP interceptors, utils, constants
│   ├── api.ts              # Axios / Fetch client with environment-configurable base URL & auto-refresh
│   └── queryClient.ts      # TanStack Query queryClient config and defaults
├── modules/                # Feature modules (Domain-driven component grouping)
│   ├── public/             # Home, About, Academics, Facilities, Contact, AdmissionForm
│   ├── auth/               # Login, ForgotPassword, ResetPassword, Profile, MultiDeviceSessions
│   ├── admin/              # Dashboard, Classes, Teachers, Students, StudentGuardian, FeeStructures, CMS
│   ├── teacher/            # AttendanceSheet, MarkEntryTable, HomeworkWizard
│   ├── student/            # StudentDashboard, HomeworkFeed, MyAttendance, MyReportCard
│   └── guardian/           # GuardianDashboard, ChildSelector (via StudentGuardian), FeeReceiptViewer
├── router/                 # React Router v6+ route configuration & routing guards
│   ├── index.tsx           # Router tree definition
│   └── ProtectedRoute.tsx  # RBAC Guard & Session Authenticator
└── store/                  # Client UI state (Auth session context, Theme, Sidebar state)
```

---

## 2. Router Tree & Role-Based Guard Architecture

```mermaid
graph TD
    ROOT["/ (Root Router)"] --> PUB["Public Website Layout"]
    ROOT --> AUTH["/login (Auth Page)"]
    ROOT --> PORTAL["/portal (ProtectedRoute Guard)"]

    PUB --> P_HOME["/ (Home)"]
    PUB --> P_ABOUT["/about"]
    PUB --> P_ACAD["/academics"]
    PUB --> P_ADM["/admissions/enquiry"]
    PUB --> P_CONT["/contact"]

    PORTAL --> ADMIN["/portal/admin/*<br/>(Guard: SUPER_ADMIN, SCHOOL_ADMIN)"]
    PORTAL --> TCH["/portal/teacher/*<br/>(Guard: TEACHER)"]
    PORTAL --> STU["/portal/student/*<br/>(Guard: STUDENT)"]
    PORTAL --> PAR["/portal/parent/*<br/>(Guard: GUARDIAN)"]
```

### 2.1. Guard Implementation Strategy (`<ProtectedRoute />`)
```tsx
// Role-aware routing guard preventing unauthorized client navigation
interface ProtectedRouteProps {
  allowedRoles: Array<'SUPER_ADMIN' | 'SCHOOL_ADMIN' | 'TEACHER' | 'STUDENT' | 'GUARDIAN'>;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <FullPageSkeletonLoader />;
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.roleName)) {
    return <Navigate to="/portal/unauthorized" replace />;
  }

  return <ERPLayout />;
};
```

---

## 3. Environment-Configurable API Layer & Security Client (`lib/api.ts`)

To ensure clean multi-environment portability without hard-coded production URLs, the Axios/Fetch client is configured using Vite environment variables:

```typescript
// src/lib/api.ts
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1',
  withCredentials: true, // Required for sending HTTP-Only RefreshToken cookies
  headers: {
    'Content-Type': 'application/json',
  },
});
```

* **Incremental Security in Frontend Client**: From Phase 1 onwards, `withCredentials: true` ensures secure HTTP-only refresh cookies are sent automatically. Axios interceptors detect `401 AUTH_TOKEN_EXPIRED` responses and seamlessly execute a refresh token rotation request before retrying failed requests.

---

## 4. State Management Architecture

The application strictly separates **Server State** from **Client UI State**, eliminating the anti-pattern of caching API responses in Redux or Zustand.

```mermaid
graph LR
    API[Backend REST API] <--> TSQ[TanStack Query v5<br/>Server State & Cache]
    TSQ <--> COMP[React UI Components]
    ZUS[React Context / Zustand<br/>Client UI State] <--> COMP
```

### 4.1. Server State Management: TanStack Query v5
* **Purpose**: Manages all asynchronous API data, caching, background refetching, pagination, and optimistic mutations.
* **Query Key Factories**: Standardized factories ensure deterministic cache invalidation after mutations:
  ```ts
  export const attendanceKeys = {
    all: ['attendance'] as const,
    list: (filters: Record<string, unknown>) => [...attendanceKeys.all, 'list', filters] as const,
    summary: (studentId: string, session: string) => [...attendanceKeys.all, 'summary', studentId, session] as const,
  };
  ```
* **Stale Time Policy**:
  * Static dropdowns (Classes, Sections, Fee Heads): `staleTime: 24 * 60 * 60 * 1000` (24 hours).
  * Dynamic transactional data (Attendance, Fee payments): `staleTime: 5 * 60 * 1000` (5 minutes).

### 4.2. Client UI State Management: React Context / Zustand
* **Purpose**: Manages purely client-side UI preferences that have no database equivalent:
  * Active Authentication Session (`user`, `tokenExpiry`, `activeAcademicSession`).
  * ERP Navigation Sidebar Collapse State (`isSidebarCollapsed`).
  * Theme preference (`"light" | "dark" | "system"`).
  * Active Child Selection for Parent Portal (`selectedChildId` loaded from `StudentGuardian` relationships).

### 4.3. Form State & Schema Validation: React Hook Form + Zod
* Every input form (Attendance batch marking, Mark entry table, Online admission inquiry) uses **React Hook Form** wrapped with **Zod** schema resolvers.
* Guarantees zero unnecessary re-renders during high-speed typing in marks sheets.

---

## 5. UI Layout Architecture: Public Layout vs. ERP SaaS Layout

### 5.1. Public Website Layout (`<PublicLayout />`)
* **Header**: Top announcement bar (phone number, admissions status) + Sticky navigation bar with Little Angels School emblem.
* **Navigation Links**: `Home`, `About`, `Academics`, `Facilities`, `Events`, `Notices`, `Admissions`, `Contact`, and an emphasized `Portal Login` call-to-action button.
* **Footer**: Institutional contact info, Google Maps embed link, social media links, mandatory privacy links, and copyright text.

### 5.2. ERP SaaS Layout (`<ERPLayout />`)
* **Responsive Collapsible Sidebar**:
  * Displays school brand and user role badge at the top.
  * Organizes navigation into collapsible domain groups: *Academic*, *Attendance*, *Examinations*, *Finance*, *Communication*, *Administration*, and *Account Settings* (including Multi-Device Sessions).
    * **Academic Domain (Phase 5)**: Includes *Academic Terms* (`/erp/academic/terms`), *Curriculum Mapping* (`/erp/academic/curriculum`), *Room Directory* (`/erp/academic/rooms`), *Bell Schedules* (`/erp/academic/bell-schedules`), *Period Management* (`/erp/academic/periods`), *Timetable Builder* (`/erp/academic/timetables` — interactive matrix with draft/published versioning, conflict detection, and future drag-and-drop readiness), *Teacher Workload Dashboard* (`/erp/academic/workload`), and *Academic Calendar & Holidays* (`/erp/academic/calendar`).
    * **Homework & Study Material Domain (Phase 7)**: Includes *Homework Dashboard* (`/erp/homework/dashboard` — quick summary cards for pending, submitted, late, and evaluated assignments across classes/teachers), *Homework List & Create* (`/erp/homework/list`, `/erp/homework/create` — assignment list with rich filter drawer and creation wizard supporting `SCHEDULED` release, multi-attempt limits, and consuming `PUBLISHED` timetable slots and teacher assignments), *Student Submission Page* (`/erp/homework/submissions/:homeworkId` — multi-attachment URL submission form with attempt counter and automatic late badge calculation), *Teacher Evaluation Page* (`/erp/homework/evaluation/:homeworkId` — grading queue with reusable `RubricTemplate` scoring, marks/grade entry, and return for resubmission), *Rubric Templates Management* (`/erp/homework/rubrics` — CRUD for reusable teacher and shared departmental grading rubrics), *Study Material Library* (`/erp/study-materials` — searchable resource catalog for notes, PDFs, presentations, videos, and reference links with release/expire window badges and version history modal), and *Homework Analytics* (`/erp/homework/analytics` — submission %, pending %, late %, and average marks across classes and teachers using Materialized Summary Cache).
    * **Examination, Assessment & Marks Management Domain (Phase 8)**: Includes *Exam Dashboard* (`/erp/exams/dashboard` — quick summary cards for active exams, scheduled slots, marks submission status, and pass percentage overview), *Exam Scheduler* (`/erp/exams/scheduler` — interactive timetable creator with room/invigilator assignment and real-time conflict detection warnings), *Marks Entry & Bulk Entry* (`/erp/exams/marks-entry` — teacher tabular spreadsheet interface for fast tab-key marks entry across Theory/Practical/Project assessment components with automatic absent/medical flags, grade calculation preview, and revision audit trail), *Result Processing & Calculation Workbench* (`/erp/exams/results-processing` — admin workbench to trigger automated CGPA/GPA calculation, review pass/fail/compartment statistics, apply grace marks rules, lock marks, and publish results), *Grade Scale Configuration* (`/erp/exams/grade-scales` — custom grade scale builder with percentage intervals and grade point mapping), *Re-evaluation Portal* (`/erp/exams/re-evaluations` — workflow interface for student re-evaluation requests, admin scrutiny review, and teacher mark revisions), *Exam Analytics* (`/erp/exams/analytics` — subject averages, class pass percentage, teacher performance comparison, and top performers from materialized cache), and *Student Result View* (`/erp/exams/my-results` — student/parent published result card with subject marks breakdown and re-evaluation request modal).
    * **Report Cards & Promotion Management Domain (Phase 9)**: Includes *Report Card Dashboard* (`/erp/report-cards/dashboard` — executive metrics for report card generation, publishing status, and promotion distribution across classes), *Report Card Template Builder* (`/erp/report-cards/templates` — visual customization tool for school logo, header/footer branding, signature blocks, and visible sections), *Generate & Publish Report Cards* (`/erp/report-cards/generate` — workbench to generate draft report cards, preview layouts, append teacher/principal remarks, and publish in bulk), *Promotion Management* (`/erp/promotions` — end-of-term promotion evaluation table with automated recommendations for `PROMOTED`, `PROMOTED_CONDITIONALLY`, and `DETAINED`), *Student Report Card View* (`/erp/report-cards/my-reports` — student/parent view of published report cards with printable PDF download button), and *PDF Report Preview* (embedded interactive preview modal).
    * **Fee Management & Finance Domain (Phase 10)**: Includes *Fee Dashboard* (`/erp/fees/dashboard` — executive financial metrics for daily/monthly collections, total invoiced, outstanding balances, and defaulter statistics), *Fee Heads & Structures* (`/erp/fees/heads`, `/erp/fees/structures` — master catalog for charge heads and session/class-scoped fee structure builder with installment breakdown and due date scheduling), *Discounts & Scholarships* (`/erp/fees/discounts` — configuration of fixed/percentage discount rules, need/merit scholarship definitions, and student discount approval workflow), *Late Fee Rules* (`/erp/fees/late-rules` — configuration of per-day, percentage, and fixed late fee calculation rules with grace period settings), *Invoice Management* (`/erp/fees/invoices` — invoice generation workbench, individual invoice view, waiver application, and cancellation), *Payment Collection & Receipts* (`/erp/fees/payments`, `/erp/fees/receipts` — payment collection desk supporting Cash, UPI, Card, Bank Transfer, Cheque, partial payments, multiple invoice allocations, receipt printing, and refund workflow), *Student Fee Ledger* (`/erp/fees/student-ledger` — comprehensive financial ledger per student enrollment showing chronological invoices, payments, waivers, adjustments, refunds, advance balances, and outstanding dues), and *Financial Reports* (`/erp/fees/reports` — daily collection summary, monthly collection analytics, class-wise fee summary, defaulter list, and printable individual student statements).
    * **Communication & Notification System Domain (Phase 11)**: Includes *Notification Center* (`/erp/communication/notifications` — centralized notification feed with read/unread filtering, priority badges, category filters, mark-all-read action, and archive management), *Notice Board* (`/erp/communication/notices` — campus notice board displaying published circulars, announcements, and events scoped by role, class, and section with attachment download previews), *Notice Manager* (`/erp/communication/notices/manage` — Admin/Teacher authoring workbench with rich text editor, target audience selector for roles/classes/sections, file attachments, publish scheduling, and expiry date setting), *Template Manager* (`/erp/communication/templates` — Admin interface for creating and editing localization-ready SMS, Email, and In-App templates with Mustache/Handlebars variable syntax validation and interactive rendering preview modal), *Delivery Dashboard* (`/erp/communication/delivery-logs` — Admin telemetry dashboard showing real-time delivery status metrics across In-App, Email, and SMS channels with failure inspection and retry execution), *Scheduled Notifications* (`/erp/communication/scheduled` — queue manager for immediate, scheduled, and recurring broadcast notifications), and *Notification Preferences* (`/erp/communication/preferences` — user profile preferences tab to toggle opt-in and opt-out across attendance, homework, exam, result, fee, and general categories per delivery channel).
    * **Event & Holiday Calendar Domain (Phase 12)**: Includes *Calendar Dashboard* (`/erp/calendar/dashboard` — unified visual calendar combining holidays, school events, exams, and homework with Month, Week, Day, and Agenda views), *Holiday Management* (`/erp/calendar/holidays` — Admin interface to define national, state, and school holidays with multi-day and recurring support), *Event Management* (`/erp/calendar/events` — Admin/Teacher workbench to create academic, sports, cultural, and custom events scoped by visibility), *Calendar Analytics* (`/erp/calendar/analytics` — dashboard summarizing working days, holiday counts, teaching days, and attendance impact for academic terms), and *Event Reminders* (`/erp/calendar/reminders` — user configuration for pre-event notification alerts).
  * On mobile/tablet, the sidebar converts to a smooth drawer off-canvas menu.
* **Top Executive Bar**:
  * **Academic Session Switcher**: Dropdown allowing Admin/Teachers to toggle between configurable academic sessions (`2025-26`, `2026-27`) without relogging.
  * **Global Search Box**: Instant search across student admission numbers, teacher names, and circular titles.
  * **Notification Bell**: Dropdown list of unread circulars and homework due alerts.
  * **User Profile Avatar**: Dropdown with *My Profile*, *Multi-Device Sessions*, and *Log Out Everywhere*.
* **Breadcrumb Trail**: Dynamic breadcrumb navigation (e.g., `Portal > Academic > Classes > Class 10 - Sec A`).
