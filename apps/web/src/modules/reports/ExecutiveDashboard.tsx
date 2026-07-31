
import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { apiClient as api } from '../../lib/api';

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
