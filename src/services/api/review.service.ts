import { apiClient } from './client';

export interface ReviewSubmission {
  photo?: string;
  firstName: string;
  lastName: string;
  socialStatus: string;
  rating: number;
  comment: string;
}

export interface Review {
  id: string;
  photo?: string;
  firstName: string;
  lastName: string;
  socialStatus: string;
  rating: number;
  comment: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  moderatorComment?: string;
}

export class ReviewService {
  async submitReview(data: ReviewSubmission): Promise<void> {
    const response = await apiClient.post('/public/reviews', data);
    
    if (!response.success) {
      throw new Error(response.error || 'Erreur lors de la soumission de l\'avis');
    }
  }

  async getAllReviews(filters?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    reviews: Review[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get<{
      reviews: Review[];
      pagination: any;
    }>(`/admin/reviews?${params}`);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Erreur lors de la récupération des avis');
    }

    return response.data;
  }

  async getApprovedReviews(): Promise<Review[]> {
    const response = await apiClient.get<Review[]>('/public/reviews');
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Erreur lors de la récupération des avis');
    }

    return response.data;
  }

  async moderateReview(
    reviewId: string, 
    action: 'approve' | 'reject', 
    moderatorComment?: string
  ): Promise<void> {
    const response = await apiClient.put(`/admin/reviews/${reviewId}/moderate`, {
      action,
      moderatorComment
    });
    
    if (!response.success) {
      throw new Error(response.error || 'Erreur lors de la modération de l\'avis');
    }
  }

  async createReview(data: Omit<ReviewSubmission, 'id'>): Promise<Review> {
    const response = await apiClient.post<Review>('/admin/reviews', data);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Erreur lors de la création de l\'avis');
    }

    return response.data;
  }

  async updateReview(reviewId: string, data: Partial<ReviewSubmission>): Promise<Review> {
    const response = await apiClient.put<Review>(`/admin/reviews/${reviewId}`, data);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Erreur lors de la modification de l\'avis');
    }

    return response.data;
  }

  async deleteReview(reviewId: string): Promise<void> {
    const response = await apiClient.delete(`/admin/reviews/${reviewId}`);
    
    if (!response.success) {
      throw new Error(response.error || 'Erreur lors de la suppression de l\'avis');
    }
  }
}

export const reviewService = new ReviewService();