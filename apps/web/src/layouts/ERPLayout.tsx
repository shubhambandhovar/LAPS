import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';
import { ERP_NAVIGATION_CONFIG, NavItemConfig } from './navigation.config';
import { SessionsModal } from '../modules/portal/SessionsModal';
import { FirstLoginPasswordChangeModal } from '../modules/identity/FirstLoginPasswordChangeModal';
import {
  School,
  Shield,
  LogOut,
  Laptop,
  UserCheck,
} from 'lucide-react';

export const ERPLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { can } = usePermissions();
  const navigate = useNavigate();
  const location = useLocation();
  const [sessionsOpen, setSessionsOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  /**
   * Authorizes navigation item based on role or explicit permission.
   * Super Admins bypass check.
   */
  const isAuthorized = (item: NavItemConfig): boolean => {
    if (!user || !user.role) return false;
    const currentRole = user.role.toUpperCase();
    if (currentRole === 'SUPER_ADMIN') return true;

    if (item.requiredRole && item.requiredRole.length > 0) {
      const match = item.requiredRole.some(
        (r) => r.toUpperCase() === currentRole,
      );
      if (!match) return false;
    }

    if (item.requiredPermission) {
      if (!can(item.requiredPermission)) return false;
    }

    return true;
  };

  const isActive = (to: string): boolean => {
    if (to === '/portal') {
      return location.pathname === '/portal';
    }
    return location.pathname.startsWith(to);
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Dynamic Role-Filtered Sidebar Shell */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-white/10 gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0">
            <School className="w-5 h-5" />
          </div>
          <span className="font-bold text-base tracking-tight truncate">
            Little Angels ERP
          </span>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {ERP_NAVIGATION_CONFIG.map((section, sIndex) => {
            const authorizedItems = section.items.filter(isAuthorized);
            if (authorizedItems.length === 0) return null;

            return (
              <div key={sIndex} className="space-y-1">
                {section.title && (
                  <div className="pt-3 pb-1 px-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {section.title}
                  </div>
                )}
                {authorizedItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.to);
                  return (
                    <Link
                      key={item.title}
                      to={item.to}
                      className={`flex items-center gap-2.5 px-3.5 py-2 rounded-lg font-medium text-sm transition-colors ${
                        active
                          ? 'bg-indigo-600/20 text-indigo-300 font-semibold'
                          : 'hover:bg-white/5 text-slate-300 hover:text-white'
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 ${
                          active ? 'text-indigo-400' : 'text-slate-400'
                        }`}
                      />
                      <span>{item.title}</span>
                    </Link>
                  );
                })}
              </div>
            );
          })}
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

        <FirstLoginPasswordChangeModal
          isOpen={
            !!user &&
            (user.forcePasswordChange === true ||
              user.status === 'PASSWORD_RESET_REQUIRED')
          }
        />
      </div>
    </div>
  );
};
