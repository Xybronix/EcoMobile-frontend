import { apiClient, getBaseUrl } from './client';

export interface UnlockRequest {
  id: string;
  userId: string;
  bikeId: string;
  reservationId?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedAt: string;
  validatedAt?: string;
  validatedBy?: string;
  adminNote?: string;
  createdAt: string;
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
    latitude?: number;
    longitude?: number;
  };
  reservation?: {
    id: string;
    startDate: string;
    endDate: string;
    status: string;
    packageType?: string;
  };
  metadata?: {
    inspection?: {
      condition?: string;
      issues?: string[];
      notes?: string;
      photos?: string[];
      paymentMethod?: string;
    };
    inspectionData?: {
      issues: string[];
      notes: string;
      photos: string[];
    };
    paymentMethod?: string;
  };
}

export interface LockRequest {
  id: string;
  userId: string;
  bikeId: string;
  rideId?: string;
  returnLocation?: any;
  latitude?: number;
  longitude?: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedAt: string;
  validatedAt?: string;
  validatedBy?: string;
  adminNote?: string;
  createdAt: string;
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
  ride?: {
    id: string;
    startTime: string;
    endTime: string; // A revoir
    duration?: number;
    cost?: number;
  };
  metadata?: {
    inspection?: {
      condition?: string;
      issues?: string[];
      notes?: string;
      photos?: string[];
      paymentMethod?: string;
    };
    inspectionData?: {
      issues: string[];
      notes: string;
      photos: string[];
    };
    paymentMethod?: string;
  };
}

export interface CreateUnlockRequestData {
  bikeId: string;
  reservationId?: string;
}

export interface CreateLockRequestData {
  bikeId: string;
  rideId?: string;
  location?: {
    lat: number;
    lng: number;
  };
}

export interface ValidateRequestData {
  approved: boolean;
  adminNote?: string;
}

export interface PaginatedRequests<T> {
  requests: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const normalizeImageUrls = (images: string[]): string[] => {
  const baseUrl = getBaseUrl();

  return images.map(img => {
    if (!img) return '';
    if (img.startsWith('http://') || img.startsWith('https://') || img.startsWith('data:')) {
      return img;
    }
    return `${baseUrl}${img.startsWith('/') ? img : '/' + img}`;
  });
};

export class BikeActionService {
  /**
   * Récupérer une demande par ID et type (méthode générique)
   */
  async getRequestById(type: 'unlock' | 'lock', requestId: string): Promise<UnlockRequest | LockRequest> {
    if (type === 'unlock') {
      return this.getUnlockRequestById(requestId);
    } else {
      return this.getLockRequestById(requestId);
    }
  }

  /**
   * Créer une demande de déverrouillage
   */
  async createUnlockRequest(data: CreateUnlockRequestData): Promise<UnlockRequest> {
    const response = await apiClient.post<UnlockRequest>('/bike-requests/unlock', data);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Erreur lors de la création de la demande de déverrouillage');
    }

    return response.data;
  }

  /**
   * Créer une demande de verrouillage
   */
  async createLockRequest(data: CreateLockRequestData): Promise<LockRequest> {
    const response = await apiClient.post<LockRequest>('/bike-requests/lock', data);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Erreur lors de la création de la demande de verrouillage');
    }

    return response.data;
  }

  /**
   * Récupérer les demandes en attente selon le type
   */
  async getPendingRequests(type: 'unlock' | 'lock', params?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedRequests<UnlockRequest | LockRequest>> {
    const response = await apiClient.get<PaginatedRequests<any>>(`/bike-requests/${type}/pending`, params);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || `Erreur lors de la récupération des demandes de ${type === 'unlock' ? 'déverrouillage' : 'verrouillage'}`);
    }

    return response.data;
  }

  /**
   * Récupérer les demandes de déverrouillage en attente
   */
  async getUnlockRequests(params?: {
    page?: number;
    limit?: number;
  }): Promise<UnlockRequest[]> {
    const response = await this.getPendingRequests('unlock', params);
    return response.requests as UnlockRequest[];
  }

  /**
   * Récupérer les demandes de verrouillage en attente
   */
  async getLockRequests(params?: {
    page?: number;
    limit?: number;
  }): Promise<LockRequest[]> {
    const response = await this.getPendingRequests('lock', params);
    return response.requests as LockRequest[];
  }

  /**
   * Récupérer les images d'une demande
   */
  async getRequestImages(requestId: string, type: 'unlock' | 'lock'): Promise<string[]> {
    const request = await this.getRequestById(type, requestId);
    const images: string[] = [];
    
    if ('metadata' in request && request.metadata?.inspectionData?.photos) {
      images.push(...request.metadata.inspectionData.photos);
    }
    
    if ('metadata' in request && request.metadata?.inspection?.photos) {
      images.push(...request.metadata.inspection.photos);
    }
    
    return normalizeImageUrls(images.filter(img => img && img.trim() !== ''));
  }

  /**
   * Valider une demande de déverrouillage
   */
  async validateUnlockRequest(requestId: string, data: ValidateRequestData): Promise<UnlockRequest> {
    const endpoint = data.approved 
      ? `/bike-requests/unlock/${requestId}/approve`
      : `/bike-requests/unlock/${requestId}/reject`;

    const payload = data.approved 
      ? { adminNote: data.adminNote }
      : { reason: data.adminNote };

    const response = await apiClient.post<UnlockRequest>(endpoint, payload);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || `Erreur lors de la ${data.approved ? 'validation' : 'rejection'} de la demande`);
    }

    return response.data;
  }

  /**
   * Valider une demande de verrouillage
   */
  async validateLockRequest(requestId: string, data: ValidateRequestData): Promise<LockRequest> {
    const endpoint = data.approved 
      ? `/bike-requests/lock/${requestId}/approve`
      : `/bike-requests/lock/${requestId}/reject`;

    const payload = data.approved 
      ? { adminNote: data.adminNote }
      : { reason: data.adminNote };

    const response = await apiClient.post<LockRequest>(endpoint, payload);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || `Erreur lors de la ${data.approved ? 'validation' : 'rejection'} de la demande`);
    }

    return response.data;
  }

  /**
   * Récupérer une demande de déverrouillage par ID
   */
  async getUnlockRequestById(requestId: string): Promise<UnlockRequest> {
    const response = await apiClient.get<UnlockRequest>(`/bike-requests/unlock/${requestId}`);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Demande de déverrouillage non trouvée');
    }

    return response.data;
  }

  /**
   * Récupérer une demande de verrouillage par ID
   */
  async getLockRequestById(requestId: string): Promise<LockRequest> {
    const response = await apiClient.get<LockRequest>(`/bike-requests/lock/${requestId}`);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Demande de verrouillage non trouvée');
    }

    return response.data;
  }

  /**
   * Récupérer toutes les demandes de déverrouillage (avec pagination)
   */
  async getAllUnlockRequests(params?: {
    page?: number;
    limit?: number;
    status?: string;
    userId?: string;
  }): Promise<PaginatedRequests<UnlockRequest>> {
    const response = await apiClient.get<PaginatedRequests<UnlockRequest>>('/bike-requests/unlock', params);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Erreur lors de la récupération des demandes de déverrouillage');
    }

    return response.data;
  }

  /**
   * Récupérer toutes les demandes de verrouillage (avec pagination)
   */
  async getAllLockRequests(params?: {
    page?: number;
    limit?: number;
    status?: string;
    userId?: string;
  }): Promise<PaginatedRequests<LockRequest>> {
    const response = await apiClient.get<PaginatedRequests<LockRequest>>('/bike-requests/lock', params);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Erreur lors de la récupération des demandes de verrouillage');
    }

    return response.data;
  }

  /**
   * Récupérer les demandes d'un utilisateur
   */
  async getUserRequests(userId: string): Promise<{
    unlockRequests: UnlockRequest[];
    lockRequests: LockRequest[];
  }> {
    const [unlockResponse, lockResponse] = await Promise.all([
      apiClient.get<UnlockRequest[]>(`/bike-requests/unlock-requests/user`, { userId }),
      apiClient.get<LockRequest[]>(`/bike-requests/lock-requests/user`, { userId })
    ]);

    return {
      unlockRequests: unlockResponse.data || [],
      lockRequests: lockResponse.data || []
    };
  }

  /**
   * Annuler une demande en attente
   */
  async cancelRequest(type: 'unlock' | 'lock', requestId: string): Promise<void> {
    const response = await apiClient.delete(`/bike-requests/${type}/${requestId}`);
    
    if (!response.success) {
      throw new Error(response.error || 'Erreur lors de l\'annulation de la demande');
    }
  }

  /**
   * Récupérer les statistiques des demandes
   */
  async getRequestsStats(): Promise<{
    pendingUnlockRequests: number;
    pendingLockRequests: number;
    todayUnlockRequests: number;
    todayLockRequests: number;
    totalUnlockRequests: number;
    totalLockRequests: number;
  }> {
    const response = await apiClient.get<{
      pendingUnlockRequests: number;
      pendingLockRequests: number;
      todayUnlockRequests: number;
      todayLockRequests: number;
      totalUnlockRequests: number;
      totalLockRequests: number;
    }>('/bike-requests/stats');
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Erreur lors de la récupération des statistiques');
    }

    return response.data;
  }
}

export const bikeActionService = new BikeActionService();