import React from 'react';
import { Outlet, Link } from 'react-router-dom';

export const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-surface-bg">
      <header className="bg-white border-b border-surface-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-primary-500 flex items-center justify-center text-white font-heading font-bold text-lg">
              LA
            </div>
            <div>
              <span className="block font-heading font-bold text-primary-700 text-lg leading-tight">
                Little Angels School
              </span>
              <span className="block text-xs text-slate-500">Gohad, Madhya Pradesh</span>
            </div>
          </Link>

          <nav className="flex items-center space-x-6">
            <Link
              to="/"
              className="text-sm font-medium text-slate-700 hover:text-primary-500 transition-colors"
            >
              Home
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-700 transition-colors"
            >
              Portal Login
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-grow">
        <Outlet />
      </main>

      <footer className="bg-primary-700 text-white border-t border-primary-500/20 py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-sm text-primary-50">
          <p>© {new Date().getFullYear()} Little Angels School, Gohad. All rights reserved.</p>
          <p className="mt-2 sm:mt-0 text-xs text-slate-300">
            Phase 1 Foundation Technical Architecture Build
          </p>
        </div>
      </footer>
    </div>
  );
};
