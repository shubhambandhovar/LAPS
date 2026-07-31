import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { apiClient } from '../../lib/apiClient';

interface DashboardData {
  totalStudents: number;
  totalEmployees: number;
  totalFees: number;
  activeBookIssues: number;
  totalAssetValue: number;
}

export function ExecutiveDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/dashboard/executive');
      setData(res.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-4">Loading Executive Dashboard...</div>;
  if (!data) return <div className="p-4">Failed to load dashboard</div>;

  const chartData = [
    { name: 'Students', value: data.totalStudents },
    { name: 'Employees', value: data.totalEmployees },
    { name: 'Book Issues', value: data.activeBookIssues },
  ];

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
          Executive Dashboard
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500 shadow-md">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-500">Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{data.totalStudents}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 shadow-md">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-500">Total Fees Collected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">${data.totalFees.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-md">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-500">Asset Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">${data.totalAssetValue.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 shadow-md">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-slate-500">Total Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{data.totalEmployees}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Key Metrics Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip cursor={{ fill: 'transparent' }} />
                <Bar dataKey="value" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
