import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma.js';

const JWT_SECRET = process.env.JWT_SECRET || 'smarthr-enterprise-super-secret-jwt-key-2026';

export const authenticate = async (req, res, next) => {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.smarthr_token) {
      token = req.cookies.smarthr_token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No authorization token provided.'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const employee = await prisma.employee.findUnique({
      where: { id: decoded.id },
      include: {
        department: true,
        manager: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    });

    if (!employee) {
      return res.status(401).json({
        success: false,
        message: 'Account not found or deleted.'
      });
    }

    if (employee.status === 'SUSPENDED') {
      return res.status(403).json({
        success: false,
        message: 'Your account is suspended. Contact HR or Administrator.'
      });
    }

    req.user = employee;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Session expired. Please sign in again.' });
    }
    return res.status(401).json({ success: false, message: 'Invalid authentication credentials.' });
  }
};

export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted. Role '${req.user.role}' lacks sufficient privileges.`
      });
    }

    next();
  };
};

export const logAudit = async (userId, action, resource, details, req = null) => {
  try {
    const ipAddress = req ? (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1') : '127.0.0.1';
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        resource,
        details: typeof details === 'object' ? JSON.stringify(details) : details,
        ipAddress: String(ipAddress)
      }
    });
  } catch (err) {
    console.error('Audit log failure:', err.message);
  }
};
