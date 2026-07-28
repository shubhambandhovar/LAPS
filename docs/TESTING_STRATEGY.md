# TESTING & QUALITY ASSURANCE STRATEGY: LITTLE ANGELS SCHOOL

## 1. Testing Pyramid & Quality Philosophy
To guarantee zero regressions in financial records, examination calculations, and multi-role access control, the platform implements a **4-Layer Quality Assurance Pyramid**:

```mermaid
graph TD
    E2E[E2E / Workflow Tests<br/>Playwright — Critical User Flows]
    SEC[Security & Authorization Tests<br/>Supertest — RBAC Negative Cases & IDOR via StudentGuardian]
    INT[API & DB Integration Tests<br/>Supertest + Mongo Memory Server — ACID Transactions]
    UNIT[Unit & Pure Domain Logic Tests<br/>Vitest — Grade Letter Rules, Fee Discounts, Zod Schemas]
    
    E2E --> SEC
    SEC --> INT
    INT --> UNIT
```

1. **Unit Tests (Vitest)**: Fast, deterministic tests for pure business logic (grade calculations, fee discount formulas, date helpers, Zod validation schemas).
2. **Integration Tests (Vitest + Supertest + MongoMemoryServer)**: Test Express controllers, Mongoose schema constraints, and MongoDB multi-document ACID transactions in isolated memory DB instances.
3. **Security & Authorization Tests (Supertest)**: Dedicated test suite validating positive and negative RBAC / IDOR enforcement rules across all endpoints.
4. **End-to-End (E2E) Workflow Tests (Playwright)**: Browser automation verifying complete cross-actor journeys (Teacher publishing homework -> Parent viewing in portal).

---

## 2. Security & Authorization Test Matrix (High Priority)

A mandatory requirement is testing **Negative Access Cases (Denial of Service & IDOR)** before testing positive success paths.

### 2.1. Mandatory Authorization Test Scenarios
* `TEST-AUTH-001`: **Teacher Class Scope Denial**
  * *Setup*: Authenticate as Teacher A (assigned only to Class 5 - Section A).
  * *Action*: Execute `POST /api/v1/attendance/batch` with payload targeting `Class 8 - Section B`.
  * *Expected Result*: HTTP `403 Forbidden` (`AUTH_SCOPE_FORBIDDEN`).
* `TEST-AUTH-002`: **Parent IDOR Denial via `StudentGuardian`**
  * *Setup*: Authenticate as Guardian A (parent of Student 001 via `StudentGuardian`).
  * *Action*: Execute `GET /api/v1/fees/student/002` (Student 002 is linked only to Guardian B).
  * *Expected Result*: HTTP `403 Forbidden` (`AUTH_SCOPE_FORBIDDEN`).
* `TEST-AUTH-003`: **Student Self-Scope Denial**
  * *Setup*: Authenticate as Student A (`001`).
  * *Action*: Execute `GET /api/v1/exams/101/report-cards/002`.
  * *Expected Result*: HTTP `403 Forbidden`.
* `TEST-AUTH-004`: **Unassigned Subject Teacher Mark Entry Denial**
  * *Setup*: Authenticate as Teacher A (teaches Hindi in Class 10 - Section A).
  * *Action*: Execute `POST /api/v1/exams/midterm/marks` for Mathematics in Class 10 - Section A.
  * *Expected Result*: HTTP `403 Forbidden`.
* `TEST-AUTH-005`: **Multi-Device `RefreshSession` Revocation Test**
  * *Setup*: Authenticate User A on Device 1 and Device 2 (two active `RefreshSession` rows in DB).
  * *Action*: On Device 1, execute `DELETE /api/v1/auth/sessions/:device2SessionId`.
  * *Expected Result*: Device 2's `RefreshSession.isRevoked` becomes `true`. Subsequent attempts by Device 2 to call `/api/v1/auth/refresh` return `401 Unauthorized` (`AUTH_SESSION_REVOKED`).

---

## 3. Critical Business Workflow Test Suites

### 3.1. Homework Lifecycle Workflow (`TEST-FLOW-HW`)
1. **Teacher Action**: Authenticate as Teacher -> Create Homework for assigned Class 6 Math (`POST /api/v1/homework`) -> Assert status is `DRAFT`.
2. **Publish**: Execute `PATCH /api/v1/homework/:id/publish` -> Assert status becomes `PUBLISHED`.
3. **Student View**: Authenticate as Student in Class 6 -> `GET /api/v1/homework` -> Assert published homework is present in feed.
4. **Parent View**: Authenticate as Guardian of Class 6 Student (verified via `StudentGuardian`) -> Assert homework is visible.

### 3.2. Attendance Batch Processing Workflow (`TEST-FLOW-ATT`)
1. **Submit Batch**: Class Teacher submits attendance for 40 students (`38 PRESENT, 2 ABSENT`).
2. **Idempotency / Unique Date Test**: Try submitting a second batch for the same Section and Date -> Assert HTTP `409 Conflict`.
3. **Parent Check**: Guardian of Absent student queries daily attendance -> Asserts status is `ABSENT`.

### 3.3. Examination Grading & Report Card Workflow (`TEST-FLOW-EXAM`)
1. **Create Exam & Rule**: Admin creates `Mid-Term` and configures `GradeRule` (`A+: 90-100%, A: 80-89%, B: 70-79%`).
2. **Teacher Enter Marks**: Teacher submits score `85` for Student 001 in Science.
3. **Compile Results**: Admin executes `POST /api/v1/exams/midterm/compile-results`.
4. **Assert Calculation**: Database asserts Student 001 overall grade is letter `"A"`, percentage is `85%`, and report card status is `DRAFT`.
5. **Publish**: Admin publishes -> Guardian queries report card API -> Asserts compiled PDF download link is accessible.

### 3.4. Fee Billing & Payment Transaction Workflow (`TEST-FLOW-FEE`)
1. **Assign Fee**: Assign `Tuition Fee - INR 5000` to Student 001 (`StudentFee` status is `UNPAID`).
2. **Record Payment**: Staff records offline Cash payment of `INR 5000` (`POST /api/v1/fees/payments`).
3. **Assert Transaction**:
   * Asserts `StudentFee.status` transforms to `PAID`.
   * Asserts `StudentFee.paidAmount` == `5000`.
   * Asserts unique `Receipt` document (`REC-2026-00001`) is generated.
   * Asserts `AuditLog` captures `"FEE_PAYMENT_RECORDED"`.

### 3.5. Academic Promotion Session Wizard (`TEST-FLOW-PROMO`)
1. **Setup**: Student 001 is enrolled in `Session 2025-26, Class 1 - Sec A, roll 15`.
2. **Promote Action**: Principal executes `POST /api/v1/students/001/promote` to target `Session 2026-27, Class 2 - Sec A, roll 12` (with configurable session dates).
3. **Assert Historical Preservation**:
   * Querying `Enrollment.findOne({ studentId: 001, academicSessionId: "2025-26" })` returns `Class 1` with status `"PROMOTED"`.
   * Querying `Enrollment.findOne({ studentId: 001, academicSessionId: "2026-27" })` returns `Class 2` with status `"ACTIVE"`.
   * Student's biographical profile (`Student.firstName`) remains unmodified.
