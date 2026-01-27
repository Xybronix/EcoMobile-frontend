import { apiClient } from './client';

export interface ActivityLog {
  id: string;
  userId: string | null;
  action: string;
  resource: string;
  resourceId: string | null;
  details: string | null;
  metadata: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

export interface ActivityLogsResponse {
  logs: ActivityLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class LogService {
  async getActivityLogs(params?: {
    page?: number;
    limit?: number;
    action?: string;
    resource?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ActivityLogsResponse> {
    const response = await apiClient.get<ActivityLogsResponse>('/admin/activity-logs', params);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Erreur lors de la récupération des logs');
    }

    return response.data;
  }
}

export const logService = new LogService();