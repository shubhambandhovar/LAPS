import React from 'react';
import { Card } from '../../../components/ui/Card';
import { useScanHistory } from '../../../api/qr';
import { Loader2, History, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { QrScanResult } from '@laps/shared';
import { format } from 'date-fns';

export const ScanHistory: React.FC = () => {
  const { data, isLoading, isError } = useScanHistory(1, 100);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center">
        <AlertCircle className="w-5 h-5 mr-2" />
        Failed to load scan history.
      </div>
    );
  }

  const getResultIcon = (result: QrScanResult) => {
    switch (result) {
      case QrScanResult.SUCCESS:
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case QrScanResult.FORBIDDEN:
      case QrScanResult.EXPIRED:
      case QrScanResult.INVALID:
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-slate-500" />;
    }
  };

  const getResultColor = (result: QrScanResult) => {
    switch (result) {
      case QrScanResult.SUCCESS:
        return 'text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/40';
      case QrScanResult.FORBIDDEN:
        return 'text-orange-700 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/40';
      case QrScanResult.EXPIRED:
      case QrScanResult.INVALID:
        return 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/40';
      default:
        return 'text-slate-700 bg-slate-100 dark:text-slate-400 dark:bg-slate-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 rounded-xl">
          <History className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Scan Audit Logs</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Real-time history of all QR Code scans across the institution.
          </p>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200">
              <tr>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Action / Context</th>
                <th className="p-4 font-semibold">Scanned By</th>
                <th className="p-4 font-semibold">IP Address</th>
                <th className="p-4 font-semibold text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    No scan logs found.
                  </td>
                </tr>
              ) : (
                data.data.map((log: any) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="p-4">
                      <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold gap-1.5 ${getResultColor(log.result)}`}>
                        {getResultIcon(log.result)}
                        {log.result}
                      </div>
                    </td>
                    <td className="p-4 font-medium text-slate-900 dark:text-white">
                      {log.action}
                    </td>
                    <td className="p-4">
                      {log.scannedBy}
                    </td>
                    <td className="p-4 font-mono text-xs text-slate-500">
                      {log.ipAddress || 'Unknown'}
                    </td>
                    <td className="p-4 text-right whitespace-nowrap text-slate-500">
                      {log.scannedAt ? format(new Date(log.scannedAt), 'PP pp') : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
