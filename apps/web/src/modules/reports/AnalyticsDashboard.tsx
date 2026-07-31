import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { apiClient } from '../../lib/apiClient';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function AnalyticsDashboard() {
  const [module, setModule] = useState('fees');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, [module]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/analytics/${module}`);
      setData(res.data.data.analytics);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-800">Analytics Dashboard</h1>
        <Select value={module} onValueChange={setModule}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select Module" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fees">Fee Collections</SelectItem>
            <SelectItem value="attendance">Attendance Status</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>
            {module === 'fees' ? 'Fee Collection Trends' : 'Attendance Distribution'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-80 flex items-center justify-center">Loading...</div>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                {module === 'fees' ? (
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="_id" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="total" stroke="#10b981" strokeWidth={3} />
                  </LineChart>
                ) : (
                  <div className="flex flex-col space-y-4 pt-4">
                    {data.length > 0 ? (
                      data.map((item, idx) => (
                        <div key={idx} className="flex justify-between p-4 bg-white border rounded shadow-sm">
                          <span className="font-semibold">{item._id}</span>
                          <span className="text-blue-600">{item.count} Records</span>
                        </div>
                      ))
                    ) : (
                      <div>No data available</div>
                    )}
                  </div>
                )}
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
