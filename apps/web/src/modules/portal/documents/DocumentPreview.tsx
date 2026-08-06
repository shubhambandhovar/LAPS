import React from 'react';
import { DocumentTemplate, DocumentElementType, DocumentRecord } from '@laps/shared';
import QRCode from 'react-qr-code';
import Barcode from 'react-barcode';

interface DocumentPreviewProps {
  template: DocumentTemplate;
  documentRecord?: DocumentRecord;
  masterData?: any;
}

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({ template, documentRecord, masterData }) => {
  const resolveVariable = (path: string) => {
    const parts = path.trim().split('.');
    let obj = masterData;
    for (const part of parts) {
      if (!obj) break;
      // Depending on the API, masterData might already be the entity
      if (part === 'student' || part === 'teacher' || part === 'employee') continue;
      obj = obj[part];
    }
    return obj !== undefined ? obj : `{{${path}}}`;
  };

  const renderElement = (el: any) => {
    let value = el.value || '';
    
    if (masterData && typeof value === 'string') {
      const regex = /\{\{(.*?)\}\}/g;
      value = value.replace(regex, (_, p1) => {
        if (p1.trim() === 'system.currentDate') return new Date().toLocaleDateString();
        if (p1.trim() === 'record.serialNumber') return documentRecord?.serialNumber || 'SERIAL-PENDING';
        return resolveVariable(p1);
      });
    }

    const style: React.CSSProperties = {
      position: 'absolute',
      left: `${el.x}px`,
      top: `${el.y}px`,
      width: el.width ? `${el.width}px` : undefined,
      height: el.height ? `${el.height}px` : undefined,
      fontSize: el.fontSize ? `${el.fontSize}px` : undefined,
      fontFamily: el.fontFamily || 'Times New Roman, serif',
      fontWeight: el.fontWeight || 'normal',
      color: el.color || '#000',
      backgroundColor: el.backgroundColor,
      border: el.borderWidth ? `${el.borderWidth}px solid ${el.borderColor || '#000'}` : undefined,
      borderRadius: el.borderRadius ? `${el.borderRadius}px` : undefined,
      textAlign: el.textAlign as any,
      zIndex: el.zIndex || 1,
      whiteSpace: el.type === DocumentElementType.TEXT ? 'pre-wrap' : 'normal',
    };

    switch (el.type) {
      case DocumentElementType.TEXT:
        return <div key={el.id} style={style}>{value}</div>;
      case DocumentElementType.IMAGE:
        return <img key={el.id} src={value} style={{ ...style, objectFit: 'contain' }} alt="" />;
      case DocumentElementType.QR:
        return (
          <div key={el.id} style={style}>
            {documentRecord?.qrCodeToken ? (
              <QRCode value={documentRecord.qrCodeToken} size={128} level="M" />
            ) : (
              <div className="w-32 h-32 bg-slate-100 border border-dashed flex items-center justify-center text-slate-400">QR CODE</div>
            )}
          </div>
        );
      case DocumentElementType.BARCODE:
        return (
          <div key={el.id} style={style}>
            {documentRecord?.serialNumber ? (
              <Barcode value={documentRecord.serialNumber} width={1.5} height={60} displayValue={true} />
            ) : (
              <div className="w-48 h-16 bg-slate-100 border border-dashed flex items-center justify-center text-slate-400">BARCODE</div>
            )}
          </div>
        );
      case 'SIGNATURE_PLACEHOLDER': {
        // Find if this document has been signed
        // In a real app, you might map specific roles to specific placeholders. 
        // For simplicity, we just grab the first signature applied.
        const sig = documentRecord?.signatures?.[0]; // Mock logic: assume 1 signature placeholder for now
        return (
          <div key={el.id} style={style}>
            {sig ? (
              <div className="flex flex-col items-center">
                <img src={(sig.signatureId as any)?.imageUrl || 'https://via.placeholder.com/150x50?text=Signed'} alt="Signature" className="h-16 object-contain mix-blend-multiply" />
                <p className="text-[10px] font-bold mt-1">{sig.role.replace(/_/g, ' ')}</p>
                <p className="text-[8px] text-slate-500">{new Date(sig.timestamp).toLocaleString()}</p>
              </div>
            ) : (
              <div className="w-48 h-16 border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-xs">
                Pending Signature
              </div>
            )}
          </div>
        );
      }
      case DocumentElementType.SHAPE:
        return <div key={el.id} style={style} />;
      default:
        return null;
    }
  };

  return (
    <div 
      className="relative bg-white print:shadow-none print:border-none print:m-0"
      style={{
        width: `${template.width}px`,
        height: `${template.height}px`,
        backgroundColor: template.backgroundColor || '#fff',
        backgroundImage: template.backgroundImageUrl ? `url(${template.backgroundImageUrl})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        margin: '0 auto',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        pageBreakAfter: 'always',
      }}
    >
      {/* Watermark layer if present */}
      {template.watermarkUrl && (
        <div 
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: `url(${template.watermarkUrl})`,
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            zIndex: 0,
          }}
        />
      )}
      
      {template.elements?.map(renderElement)}
    </div>
  );
};
