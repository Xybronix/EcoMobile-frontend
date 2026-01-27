import { apiClient } from './client';

export interface FinancialStats {
  todayRevenue: number;
  weekRevenue: number;
  monthRevenue: number;
  avgRevenuePerTrip: number;
  totalTrips: number;
  totalUsers: number;
}

export interface FinancialData {
  shortTerm: Array<{
    period: string;
    revenue: number;
    expenses: number;
    trips: number;
  }>;
  longTerm: Array<{
    period: string;
    revenue: number;
    expenses: number;
  }>;
  planDistribution: Array<{
    name: string;
    value: number;
    color: string;
  }>;
}

export interface TransactionSummary {
  topUps: { total: number; count: number };
  payments: { total: number; count: number };
  maintenance: { total: number; count: number };
  refunds: { total: number; count: number };
  userBalances: number;
}

export interface FinancialFilters {
  startDate: string;
  endDate: string;
  type: 'both' | 'revenue' | 'expenses';
}

export class FinancialService {
  async getFinancialStats(filters: FinancialFilters): Promise<{ data: FinancialStats }> {
    const params = new URLSearchParams(filters as any);
    const response = await apiClient.get<FinancialStats>(`/admin/financial/stats?${params}`);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Erreur lors de la récupération des statistiques financières');
    }

    return { data: response.data };
  }

  async getFinancialData(filters: FinancialFilters): Promise<{ data: FinancialData }> {
    const params = new URLSearchParams(filters as any);
    const response = await apiClient.get<FinancialData>(`/admin/financial/data?${params}`);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Erreur lors de la récupération des données financières');
    }

    return { data: response.data };
  }

  async getTransactionSummary(filters: FinancialFilters): Promise<{ data: TransactionSummary }> {
    const params = new URLSearchParams(filters as any);
    const response = await apiClient.get<TransactionSummary>(`/admin/financial/transactions?${params}`);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Erreur lors de la récupération du résumé des transactions');
    }

    return { data: response.data };
  }

  async exportFinancialData(filters: FinancialFilters, format: string = 'csv'): Promise<void> {
    const params = new URLSearchParams({ ...filters, format } as any);
    
    try {
      const response = await fetch(`/api/v1/admin/financial/export?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'export');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `finances_${filters.startDate}_${filters.endDate}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      throw new Error('Erreur lors de l\'export des données financières');
    }
  }
}

export const financialService = new FinancialService();