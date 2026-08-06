import React, { useState } from 'react';
import { DocumentTemplate, DocumentType, DocumentLayoutType, DocumentElementType, DocumentElement } from '@laps/shared';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useSaveDocumentTemplate } from '../../../api/document';
import { Save, Type, Image as ImageIcon, QrCode, Baseline, FileText, PenTool } from 'lucide-react';

export const DocumentTemplateBuilder: React.FC = () => {
  const { mutateAsync: saveTemplate, isPending } = useSaveDocumentTemplate();

  const [activeTemplate, setActiveTemplate] = useState<Partial<DocumentTemplate>>({
    name: 'New A4 Document Template',
    documentType: DocumentType.BONAFIDE,
    layoutType: DocumentLayoutType.A4_PORTRAIT,
    width: 794, // 210mm at 96 DPI
    height: 1123, // 297mm at 96 DPI
    elements: [],
  });

  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  const addElement = (type: DocumentElementType) => {
    const newEl: DocumentElement = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      x: 50,
      y: 50,
      value: type === DocumentElementType.TEXT ? 'Enter Text Here (supports {{variable}})' : '',
      fontSize: 16,
      color: '#000000',
    };
    setActiveTemplate(prev => ({
      ...prev,
      elements: [...(prev.elements || []), newEl]
    }));
  };

  const handleSave = async () => {
    await saveTemplate(activeTemplate as DocumentTemplate);
    alert('Template saved successfully');
  };

  const renderCanvas = () => {
    return (
      <div 
        className="relative bg-white shadow-xl mx-auto border border-slate-200"
        style={{ 
          width: `${activeTemplate.width}px`, 
          height: `${activeTemplate.height}px`,
          transform: 'scale(0.6)', // scale down to fit screen
          transformOrigin: 'top center'
        }}
      >
        {activeTemplate.elements?.map(el => (
          <div
            key={el.id}
            onClick={() => setSelectedElementId(el.id)}
            style={{
              position: 'absolute',
              left: `${el.x}px`,
              top: `${el.y}px`,
              fontSize: `${el.fontSize}px`,
              color: el.color,
              fontFamily: el.fontFamily || 'Times New Roman, serif',
              fontWeight: el.fontWeight || 'normal',
              cursor: 'move',
              border: selectedElementId === el.id ? '2px dashed blue' : 'none',
              minWidth: el.type === DocumentElementType.TEXT ? '200px' : 'auto',
              whiteSpace: 'pre-wrap'
            }}
          >
            {el.type === DocumentElementType.TEXT && (el.value || 'Text')}
            {el.type === DocumentElementType.IMAGE && <div className="w-32 h-32 bg-slate-200 flex items-center justify-center text-xs">Image/Logo</div>}
            {el.type === 'SIGNATURE_PLACEHOLDER' && <div className="w-48 h-16 border-2 border-dashed border-blue-400 bg-blue-50 flex flex-col items-center justify-center text-blue-500 rounded"><PenTool className="w-5 h-5 mb-1" /><span className="text-[10px] font-bold">DIGITAL SIGNATURE</span></div>}
            {el.type === DocumentElementType.QR && <QrCode className="w-24 h-24" />}
            {el.type === DocumentElementType.BARCODE && <Baseline className="w-48 h-16" />}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <FileText className="text-blue-500 w-8 h-8" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Document Template Builder</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">Design dynamic A4/Letter document templates</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={isPending}>
          <Save className="w-4 h-4 mr-2" /> Save Template
        </Button>
      </div>

      <div className="grid grid-cols-12 gap-6 flex-1">
        {/* Tools */}
        <Card className="col-span-3 p-4 space-y-4 h-[750px] overflow-y-auto">
          <h3 className="font-bold text-slate-700">Add Elements</h3>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" className="w-full" onClick={() => addElement(DocumentElementType.TEXT)}>
              <Type className="w-4 h-4 mr-2" /> Text Block
            </Button>
            <Button variant="secondary" className="w-full" onClick={() => addElement(DocumentElementType.IMAGE)}>
              <ImageIcon className="w-4 h-4 mr-2" /> Image/Logo
            </Button>
            <Button variant="secondary" className="w-full" onClick={() => addElement(DocumentElementType.QR)}>
              <QrCode className="w-4 h-4 mr-2" /> QR Auth
            </Button>
            <Button variant="secondary" className="w-full" onClick={() => addElement(DocumentElementType.BARCODE)}>
              <Baseline className="w-4 h-4 mr-2" /> Barcode
            </Button>
            <Button variant="secondary" className="w-full col-span-2" onClick={() => addElement(DocumentElementType.SIGNATURE_PLACEHOLDER as DocumentElementType)}>
              <PenTool className="w-4 h-4 mr-2" /> Signature Placeholder
            </Button>
          </div>

          <h3 className="font-bold text-slate-700 mt-6 pt-4 border-t">Properties</h3>
          {selectedElementId ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-500">Content / Binding</label>
                <textarea 
                  className="w-full p-2 border rounded text-sm h-32"
                  value={activeTemplate.elements?.find(e => e.id === selectedElementId)?.value || ''}
                  onChange={e => {
                    setActiveTemplate(prev => ({
                      ...prev,
                      elements: prev.elements?.map(el => el.id === selectedElementId ? { ...el, value: e.target.value } : el)
                    }))
                  }}
                />
                <p className="text-[10px] text-slate-400 mt-1">Example: This is to certify that {'{{student.name}}'} is a bonafide student.</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-500">X Position (px)</label>
                  <input type="number" className="w-full p-2 border rounded text-sm" 
                    value={activeTemplate.elements?.find(e => e.id === selectedElementId)?.x || 0}
                    onChange={e => setActiveTemplate(prev => ({
                      ...prev, elements: prev.elements?.map(el => el.id === selectedElementId ? { ...el, x: parseInt(e.target.value) } : el)
                    }))}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500">Y Position (px)</label>
                  <input type="number" className="w-full p-2 border rounded text-sm"
                    value={activeTemplate.elements?.find(e => e.id === selectedElementId)?.y || 0}
                    onChange={e => setActiveTemplate(prev => ({
                      ...prev, elements: prev.elements?.map(el => el.id === selectedElementId ? { ...el, y: parseInt(e.target.value) } : el)
                    }))}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500">Font Size (px)</label>
                  <input type="number" className="w-full p-2 border rounded text-sm"
                    value={activeTemplate.elements?.find(e => e.id === selectedElementId)?.fontSize || 16}
                    onChange={e => setActiveTemplate(prev => ({
                      ...prev, elements: prev.elements?.map(el => el.id === selectedElementId ? { ...el, fontSize: parseInt(e.target.value) } : el)
                    }))}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500">Weight</label>
                  <select className="w-full p-2 border rounded text-sm"
                    value={activeTemplate.elements?.find(e => e.id === selectedElementId)?.fontWeight || 'normal'}
                    onChange={e => setActiveTemplate(prev => ({
                      ...prev, elements: prev.elements?.map(el => el.id === selectedElementId ? { ...el, fontWeight: e.target.value } : el)
                    }))}
                  >
                    <option value="normal">Normal</option>
                    <option value="bold">Bold</option>
                  </select>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Select an element on the canvas to edit its properties.</p>
          )}
        </Card>

        {/* Canvas Area */}
        <div className="col-span-9 bg-slate-100 flex justify-center overflow-auto p-4 rounded-lg shadow-inner relative" style={{ height: '750px' }}>
          {renderCanvas()}
        </div>
      </div>
    </div>
  );
};
