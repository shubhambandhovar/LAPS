import React, { useState, useEffect } from 'react';
import { apiClient as api } from '../../lib/api';

export const ConsumableManager: React.FC = () => {
  const [consumables, setConsumables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConsumables();
  }, []);

  const fetchConsumables = async () => {
    try {
      const res = await api.get('/inventory/consumables');
      setConsumables(res.data.data.consumables);
    } catch (error) {
      console.error('Failed to fetch consumables', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Consumable Manager</h1>
          <p className="text-gray-500 mt-1">Manage expendable items, stationery, and lab stock</p>
        </div>
        <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
          + Add Consumable
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {consumables.map(item => {
          const isLowStock = item.currentStock < item.minimumStock;
          return (
            <div key={item._id} className={`bg-white rounded-xl shadow-sm border p-5 flex flex-col ${isLowStock ? 'border-red-300 bg-red-50' : 'border-gray-100'}`}>
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-gray-900">{item.name}</h3>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{item.category}</span>
              </div>
              <div className="mt-4">
                <div className="text-sm text-gray-500">Current Stock</div>
                <div className={`text-2xl font-bold ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                  {item.currentStock} <span className="text-base font-normal text-gray-500">{item.unit}</span>
                </div>
              </div>
              <div className="mt-auto pt-4 flex justify-between items-center text-sm border-t border-gray-100 mt-4">
                <span className="text-gray-500">Min: {item.minimumStock}</span>
                <button className="text-emerald-600 hover:text-emerald-800 font-medium">Record Movement</button>
              </div>
            </div>
          );
        })}
        {consumables.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500">
            No consumables found.
          </div>
        )}
      </div>
    </div>
  );
};
