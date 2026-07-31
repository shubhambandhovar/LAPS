import React, { useState, useEffect } from 'react';
import { apiClient as api } from '../../lib/api';

export const VendorManager: React.FC = () => {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const res = await api.get('/inventory/vendors');
      setVendors(res.data.data.vendors);
    } catch (error) {
      console.error('Failed to fetch vendors', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendor Directory</h1>
          <p className="text-gray-500 mt-1">Manage supplier information</p>
        </div>
        <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
          + Add Vendor
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-sm font-medium text-gray-500">
              <th className="p-4">Vendor Code</th>
              <th className="p-4">Name</th>
              <th className="p-4">Contact</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {vendors.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">
                  No vendors found.
                </td>
              </tr>
            ) : (
              vendors.map(vendor => (
                <tr key={vendor._id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="p-4 font-medium text-sm">{vendor.vendorCode}</td>
                  <td className="p-4">{vendor.name}</td>
                  <td className="p-4">
                    <div className="text-sm">{vendor.contactPerson || '-'}</div>
                    <div className="text-xs text-gray-500">{vendor.phone}</div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        vendor.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {vendor.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button className="text-emerald-600 hover:text-emerald-800 text-sm font-medium">Edit</button>
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
