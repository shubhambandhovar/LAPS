import React, { useState, useEffect } from 'react';
import { apiClient as api } from '../../lib/api';

export const AssetManager: React.FC = () => {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const res = await api.get('/inventory/assets');
      setAssets(res.data.data.assets);
    } catch (error) {
      console.error('Failed to fetch assets', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Asset Manager</h1>
          <p className="text-gray-500 mt-1">Manage fixed assets, assignments, and repairs</p>
        </div>
        <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
          + Add Asset
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-sm font-medium text-gray-500">
              <th className="p-4">Code</th>
              <th className="p-4">Name</th>
              <th className="p-4">Category</th>
              <th className="p-4">Location</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {assets.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">
                  No assets found.
                </td>
              </tr>
            ) : (
              assets.map(asset => (
                <tr key={asset._id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="p-4 font-medium text-sm">{asset.assetCode}</td>
                  <td className="p-4">{asset.name}</td>
                  <td className="p-4 text-sm">{asset.category}</td>
                  <td className="p-4 text-sm text-gray-500">{asset.location || '-'}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        asset.status === 'IN_USE' ? 'bg-blue-100 text-blue-800' :
                        asset.status === 'IN_STORAGE' ? 'bg-gray-100 text-gray-800' :
                        asset.status === 'UNDER_REPAIR' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                    }`}>
                      {asset.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button className="text-emerald-600 hover:text-emerald-800 text-sm font-medium">Assign</button>
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
