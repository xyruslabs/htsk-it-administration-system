# SmartHR Enterprise System

An enterprise-grade HR and workforce management system architected for organizations with 200–500 active employees.

---

## 🏛️ Architecture & Tech Stack

- **Backend**: Node.js + Express.js modular MVC (`routes/`, `controllers/`, `middleware/`, `utils/`)
- **Database & ORM**: SQLite / SQL-compatible normalized schema via **Prisma ORM 6**
- **Security & RBAC**: JWT stateless tokens, bcrypt password hashing, role-based protection
- **Frontend**: React (Vite SPA) + Tailwind CSS + Lucide Icons + React Router v7 + Axios

---

## 👥 Seed Accounts & Demo Personas

All accounts use password: `password123`

| Role | Name | Email | Primary Responsibilities |
| :--- | :--- | :--- | :--- |
| **Super Admin** | Sarah Vance | `admin@smarthr.io` | Org structure, system-wide audits, security compliance |
| **HR Manager** | Marcus Sterling | `hr@smarthr.io` | Employee directory, leave policy allocations, workforce analytics |
| **Team Lead / Manager** | David Chen | `lead@smarthr.io` | Live floor attendance monitoring, leave approvals |
| **Employee** | Elena Rostova | `employee@smarthr.io` | Quick clock-in/out (<5s), break session logging, leave apply |

---

## 🚀 Live Running Services

- **Backend API**: `http://localhost:5000` (Health check: `http://localhost:5000/api/health`)
- **Frontend SPA**: `http://localhost:5173`

---

## 📦 Core Capabilities Implemented

1. **Identity & RBAC**:
   - 4 user tiers (`ADMIN`, `HR`, `MANAGER`, `EMPLOYEE`).
   - Token interceptors with automatic session management and account suspension checks.

2. **Smart Attendance & Break Engine**:
   - Single daily clock-in/out constraint.
   - Concurrent break locks (`LUNCH`, `TEA`, `EMERGENCY`): Prevents starting a new break while another is active.
   - Precision automated work vs. break duration computation.

3. **Leave Management Lifecycle**:
   - Quota tracking across `ANNUAL`, `MEDICAL`, `CASUAL`, and `UNPAID` categories.
   - Manager approval workflow with reviewer notes and decision audit trail.

4. **Workforce Analytics & Roster Engine**:
   - Automated aggregation of shifts and team availability.
   - Real-time exception notifications and overtime adherence tracking.

5. **Live Floor Attendance Monitor**:
   - Real-time KPI counters: *Active On Duty*, *On Break*, *On Leave*, *Absent/Late*.
   - Filterable data grid with active break indicators and auto-refresh capability.

6. **Audit & Compliance Hub**:
   - Immutable security log stream capturing every sign-in, clock event, leave review, and administrative action.
