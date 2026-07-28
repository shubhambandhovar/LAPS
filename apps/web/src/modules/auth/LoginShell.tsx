import React from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Link } from 'react-router-dom';

export const LoginShell: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <Card
          title="Portal Authentication (Shell)"
          subtitle="Little Angels School — Secure Login Gateway"
          footer={
            <div className="text-center">
              <Link
                to="/"
                className="text-xs text-primary-500 hover:text-primary-700 font-medium transition-colors"
              >
                ← Return to Public Website
              </Link>
            </div>
          }
        >
          <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm mb-6">
            <p className="font-semibold">⚠️ Phase 1 Architectural Shell</p>
            <p className="mt-1 text-xs leading-relaxed">
              Authentication, JWT access tokens, and multi-device RefreshSession cookies will be
              implemented in <strong>Phase 2</strong>.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Username / Email
              </label>
              <input
                type="text"
                disabled
                placeholder="principal@littleangelsschoolgohad.edu.in"
                className="w-full px-3 py-2 border border-surface-border rounded-lg bg-slate-50 text-slate-400 text-sm cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Password
              </label>
              <input
                type="password"
                disabled
                placeholder="••••••••••••"
                className="w-full px-3 py-2 border border-surface-border rounded-lg bg-slate-50 text-slate-400 text-sm cursor-not-allowed"
              />
            </div>

            <Button variant="primary" className="w-full opacity-60 cursor-not-allowed" disabled>
              Sign In (Available in Phase 2)
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
