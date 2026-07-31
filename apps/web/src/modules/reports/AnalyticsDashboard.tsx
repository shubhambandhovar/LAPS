
import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { apiClient as api } from '../../lib/api';

export function AnalyticsDashboard() {
  const [moduleName, setModuleName] = useState('fees');
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.get(`/api/v1/reports/analytics/${moduleName}`).then((res: any) => {
      setData(res.data?.data?.analytics || []);
    });
  }, [moduleName]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Analytics</h1>
      <select className="border p-2 rounded mb-4" value={moduleName} onChange={(e) => setModuleName(e.target.value)}>
        <option value="fees">Fees</option>
        <option value="attendance">Attendance</option>
        <option value="exams">Exams</option>
      </select>
      <div className="grid grid-cols-1 gap-4">
        {data && data.map((item: any, idx: number) => (
          <Card key={idx} className="p-4">
            <pre>{JSON.stringify(item, null, 2)}</pre>
          </Card>
        ))}
      </div>
    </div>
  );
}
