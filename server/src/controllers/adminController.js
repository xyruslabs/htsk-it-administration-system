import prisma from '../utils/prisma.js';

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
