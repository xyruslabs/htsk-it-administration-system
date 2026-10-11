import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { SmartHRLogo } from './SmartHRLogo';
import api from '../api/axios';
import {
  LayoutDashboard,
  Clock,
  Coffee,
  CalendarDays,
  Users,
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
  Sparkles,
  PlusCircle,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  UserCheck,
  CheckCheck,
  Trash2,
  Inbox
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

  const isEmployeePortal = user?.role === 'EMPLOYEE' || user?.email === 'employee@smarthr.io';

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
          label: 'Add / Mark Attendance',
          path: '/attendance',
          icon: Clock,
          roles: ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'],
          badge: 'Quick'
        },
        {
          label: 'Break Time',
          path: '/break-time',
          icon: Coffee,
          roles: ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'],
          badge: '20m/1h'
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
          roles: ['ADMIN', 'HR']
        }
      ]
    },
    {
      group: 'Security & Compliance',
      items: [
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
      case '/audit-logs':
        return { section: 'Security', page: 'Audit & Compliance' };
      default:
        return { section: 'Workspace', page: 'Overview' };
    }
  };

  const breadcrumb = getBreadcrumb();

  const defaultNotifications = [
    {
      id: 'notif-1',
      title: 'Leave Request Pending Review',
      desc: 'Elena Rostova submitted a 3-day Casual Leave request awaiting manager review.',
      time: '12m ago',
      unread: true,
      type: 'leave',
      link: '/leaves',
      badge: 'Action Required'
    },
    {
      id: 'notif-2',
      title: 'Workforce Attendance Milestone',
      desc: 'Today’s floor attendance exceeded 92% active on-duty personnel.',
      time: '45m ago',
      unread: true,
      type: 'attendance',
      link: '/floor-monitor',
      badge: 'Operational'
    },
    {
      id: 'notif-3',
      title: 'Biometric Gateway Synchronized',
      desc: 'Regional edge attendance readers and time logs synced cleanly.',
      time: '2h ago',
      unread: false,
      type: 'system',
      link: '/audit-logs',
      badge: 'Security'
    },
    {
      id: 'notif-4',
      title: 'Passcode Verification Policy Active',
      desc: 'Anti-proxy attendance rules enforced: 3–5 character passcodes required.',
      time: '4h ago',
      unread: false,
      type: 'security',
      link: '/floor-monitor',
      badge: 'Compliance'
    }
  ];

  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('smarthr_notifications_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return defaultNotifications;
  });

  const [notificationFilter, setNotificationFilter] = useState('ALL');

  useEffect(() => {
    try {
      localStorage.setItem('smarthr_notifications_v1', JSON.stringify(notifications));
    } catch (e) {
      // ignore
    }
  }, [notifications]);

  useEffect(() => {
    const fetchLiveAlerts = async () => {
      if (!user) return;
      try {
        if (['ADMIN', 'HR', 'MANAGER'].includes(user.role)) {
          const res = await api.get('/leaves?status=PENDING');
          if (res.data?.success && Array.isArray(res.data.leaves) && res.data.leaves.length > 0) {
            const pendingCount = res.data.leaves.length;
            setNotifications((prev) => {
              const exists = prev.some((n) => n.id === 'live-pending-leaves');
              if (exists) return prev;
              const liveNotif = {
                id: 'live-pending-leaves',
                title: `${pendingCount} Pending Leave Request${pendingCount > 1 ? 's' : ''}`,
                desc: `${res.data.leaves[0].employee?.firstName || 'Staff member'} and others awaiting approval.`,
                time: 'Just now',
                unread: true,
                type: 'leave',
                link: '/leaves',
                badge: 'Live Pending'
              };
              return [liveNotif, ...prev];
            });
          }
        }
      } catch (e) {
        // Silently catch
      }
    };
    fetchLiveAlerts();
  }, [user]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const handleMarkAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
    );
  };

  const handleDismissNotification = (e, id) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleClearAllNotifications = () => {
    setNotifications([]);
  };

  const handleResetSampleNotifications = () => {
    setNotifications(defaultNotifications);
  };

  const handleNotificationClick = (item) => {
    handleMarkAsRead(item.id);
    setNotificationsOpen(false);
    if (item.link) {
      navigate(item.link);
    }
  };

  const filteredNotifications = notificationFilter === 'UNREAD'
    ? notifications.filter((n) => n.unread)
    : notifications;

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'leave':
        return (
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <CalendarDays size={15} />
          </div>
        );
      case 'attendance':
        return (
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Activity size={15} />
          </div>
        );
      case 'security':
      case 'system':
        return (
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <ShieldAlert size={15} />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Bell size={15} />
          </div>
        );
    }
  };

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
          <div className="px-5 py-4 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
            <SmartHRLogo className="w-9 h-9" textSize="text-lg" showText={true} />
          </div>

          {/* Current User Quick Info Card */}
          <div className="mx-3.5 my-3.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-center space-x-3">
            <div className="relative">
              {isEmployeePortal ? (
                <div className="w-10 h-10 rounded-xl bg-emerald-600 dark:bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                  <Users size={18} />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                  {user?.firstName?.[0]}
                  {user?.lastName?.[0]}
                </div>
              )}
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#0D1424]"></span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate font-display tracking-tight">
                {isEmployeePortal ? 'Workforce Portal' : `${user?.firstName} ${user?.lastName}`}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {isEmployeePortal ? 'All Staff Attendance & Kiosk' : (user?.designation || 'Specialist')}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded border font-display tracking-wide ${getRoleBadgeColor(
                    user?.role
                  )}`}
                >
                  {isEmployeePortal ? 'ALL EMPLOYEES' : user?.role}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  {isEmployeePortal ? 'SHARED KIOSK' : user?.employeeCode}
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
                  <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-400 font-display">
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
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${
                          isActive
                            ? 'bg-slate-900 text-white dark:bg-[#121829] dark:text-[#D2FD41] border border-slate-800 dark:border-lime-400/20 font-bold shadow-xs'
                            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 font-medium'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <Icon
                            size={16}
                            className={
                              isActive
                                ? 'text-[#D2FD41] dark:text-[#D2FD41]'
                                : 'text-slate-400 dark:text-slate-400'
                            }
                          />
                          <span className={isActive ? 'font-bold' : ''}>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                              item.badge === 'Live'
                                ? 'bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30 animate-pulse'
                                : 'bg-[#D2FD41] text-[#0A0E1A] font-extrabold'
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
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60 font-bold'
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
                  ? 'bg-slate-800 text-white shadow-sm border border-slate-700/60 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Moon size={13} className={isDark ? 'text-blue-400' : ''} />
              <span>Dark</span>
            </button>
          </div>

          {/* Org & Version Badge */}
          <div className="space-y-1.5 px-0.5">
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-slate-400 dark:text-slate-500 font-medium">Org:</span>
                <span className="font-display font-extrabold text-slate-800 dark:text-slate-200 capitalize tracking-tight">
                  Dinitha
                </span>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide bg-[#D2FD41] text-[#0A0E1A] shadow-2xs whitespace-nowrap shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0A0E1A] animate-pulse" />
                v2.6 Pro
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500">
              <span>System Status</span>
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                99.9% Online
              </span>
            </div>
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
                placeholder="Search modules, roster, attendance..."
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
                className={`relative p-2 rounded-xl border transition cursor-pointer ${
                  notificationsOpen
                    ? 'bg-slate-200 dark:bg-slate-700/80 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white'
                    : 'bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-300'
                }`}
                title="Notifications & System Alerts"
                aria-label={`Notifications (${unreadCount} unread)`}
              >
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-[#0D1424] shadow-xs animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-[#0D1424] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[85vh]">
                  {/* Notification Header */}
                  <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">System Alerts</h4>
                        {unreadCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {unreadCount > 0
                          ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`
                          : 'All notifications caught up'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={handleMarkAllRead}
                          className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition cursor-pointer"
                          title="Mark all as read"
                        >
                          <CheckCheck size={13} />
                          <span>Mark all read</span>
                        </button>
                      )}
                      {notifications.length > 0 && (
                        <button
                          type="button"
                          onClick={handleClearAllNotifications}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 dark:hover:bg-rose-500/10 transition cursor-pointer"
                          title="Clear all notifications"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Filter Pills */}
                  {notifications.length > 0 && (
                    <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5 bg-slate-50/20 dark:bg-slate-900/20">
                      <button
                        type="button"
                        onClick={() => setNotificationFilter('ALL')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                          notificationFilter === 'ALL'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        All ({notifications.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setNotificationFilter('UNREAD')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                          notificationFilter === 'UNREAD'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        Unread ({unreadCount})
                      </button>
                    </div>
                  )}

                  {/* Notification List Body */}
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/60 overflow-y-auto max-h-80 flex-1">
                    {filteredNotifications.length === 0 ? (
                      <div className="py-10 px-4 text-center">
                        <div className="w-10 h-10 mx-auto mb-2.5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500">
                          <Inbox size={18} />
                        </div>
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {notificationFilter === 'UNREAD' ? 'No unread notifications' : 'No notifications'}
                        </p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                          {notificationFilter === 'UNREAD'
                            ? 'You have reviewed all incoming alerts.'
                            : 'All system and workforce telemetries are up to date.'}
                        </p>
                        {notifications.length === 0 && (
                          <button
                            type="button"
                            onClick={handleResetSampleNotifications}
                            className="mt-3 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                          >
                            Reset sample alerts
                          </button>
                        )}
                      </div>
                    ) : (
                      filteredNotifications.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleNotificationClick(item)}
                          className={`p-3 text-xs hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer group relative flex gap-3 items-start ${
                            item.unread ? 'bg-emerald-50/30 dark:bg-emerald-500/5' : ''
                          }`}
                        >
                          {getNotificationIcon(item.type)}

                          <div className="flex-1 min-w-0 pr-6">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              {item.badge && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded border bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 font-mono uppercase">
                                  {item.badge}
                                </span>
                              )}
                              <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                {item.time}
                              </span>
                              {item.unread && (
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                              )}
                            </div>
                            <p className={`text-xs ${item.unread ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-300'}`}>
                              {item.title}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                              {item.desc}
                            </p>
                          </div>

                          {/* Quick dismiss button */}
                          <button
                            type="button"
                            onClick={(e) => handleDismissNotification(e, item.id)}
                            title="Dismiss notification"
                            className="opacity-0 group-hover:opacity-100 absolute top-2.5 right-2.5 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Footer */}
                  <div className="p-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/30 text-[11px]">
                    <button
                      type="button"
                      onClick={() => {
                        navigate('/audit-logs');
                        setNotificationsOpen(false);
                      }}
                      className="font-semibold text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition cursor-pointer"
                    >
                      Audit Trail Logs &rarr;
                    </button>
                    <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                      TELEMETRY READY
                    </span>
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
                {isEmployeePortal ? (
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 dark:bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                    <Users size={15} />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                    {user?.firstName?.[0]}
                    {user?.lastName?.[0]}
                  </div>
                )}
                <div className="text-left hidden lg:block">
                  <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                    {isEmployeePortal ? 'Workforce Portal' : `${user?.firstName} ${user?.lastName}`}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                    {isEmployeePortal ? 'All Staff Access' : user?.role}
                  </p>
                </div>
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-[#0D1424] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden py-1">
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      {isEmployeePortal ? 'Workforce Portal' : `${user?.firstName} ${user?.lastName}`}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-mono">
                      {isEmployeePortal ? 'Universal Staff Terminal' : user?.email}
                    </p>
                    <span
                      className={`inline-block mt-1 text-[9px] font-bold px-1.5 py-0.2 rounded border ${getRoleBadgeColor(
                        user?.role
                      )}`}
                    >
                      {isEmployeePortal ? 'ALL EMPLOYEES' : user?.role}
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
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      window.dispatchEvent(new CustomEvent('replay-splash'));
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center gap-2 cursor-pointer"
                  >
                    <Sparkles size={14} className="text-[#D2FD41]" />
                    <span>Replay Intro Animation</span>
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

