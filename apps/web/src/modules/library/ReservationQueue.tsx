import React, { useState, useEffect } from 'react';
import { apiClient as api } from '../../lib/api';

export const ReservationQueue: React.FC = () => {
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      const res = await api.get('/library/reservations');
      setReservations(res.data.data.reservations);
    } catch (error) {
      console.error('Failed to fetch reservations', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reservation Queue</h1>
          <p className="text-gray-500 mt-1">Manage pending book requests</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-sm font-medium text-gray-500">
              <th className="p-4">Queue #</th>
              <th className="p-4">Book Title</th>
              <th className="p-4">Reserved By</th>
              <th className="p-4">Date</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reservations.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">
                  No reservations found.
                </td>
              </tr>
            ) : (
              reservations.map(res => (
                <tr key={res._id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="p-4 font-medium">{res.queuePosition}</td>
                  <td className="p-4">{res.bookId?.title || 'Unknown'}</td>
                  <td className="p-4">
                    {res.reservedByUserType}
                  </td>
                  <td className="p-4 text-sm text-gray-500">
                    {new Date(res.reservationDate).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      {res.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button className="text-red-600 hover:text-red-800 text-sm font-medium">Cancel</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
