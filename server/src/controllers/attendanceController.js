import prisma from '../utils/prisma.js';
import { logAudit } from '../middleware/auth.js';

// Helper to get formatted date string YYYY-MM-DD
const getTodayStr = () => new Date().toISOString().split('T')[0];

export const getTodayAttendanceStatus = async (req, res) => {
  try {
    const employeeId = req.query.employeeId || req.user.id;
    const today = getTodayStr();

    const attendance = await prisma.attendance.findUnique({
      where: {
        employeeId_date: { employeeId, date: today }
      },
      include: {
        breaks: {
          orderBy: { startTime: 'desc' }
        }
      }
    });

    // Check if there is an active break session
    const activeBreak = attendance?.breaks.find(b => !b.endTime) || null;

    return res.status(200).json({
      success: true,
      hasClockedIn: !!attendance,
      hasClockedOut: !!(attendance && attendance.clockOut),
      activeBreak,
      attendance
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const clockIn = async (req, res) => {
  try {
    const employeeId = req.body.employeeId || req.user.id;
    const today = getTodayStr();

    // Check if single daily clock-in already exists
    const existing = await prisma.attendance.findUnique({
      where: {
        employeeId_date: { employeeId, date: today }
      }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Daily clock-in already recorded for today. Single clock-in per calendar day is strictly enforced.'
      });
    }

    const now = new Date();
    // Example: shift starts at 09:30 AM local time. If clocked in after 09:45, mark LATE
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const isLate = (hours > 9 || (hours === 9 && minutes > 30));

    const attendance = await prisma.attendance.create({
      data: {
        employeeId,
        date: today,
        clockIn: now,
        status: isLate ? 'LATE' : 'PRESENT'
      },
      include: { breaks: true }
    });

    await logAudit(employeeId, 'CLOCK_IN', 'ATTENDANCE', `Clocked in at ${now.toISOString()} (${attendance.status})`, req);

    return res.status(201).json({
      success: true,
      message: `Clock-in successful at ${now.toLocaleTimeString()}`,
      attendance
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const clockOut = async (req, res) => {
  try {
    const employeeId = req.body?.employeeId || req.user.id;
    const today = getTodayStr();

    const attendance = await prisma.attendance.findUnique({
      where: {
        employeeId_date: { employeeId, date: today }
      },
      include: {
        breaks: true
      }
    });

    if (!attendance) {
      return res.status(400).json({ success: false, message: 'No clock-in record found for today.' });
    }

    if (attendance.clockOut) {
      return res.status(400).json({ success: false, message: 'You have already clocked out for today.' });
    }

    // Check if an ongoing break is not closed
    const activeBreak = attendance.breaks.find(b => !b.endTime);
    if (activeBreak) {
      return res.status(400).json({
        success: false,
        message: `Cannot clock out while on break (${activeBreak.type}). Please resume work before clocking out.`
      });
    }

    const clockOutTime = new Date();
    // Compute total work minutes: (clockOut - clockIn) - totalBreakMins
    const totalElapsedMins = Math.round((clockOutTime - new Date(attendance.clockIn)) / (1000 * 60));
    const netWorkMins = Math.max(0, totalElapsedMins - attendance.totalBreakMins);

    const updated = await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        clockOut: clockOutTime,
        totalWorkMins: netWorkMins
      },
      include: { breaks: true }
    });

    await logAudit(employeeId, 'CLOCK_OUT', 'ATTENDANCE', `Clocked out at ${clockOutTime.toISOString()}. Total work: ${netWorkMins} mins`, req);

    return res.status(200).json({
      success: true,
      message: `Clock-out recorded. Net work duration: ${(netWorkMins / 60).toFixed(1)} hrs`,
      attendance: updated
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const startBreak = async (req, res) => {
  try {
    const employeeId = req.body?.employeeId || req.user.id;
    const today = getTodayStr();
    const { type } = req.body; // LUNCH, TEA, EMERGENCY

    if (!['LUNCH', 'TEA', 'EMERGENCY'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid break type. Allowed: LUNCH, TEA, EMERGENCY.' });
    }

    const attendance = await prisma.attendance.findUnique({
      where: { employeeId_date: { employeeId, date: today } },
      include: { breaks: true }
    });

    if (!attendance) {
      return res.status(400).json({ success: false, message: 'You must clock in before starting a break.' });
    }

    if (attendance.clockOut) {
      return res.status(400).json({ success: false, message: 'You have already clocked out for today.' });
    }

    // Concurrent break locks: cannot start break while another is active
    const activeBreak = attendance.breaks.find(b => !b.endTime);
    if (activeBreak) {
      return res.status(400).json({
        success: false,
        message: `Concurrent break lock: Break session '${activeBreak.type}' is currently in progress. Complete it first.`
      });
    }

    const breakSession = await prisma.breakSession.create({
      data: {
        attendanceId: attendance.id,
        type,
        startTime: new Date()
      }
    });

    await logAudit(employeeId, 'BREAK_START', 'ATTENDANCE', `Started ${type} break session`, req);

    return res.status(201).json({
      success: true,
      message: `${type} break started successfully.`,
      breakSession
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const endBreak = async (req, res) => {
  try {
    const employeeId = req.body?.employeeId || req.user.id;
    const today = getTodayStr();

    const attendance = await prisma.attendance.findUnique({
      where: { employeeId_date: { employeeId, date: today } },
      include: { breaks: true }
    });

    if (!attendance) {
      return res.status(400).json({ success: false, message: 'No attendance record found for today.' });
    }

    const activeBreak = attendance.breaks.find(b => !b.endTime);
    if (!activeBreak) {
      return res.status(400).json({ success: false, message: 'No active break session found to resume from.' });
    }

    const endTime = new Date();
    const durationMins = Math.round((endTime - new Date(activeBreak.startTime)) / (1000 * 60));

    // Update break session
    const closedBreak = await prisma.breakSession.update({
      where: { id: activeBreak.id },
      data: {
        endTime,
        durationMins
      }
    });

    // Update cumulative break minutes in attendance record
    const updatedAttendance = await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        totalBreakMins: { increment: durationMins }
      },
      include: { breaks: true }
    });

    await logAudit(employeeId, 'BREAK_END', 'ATTENDANCE', `Ended ${activeBreak.type} break session (${durationMins} mins)`, req);

    return res.status(200).json({
      success: true,
      message: `Resumed work. ${activeBreak.type} lasted ${durationMins} minutes.`,
      breakSession: closedBreak,
      attendance: updatedAttendance
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getAttendanceHistory = async (req, res) => {
  try {
    const { employeeId, startDate, endDate, departmentId } = req.query;

    const where = {};

    // If employeeId specified (e.g. from employee selector), filter by it; otherwise fallback to logged in user for employee role
    if (employeeId) {
      where.employeeId = employeeId;
    } else if (req.user.role === 'EMPLOYEE') {
      where.employeeId = req.user.id;
    }

    if (departmentId) {
      where.employee = { departmentId };
    }

    if (startDate && endDate) {
      where.date = { gte: startDate, lte: endDate };
    }

    const attendances = await prisma.attendance.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            designation: true,
            department: { select: { name: true, code: true } }
          }
        },
        breaks: true
      },
      orderBy: { date: 'desc' }
    });

    return res.status(200).json({ success: true, count: attendances.length, attendances });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Live Floor Monitor KPI
export const getLiveFloorMonitor = async (req, res) => {
  try {
    const today = getTodayStr();

    // Fetch all active employees
    const allEmployees = await prisma.employee.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        employeeCode: true,
        firstName: true,
        lastName: true,
        designation: true,
        role: true,
        department: { select: { id: true, name: true, code: true } },
        attendances: {
          where: { date: today },
          include: { breaks: true }
        },
        leaveRequests: {
          where: {
            status: 'APPROVED',
            startDate: { lte: new Date() },
            endDate: { gte: new Date() }
          }
        }
      }
    });

    let activeOnDuty = 0;
    let onBreak = 0;
    let onLeave = 0;
    let lateOrAbsent = 0;

    const roster = allEmployees.map(emp => {
      const todayAtt = emp.attendances[0] || null;
      const todayLeave = emp.leaveRequests[0] || null;

      let floorStatus = 'ABSENT'; // ABSENT, ON_DUTY, ON_BREAK, ON_LEAVE, CLOCKED_OUT
      let activeBreakType = null;

      if (todayLeave) {
        floorStatus = 'ON_LEAVE';
        onLeave++;
      } else if (todayAtt) {
        if (todayAtt.clockOut) {
          floorStatus = 'CLOCKED_OUT';
        } else {
          const activeBreak = todayAtt.breaks.find(b => !b.endTime);
          if (activeBreak) {
            floorStatus = 'ON_BREAK';
            activeBreakType = activeBreak.type;
            onBreak++;
          } else {
            floorStatus = 'ON_DUTY';
            activeOnDuty++;
          }
        }
      } else {
        floorStatus = 'ABSENT';
        lateOrAbsent++;
      }

      return {
        id: emp.id,
        employeeCode: emp.employeeCode,
        name: `${emp.firstName} ${emp.lastName}`,
        designation: emp.designation,
        department: emp.department?.name || 'Unassigned',
        departmentCode: emp.department?.code || 'GEN',
        floorStatus,
        activeBreakType,
        clockInTime: todayAtt?.clockIn || null,
        totalWorkMins: todayAtt?.totalWorkMins || 0,
        totalBreakMins: todayAtt?.totalBreakMins || 0
      };
    });

    return res.status(200).json({
      success: true,
      summary: {
        totalStaff: allEmployees.length,
        activeOnDuty,
        onBreak,
        onLeave,
        lateOrAbsent
      },
      roster
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const manualLogAttendance = async (req, res) => {
  try {
    const { employeeId, date, clockIn, clockOut, status = 'PRESENT', notes } = req.body;
    const targetEmployeeId = employeeId || req.user.id;
    const recordDate = date || getTodayStr();

    // Verify employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: targetEmployeeId }
    });
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Target employee not found.' });
    }

    // Permission check: ADMIN, HR, or the employee themselves can record attendance
    const isSelf = req.user.id === targetEmployeeId || req.user.email?.toLowerCase() === employee.email?.toLowerCase();
    const isHRorAdmin = ['ADMIN', 'HR'].includes(req.user.role);

    if (!isHRorAdmin && !isSelf) {
      return res.status(403).json({
        success: false,
        message: 'Security Violation: You do not have permission to log attendance for another employee.'
      });
    }

    // Parse clockIn and clockOut
    let clockInDateTime;
    if (clockIn) {
      clockInDateTime = new Date(clockIn.includes('T') ? clockIn : `${recordDate}T${clockIn}:00`);
      if (isNaN(clockInDateTime.getTime())) {
        clockInDateTime = new Date(`${recordDate}T09:00:00`);
      }
    } else {
      clockInDateTime = new Date(`${recordDate}T09:00:00`);
    }

    let clockOutDateTime = null;
    let totalWorkMins = 0;
    if (clockOut) {
      clockOutDateTime = new Date(clockOut.includes('T') ? clockOut : `${recordDate}T${clockOut}:00`);
      if (!isNaN(clockOutDateTime.getTime()) && clockOutDateTime > clockInDateTime) {
        totalWorkMins = Math.round((clockOutDateTime.getTime() - clockInDateTime.getTime()) / (1000 * 60));
      }
    }

    const attendance = await prisma.attendance.upsert({
      where: {
        employeeId_date: {
          employeeId: targetEmployeeId,
          date: recordDate
        }
      },
      update: {
        clockIn: clockInDateTime,
        clockOut: clockOutDateTime,
        status: status || 'PRESENT',
        totalWorkMins,
        notes: notes || 'Manually logged attendance'
      },
      create: {
        employeeId: targetEmployeeId,
        date: recordDate,
        clockIn: clockInDateTime,
        clockOut: clockOutDateTime,
        status: status || 'PRESENT',
        totalWorkMins,
        notes: notes || 'Manually logged attendance'
      },
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true, employeeCode: true }
        }
      }
    });

    await logAudit(
      req.user.id,
      'MANUAL_ATTENDANCE_LOG',
      'ATTENDANCE',
      `Manual attendance logged for ${employee.firstName} ${employee.lastName} on ${recordDate} (${status})`,
      req
    );

    return res.status(200).json({
      success: true,
      message: `Manual attendance recorded successfully for ${employee.firstName} ${employee.lastName}`,
      attendance
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

