import { apiClient } from './client';

export interface Ride {
  id: string;
  bikeId: string;
  bikeName: string;
  userId: string;
  userName: string;
  startTime: string;
  endTime?: string;
  duration: number;
  distance: number;
  cost: number;
  startLocation: string;
  endLocation?: string;
  status: 'ONGOING' | 'COMPLETED' | 'IN_PROGRESS' | 'CANCELLED';
}

export interface UserRidesResponse {
  rides: Ride[];
  userName: string;
}

export interface PaginatedRides {
  rides: Ride[];
  total: number;
  pages: number;
  currentPage: number;
}

export class RidesService {
  async getAllRides(params?: {
    page?: number;
    limit?: number;
    status?: string;
    bikeId?: string;
    userId?: string;
  }): Promise<PaginatedRides> {
    const response = await apiClient.get<PaginatedRides>('/rides', params);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Erreur lors de la récupération des trajets');
    }

    return response.data;
  }

  async getBikeTrips(bikeId: string): Promise<{ trips: Ride[], bikeName: string }> {
    const response = await apiClient.get<{ trips: Ride[], bikeName: string }>(`/bikes/${bikeId}/trips`);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Erreur lors de la récupération des trajets');
    }

    return response.data;
  }

  async getUserRides(userId: string): Promise<Ride[]> {
    const response = await apiClient.get<Ride[]>(`/admin/users/${userId}/rides`);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Erreur lors de la récupération des trajets');
    }

    return response.data;
  }

  async getRideById(id: string): Promise<Ride> {
    const response = await apiClient.get<Ride>(`/rides/${id}`);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Trajet non trouvé');
    }

    return response.data;
  }
}

export const ridesService = new RidesService();