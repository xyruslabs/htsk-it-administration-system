# SmartHR Enterprise Workforce System

An enterprise-grade workforce management, attendance tracking, and operations platform architected for modern organizations with 200–500 active employees.

---

## 🌐 Live Application

- **Production Portal**: [https://smarthr-enterprise.vercel.app/login](https://smarthr-enterprise.vercel.app/login)
- **API Status & Health**: `https://smarthr-backend-h60c.onrender.com/api/health`

---

## 🏛️ Architecture & Tech Stack

- **Backend**: Node.js + Express.js modular MVC (`routes/`, `controllers/`, `middleware/`, `utils/`)
- **Database & ORM**: PostgreSQL (Cloud-ready on Neon.tech / Render Postgres) via **Prisma ORM 6**
- **Security & RBAC**: JWT stateless tokens, bcrypt password hashing, role-based protection
- **Frontend**: React 19 (Vite SPA) + Tailwind CSS + Lucide Icons + React Router v7 + Axios
- **Deployment**:
  - **Frontend**: Vercel (`client/dist`) — [https://smarthr-enterprise.vercel.app/login](https://smarthr-enterprise.vercel.app/login)
  - **Backend**: Render (`server/`) Web Service
  - **Database**: Neon Serverless PostgreSQL

---

## 👥 Seed Accounts & Demo Personas

All accounts support 3–5 character passcodes (default: `1234` or legacy `password123`):

| Role | Portal Identity | Email | Primary Responsibilities |
| :--- | :--- | :--- | :--- |
| **Super Admin** | Sarah Vance | `admin@smarthr.io` | Org structure, system-wide audits, security compliance |
| **HR Manager** | Marcus Sterling | `hr@smarthr.io` | Employee directory, registration approvals, leave policies |
| **Team Lead / Manager** | David Chen | `lead@smarthr.io` | Live floor attendance monitoring, leave request reviews |
| **Universal Workforce** | Workforce Portal (All Staff) | `employee@smarthr.io` | Shared terminal: mark attendance by filtering name, register profiles, apply leaves |

---

## 🚀 Running Locally

### Prerequisites
- Node.js (v18+)
- PostgreSQL database (or Neon.tech connection URL)

### 1. Backend Setup
```bash
cd server
npm install
npx prisma generate
npx prisma db push
npm run seed     # Seeds departments, initial staff, and sample attendance
npm run dev      # Starts API server on http://localhost:5000
```

### 2. Frontend Setup
```bash
cd client
npm install
npm run dev      # Starts Vite client on http://localhost:5173
```

---

## 📦 Core Capabilities Implemented

### 1. Universal Workforce Portal (All-Staff Login)
- Single universal login (`employee@smarthr.io`) for all organization employees.
- Neutral kiosk theme without pinning to any individual's identity.
- Employees filter or search their own name to check shift status, clock in/out, or take breaks.

### 2. Anti-Proxy Attendance Verification (3–5 Character Passcode)
- Strict **3 to 5 character passcode** requirement across the entire platform (letters, digits, or mixed).
- Prevents proxy clock-ins: colleagues cannot mark attendance for absent friends without their confidential passcode.
- Passcode required when clocking in at the kiosk, logging manual attendance, and updating employee profiles.
- Seamless fallback auto-upgrade for legacy accounts.

### 3. Live Floor Attendance Monitor & Shift Tracking
- Accessible directly via **"Live Floor Monitor"** and **"Add / Mark Attendance"** in sidebar navigation.
- Real-time KPI counters: *Active On Duty*, *On Break*, *On Leave*, *Absent/Late*.
- Full workforce roster with status filter tabs (`ALL`, `ON DUTY`, `ON BREAK`, `ON LEAVE`, `ABSENT`).
- One-click **"Add Attendance"** action button on each employee roster row for rapid shift logging.

### 4. Employee Directory & HR Approval Workflow
- Public staff directory with searchable name, department, email, and employee code filters.
- **Self-Registration**: New employees can submit their registration details directly.
- **HR Approval Gate**: New registrants stay in `PENDING_APPROVAL` status until approved by HR/Admin, ensuring unapproved users cannot mark attendance.
- Profile editing protected by 3–5 character passcode verification to prevent unauthorized tampering.

### 5. Smart Timekeeping & Granular Break Engine
- Single daily clock-in/out constraint.
- Granular break session locking (`LUNCH`, `TEA`, `EMERGENCY`) preventing overlapping breaks.
- Automated productive work vs. break duration computation.
- Comprehensive attendance history with net work hours computation.

### 6. Leave Management Lifecycle
- Quota balance tracking across `ANNUAL`, `MEDICAL`, `CASUAL`, and `UNPAID` categories.
- Leave application form with remaining quota checks.
- Manager & HR review portal with one-click approvals, rejections, and review notes.

### 7. Security, Compliance & Audit Trail
- Immutable security audit log tracking every login, attendance entry, leave decision, and employee profile modification.
- Privacy-compliant architecture focusing strictly on workforce attendance, leave administration, and employee management.

### 8. Modern UI & SaaS Aesthetics
- Bespoke kinetic logo splash screen with on-demand replay action.
- Complete Light Mode & Dark Mode theme engine.
- Clean, human-crafted design patterns with zero generic AI styling.

---

## 📄 License

Proprietary enterprise workforce software. All rights reserved.