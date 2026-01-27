import { apiClient } from './client';

export interface User {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  status: 'active' | 'blocked' | 'pending';
  accountBalance: number;
  totalSpent: number;
  totalTrips: number;
  reliabilityScore: number;
  depositBalance: number;
  negativeBalance?: number;
  subscription?: {
    planName: string;
    packageType: string;
    endDate: string;
  };
  isActive: boolean;
  address?: string;
  avatar?: string;
  createdAt: string;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  blockedUsers: number;
  totalBalance: number;
  totalSpent: number;
  totalTrips: number;
}

export interface PaginatedUsers {
  users: User[];
  total: number;
  pages: number;
  currentPage: number;
}

export class UserService {
  async getAllUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
  }): Promise<PaginatedUsers> {
    const queryParams: any = { ...params };
    if (!queryParams.role || queryParams.role !== 'ADMIN') {
      queryParams.role = 'USER';
    }

    const response = await apiClient.get<PaginatedUsers>('/users', queryParams);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Erreur lors de la récupération des utilisateurs');
    }

    const usersWithWallet = await Promise.all(
      response.data.users.map(async (user) => {
        const depositResponse = await apiClient.get<any>(`/wallet/admin/user/${user.id}/deposit-info`);
        const depositInfo = depositResponse.success ? depositResponse.data : null;
        
        const walletResponse = await apiClient.get<any>(`/wallet/admin/user/${user.id}/balance`);
        const walletBalance = walletResponse.success ? walletResponse.data : null;

        return {
          ...user,
          name: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email,
          depositBalance: depositInfo?.currentDeposit || depositInfo?.deposit || 0,
          accountBalance: walletBalance?.balance || 0,
          totalSpent: user.totalSpent || 0,
          totalTrips: user.totalTrips || 0,
          reliabilityScore: Number(user.reliabilityScore) || 0
        };
      })
    );

    return {
      ...response.data,
      users: usersWithWallet
    };
  }

  async getUserById(id: string): Promise<User & {
    stats?: any;
    incidents?: any[];
    rides?: any[];
    transactions?: any[];
    requests?: any[];
    subscription?: any;
  }> {
    const response = await apiClient.get<User>(`/users/${id}`);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Utilisateur non trouvé');
    }

    const user = response.data;

    const depositResponse = await apiClient.get<any>(`/wallet/admin/user/${id}/deposit-info`);
    const depositInfo = depositResponse.success ? depositResponse.data : null;
    
    const walletResponse = await apiClient.get<any>(`/wallet/admin/user/${id}/balance`);
    const walletBalance = walletResponse.success ? walletResponse.data : null;
    
    user.depositBalance = depositInfo?.currentDeposit || depositInfo?.deposit || 0;
    user.accountBalance = walletBalance?.balance || 0;
    
    const statsResponse = await apiClient.get(`/users/${id}/stats`);
    const stats = statsResponse.success ? (statsResponse.data as any) : null;
    
    const incidentsResponse = await apiClient.get(`/users/${id}/incidents`);
    const incidents = incidentsResponse.success ? (incidentsResponse.data as any) : { incidents: [] };
    
    const ridesResponse = await apiClient.get(`/users/${id}/rides`);
    const rides = ridesResponse.success ? (ridesResponse.data as any) : { rides: [] };
    
    const transactionsResponse = await apiClient.get(`/users/${id}/transactions`);
    const transactions = transactionsResponse.success ? (transactionsResponse.data as any) : { transactions: [] };
    
    const requestsResponse = await apiClient.get(`/users/${id}/requests`);
    const requests = requestsResponse.success ? (requestsResponse.data as any) : [];
    
    const subscriptionResponse = await apiClient.get(`/users/${id}/subscription`);
    const subscription = subscriptionResponse.success ? (subscriptionResponse.data as any) : null;

    return {
      ...user,
      stats,
      incidents: incidents.incidents || [],
      rides: rides.rides || [],
      transactions: transactions.transactions || [],
      requests: requests,
      subscription
    };
  }

  async getUserIncidents(userId: string): Promise<any[]> {
    const response = await apiClient.get<{ incidents: any[] }>(`/users/${userId}/incidents`);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Erreur lors de la récupération des incidents');
    }

    return response.data.incidents || [];
  }

  async getUserRides(userId: string): Promise<any[]> {
    const response = await apiClient.get<{ rides: any[] }>(`/users/${userId}/rides`);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Erreur lors de la récupération des trajets');
    }

    return response.data.rides || [];
  }

  async getUserTransactions(userId: string): Promise<any[]> {
    const response = await apiClient.get<{ transactions: any[] }>(`/users/${userId}/transactions`);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Erreur lors de la récupération des transactions');
    }

    return response.data.transactions || [];
  }

  async getUserRequests(userId: string): Promise<any[]> {
    const response = await apiClient.get<any[]>(`/users/${userId}/requests`);
    
    if (!response.success) {
      throw new Error(response.error || 'Erreur lors de la récupération des demandes');
    }

    return response.data || [];
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const response = await apiClient.put<User>(`/users/${id}`, data);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Erreur lors de la modification');
    }

    return response.data;
  }

  async blockUser(id: string): Promise<void> {
    const response = await apiClient.put(`/users/${id}/status`, { status: 'blocked', isActive: false });
    
    if (!response.success) {
      throw new Error(response.error || 'Erreur lors du blocage');
    }
  }

  async unblockUser(id: string): Promise<void> {
    const response = await apiClient.put(`/users/${id}/status`, { status: 'active', isActive: true });
    
    if (!response.success) {
      throw new Error(response.error || 'Erreur lors du déblocage');
    }
  }

  async deleteUser(id: string): Promise<void> {
    const response = await apiClient.delete(`/users/${id}`);
    
    if (!response.success) {
      throw new Error(response.error || 'Erreur lors de la suppression');
    }
  }

  async searchUsers(query: string): Promise<User[]> {
    const response = await apiClient.get<User[]>('/users/search', { q: query });
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Erreur lors de la recherche');
    }

    return response.data;
  }
}

export const userService = new UserService();