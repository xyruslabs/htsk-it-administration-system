import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';

import { Login } from './pages/Login';
import { AdminDashboard } from './pages/AdminDashboard';
import { FloorMonitor } from './pages/FloorMonitor';
import { Attendance } from './pages/Attendance';
import { LeaveManagement } from './pages/LeaveManagement';
import { Employees } from './pages/Employees';
import { Payroll } from './pages/Payroll';
import { AuditLogs } from './pages/AuditLogs';

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
        <Routes>
          {/* Public login portal */}
          <Route path="/login" element={<Login />} />

          {/* Admin Dashboard */}
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'HR']}>
                <Layout>
                  <AdminDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Protected Enterprise Routes */}
          <Route
            path="/floor-monitor"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE']}>
                <Layout>
                  <FloorMonitor />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/attendance"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE']}>
                <Layout>
                  <Attendance />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/leaves"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE']}>
                <Layout>
                  <LeaveManagement />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/employees"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'HR', 'MANAGER']}>
                <Layout>
                  <Employees />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/payroll"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'HR', 'EMPLOYEE']}>
                <Layout>
                  <Payroll />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/audit-logs"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'HR']}>
                <Layout>
                  <AuditLogs />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Default fallback route */}
          <Route path="*" element={<Navigate to="/floor-monitor" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
