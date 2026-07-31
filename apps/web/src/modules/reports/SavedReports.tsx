import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiClient } from '../../lib/apiClient';
import { Play, Calendar, Trash2 } from 'lucide-react';

export function SavedReports() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSavedReports();
  }, []);

  const fetchSavedReports = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/reports/saved');
      setReports(res.data.data.reports);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      <h1 className="text-3xl font-bold text-slate-800">Saved Reports</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div>Loading...</div>
        ) : reports.length === 0 ? (
          <div className="text-slate-500">No saved reports found.</div>
        ) : (
          reports.map((report) => (
            <Card key={report._id} className="shadow hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex justify-between items-start">
                  <span className="text-lg text-indigo-700">{report.name}</span>
                  <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded">
                    {report.templateId?.module || 'Custom'}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-600 line-clamp-2">
                  {report.description || 'No description provided.'}
                </p>
                <div className="flex gap-2 pt-2 border-t">
                  <Button size="sm" variant="outline" className="flex-1 flex gap-2">
                    <Play size={14} /> Run Now
                  </Button>
                  <Button size="sm" variant="secondary" className="flex-1 flex gap-2">
                    <Calendar size={14} /> Schedule
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
