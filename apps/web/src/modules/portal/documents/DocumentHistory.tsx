import React, { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useGetDocumentRecords, useRevokeDocument } from '../../../api/document';
import { DocumentType, DocumentStatus } from '@laps/shared';
import { Ban, Eye } from 'lucide-react';
import { format } from 'date-fns';

export const DocumentHistory: React.FC = () => {
  const [filterType, setFilterType] = useState<DocumentType | ''>('');
  const [filterStatus, setFilterStatus] = useState<DocumentStatus | ''>('');
  
  const { data: records, isLoading } = useGetDocumentRecords({
    documentType: filterType || undefined,
    status: filterStatus || undefined,
  });

  const { mutateAsync: revokeDocument } = useRevokeDocument();

  const handleRevoke = async (id: string) => {
    if (confirm('Are you sure you want to revoke this document? This will permanently mark its QR code as invalid.')) {
      await revokeDocument(id);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Document Ledger</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">Audit trail of all generated certificates and documents.</p>
      </div>

      <div className="flex gap-4">
        <select className="p-2 border rounded" value={filterType} onChange={e => setFilterType(e.target.value as DocumentType)}>
          <option value="">All Types</option>
          {Object.values(DocumentType).map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
        </select>
        
        <select className="p-2 border rounded" value={filterStatus} onChange={e => setFilterStatus(e.target.value as DocumentStatus)}>
          <option value="">All Statuses</option>
          {Object.values(DocumentStatus).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b">
              <tr>
                <th className="p-4 font-semibold">Serial No</th>
                <th className="p-4 font-semibold">Type</th>
                <th className="p-4 font-semibold">Reference Model</th>
                <th className="p-4 font-semibold">Issued Date</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="p-4 text-center">Loading...</td></tr>
              ) : records?.map((r: any) => (
                <tr key={r.id} className="border-b last:border-0 hover:bg-slate-50">
                  <td className="p-4 font-mono font-bold text-slate-700">{r.serialNumber}</td>
                  <td className="p-4 text-slate-600">{r.documentType.replace(/_/g, ' ')}</td>
                  <td className="p-4 text-slate-600">{r.referenceModel}</td>
                  <td className="p-4 text-slate-600">{format(new Date(r.issuedDate), 'dd MMM yyyy HH:mm')}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      r.status === 'ISSUED' ? 'bg-green-100 text-green-700' :
                      r.status === 'REVOKED' ? 'bg-red-100 text-red-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="p-4 flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => alert('View implemented in Generator')}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    {r.status !== 'REVOKED' && (
                      <Button variant="danger" size="sm" onClick={() => handleRevoke(r.id)}>
                        <Ban className="w-4 h-4" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {!isLoading && records?.length === 0 && (
                <tr><td colSpan={6} className="p-4 text-center text-slate-500">No records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
