import React, { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { SessionsModal } from '../modules/portal/SessionsModal';
import {
  School,
  Shield,
  LogOut,
  Laptop,
  UserCheck,
  LayoutDashboard,
  Calendar,
  BookOpen,
  Users,
  Award,
  GraduationCap,
} from 'lucide-react';

export const ERPLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sessionsOpen, setSessionsOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Minimal Sidebar Shell */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-white/10 gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0">
            <School className="w-5 h-5" />
          </div>
          <span className="font-bold text-base tracking-tight truncate">
            Little Angels ERP
          </span>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <Link
            to="/portal"
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-lg bg-indigo-600/20 text-indigo-300 font-medium text-sm transition-colors"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Portal Overview</span>
          </Link>

          <div className="pt-3 pb-1 px-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Academic Foundation
          </div>

          <Link
            to="/portal/academic-sessions"
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-lg hover:bg-white/5 text-slate-300 hover:text-white font-medium text-sm transition-colors"
          >
            <Calendar className="w-4 h-4 text-indigo-400" />
            <span>Academic Sessions</span>
          </Link>

          <Link
            to="/portal/classes"
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-lg hover:bg-white/5 text-slate-300 hover:text-white font-medium text-sm transition-colors"
          >
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <span>Classes</span>
          </Link>

          <Link
            to="/portal/sections"
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-lg hover:bg-white/5 text-slate-300 hover:text-white font-medium text-sm transition-colors"
          >
            <Users className="w-4 h-4 text-indigo-400" />
            <span>Sections</span>
          </Link>

          <Link
            to="/portal/subjects"
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-lg hover:bg-white/5 text-slate-300 hover:text-white font-medium text-sm transition-colors"
          >
            <Award className="w-4 h-4 text-indigo-400" />
            <span>Global Subjects</span>
          </Link>

          <div className="pt-3 pb-1 px-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Faculty & Assignments
          </div>

          <Link
            to="/portal/teachers"
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-lg hover:bg-white/5 text-slate-300 hover:text-white font-medium text-sm transition-colors"
          >
            <GraduationCap className="w-4 h-4 text-indigo-400" />
            <span>Teachers</span>
          </Link>

          <Link
            to="/portal/teaching-assignments"
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-lg hover:bg-white/5 text-slate-300 hover:text-white font-medium text-sm transition-colors"
          >
            <UserCheck className="w-4 h-4 text-indigo-400" />
            <span>Teaching Assignments</span>
          </Link>

          <div className="pt-3 pb-1 px-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Students & Enrollment
          </div>

          <Link
            to="/portal/students"
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-lg hover:bg-white/5 text-slate-300 hover:text-white font-medium text-sm transition-colors"
          >
            <GraduationCap className="w-4 h-4 text-indigo-400" />
            <span>Students Directory</span>
          </Link>

          <Link
            to="/portal/guardians"
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-lg hover:bg-white/5 text-slate-300 hover:text-white font-medium text-sm transition-colors"
          >
            <Users className="w-4 h-4 text-indigo-400" />
            <span>Guardians</span>
          </Link>

          <Link
            to="/portal/enrollments"
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-lg hover:bg-white/5 text-slate-300 hover:text-white font-medium text-sm transition-colors"
          >
            <School className="w-4 h-4 text-indigo-400" />
            <span>Enrollment Matrix</span>
          </Link>

          <div className="pt-3 pb-1 px-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Curriculum & Timetable
          </div>

          <Link
            to="/portal/curriculum"
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-lg hover:bg-white/5 text-slate-300 hover:text-white font-medium text-sm transition-colors"
          >
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <span>Curriculum & Rooms</span>
          </Link>

          <Link
            to="/portal/timetable"
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-lg hover:bg-white/5 text-slate-300 hover:text-white font-medium text-sm transition-colors"
          >
            <School className="w-4 h-4 text-indigo-400" />
            <span>Timetable & Workload</span>
          </Link>

          <Link
            to="/portal/academic-calendar"
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-lg hover:bg-white/5 text-slate-300 hover:text-white font-medium text-sm transition-colors"
          >
            <Calendar className="w-4 h-4 text-indigo-400" />
            <span>Academic Calendar</span>
          </Link>
        </nav>

        {user && (
          <div className="p-4 border-t border-white/10 space-y-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-400 font-bold text-xs shrink-0">
                {user.identifier.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">
                  {user.identifier}
                </p>
                <p className="text-[10px] text-indigo-400 font-medium tracking-wider uppercase truncate">
                  {user.role}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5 pt-1">
              <button
                onClick={() => setSessionsOpen(true)}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                title="Manage Multi-Device Sessions"
              >
                <Laptop className="w-3.5 h-3.5" />
                <span>Sessions</span>
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded bg-red-600/20 hover:bg-red-600/30 text-red-400 text-xs font-medium transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Phase 2: Authentication, Multi-Device Sessions & RBAC Active
            </span>
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">
                <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span className="text-xs font-semibold text-indigo-900">
                  Role: {user.role}
                </span>
              </div>
            )}
            <Link
              to="/"
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold transition-colors"
            >
              ← Back to Public Website
            </Link>
          </div>
        </header>

        <main className="flex-1 p-8">
          <Outlet />
        </main>

        <SessionsModal
          isOpen={sessionsOpen}
          onClose={() => setSessionsOpen(false)}
        />
      </div>
    </div>
  );
};
