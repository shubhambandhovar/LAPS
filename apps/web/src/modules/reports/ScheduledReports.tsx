import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiClient } from '../../lib/apiClient';
import { Trash2, Clock, Mail } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function ScheduledReports() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/scheduled-reports');
      setSchedules(res.data.data.reports);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const deleteSchedule = async (id: string) => {
    try {
      await apiClient.delete(`/scheduled-reports/${id}`);
      setSchedules(schedules.filter(s => s._id !== id));
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      <h1 className="text-3xl font-bold text-slate-800">Scheduled Reports</h1>
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div>Loading...</div>
        ) : schedules.length === 0 ? (
          <div className="text-slate-500">No scheduled reports found.</div>
        ) : (
          schedules.map((schedule) => (
            <Card key={schedule._id} className="shadow-sm hover:shadow transition-shadow">
              <CardContent className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-lg text-slate-800">
                      {schedule.savedReportId?.name || 'Unknown Report'}
                    </span>
                    <Badge variant={schedule.status === 'ACTIVE' ? 'default' : 'secondary'}>
                      {schedule.status}
                    </Badge>
                    <Badge variant="outline">{schedule.format}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <div className="flex items-center gap-1">
                      <Clock size={14} /> {schedule.frequency} ({schedule.cronExpression})
                    </div>
                    <div className="flex items-center gap-1">
                      <Mail size={14} /> {schedule.recipients.length} Recipient(s)
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  <Button size="sm" variant="destructive" onClick={() => deleteSchedule(schedule._id)}>
                    <Trash2 size={16} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
