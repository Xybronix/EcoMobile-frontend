import { apiClient } from './client';

export interface DashboardStats {
  totalUsers: number;
  totalBikes: number;
  totalRides: number;
  totalRevenue: number;
  activeUsers: number;
  availableBikes: number;
  activeRides: number;
  ongoingRides: number;
  revenueToday: number;
  userGrowth: number;
  bikeUtilization: number;
  avgTripDuration: number;
  popularZones: Array<{ name: string; count: number }>;
  maintenanceBikes: number;
  weeklyGrowth: {
    users: number;
    rides: number;
    revenue: number;
  };
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
    user?: string;
  }>;
}

export interface AppSettings {
  company: {
    name: string;
    email: string;
    phone: string;
    address: string;
    website?: string;
  };
  pricing: {
    unlockFee: number;
    ratePerMinute: number;
    maxDailyRate: number;
    currency: string;
  };
  notifications: {
    emailEnabled: boolean;
    smsEnabled: boolean;
    pushEnabled: boolean;
  };
  features: {
    maintenanceMode: boolean;
    registrationOpen: boolean;
    gpsTracking: boolean;
  };
  supportEmail: string;
  timezone: string;
}

export interface Incident {
  id: string;
  userId: string;
  userName: string;
  bikeId: string;
  bikeName: string;
  type: 'technical' | 'accident' | 'damaged' | 'payment' | 'theft';
  status: 'pending' | 'in-progress' | 'resolved' | 'rejected';
  description: string;
  refundAmount?: number;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
  attachments?: string[];
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  description: string;
  resource: string;
  resourceId?: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  module: string;
  status: 'success' | 'error' | 'warning';
}

export interface PaginatedIncidents {
  incidents: Incident[];
  total: number;
  pages: number;
  currentPage: number;
}

export interface PaginatedLogs {
  logs: ActivityLog[];
  total: number;
  pages: number;
  currentPage: number;
}

export interface PricingConfig {
  unlockFee: number;
  perMinuteRate: number;
  freeMinutes: number;
  maxDailyCharge: number;
  currency: string;
  discounts: Array<{
    name: string;
    percentage: number;
    conditions: string;
  }>;
}

export class AdminService {
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await apiClient.get<DashboardStats>('/admin/dashboard/stats');
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Erreur lors de la récupération des statistiques');
    }

    return response.data;
  }

  async getSettings(): Promise<AppSettings> {
    const response = await apiClient.get<AppSettings>('/admin/settings');
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Erreur lors de la récupération des paramètres');
    }

    return response.data;
  }

  async updateSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
    const response = await apiClient.put<AppSettings>('/admin/settings', settings);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Erreur lors de la mise à jour des paramètres');
    }

    return response.data;
  }

  async getPricing(): Promise<AppSettings['pricing']> {
    const response = await apiClient.get<AppSettings['pricing']>('/admin/pricing');
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Erreur lors de la récupération des tarifs');
    }

    return response.data;
  }

  async updatePricing(pricing: Partial<AppSettings['pricing']>): Promise<AppSettings['pricing']> {
    const response = await apiClient.put<AppSettings['pricing']>('/admin/pricing', pricing);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Erreur lors de la mise à jour des tarifs');
    }

    return response.data;
  }

  async getIncidents(params?: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
  }): Promise<PaginatedIncidents> {
    const response = await apiClient.get<PaginatedIncidents>('/admin/incidents', params);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Erreur lors de la récupération des signalements');
    }

    return response.data;
  }

  async updateIncident(id: string, data: {
    status?: string;
    refundAmount?: number;
    adminNote?: string;
  }): Promise<Incident> {
    const response = await apiClient.put<Incident>(`/admin/incidents/${id}`, data);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Erreur lors de la mise à jour du signalement');
    }

    return response.data;
  }

  async getActivityLogs(params?: {
    page?: number;
    limit?: number;
    action?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<PaginatedLogs> {
    const response = await apiClient.get<PaginatedLogs>('/admin/activity-logs', params);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Erreur lors de la récupération des journaux');
    }

    return response.data;
  }
}

export const adminService = new AdminService();