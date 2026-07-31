import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiClient } from '../../lib/apiClient';

export function ReportBuilder() {
  const [module, setModule] = useState('');
  const [format, setFormat] = useState('EXCEL');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<any[]>([]);

  const handleGenerate = async () => {
    if (!module) return;
    try {
      setLoading(true);
      const res = await apiClient.post('/reports/generate', { module, filters: {} });
      setPreview(res.data.data.reportData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!module) return;
    try {
      setLoading(true);
      const res = await apiClient.post('/reports/export', { module, format });
      window.open(res.data.data.url, '_blank');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-slate-800">Report Builder & Export Center</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1 shadow-md border-t-4 border-t-indigo-500">
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Module</label>
              <Select value={module} onValueChange={setModule}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Module" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="academic">Academic</SelectItem>
                  <SelectItem value="attendance">Attendance</SelectItem>
                  <SelectItem value="fees">Fees</SelectItem>
                  <SelectItem value="hr">HR</SelectItem>
                  <SelectItem value="inventory">Inventory</SelectItem>
                  <SelectItem value="library">Library</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Export Format</label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger>
                  <SelectValue placeholder="Format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EXCEL">Excel (.xlsx)</SelectItem>
                  <SelectItem value="PDF">PDF (.pdf)</SelectItem>
                  <SelectItem value="CSV">CSV (.csv)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t bg-slate-50 p-4">
            <Button variant="outline" onClick={handleGenerate} disabled={!module || loading}>
              Generate Preview
            </Button>
            <Button onClick={handleExport} disabled={!module || loading}>
              Export {format}
            </Button>
          </CardFooter>
        </Card>

        <Card className="col-span-2 shadow-md">
          <CardHeader>
            <CardTitle>Data Preview</CardTitle>
          </CardHeader>
          <CardContent>
            {preview.length === 0 ? (
              <div className="text-center text-slate-500 py-10">Select a module and generate a preview.</div>
            ) : (
              <div className="space-y-2">
                {preview.map((row, idx) => (
                  <div key={idx} className="p-3 border rounded bg-white text-sm shadow-sm">
                    {row.info || JSON.stringify(row)}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
