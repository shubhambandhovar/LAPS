import React, { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { IdCardTemplate, IdCardUserType, IdCardLayoutType, CardElementType, CardElement } from '@laps/shared';
import { useSaveTemplate } from '../../../api/idCard';
import { Save, Type, Image as ImageIcon, QrCode, Baseline } from 'lucide-react';

export const TemplateBuilder: React.FC = () => {
  const { mutateAsync: saveTemplate, isPending } = useSaveTemplate();

  const [activeTemplate, setActiveTemplate] = useState<Partial<IdCardTemplate>>({
    name: 'New Template',
    targetUserType: IdCardUserType.STUDENT,
    layoutType: IdCardLayoutType.PVC,
    width: 212.5, // 2.125 inches * 100
    height: 337.5, // 3.375 inches * 100 (Portrait CR80)
    frontElements: [],
    backElements: [],
    isDefault: true,
  });

  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  const addElement = (type: CardElementType) => {
    const newEl: CardElement = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      x: 20,
      y: 20,
      value: type === CardElementType.TEXT ? 'New Text' : '',
      fontSize: 12,
      color: '#000000',
    };
    setActiveTemplate(prev => ({
      ...prev,
      frontElements: [...(prev.frontElements || []), newEl]
    }));
  };

  const handleSave = async () => {
    await saveTemplate(activeTemplate as IdCardTemplate);
    alert('Template saved successfully');
  };

  const renderCanvas = () => {
    return (
      <div 
        className="relative bg-white border border-slate-300 shadow-lg mx-auto"
        style={{ width: `${activeTemplate.width}px`, height: `${activeTemplate.height}px`, zoom: 1.5 }}
      >
        {activeTemplate.frontElements?.map(el => (
          <div
            key={el.id}
            onClick={() => setSelectedElementId(el.id)}
            style={{
              position: 'absolute',
              left: `${el.x}px`,
              top: `${el.y}px`,
              fontSize: `${el.fontSize}px`,
              color: el.color,
              fontFamily: el.fontFamily || 'sans-serif',
              fontWeight: el.fontWeight || 'normal',
              cursor: 'move',
              border: selectedElementId === el.id ? '1px dashed blue' : 'none'
            }}
          >
            {el.type === CardElementType.TEXT && (el.value || 'Text')}
            {el.type === CardElementType.IMAGE && <div className="w-16 h-16 bg-slate-200 flex items-center justify-center text-xs">Image</div>}
            {el.type === CardElementType.QR && <QrCode className="w-12 h-12" />}
            {el.type === CardElementType.BARCODE && <Baseline className="w-16 h-8" />}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Template Builder</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">Drag and drop elements to design ID cards</p>
        </div>
        <Button onClick={handleSave} disabled={isPending}>
          <Save className="w-4 h-4 mr-2" /> Save Template
        </Button>
      </div>

      <div className="grid grid-cols-12 gap-6 flex-1">
        {/* Tools */}
        <Card className="col-span-3 p-4 space-y-4 h-[600px] overflow-y-auto">
          <h3 className="font-bold text-slate-700">Add Elements</h3>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" className="w-full" onClick={() => addElement(CardElementType.TEXT)}>
              <Type className="w-4 h-4 mr-2" /> Text
            </Button>
            <Button variant="secondary" className="w-full" onClick={() => addElement(CardElementType.IMAGE)}>
              <ImageIcon className="w-4 h-4 mr-2" /> Photo
            </Button>
            <Button variant="secondary" className="w-full" onClick={() => addElement(CardElementType.QR)}>
              <QrCode className="w-4 h-4 mr-2" /> QR
            </Button>
            <Button variant="secondary" className="w-full" onClick={() => addElement(CardElementType.BARCODE)}>
              <Baseline className="w-4 h-4 mr-2" /> Barcode
            </Button>
          </div>

          <h3 className="font-bold text-slate-700 mt-6 pt-4 border-t">Properties</h3>
          {selectedElementId ? (
            <div className="space-y-3">
              {/* Simplistic properties editor for demonstration */}
              <div>
                <label className="text-xs font-semibold text-slate-500">Value / Binding</label>
                <input 
                  type="text" 
                  className="w-full p-2 border rounded text-sm"
                  value={activeTemplate.frontElements?.find(e => e.id === selectedElementId)?.value || ''}
                  onChange={e => {
                    setActiveTemplate(prev => ({
                      ...prev,
                      frontElements: prev.frontElements?.map(el => el.id === selectedElementId ? { ...el, value: e.target.value } : el)
                    }))
                  }}
                />
                <p className="text-[10px] text-slate-400 mt-1">Use {'{{student.name}}'} syntax for bindings.</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-500">X Position (px)</label>
                  <input type="number" className="w-full p-2 border rounded text-sm" 
                    value={activeTemplate.frontElements?.find(e => e.id === selectedElementId)?.x || 0}
                    onChange={e => setActiveTemplate(prev => ({
                      ...prev, frontElements: prev.frontElements?.map(el => el.id === selectedElementId ? { ...el, x: parseInt(e.target.value) } : el)
                    }))}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500">Y Position (px)</label>
                  <input type="number" className="w-full p-2 border rounded text-sm"
                    value={activeTemplate.frontElements?.find(e => e.id === selectedElementId)?.y || 0}
                    onChange={e => setActiveTemplate(prev => ({
                      ...prev, frontElements: prev.frontElements?.map(el => el.id === selectedElementId ? { ...el, y: parseInt(e.target.value) } : el)
                    }))}
                  />
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Select an element on the canvas to edit its properties.</p>
          )}
        </Card>

        {/* Canvas */}
        <Card className="col-span-9 p-8 bg-slate-50 flex items-center justify-center overflow-auto">
          {renderCanvas()}
        </Card>
      </div>
    </div>
  );
};
