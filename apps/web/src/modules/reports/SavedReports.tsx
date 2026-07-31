
import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { apiClient as api } from '../../lib/api';

export function SavedReports() {
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    api.get('/api/v1/reports/saved').then((res: any) => {
      setReports(res.data?.data || []);
    });
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Saved Reports</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map((report: any) => (
          <Card key={report._id} className="p-4 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold">{report.name}</h2>
              <p className="text-sm text-gray-500">{report.module}</p>
            </div>
            <Button variant="secondary">Run</Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
