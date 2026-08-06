import React, { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useGetApprovalQueue, useSignDocument, useGetMySignatures } from '../../../api/signature';
import { FileCheck, PenTool, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { DocumentPreview } from './DocumentPreview';
import { useGetDocumentRecordDetails } from '../../../api/document';

export const ApprovalQueue: React.FC = () => {
  const { data: queue, isLoading } = useGetApprovalQueue();
  const { data: signatures } = useGetMySignatures();
  const { mutateAsync: signDocument, isPending: isSigning } = useSignDocument();

  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [selectedSignatureId, setSelectedSignatureId] = useState<string>('');

  const { data: details, isLoading: isDetailsLoading } = useGetDocumentRecordDetails(selectedRecordId || '');

  const handleSign = async () => {
    if (!selectedRecordId || !selectedSignatureId) return alert('Select a signature');
    await signDocument({ recordId: selectedRecordId, signatureId: selectedSignatureId });
    setSelectedRecordId(null);
    alert('Document signed successfully!');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 rounded-xl">
          <FileCheck className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Approval Queue</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">Documents pending your digital signature.</p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <Card className="col-span-4 p-0 overflow-hidden h-[750px] flex flex-col">
          <div className="p-4 border-b bg-slate-50 font-bold">Pending Documents</div>
          <div className="overflow-y-auto flex-1">
            {isLoading ? (
              <p className="p-4 text-center">Loading...</p>
            ) : queue?.length === 0 ? (
              <p className="p-4 text-center text-slate-500">Your queue is empty.</p>
            ) : queue?.map((record) => (
              <div 
                key={record.id} 
                className={`p-4 border-b cursor-pointer hover:bg-blue-50 transition-colors ${selectedRecordId === record.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
                onClick={() => setSelectedRecordId(record.id!)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">{record.documentType.replace(/_/g, ' ')}</h4>
                    <p className="text-xs text-slate-500 font-mono mt-1">{record.serialNumber}</p>
                  </div>
                  <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">PENDING</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">Generated: {format(new Date(record.createdAt!), 'dd MMM, HH:mm')}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="col-span-8 p-6 bg-slate-50 flex flex-col h-[750px]">
          {selectedRecordId ? (
            isDetailsLoading ? (
              <div className="flex-1 flex justify-center items-center">Loading Preview...</div>
            ) : details ? (
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg">Document Preview</h3>
                  <div className="flex gap-2">
                    <select className="border rounded px-3 py-2 text-sm bg-white shadow-sm" value={selectedSignatureId} onChange={e => setSelectedSignatureId(e.target.value)}>
                      <option value="">-- Select Signature --</option>
                      {signatures?.map(s => <option key={s.id} value={s.id}>{s.name} ({s.designation})</option>)}
                    </select>
                    <Button onClick={handleSign} disabled={isSigning || !selectedSignatureId}>
                      <PenTool className="w-4 h-4 mr-2" /> Sign & Approve
                    </Button>
                  </div>
                </div>
                <div className="flex-1 overflow-auto bg-slate-200 p-4 rounded shadow-inner flex justify-center items-start">
                  <div style={{ transform: 'scale(0.8)', transformOrigin: 'top center' }}>
                    <DocumentPreview 
                      template={details.record.templateId as any} 
                      documentRecord={details.record} 
                      masterData={details.masterData} 
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex justify-center items-center text-red-500">Error loading document.</div>
            )
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center text-slate-400">
              <ExternalLink className="w-16 h-16 mb-4 opacity-30" />
              <p>Select a document from the queue to preview and sign.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
