import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Clock,
  CalendarDays,
  Users,
  Banknote,
  ShieldAlert,
  LogOut,
  Building2,
  ChevronRight,
  Bell,
  Menu,
  X,
  Activity
} from 'lucide-react';

export const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    {
      label: 'Admin Dashboard',
      path: '/admin-dashboard',
      icon: LayoutDashboard,
      roles: ['ADMIN', 'HR'],
      badge: 'Pro'
    },
    {
      label: 'Live Floor Monitor',
      path: '/floor-monitor',
      icon: Activity,
      roles: ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'],
      badge: 'Live'
    },
    {
      label: 'My Time & Breaks',
      path: '/attendance',
      icon: Clock,
      roles: ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE']
    },
    {
      label: 'Leave Management',
      path: '/leaves',
      icon: CalendarDays,
      roles: ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE']
    },
    {
      label: 'Employee Directory',
      path: '/employees',
      icon: Users,
      roles: ['ADMIN', 'HR', 'MANAGER']
    },
    {
      label: 'Payroll Engine',
      path: '/payroll',
      icon: Banknote,
      roles: ['ADMIN', 'HR', 'EMPLOYEE']
    },
    {
      label: 'Audit & Compliance',
      path: '/audit-logs',
      icon: ShieldAlert,
      roles: ['ADMIN', 'HR']
    }
  ];

  const allowedNav = navItems.filter((item) => item.roles.includes(user?.role));

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-900/40 text-purple-300 border-purple-700/50';
      case 'HR':
        return 'bg-emerald-900/40 text-emerald-300 border-emerald-700/50';
      case 'MANAGER':
        return 'bg-amber-900/40 text-amber-300 border-amber-700/50';
      default:
        return 'bg-blue-900/40 text-blue-300 border-blue-700/50';
    }
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col md:flex-row antialiased">
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-[#0F172A] border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-white shadow-lg shadow-emerald-900/40">
            S
          </div>
          <span className="font-semibold text-lg tracking-tight text-white">SmartHR</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-slate-400 hover:text-white"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0D1424] border-r border-slate-800 flex flex-col justify-between transition-transform duration-200 md:static md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-0 max-md:-translate-x-full'
        }`}
      >
        <div>
          {/* Logo Header */}
          <div className="px-6 py-6 border-b border-slate-800/80 flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center font-black text-white text-lg shadow-md shadow-emerald-950/60 ring-1 ring-white/10">
              S
            </div>
            <div>
              <div className="font-bold text-base tracking-wide text-white flex items-center gap-1.5">
                SmartHR
                <span className="text-[10px] bg-slate-800 text-slate-300 font-medium px-1.5 py-0.5 rounded border border-slate-700">
                  ENT
                </span>
              </div>
              <p className="text-xs text-slate-400">Enterprise Workforce</p>
            </div>
          </div>

          {/* Current User Quick Info */}
          <div className="mx-4 my-4 p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-semibold text-emerald-400 text-sm">
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${getRoleBadgeColor(
                    user?.role
                  )}`}
                >
                  {user?.role}
                </span>
                <span className="text-[11px] text-slate-400 truncate">
                  {user?.employeeCode}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 space-y-1 mt-2">
            <p className="px-3 text-[11px] font-medium uppercase tracking-wider text-slate-300 mb-2">
              Workspace Modules
            </p>
            {allowedNav.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-emerald-600/15 text-emerald-400 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon
                      size={18}
                      className={isActive ? 'text-emerald-400' : 'text-slate-400'}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800/80">
          <div className="flex items-center justify-between px-3 py-2 text-xs text-slate-300 mb-2">
            <span>Org ID: SHR-PROD-26</span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              99.9% Up
            </span>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 border border-rose-900/30 transition-colors"
          >
            <LogOut size={16} />
            <span>Sign Out Session</span>
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Bar Banner / Status */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 bg-[#0D1424]/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40">
          <div>
            <h1 className="text-lg font-semibold text-white tracking-tight">
              Enterprise Workforce Management
            </h1>
            <p className="text-xs text-slate-400">
              Department: {user?.department?.name || 'General Operations'} • Logged in as{' '}
              <span className="text-slate-200 font-medium">{user?.designation}</span>
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span>Session Secure • JWT HS256</span>
            </div>
            <div className="w-px h-6 bg-slate-800"></div>
            <div className="text-right">
              <p className="text-xs font-semibold text-slate-200">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric'
                })}
              </p>
              <p className="text-[11px] text-slate-300">Real-time sync active</p>
            </div>
          </div>
        </header>

        {/* Dynamic Route Body */}
        <div className="p-4 sm:p-6 md:p-8 flex-1 max-w-7xl w-full mx-auto">{children}</div>
      </main>
    </div>
  );
};
