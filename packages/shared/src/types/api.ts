export interface PaginationMeta {
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiMeta {
  timestamp: string;
  requestId?: string;
  path?: string;
}

export interface ApiResponse<T = unknown> {
  success: true;
  statusCode: number;
  message: string;
  data: T;
  pagination?: PaginationMeta;
  meta: ApiMeta;
}

export interface ApiErrorDetail {
  field?: string;
  issue: string;
}

export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  errorCode: string;
  message: string;
  errors?: ApiErrorDetail[];
  meta: ApiMeta;
}

export interface HealthStatusResponse {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  environment: string;
  apiVersion: string;
  database: {
    status: 'connected' | 'disconnected' | 'connecting';
  };
}
