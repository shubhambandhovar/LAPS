import React from 'react';
import { IdCardTemplate, CardElementType, IdCardRecord } from '@laps/shared';
import QRCode from 'react-qr-code';
import Barcode from 'react-barcode';

interface CardPreviewProps {
  template: IdCardTemplate;
  cardRecord?: IdCardRecord;
  masterData?: any;
}

export const CardPreview: React.FC<CardPreviewProps> = ({ template, cardRecord, masterData }) => {
  const renderElement = (el: any) => {
    let value = el.value || '';
    
    // Simple binding engine: replace {{field}} with masterData[field]
    if (masterData && typeof value === 'string') {
      const regex = /\{\{(.*?)\}\}/g;
      value = value.replace(regex, (match, p1) => {
        const parts = p1.trim().split('.');
        let obj = masterData;
        for (const part of parts) {
          if (!obj) break;
          // E.g. student.name => obj is already student data, so just 'name' or 'firstName'
          // We assume masterData is the flat entity returned by API
          if (part === 'student' || part === 'teacher') continue; 
          obj = obj[part];
        }
        return obj !== undefined ? obj : match;
      });
    }

    const style: React.CSSProperties = {
      position: 'absolute',
      left: `${el.x}px`,
      top: `${el.y}px`,
      width: el.width ? `${el.width}px` : undefined,
      height: el.height ? `${el.height}px` : undefined,
      fontSize: el.fontSize ? `${el.fontSize}px` : undefined,
      fontFamily: el.fontFamily || 'sans-serif',
      fontWeight: el.fontWeight || 'normal',
      color: el.color || '#000',
      backgroundColor: el.backgroundColor,
      border: el.borderWidth ? `${el.borderWidth}px solid ${el.borderColor || '#000'}` : undefined,
      borderRadius: el.borderRadius ? `${el.borderRadius}px` : undefined,
      textAlign: el.textAlign as any,
      zIndex: el.zIndex || 1,
    };

    switch (el.type) {
      case CardElementType.TEXT:
        return <div key={el.id} style={style}>{value}</div>;
      case CardElementType.IMAGE:
        return <img key={el.id} src={value} style={{ ...style, objectFit: 'cover' }} alt="" />;
      case CardElementType.QR:
        return (
          <div key={el.id} style={style}>
            {cardRecord?.qrCodeToken ? (
              <QRCode value={cardRecord.qrCodeToken} size={el.width || 64} level="Q" />
            ) : (
              <div className="w-full h-full bg-slate-200 border-2 border-dashed flex items-center justify-center text-[10px]">QR</div>
            )}
          </div>
        );
      case CardElementType.BARCODE:
        return (
          <div key={el.id} style={style}>
            {cardRecord?.qrCodeToken ? (
              <Barcode value={cardRecord.qrCodeToken} width={el.width ? el.width / 100 : 1} height={el.height || 40} displayValue={false} />
            ) : (
              <div className="w-full h-full bg-slate-200 border-2 border-dashed flex items-center justify-center text-[10px]">BARCODE</div>
            )}
          </div>
        );
      case CardElementType.SHAPE:
        return <div key={el.id} style={style} />;
      default:
        return null;
    }
  };

  return (
    <div 
      className="relative bg-white shadow overflow-hidden"
      style={{
        width: `${template.width}px`,
        height: `${template.height}px`,
        backgroundColor: template.backgroundColor || '#fff',
        backgroundImage: template.backgroundImageUrl ? `url(${template.backgroundImageUrl})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {template.frontElements?.map(renderElement)}
    </div>
  );
};
