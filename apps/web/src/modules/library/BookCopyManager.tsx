import React from 'react';


export const BookCopyManager: React.FC = () => {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Book Copy Manager</h1>
          <p className="text-gray-500 mt-1">Manage physical book copies, barcodes, and conditions</p>
        </div>
        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
          + Add Copy
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-sm font-medium text-gray-500">
              <th className="p-4">Accession #</th>
              <th className="p-4">Book</th>
              <th className="p-4">Condition</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={5} className="p-8 text-center text-gray-500">
                Select a book to manage copies or scan a barcode.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
