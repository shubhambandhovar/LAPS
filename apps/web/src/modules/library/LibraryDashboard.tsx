import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';

export const LibraryDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    // Basic mock stats since there is no analytics endpoint for library
    setStats({
      booksIssued: 150,
      overdueFines: 1250,
      activeReservations: 25,
    });
  }, []);

  if (!stats) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in duration-300">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Library Dashboard
          </h1>
          <p className="text-gray-500 mt-1">Manage books, issues, and reservations</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="text-sm font-medium text-gray-500">Books Issued</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">{stats.booksIssued}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="text-sm font-medium text-gray-500">Overdue Fines (₹)</div>
          <div className="text-3xl font-bold text-red-600 mt-2">{stats.overdueFines}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="text-sm font-medium text-gray-500">Active Reservations</div>
          <div className="text-3xl font-bold text-blue-600 mt-2">{stats.activeReservations}</div>
        </div>
      </div>

      {user?.role === 'LIBRARIAN' || user?.role === 'SUPER_ADMIN' ? (
        <div className="bg-blue-50 border border-blue-100 text-blue-800 p-4 rounded-xl">
          Use the navigation menu to manage the catalog, issues, and returns.
        </div>
      ) : (
        <div className="bg-green-50 border border-green-100 text-green-800 p-4 rounded-xl">
          Welcome to the library! You can browse books and view your issue history.
        </div>
      )}
    </div>
  );
};
