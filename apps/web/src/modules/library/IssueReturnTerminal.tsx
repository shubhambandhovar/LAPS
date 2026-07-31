import React, { useState } from 'react';
export const IssueReturnTerminal: React.FC = () => {
  const [mode, setMode] = useState<'ISSUE' | 'RETURN'>('ISSUE');

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Issue & Return Terminal</h1>
          <p className="text-gray-500 mt-1">Fast-action terminal for processing book transactions</p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setMode('ISSUE')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              mode === 'ISSUE' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Issue
          </button>
          <button
            onClick={() => setMode('RETURN')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              mode === 'RETURN' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Return
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center space-y-4">
        <div className="text-5xl mb-4">{mode === 'ISSUE' ? '📚' : '📥'}</div>
        <h2 className="text-xl font-medium">Scan Barcode or Accession Number</h2>
        <input 
            type="text" 
            placeholder="Focus here to scan..." 
            className="w-full max-w-md mx-auto p-4 text-center text-lg bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
            autoFocus
        />
        <p className="text-sm text-gray-500">
          Press Enter to process
        </p>
      </div>
    </div>
  );
};
