import prisma from '../utils/prisma.js';
import { logAudit } from '../middleware/auth.js';

export const getLeaveBalances = async (req, res) => {
  try {
    const employeeId = req.query.employeeId || req.user.id;
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const balances = await prisma.leaveBalance.findMany({
      where: { employeeId, year }
    });

    return res.status(200).json({ success: true, year, balances });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getLeaveRequests = async (req, res) => {
  try {
    const { status, employeeId } = req.query;
    const where = {};

    if (status) where.status = status;

    if (employeeId) {
      where.employeeId = employeeId;
    } else if (req.user.role === 'EMPLOYEE') {
      where.employeeId = req.user.id;
    } else if (req.user.role === 'MANAGER') {
      // Manager sees their subordinates' leaves or their own
      where.OR = [
        { employeeId: req.user.id },
        { employee: { managerId: req.user.id } }
      ];
    }

    const requests = await prisma.leaveRequest.findMany({
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
        approver: {
          select: { id: true, firstName: true, lastName: true, designation: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json({ success: true, count: requests.length, requests });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const submitLeaveRequest = async (req, res) => {
  try {
    const employeeId = req.body?.employeeId || req.user.id;
    const { leaveType, startDate, endDate, daysCount, reason } = req.body;

    if (!leaveType || !startDate || !endDate || !daysCount || !reason) {
      return res.status(400).json({ success: false, message: 'All leave request fields are required.' });
    }

    const numDays = parseFloat(daysCount);
    if (numDays <= 0) {
      return res.status(400).json({ success: false, message: 'Leave days must be greater than 0.' });
    }

    const currentYear = new Date(startDate).getFullYear();

    // Check quota balance
    const balance = await prisma.leaveBalance.findUnique({
      where: {
        employeeId_leaveType_year: {
          employeeId,
          leaveType,
          year: currentYear
        }
      }
    });

    if (balance && leaveType !== 'UNPAID') {
      const remaining = balance.allocated - balance.used;
      if (numDays > remaining) {
        return res.status(400).json({
          success: false,
          message: `Insufficient ${leaveType} balance. Requested: ${numDays} days, Available: ${remaining} days.`
        });
      }
    }

    const request = await prisma.leaveRequest.create({
      data: {
        employeeId,
        leaveType,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        daysCount: numDays,
        reason,
        status: 'PENDING'
      },
      include: {
        employee: {
          select: { firstName: true, lastName: true, employeeCode: true }
        }
      }
    });

    await logAudit(employeeId, 'LEAVE_APPLY', 'LEAVE', `Applied for ${numDays} days ${leaveType} leave`, req);

    return res.status(201).json({
      success: true,
      message: 'Leave application submitted successfully for manager review.',
      request
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const reviewLeaveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reviewNotes } = req.body; // APPROVED or REJECTED
    const approverId = req.user.id;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Decision status must be APPROVED or REJECTED.' });
    }

    const request = await prisma.leaveRequest.findUnique({
      where: { id },
      include: { employee: true }
    });

    if (!request) {
      return res.status(404).json({ success: false, message: 'Leave request not found.' });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: `Request is already finalized (${request.status}).` });
    }

    // Role check: Only HR, Admin, or the direct manager can review
    if (req.user.role === 'MANAGER' && request.employee.managerId !== approverId) {
      return res.status(403).json({ success: false, message: 'You are only authorized to review leaves of your direct team.' });
    }

    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status,
        approverId,
        reviewNotes: reviewNotes || null,
        reviewedAt: new Date()
      },
      include: {
        employee: { select: { firstName: true, lastName: true, employeeCode: true } },
        approver: { select: { firstName: true, lastName: true, designation: true } }
      }
    });

    // If APPROVED, deduct from leave quota
    if (status === 'APPROVED') {
      const year = new Date(request.startDate).getFullYear();
      await prisma.leaveBalance.updateMany({
        where: {
          employeeId: request.employeeId,
          leaveType: request.leaveType,
          year
        },
        data: {
          used: { increment: request.daysCount }
        }
      });
    }

    await logAudit(
      approverId,
      `LEAVE_${status}`,
      'LEAVE',
      `${status} leave for ${request.employee.employeeCode} (${request.daysCount} days)`,
      req
    );

    return res.status(200).json({
      success: true,
      message: `Leave request has been marked as ${status}.`,
      request: updated
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
