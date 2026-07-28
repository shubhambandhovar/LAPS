# Little Angels School — School ERP & Public Website
**Production-Grade Educational Platform (Gohad, Madhya Pradesh, India)**  
*Academic Range: Pre-Primary (Nursery / LKG / UKG) up to Class 10*

---

## 1. Project Overview & Architecture Summary
This repository contains the production full-stack modular monolith for **Little Angels School**. The platform unifies two distinct experiences within a cohesive TypeScript architecture:
1. **Public School Website**: SEO-optimized digital front-door for prospective parents and students (`apps/web`).
2. **School Administration & Management System (ERP)**: High-density SaaS portal for daily academic administration, attendance, examinations, fee collection, communication, and historical student records (`apps/web` and `apps/api`).

### Technical Stack
* **Language**: Full-stack **TypeScript** (`@laps/shared` shared types and Zod schemas).
* **Frontend (`apps/web`)**: React 18, Vite, Tailwind CSS (HSL custom design tokens), React Router v6, TanStack Query v5, React Hook Form, and Zod.
* **Backend (`apps/api`)**: Node.js, Express 4, Mongoose (MongoDB 7.0 ODM), Pino structured logging, Helmet, CORS allowlist, and `express-mongo-sanitize`.
* **Database**: MongoDB 7.0 (with replica set support for multi-document ACID transactions).

---

## 2. Monorepo Workspace Structure
```text
little-angels-school/
│
├── apps/
│   ├── api/                 # Express Backend API Monolith (@laps/api)
│   └── web/                 # Vite + React Frontend SPA (@laps/web)
│
├── packages/
│   └── shared/              # Shared TypeScript types, Zod schemas, error codes (@laps/shared)
│
├── docs/                    # Source of truth architectural documentation (11 specifications)
│
├── .env.example             # Template for required environment variables
├── package.json             # NPM Workspace definitions and root scripts
├── tsconfig.base.json       # Strict ESNext/ES2022 TypeScript base config
└── docker-compose.yml       # Local MongoDB 7.0 development container
```

---

## 3. Prerequisites
Ensure the following tools are installed on your system:
* **Node.js**: `>= 20.0.0` (LTS recommended)
* **npm**: `>= 10.0.0` (included with Node 20+)
* **Docker & Docker Desktop** (optional, for local MongoDB container via `docker-compose`)
* **MongoDB**: `>= 7.0` (if running a local database instance outside Docker)

---

## 4. Installation & Setup Instructions

### Step 1: Clone & Install Dependencies
From the repository root, install all workspace packages:
```bash
npm install
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env` in the repository root:
```bash
cp .env.example .env
```
Ensure your `.env` contains valid values for:
* `NODE_ENV=development`
* `PORT=5000`
* `MONGODB_URI=mongodb://127.0.0.1:27017/little_angels_school_dev`
* `API_BASE_URL=http://localhost:5000/api/v1`
* `FRONTEND_ORIGIN=http://localhost:5173`
* `ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173`
* `LOG_LEVEL=info`
* `VITE_API_BASE_URL=http://localhost:5000/api/v1`

*Note: Environment variables are strictly validated by Zod on startup (`apps/api/src/config/env.ts`). Missing or malformed required variables cause an immediate fail-fast error.*

---

## 5. MongoDB Setup (Docker Development Environment)

You can spin up a local MongoDB 7.0 database using Docker Compose:
```bash
docker-compose up -d
```
* Binds to `localhost:27017`
* Database name: `little_angels_school_dev`
* Persistent storage volume: `mongodb_data`

To stop and remove the container:
```bash
docker-compose down
```

---

## 6. Available Workspace Commands

Run these commands from the repository root:

### Development Commands
* **Start All Workspaces in Dev Mode**:
  ```bash
  npm run dev
  ```
* **Start Backend API Only**:
  ```bash
  npm run dev --workspace=@laps/api
  ```
* **Start Frontend Web SPA Only**:
  ```bash
  npm run dev --workspace=@laps/web
  ```

### Testing Commands
* **Run Automated Test Suite (Vitest & Supertest)**:
  ```bash
  npm run test
  ```
  Executes integration and unit tests for:
  * `GET /api/v1/health` response envelope and database status.
  * Zod environment validation rules.
  * 404 standard error handling.
  * Helmet security headers and CORS allowlist enforcement.

### Linting & Type-Checking
* **Run TypeScript Type Check Across Workspaces**:
  ```bash
  npm run typecheck
  ```
* **Run ESLint Code Linting**:
  ```bash
  npm run lint
  ```
* **Format Code with Prettier**:
  ```bash
  npm run format
  ```

### Production Build
* **Build All Workspaces for Production**:
  ```bash
  npm run build
  ```
  Generates compiled output in `dist/` folders for `@laps/shared`, `@laps/api`, and `@laps/web`.

---

## 7. Architectural Status & Phased Implementation
* **Phase 1 (CURRENT PHASE)**: Technical foundation, workspace setup, security baseline (Helmet, CORS allowlists, NoSQL injection sanitization, rate limiting), Pino structured logging with request IDs, global error/404 handling, `/api/v1/health`, and minimal React Router UI shell (`/`, `/login`, `/portal`).
* **Phase 2**: Authentication, Multi-Device `RefreshSession` cookies, and RBAC Engine.
* **Phases 3–16**: Institutional setup, Student/Guardian normalized relationships, Attendance, Homework, Examinations, Fees, Communication, Public CMS, and Promotion Wizard.
* **Phase 17**: Final Security Hardening, Penetration Testing & Complete Audit Verification.
