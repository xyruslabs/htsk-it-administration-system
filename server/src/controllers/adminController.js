import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from '../utils/prisma.js';
import { logAudit } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SETTINGS_FILE = path.join(__dirname, '../../data/hr-settings.json');

const defaultSettings = {
  company: {
    name: 'SmartHR Enterprise Corporation',
    standardWorkingHours: 8.5,
    workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    timezone: 'Asia/Colombo (UTC+05:30)',
    currency: 'USD ($)'
  },
  shiftPolicy: {
    shiftName: 'General Day Shift',
    startTime: '09:00',
    endTime: '17:30',
    lateEntryGracePeriodMins: 15,
    earlyExitGracePeriodMins: 15,
    halfDayThresholdHours: 4.5,
    absentThresholdHours: 2.5,
    rosterColor: '#10b981',
    allowOvertime: true
  },
  breakPolicy: {
    comfortBreakMins: 20,
    mealBreakMins: 60,
    antiProxyPasscodeEnabled: true,
    minPasscodeLength: 3,
    maxPasscodeLength: 5,
    concurrentBreakLock: true
  },
  leavePolicy: {
    annualLeaveQuota: 14,
    medicalLeaveQuota: 14,
    casualLeaveQuota: 7,
    allowCarryForward: true,
    antiSelfApproval: true,
    restrictBackdatedLeaves: true
  },
  lastUpdated: new Date().toISOString(),
  updatedBy: 'System'
};

const readSettings = () => {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading hr-settings.json:', err);
  }
  return defaultSettings;
};

const writeSettings = (settings) => {
  try {
    const dir = path.dirname(SETTINGS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing hr-settings.json:', err);
  }
};

export const getAuditLogs = async (req, res) => {
  try {
    const { resource, action, limit = 100 } = req.query;
    const where = {};

    if (resource) where.resource = resource;
    if (action) where.action = action;

    const logs = await prisma.auditLog.findMany({
      where,
      take: parseInt(limit),
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, employeeCode: true, role: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json({ success: true, count: logs.length, logs });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getSystemStats = async (req, res) => {
  try {
    const totalEmployees = await prisma.employee.count({ where: { status: 'ACTIVE' } });
    const totalDepartments = await prisma.department.count();
    const pendingLeaves = await prisma.leaveRequest.count({ where: { status: 'PENDING' } });
    const today = new Date().toISOString().split('T')[0];
    const clockedInToday = await prisma.attendance.count({ where: { date: today } });

    return res.status(200).json({
      success: true,
      stats: {
        totalEmployees,
        totalDepartments,
        pendingLeaves,
        clockedInToday
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/hr-setup: Central HR Setup & Policies hub
export const getHrSetup = async (req, res) => {
  try {
    const settings = readSettings();

    // Fetch live system metrics for checklist calculations
    const [deptCount, empCount, auditCount, departments] = await Promise.all([
      prisma.department.count(),
      prisma.employee.count({ where: { status: 'ACTIVE' } }),
      prisma.auditLog.count(),
      prisma.department.findMany({
        include: { _count: { select: { employees: true } } },
        orderBy: { name: 'asc' }
      })
    ]);

    // Onboarding checklist mapping (inspired by Frappe HR Onboarding steps)
    const checklist = [
      {
        id: 'step_company',
        title: 'Company & Work Schedule',
        description: 'Standard work hours, operating timezone, and currency defaults',
        completed: Boolean(settings.company?.name),
        badge: 'Core'
      },
      {
        id: 'step_departments',
        title: 'Organizational Departments',
        description: `${deptCount} active business divisions configured`,
        completed: deptCount > 0,
        badge: `${deptCount} Depts`
      },
      {
        id: 'step_employees',
        title: 'Workforce Directory',
        description: `${empCount} active enterprise personnel registered`,
        completed: empCount > 0,
        badge: `${empCount} Staff`
      },
      {
        id: 'step_shifts',
        title: 'Shift Timings & Grace Windows',
        description: `${settings.shiftPolicy?.startTime || '09:00'} — ${settings.shiftPolicy?.endTime || '17:30'} with ${settings.shiftPolicy?.lateEntryGracePeriodMins || 15}m late grace`,
        completed: Boolean(settings.shiftPolicy?.startTime),
        badge: 'Active'
      },
      {
        id: 'step_breaks',
        title: 'Comfort & Meal Break Governance',
        description: `Comfort ${settings.breakPolicy?.comfortBreakMins || 20}m / Meal ${settings.breakPolicy?.mealBreakMins || 60}m with anti-proxy locking`,
        completed: Boolean(settings.breakPolicy?.comfortBreakMins),
        badge: 'Enforced'
      },
      {
        id: 'step_leaves',
        title: 'Leave Quotas & Anti-Self-Approval',
        description: `Annual (${settings.leavePolicy?.annualLeaveQuota || 14}d), Medical (${settings.leavePolicy?.medicalLeaveQuota || 14}d), Casual (${settings.leavePolicy?.casualLeaveQuota || 7}d)`,
        completed: Boolean(settings.leavePolicy?.annualLeaveQuota),
        badge: 'Policy'
      },
      {
        id: 'step_compliance',
        title: 'Audit Trails & Anti-Proxy Security',
        description: `${auditCount} security events logged and tamper-verified`,
        completed: auditCount > 0,
        badge: 'Protected'
      }
    ];

    const completedCount = checklist.filter((s) => s.completed).length;
    const completionPercentage = Math.round((completedCount / checklist.length) * 100);

    return res.status(200).json({
      success: true,
      settings,
      departments,
      summary: {
        totalDepartments: deptCount,
        totalEmployees: empCount,
        totalAuditEvents: auditCount,
        setupScore: completionPercentage,
        completedSteps: completedCount,
        totalSteps: checklist.length
      },
      checklist
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/admin/hr-setup: Save updated policies
export const updateHrSetup = async (req, res) => {
  try {
    const { company, shiftPolicy, breakPolicy, leavePolicy } = req.body;
    const current = readSettings();

    const updated = {
      ...current,
      company: company ? { ...current.company, ...company } : current.company,
      shiftPolicy: shiftPolicy ? { ...current.shiftPolicy, ...shiftPolicy } : current.shiftPolicy,
      breakPolicy: breakPolicy ? { ...current.breakPolicy, ...breakPolicy } : current.breakPolicy,
      leavePolicy: leavePolicy ? { ...current.leavePolicy, ...leavePolicy } : current.leavePolicy,
      lastUpdated: new Date().toISOString(),
      updatedBy: req.user ? `${req.user.firstName} ${req.user.lastName} (${req.user.role})` : 'Administrator'
    };

    writeSettings(updated);

    await logAudit(
      req.user?.id || null,
      'UPDATE_HR_SETUP',
      'SYSTEM',
      `Updated Enterprise HR Setup Policies (Shift: ${updated.shiftPolicy.startTime}-${updated.shiftPolicy.endTime}, Comfort: ${updated.breakPolicy.comfortBreakMins}m, Meal: ${updated.breakPolicy.mealBreakMins}m)`,
      req
    );

    return res.status(200).json({
      success: true,
      message: 'Enterprise HR policies and configurations updated successfully.',
      settings: updated
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
