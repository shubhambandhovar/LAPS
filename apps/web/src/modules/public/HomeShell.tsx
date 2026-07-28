import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/api';
import { HealthStatusResponse, ApiResponse } from '@laps/shared';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Link } from 'react-router-dom';

export const HomeShell: React.FC = () => {
  const {
    data: health,
    isLoading,
    isError,
    refetch,
  } = useQuery<ApiResponse<HealthStatusResponse>>({
    queryKey: ['health'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<HealthStatusResponse>>('/health');
      return res.data;
    },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <span className="inline-block px-3 py-1 rounded-full bg-accent-500/20 text-accent-600 text-xs font-semibold uppercase tracking-wider mb-4">
          Phase 1: Technical Foundation Established
        </span>
        <h1 className="text-4xl sm:text-5xl font-heading font-bold text-primary-700 tracking-tight">
          Little Angels School
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          Gohad, Madhya Pradesh • Pre-Primary up to Class 10
        </p>
        <div className="mt-8 flex justify-center space-x-4">
          <Link to="/portal">
            <Button variant="primary" size="lg">
              Explore Portal Shell →
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="secondary" size="lg">
              Portal Login (Phase 2)
            </Button>
          </Link>
        </div>
      </div>

      {/* Backend API Health Verification Card */}
      <div className="max-w-xl mx-auto">
        <Card
          title="Backend API Connectivity Check"
          subtitle="Real-time verification of /api/v1/health via Vite proxy & CORS"
          footer={
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400">
                Auto-refreshed via TanStack Query v5
              </span>
              <Button variant="ghost" size="sm" onClick={() => refetch()}>
                Refresh Health
              </Button>
            </div>
          }
        >
          {isLoading && (
            <div className="py-8 text-center text-slate-500 text-sm">
              Checking backend API connectivity...
            </div>
          )}

          {isError && (
            <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
              <p className="font-semibold">❌ API Connection Failed</p>
              <p className="mt-1 text-xs">
                Ensure the backend Express server is running on port 5000 and CORS is configured.
              </p>
            </div>
          )}

          {health && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-surface-border">
                <span className="font-medium text-slate-600">Service:</span>
                <span className="font-semibold text-primary-700">{health.data.service}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-surface-border">
                <span className="font-medium text-slate-600">API Status:</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                  ● {health.data.status.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-surface-border">
                <span className="font-medium text-slate-600">MongoDB Database:</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                  ● {health.data.database.status.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="font-medium text-slate-600">Environment:</span>
                <span className="text-slate-700 font-mono text-xs">{health.data.environment}</span>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
