import React, { useState } from 'react';
import QRCode from 'react-qr-code';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Printer, UserPlus } from 'lucide-react';
import { useGenerateQr } from '../../../api/qr';
import { QrType } from '@laps/shared';

// Mock data for demonstration - in reality, we'd fetch actual users via API
const mockStudents = [
  { id: '1', name: 'Alice Smith', class: '10th', section: 'A', bloodGroup: 'O+', emergency: '9876543210' },
  { id: '2', name: 'Bob Johnson', class: '10th', section: 'B', bloodGroup: 'B+', emergency: '9123456789' },
];

export const IdCardGenerator: React.FC = () => {
  const [selectedStudent, setSelectedStudent] = useState(mockStudents[0]);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);

  const { mutateAsync: generateQr, isPending } = useGenerateQr();

  const handleGenerate = async () => {
    try {
      const qr = await generateQr({
        qrType: QrType.STUDENT_ID,
        referenceId: selectedStudent.id,
      });
      setGeneratedToken(qr.secureToken);
    } catch (error) {
      console.error('Failed to generate QR', error);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Digital ID Generator</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Generate and print PVC ID Cards with secure QR Codes.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={handlePrint} disabled={!generatedToken}>
            <Printer className="w-4 h-4 mr-2" /> Print ID Card
          </Button>
          <Button onClick={handleGenerate} disabled={isPending}>
            <UserPlus className="w-4 h-4 mr-2" /> Generate Secure Token
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 print:block print:w-full">
        {/* Controls - Hidden during print */}
        <div className="space-y-4 print:hidden">
          <Card className="p-6">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">Select Target User</h3>
            <select 
              className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              value={selectedStudent.id}
              onChange={(e) => {
                const s = mockStudents.find(st => st.id === e.target.value);
                if (s) {
                  setSelectedStudent(s);
                  setGeneratedToken(null);
                }
              }}
            >
              {mockStudents.map(s => (
                <option key={s.id} value={s.id}>{s.name} - Class {s.class} {s.section}</option>
              ))}
            </select>
          </Card>
        </div>

        {/* ID Card Preview - CR80 standard PVC size (3.375" x 2.125") mapped to pixels */}
        <div className="flex justify-center items-start print:items-center">
          <div className="relative w-[3.375in] h-[2.125in] bg-white border-2 border-slate-200 rounded-xl overflow-hidden shadow-xl print:shadow-none print:border-none flex flex-row">
            {/* Left Col - School & Photo */}
            <div className="w-1/3 bg-indigo-600 text-white p-2 flex flex-col items-center justify-between">
              <div className="text-center">
                <div className="w-8 h-8 bg-white/20 rounded-full mx-auto mb-1" />
                <p className="text-[8px] font-bold leading-tight">LITTLE ANGELS</p>
                <p className="text-[6px]">SCHOOL</p>
              </div>
              <div className="w-16 h-20 bg-slate-200 rounded-md overflow-hidden">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedStudent.id}`} alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <p className="text-[6px] font-bold">STUDENT ID</p>
            </div>

            {/* Right Col - Details & QR */}
            <div className="w-2/3 p-3 flex flex-col justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 leading-tight uppercase">{selectedStudent.name}</h2>
                <p className="text-[10px] text-slate-600 font-semibold mb-2">Class: {selectedStudent.class} '{selectedStudent.section}'</p>
                
                <div className="text-[8px] text-slate-700 space-y-0.5">
                  <p><span className="font-bold">ID NO:</span> STU-{selectedStudent.id.padStart(4, '0')}</p>
                  <p><span className="font-bold">DOB:</span> 15-Aug-2010</p>
                  <p><span className="font-bold">BLOOD:</span> <span className="text-red-600 font-bold">{selectedStudent.bloodGroup}</span></p>
                  <p><span className="font-bold">EMERGENCY:</span> {selectedStudent.emergency}</p>
                </div>
              </div>
              
              <div className="absolute bottom-2 right-2 flex flex-col items-center">
                {generatedToken ? (
                  <div className="bg-white p-1 rounded border border-slate-200">
                    <QRCode
                      value={generatedToken}
                      size={48}
                      level="Q"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center text-[6px] text-slate-400 text-center rounded">
                    Generate<br/>Token
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
