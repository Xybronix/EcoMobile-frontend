import { apiClient } from './client';

export interface WalletBalance {
  balance: number;
  currency: string;
}

export interface Transaction {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'RIDE_PAYMENT' | 'REFUND' | 'CASH_DEPOSIT' | 'DEPOSIT_RECHARGE' | 'DAMAGE_CHARGE' | 'SUBSCRIPTION_PAYMENT';
  amount: number;
  fees: number;
  totalAmount: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  paymentMethod?: string;
  paymentProvider?: string;
  externalId?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  requestedBy?: string;
  validatedBy?: string;
  validatedAt?: string;
  rejectionReason?: string;
  canModify?: boolean;
}

export interface WalletTransaction extends Transaction {
  wallet?: {
    userId: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      createdAt: Date;
    };
  };
}

export interface WalletStats {
  totalDeposits: number;
  totalSpent: number;
  totalTransactions: number;
  averageTransactionAmount: number;
}

export interface DepositRequest {
  amount: number;
  paymentMethod: string;
}

export interface DepositResponse {
  transactionId: string;
  paymentUrl: string;
  externalId: string;
}

export interface FeesCalculation {
  amount: number;
  fees: number;
  totalAmount: number;
}

export interface TransactionFilters {
  type?: string;
  status?: string;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface PaginatedTransactions {
  transactions: WalletTransaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class WalletService {
  async getBalance(): Promise<WalletBalance> {
    const response = await apiClient.get<WalletBalance>('/wallet/balance');
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Erreur lors de la récupération du solde');
    }

    return response.data;
  }

  async getTransactions(params?: {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
  }): Promise<{ transactions: Transaction[], total: number, pages: number }> {
    const response = await apiClient.get<{ transactions: Transaction[], total: number, pages: number }>('/wallet/transactions', params);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Erreur lors de la récupération des transactions');
    }

    return response.data;
  }

  async getTransaction(id: string): Promise<Transaction> {
    const response = await apiClient.get<Transaction>(`/wallet/transactions/${id}`);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Transaction non trouvée');
    }

    return response.data;
  }

  async getStats(): Promise<WalletStats> {
    const response = await apiClient.get<WalletStats>('/wallet/stats');
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Erreur lors de la récupération des statistiques');
    }

    return response.data;
  }

  async calculateFees(amount: number): Promise<FeesCalculation> {
    const response = await apiClient.post<FeesCalculation>('/wallet/deposit/calculate-fees', { amount });
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Erreur lors du calcul des frais');
    }

    return response.data;
  }

  async initiateDeposit(data: DepositRequest): Promise<DepositResponse> {
    const response = await apiClient.post<DepositResponse>('/wallet/deposit', data);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Erreur lors de l\'initiation du dépôt');
    }

    return response.data;
  }

  async verifyPayment(transactionId: string): Promise<Transaction> {
    const response = await apiClient.get<Transaction>(`/wallet/payment/verify/${transactionId}`);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Erreur lors de la vérification du paiement');
    }

    return response.data;
  }

  /**
   * Récupérer toutes les transactions (Admin uniquement)
   */
  async getAllTransactions(
    page: number = 1,
    limit: number = 20,
    filters: TransactionFilters = {}
  ): Promise<PaginatedTransactions> {
    const params: any = { page, limit, ...filters };
    
    const response = await apiClient.get<PaginatedTransactions>('/wallet/admin/transactions', params);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Erreur lors de la récupération des transactions');
    }

    return response.data;
  }

  /**
   * Récupérer les détails d'une transaction (Admin uniquement)
   */
  async getAdminTransactionById(transactionId: string): Promise<WalletTransaction> {
    const response = await apiClient.get<WalletTransaction>(`/wallet/admin/transactions/${transactionId}`);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Transaction non trouvée');
    }

    return response.data;
  }

  /**
   * Valider une demande de recharge en espèces (Admin uniquement)
   */
  async validateCashDeposit(transactionId: string, adminNote?: string): Promise<WalletTransaction> {
    const response = await apiClient.post<WalletTransaction>(
      `/wallet/admin/cash-deposits/${transactionId}/validate`,
      { adminNote }
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Erreur lors de la validation');
    }

    return response.data;
  }

  /**
   * Rejeter une demande de recharge en espèces (Admin uniquement)
   */
  async rejectCashDeposit(transactionId: string, reason: string): Promise<WalletTransaction> {
    const response = await apiClient.post<WalletTransaction>(
      `/wallet/admin/cash-deposits/${transactionId}/reject`,
      { reason }
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Erreur lors du rejet');
    }

    return response.data;
  }

  /**
   * Récupérer les statistiques globales des portefeuilles (Admin uniquement)
   */
  async getGlobalWalletStats(): Promise<{
    totalBalance: number;
    totalTransactions: number;
    pendingCashRequests: number;
    completedTransactions: number;
    failedTransactions: number;
    totalDeposited: number;
    totalWithdrawn: number;
  }> {
    const response = await apiClient.get<{
      totalBalance: number;
      totalTransactions: number;
      pendingCashRequests: number;
      completedTransactions: number;
      failedTransactions: number;
      totalDeposited: number;
      totalWithdrawn: number;
    }>('/wallet/admin/stats');
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Erreur lors de la récupération des statistiques');
    }

    return response.data;
  }
}

export const walletService = new WalletService();