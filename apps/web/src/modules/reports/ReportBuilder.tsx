
import { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { apiClient as api } from '../../lib/api';

export function ReportBuilder() {
  const [moduleName, setModuleName] = useState('students');
  const [reportData, setReportData] = useState<any>(null);

  const generateReport = async () => {
    const res = await api.post('/api/v1/reports/generate', { module: moduleName, filters: {} });
    setReportData(res.data?.data);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Report Builder</h1>
      <Card className="p-4 mb-4">
        <select className="border p-2 rounded mr-4" value={moduleName} onChange={(e) => setModuleName(e.target.value)}>
          <option value="students">Students</option>
          <option value="fees">Fees</option>
          <option value="attendance">Attendance</option>
        </select>
        <Button onClick={generateReport}>Generate</Button>
      </Card>
      {reportData && (
        <Card className="p-4">
          <h2 className="text-lg font-bold mb-2">Results</h2>
          <div className="overflow-auto">
            {reportData.map((row: any, idx: number) => (
               <div key={idx} className="border-b py-2">{JSON.stringify(row)}</div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
