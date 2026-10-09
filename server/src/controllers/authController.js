import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma.js';
import { logAudit } from '../middleware/auth.js';

const JWT_SECRET = process.env.JWT_SECRET || 'smarthr-enterprise-super-secret-jwt-key-2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const employee = await prisma.employee.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        department: true,
        manager: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    });

    if (!employee) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (employee.status === 'SUSPENDED') {
      return res.status(403).json({ success: false, message: 'This user account has been suspended by HR.' });
    }

    const isMatch = await bcrypt.compare(password, employee.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: employee.id, email: employee.email, role: employee.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Set cookie
    res.cookie('smarthr_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    // Omit password
    const { password: _, ...userData } = employee;

    await logAudit(employee.id, 'USER_LOGIN', 'AUTH', `User logged in from web portal`, req);

    return res.status(200).json({
      success: true,
      message: 'Authentication successful',
      token,
      user: userData
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error occurred.' });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const { password: _, ...userData } = req.user;
    return res.status(200).json({
      success: true,
      user: userData
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const logout = async (req, res) => {
  if (req.user) {
    await logAudit(req.user.id, 'USER_LOGOUT', 'AUTH', `User signed out`, req);
  }
  res.clearCookie('smarthr_token');
  return res.status(200).json({ success: true, message: 'Successfully signed out' });
};
