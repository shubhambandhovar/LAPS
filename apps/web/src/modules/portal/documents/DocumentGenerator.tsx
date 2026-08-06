import React, { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useGetDocumentTemplates, useGenerateDocument, useGetDocumentRecordDetails } from '../../../api/document';
import { DocumentType } from '@laps/shared';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Loader2, FileCheck, Printer, Download } from 'lucide-react';
import { DocumentPreview } from './DocumentPreview';
import html2canvas from 'html2canvas';

export const DocumentGenerator: React.FC = () => {
  const [documentType, setDocumentType] = useState<DocumentType>(DocumentType.BONAFIDE);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [referenceModel, setReferenceModel] = useState<'Student' | 'Teacher' | 'Employee'>('Student');
  const [referenceId, setReferenceId] = useState<string>('');
  
  const { data: templates } = useGetDocumentTemplates(documentType);
  const { mutateAsync: generateDocument, isPending: isGenerating } = useGenerateDocument();

  const [generatedRecordId, setGeneratedRecordId] = useState<string | null>(null);

  const { data: recordDetails, isLoading: isLoadingDetails } = useGetDocumentRecordDetails(generatedRecordId || '');

  // Mock list for selection
  const { data: users } = useQuery({
    queryKey: ['users', referenceModel],
    queryFn: async () => {
      let url = '/api/v1/students';
      if (referenceModel === 'Teacher') url = '/api/v1/teachers';
      else if (referenceModel === 'Employee') url = '/api/v1/employees';
      const res = await axios.get(url);
      return res.data.data;
    }
  });

  const handleGenerate = async () => {
    if (!selectedTemplateId || !referenceId) return;
    try {
      const record = await generateDocument({
        referenceId,
        referenceModel,
        documentType,
        templateId: selectedTemplateId
      });
      setGeneratedRecordId(record.id!);
    } catch (e) {
      alert('Failed to generate document');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadImage = async () => {
    const el = document.getElementById('printable-document');
    if (!el) return;
    try {
      const canvas = await html2canvas(el, { scale: 2 });
      const image = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `${recordDetails?.record.serialNumber}.png`;
      link.href = image;
      link.click();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="print:hidden">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Issue Document</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">Generate a new official certificate or document.</p>
      </div>

      <div className="grid grid-cols-12 gap-6 print:hidden">
        <Card className="col-span-4 p-4 space-y-4">
          <div>
            <label className="text-sm font-semibold">Document Type</label>
            <select className="w-full p-2 border rounded" value={documentType} onChange={(e) => {
              setDocumentType(e.target.value as DocumentType);
              setSelectedTemplateId('');
            }}>
              {Object.values(DocumentType).map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold">Template</label>
            <select className="w-full p-2 border rounded" value={selectedTemplateId} onChange={e => setSelectedTemplateId(e.target.value)}>
              <option value="">Select Template</option>
              {templates?.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold">Target User Type</label>
            <select className="w-full p-2 border rounded" value={referenceModel} onChange={(e: any) => setReferenceModel(e.target.value)}>
              <option value="Student">Student</option>
              <option value="Teacher">Teacher</option>
              <option value="Employee">Employee</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold">Select User</label>
            <select className="w-full p-2 border rounded" value={referenceId} onChange={e => setReferenceId(e.target.value)}>
              <option value="">Select...</option>
              {users?.map((u: any) => <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.admissionNumber || u.employeeId})</option>)}
            </select>
          </div>

          <Button className="w-full mt-4" onClick={handleGenerate} disabled={isGenerating || !selectedTemplateId || !referenceId}>
            {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileCheck className="w-4 h-4 mr-2" />}
            Generate Document
          </Button>

          {recordDetails && (
            <div className="mt-8 pt-4 border-t space-y-2">
              <Button variant="secondary" className="w-full" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" /> Print Document
              </Button>
              <Button variant="secondary" className="w-full" onClick={handleDownloadImage}>
                <Download className="w-4 h-4 mr-2" /> Download PNG
              </Button>
            </div>
          )}
        </Card>

        <Card className="col-span-8 p-8 bg-slate-50 overflow-auto flex justify-center">
          {isLoadingDetails ? (
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          ) : recordDetails ? (
            <div id="printable-document" style={{ transform: 'scale(0.8)', transformOrigin: 'top center' }}>
              <DocumentPreview 
                template={(templates || []).find(t => t.id === recordDetails.record.templateId) as any}
                documentRecord={recordDetails.record}
                masterData={recordDetails.masterData}
              />
            </div>
          ) : (
            <div className="text-slate-400 flex flex-col items-center justify-center h-[500px]">
              <FileCheck className="w-16 h-16 mb-4 opacity-50" />
              <p>Generate a document to preview it here.</p>
            </div>
          )}
        </Card>
      </div>

      {/* Print-only View */}
      {recordDetails && (
        <div className="hidden print:block">
          <DocumentPreview 
            template={(templates || []).find(t => t.id === recordDetails.record.templateId) as any}
            documentRecord={recordDetails.record}
            masterData={recordDetails.masterData}
          />
        </div>
      )}
    </div>
  );
};
