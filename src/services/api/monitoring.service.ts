import { apiClient } from './client';

export interface SuspiciousMovement {
  bikeId: string;
  bikeCode: string;
  currentLocation: { lat: number; lng: number };
  lastKnownLocation: { lat: number; lng: number };
  movement: {
    distance: number;
    timeDetected: Date;
    isOutsideDepositZone: boolean;
  };
  status: 'AVAILABLE' | 'MAINTENANCE';
  lastRide?: {
    endTime: Date;
    userId: string;
    userName: string;
  };
}

export interface SecurityAlert {
  id: string;
  bikeId: string;
  alertType: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'ACTIVE' | 'RESOLVED' | 'FALSE_ALARM';
  detectedAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
  metadata: any;
}

class MonitoringService {
  async getSuspiciousMovements(): Promise<SuspiciousMovement[]> {
    const response = await apiClient.get<SuspiciousMovement[]>('/monitoring/suspicious-movements');
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Erreur lors de la récupération des mouvements suspects');
    }

    // Convertir les dates string en objets Date
    return response.data.map(movement => ({
      ...movement,
      movement: {
        ...movement.movement,
        timeDetected: new Date(movement.movement.timeDetected)
      },
      lastRide: movement.lastRide ? {
        ...movement.lastRide,
        endTime: new Date(movement.lastRide.endTime)
      } : undefined
    }));
  }

  async markAlertAsHandled(bikeId: string, action: string, note?: string): Promise<void> {
    const response = await apiClient.post('/monitoring/handle-alert', {
      bikeId,
      action,
      note
    });
    
    if (!response.success) {
      throw new Error(response.error || 'Erreur lors du traitement de l\'alerte');
    }
  }

  async getSecurityAlerts(limit: number = 50): Promise<SecurityAlert[]> {
    const response = await apiClient.get<SecurityAlert[]>('/monitoring/security-alerts', { limit });
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Erreur lors de la récupération des alertes');
    }

    return response.data.map(alert => ({
      ...alert,
      detectedAt: new Date(alert.detectedAt),
      resolvedAt: alert.resolvedAt ? new Date(alert.resolvedAt) : undefined
    }));
  }

  async startMonitoring(interval: number = 60000): Promise<void> {
    const response = await apiClient.post('/monitoring/start', { interval });
    
    if (!response.success) {
      throw new Error(response.error || 'Erreur lors du démarrage de la surveillance');
    }
  }

  async stopMonitoring(): Promise<void> {
    const response = await apiClient.post('/monitoring/stop');
    
    if (!response.success) {
      throw new Error(response.error || 'Erreur lors de l\'arrêt de la surveillance');
    }
  }
}

export const monitoringService = new MonitoringService();