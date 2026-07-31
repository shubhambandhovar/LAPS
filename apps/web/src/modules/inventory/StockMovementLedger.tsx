import React, { useState, useEffect } from 'react';
import { apiClient as api } from '../../lib/api';

export const StockMovementLedger: React.FC = () => {
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMovements();
  }, []);

  const fetchMovements = async () => {
    try {
      const res = await api.get('/inventory/stock/movements');
      setMovements(res.data.data.movements);
    } catch (error) {
      console.error('Failed to fetch stock movements', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock Movement Ledger</h1>
          <p className="text-gray-500 mt-1">Audit trail for all consumable stock changes</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-sm font-medium text-gray-500">
              <th className="p-4">Date</th>
              <th className="p-4">Item</th>
              <th className="p-4">Type</th>
              <th className="p-4">Quantity</th>
              <th className="p-4">Recorded By</th>
            </tr>
          </thead>
          <tbody>
            {movements.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">
                  No stock movements recorded.
                </td>
              </tr>
            ) : (
              movements.map(movement => (
                <tr key={movement._id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="p-4 text-sm text-gray-500">
                    {new Date(movement.movementDate).toLocaleString()}
                  </td>
                  <td className="p-4 font-medium">{movement.consumableId?.name || 'Unknown'}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        movement.movementType === 'PURCHASE' ? 'bg-blue-100 text-blue-800' :
                        movement.movementType === 'ISSUE' ? 'bg-orange-100 text-orange-800' :
                        movement.movementType === 'RETURN' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                    }`}>
                      {movement.movementType}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`font-medium ${
                        ['ISSUE'].includes(movement.movementType) ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {['ISSUE'].includes(movement.movementType) ? '-' : '+'}{movement.quantity}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-500">
                    {movement.recordedByUserId?.identifier || 'System'}
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
