import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { SmartHRLogo } from './SmartHRLogo';
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
  Activity,
  Sun,
  Moon
} from 'lucide-react';

export const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
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
        return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-700/50';
      case 'HR':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700/50';
      case 'MANAGER':
        return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700/50';
      default:
        return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700/50';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090D16] text-slate-800 dark:text-slate-100 flex flex-col md:flex-row antialiased transition-colors duration-200">
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-[#0F172A] border-b border-slate-200 dark:border-slate-800">
        <SmartHRLogo className="w-8 h-8" showText={true} textClassName="text-lg" />
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition"
          >
            {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-slate-600" />}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-[#0D1424] border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-transform duration-200 md:static md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-0 max-md:-translate-x-full'
        }`}
      >
        <div>
          {/* Logo Header */}
          <div className="px-5 py-5 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <SmartHRLogo className="w-9 h-9" />
              <div>
                <div className="font-bold text-base tracking-wide text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>Smart<span className="text-emerald-500 font-extrabold">HR</span></span>
                  <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    ENT
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Enterprise Workforce</p>
              </div>
            </div>
          </div>

          {/* Current User Quick Info */}
          <div className="mx-4 my-4 p-3 rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-semibold text-emerald-600 dark:text-emerald-400 text-sm shadow-sm">
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
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
                <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-mono">
                  {user?.employeeCode}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 space-y-1 mt-2">
            <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
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
                      ? 'bg-emerald-50 dark:bg-emerald-600/15 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon
                      size={18}
                      className={isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer with Theme Switcher Pill */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800/80 space-y-3">
          {/* Theme Switcher Toggle Pill */}
          <div className="flex items-center justify-between p-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => theme !== 'light' && toggleTheme()}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                !isDark
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Sun size={14} className={!isDark ? 'text-amber-500' : ''} />
              <span>Light</span>
            </button>
            <button
              onClick={() => theme !== 'dark' && toggleTheme()}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                isDark
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Moon size={14} className={isDark ? 'text-blue-400' : ''} />
              <span>Dark</span>
            </button>
          </div>

          <div className="flex items-center justify-between px-2 text-xs text-slate-500 dark:text-slate-400">
            <span>Org ID: SHR-PROD-26</span>
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              99.9% Up
            </span>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-rose-200 dark:border-rose-900/30 transition-colors cursor-pointer"
          >
            <LogOut size={16} />
            <span>Sign Out Session</span>
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Bar Banner / Status */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 bg-white/90 dark:bg-[#0D1424]/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 transition-colors">
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Enterprise Workforce Management
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Department: {user?.department?.name || 'General Operations'} • Logged in as{' '}
              <span className="text-slate-700 dark:text-slate-200 font-semibold">{user?.designation}</span>
            </p>
          </div>

          <div className="flex items-center space-x-4">
            {/* Direct Theme Switcher Icon */}
            <button
              onClick={toggleTheme}
              title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition cursor-pointer"
            >
              {isDark ? (
                <>
                  <Sun size={15} className="text-amber-400" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon size={15} className="text-slate-600" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>

            <div className="w-px h-6 bg-slate-200 dark:bg-slate-800"></div>

            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span>Session Secure • JWT HS256</span>
            </div>

            <div className="w-px h-6 bg-slate-200 dark:bg-slate-800"></div>

            <div className="text-right">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric'
                })}
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-400">Real-time sync active</p>
            </div>
          </div>
        </header>

        {/* Dynamic Route Body */}
        <div className="p-4 sm:p-6 md:p-8 flex-1 max-w-7xl w-full mx-auto">{children}</div>
      </main>
    </div>
  );
};
