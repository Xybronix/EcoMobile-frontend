import { apiClient } from './client';

export interface Incident {
  id: string;
  userId: string;
  bikeId?: string;
  type: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: string;
  resolvedAt?: string;
  refundAmount?: number;
  adminNote?: string;
  resolvedBy?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  bike?: {
    id: string;
    code: string;
    model: string;
  };
  userName?: string;
  bikeName?: string;
}

export interface IncidentsResponse {
  incidents: Incident[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class IncidentService {
  async getIncidents(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<IncidentsResponse> {
    const response = await apiClient.get<IncidentsResponse>('/admin/incidents', params);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Erreur lors de la récupération des incidents');
    }

    const transformedIncidents = response.data.incidents.map(incident => ({
      ...incident,
      userName: incident.user ? `${incident.user.firstName} ${incident.user.lastName}` : 'Utilisateur inconnu',
      bikeName: incident.bike ? `${incident.bike.model} (${incident.bike.code})` : 'Vélo non spécifié'
    }));

    return {
      ...response.data,
      incidents: transformedIncidents
    };
  }

  async updateIncident(id: string, data: {
    status?: string;
    priority?: string;
    refundAmount?: number;
    adminNote?: string;
  }): Promise<Incident> {
    const response = await apiClient.put<Incident>(`/admin/incidents/${id}`, data);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Erreur lors de la mise à jour de l\'incident');
    }

    return response.data;
  }

  async createAdminCharge(data: {
    userId: string;
    bikeId?: string;
    amount: number;
    reason: string;
    description?: string;
  }): Promise<any> {
    const response = await apiClient.post('/incidents/admin/charge', data);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Erreur lors de la création de la charge');
    }

    return response.data;
  }
}

export const incidentService = new IncidentService();