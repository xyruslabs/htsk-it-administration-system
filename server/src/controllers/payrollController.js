import prisma from '../utils/prisma.js';
import { logAudit } from '../middleware/auth.js';

export const generateMonthlyPayroll = async (req, res) => {
  try {
    const { month, year, employeeId } = req.body;

    if (!month || !year) {
      return res.status(400).json({ success: false, message: 'Month and year are required.' });
    }

    const targetMonth = parseInt(month);
    const targetYear = parseInt(year);

    // Filter employees to calculate for
    const where = { status: 'ACTIVE' };
    if (employeeId) where.id = employeeId;

    const employees = await prisma.employee.findMany({ where });

    const monthPadded = String(targetMonth).padStart(2, '0');
    const startPrefix = `${targetYear}-${monthPadded}`;

    const payrollResults = [];

    for (const emp of employees) {
      // Count attendances for that month
      const attendances = await prisma.attendance.findMany({
        where: {
          employeeId: emp.id,
          date: { startsWith: startPrefix }
        }
      });

      const daysWorked = attendances.length;

      // Count approved unpaid leaves in that month
      const unpaidLeaves = await prisma.leaveRequest.findMany({
        where: {
          employeeId: emp.id,
          leaveType: 'UNPAID',
          status: 'APPROVED'
        }
      });

      let unpaidLeaveDays = 0;
      unpaidLeaves.forEach(l => {
        const d = new Date(l.startDate);
        if (d.getMonth() + 1 === targetMonth && d.getFullYear() === targetYear) {
          unpaidLeaveDays += l.daysCount;
        }
      });

      // Daily wage calculation based on 22 standard working days
      const standardDays = 22;
      const dailyRate = emp.baseSalary / standardDays;
      const unpaidDeductions = Math.round(unpaidLeaveDays * dailyRate * 100) / 100;

      // Statutory deductions (e.g., healthcare / tax estimate 5%)
      const taxDeductions = Math.round(emp.baseSalary * 0.05 * 100) / 100;
      const totalDeductions = unpaidDeductions + taxDeductions;
      const netSalary = Math.max(0, Math.round((emp.baseSalary - totalDeductions) * 100) / 100);

      // Upsert payroll entry
      const payroll = await prisma.payroll.upsert({
        where: {
          employeeId_month_year: {
            employeeId: emp.id,
            month: targetMonth,
            year: targetYear
          }
        },
        update: {
          baseSalary: emp.baseSalary,
          daysWorked,
          unpaidLeaveDays,
          deductions: totalDeductions,
          netSalary,
          status: 'DRAFT',
          generatedAt: new Date()
        },
        create: {
          employeeId: emp.id,
          month: targetMonth,
          year: targetYear,
          baseSalary: emp.baseSalary,
          daysWorked,
          unpaidLeaveDays,
          deductions: totalDeductions,
          bonuses: 0,
          netSalary,
          status: 'DRAFT'
        },
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
          }
        }
      });

      payrollResults.push(payroll);
    }

    await logAudit(
      req.user.id,
      'PAYROLL_GENERATION',
      'PAYROLL',
      `Calculated payroll for ${payrollResults.length} staff (${targetMonth}/${targetYear})`,
      req
    );

    return res.status(200).json({
      success: true,
      message: `Generated monthly payroll summaries for ${payrollResults.length} employees`,
      payrolls: payrollResults
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getPayrolls = async (req, res) => {
  try {
    const { month, year, employeeId, status } = req.query;
    const where = {};

    if (month) where.month = parseInt(month);
    if (year) where.year = parseInt(year);
    if (status) where.status = status;

    if (req.user.role === 'EMPLOYEE') {
      where.employeeId = req.user.id;
    } else if (employeeId) {
      where.employeeId = employeeId;
    }

    const payrolls = await prisma.payroll.findMany({
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
        }
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }]
    });

    return res.status(200).json({ success: true, count: payrolls.length, payrolls });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updatePayrollStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, bonuses } = req.body;

    const data = {};
    if (status) data.status = status;
    if (notes !== undefined) data.notes = notes;
    if (bonuses !== undefined) {
      data.bonuses = parseFloat(bonuses);
      // recalculate net salary
      const existing = await prisma.payroll.findUnique({ where: { id } });
      if (existing) {
        data.netSalary = Math.round((existing.baseSalary - existing.deductions + parseFloat(bonuses)) * 100) / 100;
      }
    }

    const updated = await prisma.payroll.update({
      where: { id },
      data,
      include: {
        employee: {
          select: { firstName: true, lastName: true, employeeCode: true }
        }
      }
    });

    await logAudit(req.user.id, 'PAYROLL_STATUS_UPDATE', 'PAYROLL', `Updated payroll ${id} status to ${status}`, req);

    return res.status(200).json({ success: true, payroll: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
