import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting SmartHR Database Seeding ---');

  // Clear existing
  await prisma.auditLog.deleteMany();
  await prisma.breakSession.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.leaveBalance.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.department.deleteMany();

  // Create Departments
  const engineering = await prisma.department.create({
    data: {
      name: 'Engineering & Technology',
      code: 'ENG',
      description: 'Core product architecture, frontend, backend and infrastructure'
    }
  });

  const humanResources = await prisma.department.create({
    data: {
      name: 'Human Resources & People Ops',
      code: 'HR',
      description: 'Talent development, employee welfare, compensation & compliance'
    }
  });

  const operations = await prisma.department.create({
    data: {
      name: 'Operations & Logistics',
      code: 'OPS',
      description: 'Facility management, supply chains, customer success'
    }
  });

  const finance = await prisma.department.create({
    data: {
      name: 'Finance & Accounting',
      code: 'FIN',
      description: 'Fiscal governance, statutory reporting, budget allocation'
    }
  });

  const defaultPassword = await bcrypt.hash('password123', 10);

  // 1. Super Admin
  const admin = await prisma.employee.create({
    data: {
      employeeCode: 'SHR-001',
      firstName: 'Sarah',
      lastName: 'Vance',
      email: 'admin@smarthr.io',
      password: defaultPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
      designation: 'Enterprise Architect & Super Admin',
      departmentId: engineering.id,
      phone: '+1 555-0101',
      baseSalary: 9500.0,
      hourlyRate: 55.0
    }
  });

  // 2. HR Manager
  const hrManager = await prisma.employee.create({
    data: {
      employeeCode: 'SHR-002',
      firstName: 'Marcus',
      lastName: 'Sterling',
      email: 'hr@smarthr.io',
      password: defaultPassword,
      role: 'HR',
      status: 'ACTIVE',
      designation: 'Director of Human Resources',
      departmentId: humanResources.id,
      phone: '+1 555-0102',
      baseSalary: 7800.0,
      hourlyRate: 45.0
    }
  });

  // 3. Team Lead / Department Head
  const lead = await prisma.employee.create({
    data: {
      employeeCode: 'SHR-003',
      firstName: 'David',
      lastName: 'Chen',
      email: 'lead@smarthr.io',
      password: defaultPassword,
      role: 'MANAGER',
      status: 'ACTIVE',
      designation: 'Lead Engineering Manager',
      departmentId: engineering.id,
      managerId: admin.id,
      phone: '+1 555-0103',
      baseSalary: 6800.0,
      hourlyRate: 40.0
    }
  });

  // 4. Employees
  const emp1 = await prisma.employee.create({
    data: {
      employeeCode: 'SHR-101',
      firstName: 'Elena',
      lastName: 'Rostova',
      email: 'employee@smarthr.io',
      password: defaultPassword,
      role: 'EMPLOYEE',
      status: 'ACTIVE',
      designation: 'Senior Full Stack Engineer',
      departmentId: engineering.id,
      managerId: lead.id,
      phone: '+1 555-0104',
      baseSalary: 5200.0,
      hourlyRate: 32.0
    }
  });

  const emp2 = await prisma.employee.create({
    data: {
      employeeCode: 'SHR-102',
      firstName: 'Liam',
      lastName: 'O\'Connor',
      email: 'liam@smarthr.io',
      password: defaultPassword,
      role: 'EMPLOYEE',
      status: 'ACTIVE',
      designation: 'DevOps & Reliability Engineer',
      departmentId: engineering.id,
      managerId: lead.id,
      phone: '+1 555-0105',
      baseSalary: 5000.0,
      hourlyRate: 30.0
    }
  });

  const emp3 = await prisma.employee.create({
    data: {
      employeeCode: 'SHR-103',
      firstName: 'Priya',
      lastName: 'Nair',
      email: 'priya@smarthr.io',
      password: defaultPassword,
      role: 'EMPLOYEE',
      status: 'ACTIVE',
      designation: 'People Operations Specialist',
      departmentId: humanResources.id,
      managerId: hrManager.id,
      phone: '+1 555-0106',
      baseSalary: 4200.0,
      hourlyRate: 26.0
    }
  });

  const allEmployees = [admin, hrManager, lead, emp1, emp2, emp3];

  // Seed Leave Balances for all
  for (const emp of allEmployees) {
    const leaveTypes = [
      { type: 'ANNUAL', allocated: 15.0, used: 2.0 },
      { type: 'MEDICAL', allocated: 10.0, used: 1.0 },
      { type: 'CASUAL', allocated: 7.0, used: 0.0 },
      { type: 'UNPAID', allocated: 30.0, used: 0.0 }
    ];
    for (const lt of leaveTypes) {
      await prisma.leaveBalance.create({
        data: {
          employeeId: emp.id,
          leaveType: lt.type,
          allocated: lt.allocated,
          used: lt.used,
          year: 2026
        }
      });
    }
  }

  // Create Sample Attendance for Today (Floor Monitor test data)
  const todayStr = new Date().toISOString().split('T')[0];

  // Admin clocked in earlier
  const adminAtt = await prisma.attendance.create({
    data: {
      employeeId: admin.id,
      date: todayStr,
      clockIn: new Date(Date.now() - 4 * 3600 * 1000),
      status: 'PRESENT',
      totalWorkMins: 240,
      totalBreakMins: 20
    }
  });
  await prisma.breakSession.create({
    data: {
      attendanceId: adminAtt.id,
      type: 'TEA',
      startTime: new Date(Date.now() - 2.5 * 3600 * 1000),
      endTime: new Date(Date.now() - (2.5 * 3600 - 20 * 60) * 1000),
      durationMins: 20
    }
  });

  // Lead is currently on lunch break!
  const leadAtt = await prisma.attendance.create({
    data: {
      employeeId: lead.id,
      date: todayStr,
      clockIn: new Date(Date.now() - 3.5 * 3600 * 1000),
      status: 'PRESENT',
      totalWorkMins: 180,
      totalBreakMins: 30
    }
  });
  await prisma.breakSession.create({
    data: {
      attendanceId: leadAtt.id,
      type: 'LUNCH',
      startTime: new Date(Date.now() - 30 * 60 * 1000),
      endTime: null // Active break
    }
  });

  // Emp1 is clocked in and active
  await prisma.attendance.create({
    data: {
      employeeId: emp1.id,
      date: todayStr,
      clockIn: new Date(Date.now() - 2 * 3600 * 1000),
      status: 'PRESENT',
      totalWorkMins: 120,
      totalBreakMins: 0
    }
  });

  // Emp2 has a pending leave request
  await prisma.leaveRequest.create({
    data: {
      employeeId: emp2.id,
      leaveType: 'ANNUAL',
      startDate: new Date('2026-10-15T09:00:00Z'),
      endDate: new Date('2026-10-17T18:00:00Z'),
      daysCount: 3,
      reason: 'Attending IEEE Cloud Computing Conference & family summit',
      status: 'PENDING'
    }
  });

  // Emp3 has an approved leave request
  await prisma.leaveRequest.create({
    data: {
      employeeId: emp3.id,
      leaveType: 'CASUAL',
      startDate: new Date(Date.now() - 86400000),
      endDate: new Date(Date.now() + 86400000),
      daysCount: 2,
      reason: 'Personal family engagement',
      status: 'APPROVED',
      approverId: hrManager.id,
      reviewNotes: 'Approved. Enjoy your time off.',
      reviewedAt: new Date(Date.now() - 86400000)
    }
  });

  // Audit Logs
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: 'SYSTEM_INITIALIZATION',
      resource: 'AUTH',
      details: 'SmartHR enterprise database initialized and seeded with demo departments and users',
      ipAddress: '127.0.0.1'
    }
  });

  console.log('✅ SmartHR Seed complete! 4 Roles Created:');
  console.log('   Admin:    admin@smarthr.io    / password123');
  console.log('   HR:       hr@smarthr.io       / password123');
  console.log('   Manager:  lead@smarthr.io     / password123');
  console.log('   Employee: employee@smarthr.io / password123');
}

main()
  .catch((e) => {
    console.error('Error seeding DB:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
