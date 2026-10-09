import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma.js';
import { logAudit } from '../middleware/auth.js';

export const getAllEmployees = async (req, res) => {
  try {
    const { department, status, role, search } = req.query;

    const where = {};
    if (department) where.departmentId = department;
    if (status) where.status = status;
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
        { employeeCode: { contains: search } },
        { designation: { contains: search } }
      ];
    }

    const employees = await prisma.employee.findMany({
      where,
      select: {
        id: true,
        employeeCode: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        status: true,
        designation: true,
        departmentId: true,
        department: { select: { id: true, name: true, code: true } },
        managerId: true,
        manager: { select: { id: true, firstName: true, lastName: true, email: true } },
        phone: true,
        joinDate: true,
        hourlyRate: true,
        baseSalary: true,
        createdAt: true
      },
      orderBy: { employeeCode: 'asc' }
    });

    return res.status(200).json({ success: true, count: employees.length, employees });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;

    // Permissions: Employee can view own, Admin/HR/Manager can view
    if (req.user.role === 'EMPLOYEE' && req.user.id !== id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const employee = await prisma.employee.findUnique({
      where: { id },
      select: {
        id: true,
        employeeCode: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        status: true,
        designation: true,
        department: true,
        manager: { select: { id: true, firstName: true, lastName: true, email: true } },
        subordinates: { select: { id: true, firstName: true, lastName: true, employeeCode: true, designation: true } },
        phone: true,
        joinDate: true,
        hourlyRate: true,
        baseSalary: true,
        leaveBalances: true,
        createdAt: true
      }
    });

    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found.' });
    }

    return res.status(200).json({ success: true, employee });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createEmployee = async (req, res) => {
  try {
    const {
      employeeCode,
      firstName,
      lastName,
      email,
      password,
      role = 'EMPLOYEE',
      designation,
      departmentId,
      managerId,
      phone,
      baseSalary = 4000.0,
      hourlyRate = 25.0
    } = req.body;

    if (!firstName || !lastName || !email || !designation || !employeeCode) {
      return res.status(400).json({ success: false, message: 'Required fields missing.' });
    }

    const existing = await prisma.employee.findFirst({
      where: {
        OR: [{ email: email.toLowerCase().trim() }, { employeeCode }]
      }
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'Employee with this email or code already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password || 'password123', 10);

    const newEmployee = await prisma.employee.create({
      data: {
        employeeCode,
        firstName,
        lastName,
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role,
        designation,
        departmentId: departmentId || null,
        managerId: managerId || null,
        phone,
        baseSalary: parseFloat(baseSalary),
        hourlyRate: parseFloat(hourlyRate)
      },
      include: {
        department: true
      }
    });

    // Create default leave balances
    const leaveTypes = ['ANNUAL', 'MEDICAL', 'CASUAL', 'UNPAID'];
    for (const lt of leaveTypes) {
      await prisma.leaveBalance.create({
        data: {
          employeeId: newEmployee.id,
          leaveType: lt,
          allocated: lt === 'ANNUAL' ? 14 : lt === 'MEDICAL' ? 10 : lt === 'CASUAL' ? 7 : 30,
          used: 0,
          year: new Date().getFullYear()
        }
      });
    }

    await logAudit(req.user.id, 'CREATE_EMPLOYEE', 'EMPLOYEE', `Created employee ${newEmployee.employeeCode} (${newEmployee.email})`, req);

    const { password: _, ...createdData } = newEmployee;
    return res.status(201).json({ success: true, message: 'Employee registered successfully', employee: createdData });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      role,
      status,
      designation,
      departmentId,
      managerId,
      phone,
      baseSalary,
      hourlyRate,
      password
    } = req.body;

    const data = {};
    if (firstName) data.firstName = firstName;
    if (lastName) data.lastName = lastName;
    if (designation) data.designation = designation;
    if (phone !== undefined) data.phone = phone;
    if (departmentId !== undefined) data.departmentId = departmentId || null;
    if (managerId !== undefined) data.managerId = managerId || null;

    // Only Admin / HR can edit role, status, salaries
    if (['ADMIN', 'HR'].includes(req.user.role)) {
      if (role) data.role = role;
      if (status) data.status = status;
      if (baseSalary !== undefined) data.baseSalary = parseFloat(baseSalary);
      if (hourlyRate !== undefined) data.hourlyRate = parseFloat(hourlyRate);
    }

    if (password && password.trim() !== '') {
      data.password = await bcrypt.hash(password, 10);
    }

    const updated = await prisma.employee.update({
      where: { id },
      data,
      include: {
        department: true,
        manager: { select: { id: true, firstName: true, lastName: true } }
      }
    });

    await logAudit(req.user.id, 'UPDATE_EMPLOYEE', 'EMPLOYEE', `Updated profile of ${updated.employeeCode}`, req);

    const { password: _, ...cleaned } = updated;
    return res.status(200).json({ success: true, message: 'Employee updated successfully', employee: cleaned });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getDepartments = async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        _count: {
          select: { employees: true }
        }
      },
      orderBy: { name: 'asc' }
    });
    return res.status(200).json({ success: true, departments });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createDepartment = async (req, res) => {
  try {
    const { name, code, description } = req.body;
    if (!name || !code) {
      return res.status(400).json({ success: false, message: 'Name and code are required' });
    }

    const dept = await prisma.department.create({
      data: { name, code: code.toUpperCase(), description }
    });

    await logAudit(req.user.id, 'CREATE_DEPARTMENT', 'DEPARTMENT', `Created department ${dept.code} - ${dept.name}`, req);
    return res.status(201).json({ success: true, department: dept });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
