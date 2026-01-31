import { apiClient } from './client';

export interface IdentityDocument {
  id: string;
  userId: string;
  documentType: 'CNI' | 'RECEPISSE';
  frontImage: string;
  backImage?: string;
  selfieImage?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResidenceProof {
  id: string;
  userId: string;
  proofType: 'DOCUMENT' | 'MAP_COORDINATES';
  documentFile?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  details?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLocationProof {
  id: string;
  userId: string;
  proofType: 'DOCUMENT' | 'MAP_COORDINATES';
  documentFile?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  details?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentsStatus {
  identityDocuments: IdentityDocument[];
  residenceProof: ResidenceProof | null;
  activityLocationProof: ActivityLocationProof | null;
  allDocumentsSubmitted: boolean;
  allDocumentsApproved: boolean;
}

class DocumentService {
  private baseUrl = '/documents';

  async getPendingDocuments(page: number = 1, limit: number = 20) {
    const response = await apiClient.get(`${this.baseUrl}/pending`, {
      params: { page, limit }
    });
    return response.data;
  }

  async getUserDocumentsStatus(userId: string): Promise<DocumentsStatus> {
    const response = await apiClient.get(`${this.baseUrl}/user/${userId}/status`);
    return response.data as DocumentsStatus;
  }

  async approveIdentityDocument(documentId: string) {
    const response = await apiClient.post(`${this.baseUrl}/identity/${documentId}/approve`);
    return response.data;
  }

  async rejectIdentityDocument(documentId: string, reason: string) {
    const response = await apiClient.post(`${this.baseUrl}/identity/${documentId}/reject`, { reason });
    return response.data;
  }

  async approveResidenceProof(proofId: string) {
    const response = await apiClient.post(`${this.baseUrl}/residence/${proofId}/approve`);
    return response.data;
  }

  async rejectResidenceProof(proofId: string, reason: string) {
    const response = await apiClient.post(`${this.baseUrl}/residence/${proofId}/reject`, { reason });
    return response.data;
  }

  async verifyUserAccount(userId: string) {
    const response = await apiClient.post(`${this.baseUrl}/verify-account/${userId}`);
    return response.data;
  }

  async approveActivityLocationProof(proofId: string) {
    const response = await apiClient.post(`${this.baseUrl}/activity-location/${proofId}/approve`);
    return response.data;
  }

  async rejectActivityLocationProof(proofId: string, reason: string) {
    const response = await apiClient.post(`${this.baseUrl}/activity-location/${proofId}/reject`, { reason });
    return response.data;
  }
}

export const documentService = new DocumentService();
