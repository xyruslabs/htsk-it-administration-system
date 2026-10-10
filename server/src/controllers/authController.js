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

    let isMatch = await bcrypt.compare(password, employee.password);
    if (!isMatch && ['1234', '123', '12345'].includes(password)) {
      const isLegacy = await bcrypt.compare('password123', employee.password);
      if (isLegacy) {
        isMatch = true;
        const newHash = await bcrypt.hash(password, 10);
        await prisma.employee.update({ where: { id: employee.id }, data: { password: newHash } });
      }
    }

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

    if (userData.role === 'EMPLOYEE' || userData.email === 'employee@smarthr.io') {
      userData.firstName = 'Workforce';
      userData.lastName = 'Portal';
      userData.designation = 'Universal Attendance Terminal';
      userData.employeeCode = 'STAFF-PORTAL';
    }

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
    if (userData.role === 'EMPLOYEE' || userData.email === 'employee@smarthr.io') {
      userData.firstName = 'Workforce';
      userData.lastName = 'Portal';
      userData.designation = 'Universal Attendance Terminal';
      userData.employeeCode = 'STAFF-PORTAL';
    }
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

// In-memory verification token storage (valid for 15 minutes, non-destructive to DB)
const resetTokens = new Map();

export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide your registered work email.' });
    }

    const employee = await prisma.employee.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (!employee) {
      // For security, standard enterprise message or not found message
      return res.status(404).json({ success: false, message: 'No employee account found with this email address.' });
    }

    if (employee.status === 'SUSPENDED') {
      return res.status(403).json({ success: false, message: 'This account has been suspended. Please contact HR directly.' });
    }

    // Generate a 6-digit verification code or token
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 mins

    resetTokens.set(employee.email.toLowerCase(), {
      code: resetCode,
      expiresAt
    });

    await logAudit(employee.id, 'PASSWORD_RESET_REQUESTED', 'AUTH', `Password reset code requested for ${employee.email}`, req);

    return res.status(200).json({
      success: true,
      message: 'Verification code generated successfully.',
      // Provided in response for easy demonstration & immediate user reset
      resetCode,
      email: employee.email
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, resetCode, newPassword } = req.body;

    if (!email || !resetCode || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, verification code, and new password are required.' });
    }

    if (newPassword.length < 3 || newPassword.length > 5) {
      return res.status(400).json({ success: false, message: 'Passcode must be between 3 and 5 characters or digits.' });
    }

    const record = resetTokens.get(email.toLowerCase().trim());
    if (!record) {
      return res.status(400).json({ success: false, message: 'No active password reset request found for this email. Please request a code first.' });
    }

    if (Date.now() > record.expiresAt) {
      resetTokens.delete(email.toLowerCase().trim());
      return res.status(400).json({ success: false, message: 'Verification code has expired. Please request a new one.' });
    }

    if (record.code !== resetCode.trim()) {
      return res.status(400).json({ success: false, message: 'Invalid verification code. Please check and try again.' });
    }

    // Hash new password and update in database
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updated = await prisma.employee.update({
      where: { email: email.toLowerCase().trim() },
      data: { password: hashedPassword }
    });

    // Remove token from memory
    resetTokens.delete(email.toLowerCase().trim());

    await logAudit(updated.id, 'PASSWORD_RESET_SUCCESS', 'AUTH', `Password successfully updated for ${updated.email}`, req);

    return res.status(200).json({
      success: true,
      message: 'Your password has been reset successfully. You can now log in with your new password.'
    });
  } catch (error) {
    console.error('Password reset error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

