import xlsx from 'xlsx';
import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma.js';

// ─── Normalize header names ───────────────────────────────────────────────────
const normalize = (str) =>
  String(str ?? '')
    .toLowerCase()
    .replace(/[\s_\-\/\.]+/g, '');

// ─── Map Excel column headers to our field names ──────────────────────────────
const COLUMN_MAP = {
  firstname:      'firstName',
  first:          'firstName',
  fname:          'firstName',
  lastname:       'lastName',
  last:           'lastName',
  lname:          'lastName',
  email:          'email',
  mail:           'email',
  phone:          'phone',
  mobile:         'phone',
  contact:        'phone',
  role:           'role',
  designation:    'designation',
  title:          'designation',
  position:       'designation',
  jobtitle:       'designation',
  department:     'department',
  dept:           'department',
  password:       'password',
  passcode:       'password',
  employeecode:   'employeeCode',
  empcode:        'employeeCode',
  empid:          'employeeCode',
  employeeid:     'employeeCode',
  id:             'employeeCode',
};

// ─── Valid roles ──────────────────────────────────────────────────────────────
const VALID_ROLES = ['EMPLOYEE', 'MANAGER', 'HR', 'ADMIN'];

// ─── Parse & Preview Excel ────────────────────────────────────────────────────
export const previewImport = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawRows = xlsx.utils.sheet_to_json(sheet, { defval: '' });

    if (!rawRows.length) {
      return res.status(400).json({ success: false, message: 'Excel file is empty or has no data rows.' });
    }

    // Map raw headers to our fields
    const mappedRows = rawRows.map((row, index) => {
      const mapped = {};
      for (const [key, val] of Object.entries(row)) {
        const field = COLUMN_MAP[normalize(key)];
        if (field) mapped[field] = String(val).trim();
      }
      mapped._rowIndex = index + 2; // Excel row number (1=header, so data starts at 2)
      return mapped;
    });

    // Fetch departments for matching
    const departments = await prisma.department.findMany();

    // Get existing employee codes and emails to detect duplicates
    const existingEmployees = await prisma.employee.findMany({
      select: { email: true, employeeCode: true }
    });
    const existingEmails = new Set(existingEmployees.map(e => e.email.toLowerCase()));
    const existingCodes = new Set(existingEmployees.map(e => e.employeeCode.toLowerCase()));

    // Count for auto-generating employee codes
    const currentCount = await prisma.employee.count();

    // Validate and enrich each row
    const preview = mappedRows.map((row, idx) => {
      const errors = [];
      const warnings = [];

      // Required fields
      if (!row.firstName) errors.push('Missing First Name');
      if (!row.lastName)  errors.push('Missing Last Name');
      if (!row.email)     errors.push('Missing Email');

      // Email format
      if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
        errors.push('Invalid email format');
      }

      // Duplicate detection
      if (row.email && existingEmails.has(row.email.toLowerCase())) {
        warnings.push('Email already exists — will be skipped');
      }
      if (row.employeeCode && existingCodes.has(row.employeeCode.toLowerCase())) {
        warnings.push('Employee code already exists — will be skipped');
      }

      // Auto-generate employee code if missing
      if (!row.employeeCode) {
        row.employeeCode = `SHR-${101 + currentCount + idx}`;
        warnings.push(`Auto-assigned code: ${row.employeeCode}`);
      }

      // Role normalization
      const roleUpper = (row.role || 'EMPLOYEE').toUpperCase();
      row.role = VALID_ROLES.includes(roleUpper) ? roleUpper : 'EMPLOYEE';
      if (row.role === 'EMPLOYEE' && roleUpper !== 'EMPLOYEE') {
        warnings.push(`Unknown role "${row.role}" → defaulted to EMPLOYEE`);
      }

      // Department matching
      let departmentId = null;
      if (row.department) {
        const matched = departments.find(
          d =>
            d.name.toLowerCase().includes(row.department.toLowerCase()) ||
            d.code.toLowerCase() === row.department.toLowerCase()
        );
        if (matched) {
          departmentId = matched.id;
          row.departmentName = matched.name;
        } else {
          warnings.push(`Department "${row.department}" not found — will be unassigned`);
        }
      }

      // Default password if missing
      if (!row.password || row.password.length < 3) {
        row.password = '1234';
        warnings.push('No password provided — default "1234" will be set');
      }

      return {
        _rowIndex: row._rowIndex,
        employeeCode: row.employeeCode,
        firstName: row.firstName || '',
        lastName: row.lastName || '',
        email: row.email || '',
        phone: row.phone || '',
        role: row.role,
        designation: row.designation || '',
        department: row.departmentName || row.department || '',
        departmentId,
        password: row.password,
        errors,
        warnings,
        status: errors.length > 0 ? 'error' : (
          (row.email && existingEmails.has(row.email.toLowerCase())) ? 'skip' : 'ready'
        )
      };
    });

    const summary = {
      total: preview.length,
      ready: preview.filter(r => r.status === 'ready').length,
      skip: preview.filter(r => r.status === 'skip').length,
      errors: preview.filter(r => r.status === 'error').length,
      departments: departments.map(d => ({ id: d.id, name: d.name, code: d.code }))
    };

    return res.status(200).json({ success: true, summary, preview });
  } catch (err) {
    console.error('[Import Preview Error]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ─── Confirm & Execute Import ─────────────────────────────────────────────────
export const confirmImport = async (req, res) => {
  try {
    const { rows } = req.body;

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ success: false, message: 'No rows provided for import.' });
    }

    // Only import rows marked as "ready"
    const toImport = rows.filter(r => r.status === 'ready');

    if (toImport.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid rows to import.' });
    }

    // Get existing emails again to prevent race conditions
    const existingEmployees = await prisma.employee.findMany({
      select: { email: true, employeeCode: true }
    });
    const existingEmails = new Set(existingEmployees.map(e => e.email.toLowerCase()));

    let imported = 0;
    let skipped = 0;
    const failed = [];

    for (const row of toImport) {
      try {
        // Skip if email already exists (race condition guard)
        if (existingEmails.has(row.email.toLowerCase())) {
          skipped++;
          continue;
        }

        const hashedPassword = await bcrypt.hash(String(row.password), 12);

        await prisma.employee.create({
          data: {
            employeeCode: row.employeeCode,
            firstName: row.firstName,
            lastName: row.lastName,
            email: row.email.toLowerCase(),
            password: hashedPassword,
            role: row.role || 'EMPLOYEE',
            designation: row.designation || '',
            phone: row.phone || null,
            departmentId: row.departmentId || null,
            status: 'ACTIVE',
            joinDate: new Date()
          }
        });

        existingEmails.add(row.email.toLowerCase());
        imported++;
      } catch (rowErr) {
        console.error(`[Import Row Error] Row ${row._rowIndex}:`, rowErr.message);
        failed.push({ email: row.email, error: rowErr.message });
      }
    }

    return res.status(200).json({
      success: true,
      message: `Import complete: ${imported} added, ${skipped} skipped, ${failed.length} failed.`,
      imported,
      skipped,
      failed
    });
  } catch (err) {
    console.error('[Import Confirm Error]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
