import { apiClient, getAuthToken, getApiBaseUrl } from './client';

export interface Reservation {
  id: string;
  userId: string;
  bikeId: string;
  planId: string;
  packageType: 'daily' | 'weekly' | 'monthly';
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  plan?: {
    id: string;
    name: string;
    description?: string;
    price: number;
  };
  bike?: {
    id: string;
    code: string;
    model: string;
    status: string;
  };
}

export interface ReservationStats {
  totalReservations: number;
  activeReservations: number;
  completedReservations: number;
  cancelledReservations: number;
  todayReservations: number;
  weeklyReservations: number;
}

export interface PaginatedReservations {
  reservations: Reservation[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ReservationFilters {
  status?: string;
  dateFilter?: string;
  page?: number;
  limit?: number;
  search?: string;
}

export class ReservationService {
  /**
   * Récupérer toutes les réservations avec pagination et filtres
   */
  async getAllReservations(filters: ReservationFilters = {}): Promise<PaginatedReservations> {
    const queryParams: any = { ...filters };
    
    // Adapter les paramètres pour l'API
    if (queryParams.status === 'all') {
      delete queryParams.status;
    }
    
    if (queryParams.dateFilter === 'all') {
      delete queryParams.dateFilter;
    }

    const response = await apiClient.get<any>('/admin/reservations', queryParams);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Erreur lors de la récupération des réservations');
    }

    // Adapter la réponse selon la structure de l'API
    let reservations, pagination;

    if (Array.isArray(response.data)) {
      reservations = response.data;
      pagination = {
        page: 1,
        limit: reservations.length,
        total: reservations.length,
        totalPages: 1
      };
    } else if (response.data.reservations) {
      reservations = response.data.reservations;
      pagination = response.data.pagination || {
        page: filters.page || 1,
        limit: filters.limit || 20,
        total: response.data.total || reservations.length,
        totalPages: response.data.totalPages || Math.ceil((response.data.total || reservations.length) / (filters.limit || 20))
      };
    } else {
      reservations = response.data.data?.reservations || response.data.data || [];
      pagination = response.data.pagination || response.data.data?.pagination || {
        page: filters.page || 1,
        limit: filters.limit || 20,
        total: response.data.total || reservations.length,
        totalPages: response.data.totalPages || Math.ceil((response.data.total || reservations.length) / (filters.limit || 20))
      };
    }

    return {
      reservations,
      pagination
    };
  }

  /**
   * Récupérer une réservation par son ID
   */
  async getReservationById(id: string): Promise<Reservation> {
    const response = await apiClient.get<any>(`/reservations/${id}`);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Réservation non trouvée');
    }

    return response.data;
  }

  /**
   * Récupérer les statistiques des réservations
   */
  async getReservationStats(): Promise<ReservationStats> {
    try {
      // Dans un premier temps, on calcule les stats côté client
      // car l'API ne fournit pas d'endpoint dédié
      const allReservations = await this.getAllReservations({ limit: 20 });
      
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);

      const stats: ReservationStats = {
        totalReservations: allReservations.pagination.total,
        activeReservations: allReservations.reservations.filter(r => r.status === 'ACTIVE').length,
        completedReservations: allReservations.reservations.filter(r => r.status === 'COMPLETED').length,
        cancelledReservations: allReservations.reservations.filter(r => r.status === 'CANCELLED').length,
        todayReservations: allReservations.reservations.filter(r => {
          const reservationDate = new Date(r.startDate);
          return reservationDate.toDateString() === today.toDateString();
        }).length,
        weeklyReservations: allReservations.reservations.filter(r => {
          const reservationDate = new Date(r.startDate);
          return reservationDate >= weekAgo;
        }).length
      };

      return stats;
    } catch (error) {
      console.error('Error fetching reservation stats:', error);
      // Retourner des stats par défaut en cas d'erreur
      return {
        totalReservations: 0,
        activeReservations: 0,
        completedReservations: 0,
        cancelledReservations: 0,
        todayReservations: 0,
        weeklyReservations: 0
      };
    }
  }

  /**
   * Mettre à jour le statut d'une réservation
   */
  async updateReservationStatus(id: string, status: string, reason?: string): Promise<Reservation> {
    const response = await apiClient.put<any>(`/reservations/${id}`, { 
      status,
      ...(reason && { cancellationReason: reason })
    });
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Erreur lors de la mise à jour du statut');
    }

    return response.data;
  }

  /**
   * Annuler une réservation
   */
  async cancelReservation(id: string, reason?: string): Promise<void> {
    const response = await apiClient.delete(`/reservations/${id}`);
    
    if (!response.success) {
      throw new Error(response.error || 'Erreur lors de l\'annulation de la réservation');
    }
  }

  /**
   * Rechercher des réservations
   */
  async searchReservations(query: string): Promise<Reservation[]> {
    const response = await apiClient.get<Reservation[]>('/admin/reservations/search', { q: query });
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Erreur lors de la recherche');
    }

    return response.data;
  }

  /**
   * Exporter les réservations
   */
  async exportReservations(filters: ReservationFilters = {}): Promise<Blob> {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== 'all') {
        queryParams.append(key, value.toString());
      }
    });

    queryParams.append('export', 'true');

    const token = getAuthToken();
    const apiBaseUrl = getApiBaseUrl();
    
    const response = await fetch(`${apiBaseUrl}/admin/reservations/export?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Erreur lors de l\'export des réservations');
    }

    return await response.blob();
  }

  /**
   * Récupérer les demandes de déverrouillage
   */
  async getUnlockRequests() {
    const response = await apiClient.get<any>('/admin/unlock-requests');
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Erreur lors de la récupération des demandes de déverrouillage');
    }

    return response.data;
  }

  /**
   * Valider une demande de déverrouillage
   */
  async validateUnlockRequest(requestId: string, approved: boolean, adminNote?: string) {
    const response = await apiClient.put<any>(`/admin/unlock-requests/${requestId}/validate`, {
      approved,
      adminNote
    });
    
    if (!response.success) {
      throw new Error(response.error || 'Erreur lors de la validation de la demande');
    }

    return response.data;
  }

  /**
   * Récupérer les demandes de verrouillage
   */
  async getLockRequests() {
    const response = await apiClient.get<any>('/admin/lock-requests');
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Erreur lors de la récupération des demandes de verrouillage');
    }

    return response.data;
  }

  /**
   * Valider une demande de verrouillage
   */
  async validateLockRequest(requestId: string, approved: boolean, adminNote?: string) {
    const response = await apiClient.put<any>(`/admin/lock-requests/${requestId}/validate`, {
      approved,
      adminNote
    });
    
    if (!response.success) {
      throw new Error(response.error || 'Erreur lors de la validation de la demande');
    }

    return response.data;
  }
}

export const reservationService = new ReservationService();