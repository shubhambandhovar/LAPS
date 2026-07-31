const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'apps/web/src/modules/reports');

const execDash = `
import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import api from '../../lib/api';

export function ExecutiveDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/v1/reports/dashboard/executive').then((res: any) => {
      setData(res.data?.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!data) return <div>No data available</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Executive Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <h2 className="text-lg font-bold">Total Students</h2>
          <p className="text-3xl mt-2">{data.totalStudents}</p>
        </Card>
        <Card className="p-4">
          <h2 className="text-lg font-bold">Total Employees</h2>
          <p className="text-3xl mt-2">{data.totalEmployees}</p>
        </Card>
        <Card className="p-4">
          <h2 className="text-lg font-bold">Total Fees Collected</h2>
          <p className="text-3xl mt-2">{data.totalFeesCollected}</p>
        </Card>
        <Card className="p-4">
          <h2 className="text-lg font-bold">Pending Fees</h2>
          <p className="text-3xl mt-2">{data.totalFeesPending}</p>
        </Card>
      </div>
    </div>
  );
}
`;

const analyticsDash = `
import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import api from '../../lib/api';

export function AnalyticsDashboard() {
  const [moduleName, setModuleName] = useState('fees');
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.get(\`/api/v1/reports/analytics/\${moduleName}\`).then((res: any) => {
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
`;

const reportBuilder = `
import { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import api from '../../lib/api';

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
`;

const savedReports = `
import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import api from '../../lib/api';

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
`;

const scheduledReports = `
import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import api from '../../lib/api';

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
`;

fs.writeFileSync(path.join(dir, 'ExecutiveDashboard.tsx'), execDash);
fs.writeFileSync(path.join(dir, 'AnalyticsDashboard.tsx'), analyticsDash);
fs.writeFileSync(path.join(dir, 'ReportBuilder.tsx'), reportBuilder);
fs.writeFileSync(path.join(dir, 'SavedReports.tsx'), savedReports);
fs.writeFileSync(path.join(dir, 'ScheduledReports.tsx'), scheduledReports);
console.log('Rewrote Web UI components');
