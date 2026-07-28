import { Request, Response } from 'express';
import { HealthStatusResponse } from '@laps/shared';
import { getDatabaseStatus } from '../config/database';
import { sendSuccess } from '../utils/response';
import { env } from '../config/env';

export function getHealthStatus(req: Request, res: Response): void {
  void req;
  const dbStatus = getDatabaseStatus();

  const healthData: HealthStatusResponse = {
    service: 'Little Angels School ERP API',
    status: dbStatus === 'connected' ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    apiVersion: 'v1',
    database: {
      status: dbStatus,
    },
  };

  sendSuccess(res, 200, 'Service health check passed', healthData);
}
