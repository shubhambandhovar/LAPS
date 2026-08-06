import React, { useRef } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { CardPreview } from './CardPreview';
import { useGetActiveCard, useGetCardMasterData, useGetTemplates } from '../../../api/idCard';
import { IdCardUserType } from '@laps/shared';
import { Download, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';

// Hardcoded for demonstration, but would come from context
const referenceId = 'dummy-student-id';
const userType = IdCardUserType.STUDENT;

export const DownloadCenter: React.FC = () => {
  const cardRef = useRef<HTMLDivElement>(null);
  const { data: templates } = useGetTemplates(userType);
  const { data: activeCard, isLoading: isCardLoading } = useGetActiveCard(referenceId);
  const { data: masterData, isLoading: isDataLoading } = useGetCardMasterData(referenceId, userType);

  const template = templates?.find(t => t.id === activeCard?.templateId) || templates?.[0];

  const handleDownloadPNG = async () => {
    if (!cardRef.current) return;
    try {
      const canvas = await html2canvas(cardRef.current, { scale: 3 }); // High Res
      const image = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `ID_Card_${referenceId}.png`;
      link.href = image;
      link.click();
    } catch (e) {
      console.error('Failed to generate image', e);
    }
  };

  if (isCardLoading || isDataLoading) {
    return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-slate-400" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Download Center</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">View and download your active Digital ID Card.</p>
      </div>

      <div className="flex gap-8">
        <Card className="p-6 inline-block">
          <div ref={cardRef}>
            {template ? (
              <CardPreview template={template} cardRecord={activeCard} masterData={masterData} />
            ) : (
              <div className="w-64 h-96 bg-slate-100 flex items-center justify-center text-slate-400">
                No Template Available
              </div>
            )}
          </div>
        </Card>
        
        <div className="space-y-4">
          <Button onClick={handleDownloadPNG} disabled={!template}>
            <Download className="w-4 h-4 mr-2" /> Download High-Res PNG
          </Button>
          <div className="text-sm text-slate-500 max-w-sm">
            <p className="mb-2"><strong>Status:</strong> {activeCard?.status || 'NOT GENERATED'}</p>
            <p>Your Digital ID Card contains a secure cryptographic QR code. Do not share screenshots of this code on social media.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
