import React, { useState, useEffect, useRef } from 'react';
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
  Moon,
  Search,
  CheckCircle2,
  SlidersHorizontal,
  Home,
  Check,
  Calendar,
  AlertTriangle,
  User,
  Shield,
  Layers,
  Sparkles
} from 'lucide-react';

export const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const searchInputRef = useRef(null);
  const notifRef = useRef(null);
  const userMenuRef = useRef(null);

  // Keyboard shortcut listener: Ctrl + / or Cmd + / to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setNotificationsOpen(false);
        setUserDropdownOpen(false);
        setSearchFocused(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navGroups = [
    {
      group: 'Core Dashboards',
      items: [
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
        }
      ]
    },
    {
      group: 'Workforce & Time',
      items: [
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
          roles: ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'],
          badge: 'Approvals'
        },
        {
          label: 'Employee Directory',
          path: '/employees',
          icon: Users,
          roles: ['ADMIN', 'HR', 'MANAGER']
        }
      ]
    },
    {
      group: 'Finance & Compliance',
      items: [
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
      ]
    }
  ];

  // Flattened nav items for search filtering
  const allNavItems = navGroups.flatMap((g) => g.items).filter((i) => i.roles.includes(user?.role));

  const filteredSearchResults = searchQuery.trim()
    ? allNavItems.filter((item) =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700/50';
      case 'HR':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700/50';
      case 'MANAGER':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700/50';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/50';
    }
  };

  // Compute breadcrumbs path
  const getBreadcrumb = () => {
    switch (location.pathname) {
      case '/admin-dashboard':
        return { section: 'Dashboard', page: 'Admin Dashboard' };
      case '/floor-monitor':
        return { section: 'Operations', page: 'Live Floor Monitor' };
      case '/attendance':
        return { section: 'Timekeeping', page: 'My Time & Breaks' };
      case '/leaves':
        return { section: 'HR Workforce', page: 'Leave Management' };
      case '/employees':
        return { section: 'Human Resources', page: 'Employee Directory' };
      case '/payroll':
        return { section: 'Finance', page: 'Payroll Engine' };
      case '/audit-logs':
        return { section: 'Security', page: 'Audit & Compliance' };
      default:
        return { section: 'Workspace', page: 'Overview' };
    }
  };

  const breadcrumb = getBreadcrumb();

  const notifications = [
    {
      id: 1,
      title: 'Leave Request Submitted',
      desc: 'Elena Rostova requested 3 days Casual Leave',
      time: '10 min ago',
      unread: true,
      type: 'leave'
    },
    {
      id: 2,
      title: 'High Attendance Rate',
      desc: 'Floor presence is currently above 92% today',
      time: '45 min ago',
      unread: true,
      type: 'attendance'
    },
    {
      id: 3,
      title: 'Monthly Payroll Run Prepared',
      desc: 'Q4 disbursements draft ready for final review',
      time: '2 hours ago',
      unread: false,
      type: 'payroll'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090D16] text-slate-800 dark:text-slate-100 flex flex-col md:flex-row antialiased transition-colors duration-200">
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-[#0D1424] border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
        <SmartHRLogo className="w-8 h-8" showText={true} textClassName="text-base" />
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
          >
            {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-slate-600" />}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Sidebar Navigation (Dreams Technologies Inspired) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-[#0D1424] border-r border-slate-200/90 dark:border-slate-800/90 flex flex-col justify-between transition-transform duration-200 md:static md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-0 max-md:-translate-x-full'
        }`}
      >
        <div className="flex-1 flex flex-col min-h-0">
          {/* Logo Header */}
          <div className="px-5 py-4 border-b border-slate-200/90 dark:border-slate-800/80 flex items-center justify-between">
            <SmartHRLogo className="w-9 h-9" textSize="text-lg" showText={true} />
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
              v2.6 PRO
            </span>
          </div>

          {/* Current User Quick Info Card */}
          <div className="mx-3.5 my-3.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                {user?.firstName?.[0]}
                {user?.lastName?.[0]}
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#0D1424]"></span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {user?.designation || 'Specialist'}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${getRoleBadgeColor(
                    user?.role
                  )}`}
                >
                  {user?.role}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  {user?.employeeCode}
                </span>
              </div>
            </div>
          </div>

          {/* Grouped Navigation Links */}
          <nav className="flex-1 px-3 space-y-4 overflow-y-auto">
            {navGroups.map((group) => {
              const accessibleItems = group.items.filter((item) =>
                item.roles.includes(user?.role)
              );
              if (accessibleItems.length === 0) return null;

              return (
                <div key={group.group} className="space-y-1">
                  <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                    {group.group}
                  </p>
                  {accessibleItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                          isActive
                            ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 font-semibold shadow-xs'
                            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <Icon
                            size={16}
                            className={
                              isActive
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-slate-400 dark:text-slate-400'
                            }
                          />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                              item.badge === 'Live'
                                ? 'bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30 animate-pulse'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer with Theme Switcher Pill & Org Info */}
        <div className="p-3.5 border-t border-slate-200/90 dark:border-slate-800/80 space-y-2.5">
          {/* Dual-Theme Pill */}
          <div className="flex items-center justify-between p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => theme !== 'light' && toggleTheme()}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                !isDark
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sun size={13} className={!isDark ? 'text-amber-500' : ''} />
              <span>Light</span>
            </button>
            <button
              onClick={() => theme !== 'dark' && toggleTheme()}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                isDark
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700/60'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Moon size={13} className={isDark ? 'text-blue-400' : ''} />
              <span>Dark</span>
            </button>
          </div>

          <div className="flex items-center justify-between px-1 text-[11px] text-slate-500 dark:text-slate-400">
            <span>Org: SHR-PROD-26</span>
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              99.9% Online
            </span>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 transition-colors cursor-pointer"
          >
            <LogOut size={14} />
            <span>Sign Out Session</span>
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Enterprise Top Navbar (Dreams Technologies SmartHR Reference) */}
        <header className="hidden md:flex items-center justify-between px-6 py-3 bg-white dark:bg-[#0D1424] border-b border-slate-200/90 dark:border-slate-800 sticky top-0 z-40 transition-colors">
          {/* Left: Breadcrumbs & Quick Module Pill */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 space-x-1.5">
              <Home size={14} className="text-slate-400 dark:text-slate-400" />
              <span>/</span>
              <span className="font-medium text-slate-600 dark:text-slate-300">{breadcrumb.section}</span>
              <span>/</span>
              <span className="font-bold text-slate-900 dark:text-white">{breadcrumb.page}</span>
            </div>
          </div>

          {/* Center: Global Search Bar with Keyboard Hint (Ctrl + /) */}
          <div className="relative w-80 lg:w-96">
            <div className="relative flex items-center">
              <Search
                size={15}
                className="absolute left-3 text-slate-400 dark:text-slate-400 pointer-events-none"
              />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                placeholder="Search modules, roster, payroll..."
                className="w-full pl-9 pr-18 py-1.5 text-xs bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
              <div className="absolute right-2 flex items-center pointer-events-none">
                <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-semibold text-slate-400 dark:text-slate-400 bg-slate-200/70 dark:bg-slate-800 border border-slate-300/80 dark:border-slate-700 rounded">
                  Ctrl /
                </kbd>
              </div>
            </div>

            {/* Instant Search Results Dropdown */}
            {searchFocused && searchQuery.trim() && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-[#0D1424] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden z-50 py-1 max-h-64 overflow-y-auto">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                  Quick Navigation Results
                </div>
                {filteredSearchResults.length > 0 ? (
                  filteredSearchResults.map((res) => {
                    const ResIcon = res.icon;
                    return (
                      <button
                        key={res.path}
                        onMouseDown={() => {
                          navigate(res.path);
                          setSearchQuery('');
                          setSearchFocused(false);
                        }}
                        className="w-full text-left px-3.5 py-2 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer text-xs"
                      >
                        <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                          <ResIcon size={14} className="text-emerald-500" />
                          <span className="font-medium">{res.label}</span>
                        </div>
                        <ChevronRight size={12} className="text-slate-400" />
                      </button>
                    );
                  })
                ) : (
                  <div className="px-3 py-3 text-xs text-slate-500 dark:text-slate-400 text-center">
                    No matching modules found
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Actions, Notifications, Theme, User Pill */}
          <div className="flex items-center space-x-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 transition cursor-pointer"
            >
              {isDark ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-slate-600" />}
            </button>

            {/* Notification Dropdown Trigger */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                title="Notifications"
              >
                <Bell size={16} />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-[#0D1424]"></span>
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-[#0D1424] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden">
                  <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">Notifications</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">2 unread system alerts</p>
                    </div>
                    <button
                      onClick={() => setNotificationsOpen(false)}
                      className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                    >
                      Mark all read
                    </button>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-72 overflow-y-auto">
                    {notifications.map((item) => (
                      <div
                        key={item.id}
                        className={`p-3 text-xs hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer ${
                          item.unread ? 'bg-emerald-50/30 dark:bg-emerald-500/5' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-slate-900 dark:text-white text-xs">
                            {item.title}
                          </p>
                          <span className="text-[10px] text-slate-400 dark:text-slate-400 whitespace-nowrap">
                            {item.time}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                  <div className="p-2 border-t border-slate-100 dark:border-slate-800 text-center bg-slate-50/50 dark:bg-slate-900/30">
                    <button
                      onClick={() => {
                        navigate('/audit-logs');
                        setNotificationsOpen(false);
                      }}
                      className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer"
                    >
                      View All Compliance Logs &rarr;
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="w-px h-6 bg-slate-200 dark:border-slate-800"></div>

            {/* User Profile Dropdown Pill */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center space-x-2.5 p-1.5 pr-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-transparent hover:border-slate-200 dark:hover:border-slate-700/60 transition cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                  {user?.firstName?.[0]}
                  {user?.lastName?.[0]}
                </div>
                <div className="text-left hidden lg:block">
                  <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                    {user?.role}
                  </p>
                </div>
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-[#0D1424] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden py-1">
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-mono">
                      {user?.email}
                    </p>
                    <span
                      className={`inline-block mt-1 text-[9px] font-bold px-1.5 py-0.2 rounded border ${getRoleBadgeColor(
                        user?.role
                      )}`}
                    >
                      {user?.role}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      navigate('/attendance');
                      setUserDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center gap-2 cursor-pointer"
                  >
                    <Clock size={14} className="text-slate-400" />
                    <span>My Attendance</span>
                  </button>
                  <button
                    onClick={() => {
                      navigate('/leaves');
                      setUserDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center gap-2 cursor-pointer"
                  >
                    <CalendarDays size={14} className="text-slate-400" />
                    <span>Leave Requests</span>
                  </button>
                  <div className="border-t border-slate-100 dark:border-slate-800 my-1"></div>
                  <button
                    onClick={logout}
                    className="w-full text-left px-4 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Route Body */}
        <div className="p-4 sm:p-6 md:p-8 flex-1 max-w-7xl w-full mx-auto">{children}</div>
      </main>
    </div>
  );
};

