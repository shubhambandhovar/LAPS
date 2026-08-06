import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';

export const ForbiddenShell: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-slate-800/80 border border-slate-700 rounded-2xl p-8 shadow-2xl space-y-6">
        <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div>
          <span className="inline-block px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-bold uppercase tracking-wider mb-2">
            Error 403: Forbidden
          </span>
          <h1 className="text-2xl font-extrabold text-white">
            Access Denied
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            You do not have the required role or security permissions to view this module.
          </p>
        </div>

        {user && (
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-700/60 text-left flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Current User Account</p>
              <p className="font-semibold text-white text-sm">{user.identifier}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Assigned Role</p>
              <span className="inline-block px-2 py-0.5 rounded bg-indigo-600/30 text-indigo-300 font-bold text-xs uppercase">
                {user.role}
              </span>
            </div>
          </div>
        )}

        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <Link
            to="/portal"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors shadow-md"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Portal Overview</span>
          </Link>

          <button
            onClick={() => logout()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold text-sm transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
