import React, { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useGetMySignatures, useSaveSignature, useDeleteSignature } from '../../../api/signature';
import { SignatureType } from '@laps/shared';
import { PenTool, Trash2, Plus } from 'lucide-react';

export const SignatureManager: React.FC = () => {
  const { data: signatures, isLoading } = useGetMySignatures();
  const { mutateAsync: saveSignature } = useSaveSignature();
  const { mutateAsync: deleteSignature } = useDeleteSignature();

  const [isAdding, setIsAdding] = useState(false);
  const [newSig, setNewSig] = useState({
    name: 'Primary Signature',
    designation: 'Principal',
    type: SignatureType.SIGNATURE,
    imageUrl: '',
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewSig(prev => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!newSig.imageUrl) return alert('Please upload an image');
    await saveSignature(newSig);
    setIsAdding(false);
    setNewSig({ name: 'Primary Signature', designation: 'Principal', type: SignatureType.SIGNATURE, imageUrl: '' });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 rounded-xl">
            <PenTool className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Signatures</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">Manage your digital signatures and official seals.</p>
          </div>
        </div>
        <Button onClick={() => setIsAdding(true)} disabled={isAdding}>
          <Plus className="w-4 h-4 mr-2" /> Add Signature
        </Button>
      </div>

      {isAdding && (
        <Card className="p-6 space-y-4 bg-slate-50 border-blue-200 shadow-inner">
          <h3 className="font-bold text-slate-700">Add New Signature</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold">Display Name</label>
              <input type="text" className="w-full p-2 border rounded" value={newSig.name} onChange={e => setNewSig({...newSig, name: e.target.value})} placeholder="e.g. Official Seal" />
            </div>
            <div>
              <label className="text-sm font-semibold">Designation</label>
              <input type="text" className="w-full p-2 border rounded" value={newSig.designation} onChange={e => setNewSig({...newSig, designation: e.target.value})} placeholder="e.g. Principal" />
            </div>
            <div>
              <label className="text-sm font-semibold">Type</label>
              <select className="w-full p-2 border rounded" value={newSig.type} onChange={e => setNewSig({...newSig, type: e.target.value as SignatureType})}>
                <option value={SignatureType.SIGNATURE}>Signature</option>
                <option value={SignatureType.SEAL}>Official Seal</option>
                <option value={SignatureType.STAMP}>Rubber Stamp</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold">Upload Image (Transparent PNG)</label>
              <input type="file" accept="image/png" className="w-full p-2 border rounded bg-white" onChange={handleFileChange} />
            </div>
          </div>
          
          {newSig.imageUrl && (
            <div className="mt-4 p-4 border border-dashed rounded bg-white flex justify-center items-center h-32">
              <img src={newSig.imageUrl} alt="Preview" className="max-h-full object-contain mix-blend-multiply" />
            </div>
          )}

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Signature</Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isLoading ? (
          <p>Loading...</p>
        ) : signatures?.length === 0 ? (
          <p className="text-slate-500 col-span-2">No signatures found. Add one to get started.</p>
        ) : signatures?.map((sig) => (
          <Card key={sig.id} className="p-6 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg">{sig.name}</h3>
                  <p className="text-sm text-slate-500">{sig.designation} &bull; {sig.type}</p>
                </div>
                <Button variant="danger" size="sm" onClick={() => {
                  if (confirm('Delete this signature?')) deleteSignature(sig.id!);
                }}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <div className="bg-slate-50 border border-dashed rounded p-4 h-32 flex justify-center items-center">
                <img src={sig.imageUrl} alt={sig.name} className="max-h-full object-contain mix-blend-multiply" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
