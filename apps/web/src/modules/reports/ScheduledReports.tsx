
import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { apiClient as api } from '../../lib/api';

export function ScheduledReports() {
  const [schedules, setSchedules] = useState<any[]>([]);

  useEffect(() => {
    api.get('/api/v1/reports/scheduled-reports').then((res: any) => {
      setSchedules(res.data?.data || []);
    });
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Scheduled Reports</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {schedules.map((schedule: any) => (
          <Card key={schedule._id} className="p-4">
            <h2 className="text-lg font-bold">{schedule.name}</h2>
            <p className="text-sm text-gray-500 mb-2">Cron: {schedule.cronExpression}</p>
            <Button variant="danger">Delete</Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
