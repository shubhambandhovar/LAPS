import React, { useState, useEffect } from 'react';
import { apiClient as api } from '../../lib/api';
export const InventoryDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/inventory/analytics');
      setAnalytics(res.data.data);
    } catch (error) {
      console.error('Failed to fetch inventory analytics', error);
    }
  };

  if (!analytics) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in duration-300">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Inventory Dashboard
          </h1>
          <p className="text-gray-500 mt-1">Manage assets, consumables, and vendors</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="text-sm font-medium text-gray-500">Total Asset Value (₹)</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">
            {analytics.totalAssetValue.toLocaleString()}
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="text-sm font-medium text-gray-500">Assets In Use</div>
          <div className="text-3xl font-bold text-blue-600 mt-2">{analytics.assetsInUse} / {analytics.totalAssets}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="text-sm font-medium text-gray-500">Under Repair</div>
          <div className="text-3xl font-bold text-yellow-600 mt-2">{analytics.assetsUnderRepair}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-200 hover:shadow-md transition-shadow">
          <div className="text-sm font-medium text-red-500">Low Stock Alerts</div>
          <div className="text-3xl font-bold text-red-600 mt-2">{analytics.lowStockCount}</div>
        </div>
      </div>

      {analytics.lowStockCount > 0 && (
        <div className="bg-red-50 border border-red-100 p-6 rounded-2xl">
            <h3 className="text-red-800 font-bold mb-4">Items requiring attention</h3>
            <ul className="space-y-2">
                {analytics.lowStockItems.map((item: any) => (
                    <li key={item._id} className="flex justify-between items-center text-sm">
                        <span className="font-medium text-red-700">{item.name} ({item.category})</span>
                        <span className="text-red-600">Stock: {item.currentStock} {item.unit} (Min: {item.minimumStock})</span>
                    </li>
                ))}
            </ul>
        </div>
      )}
    </div>
  );
};
