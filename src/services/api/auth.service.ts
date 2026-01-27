import { apiClient, setAuthToken, removeAuthToken, getAuthToken } from './client';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  status: 'active' | 'blocked' | 'pending';
  role: string;
  roleId: string | null;
  permissions: string[];
  isActive: boolean;
  avatar?: string;
  phone?: string;
  address?: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
  refreshToken?: string;
}

export interface LoginResponse extends AuthResponse {}

export interface Session {
  id: string;
  device: string;
  location: string;
  lastActive: string;
  current: boolean;
  ipAddress?: string;
  userAgent?: string;
}

export class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Échec de la connexion');
    }

    // Store tokens
    setAuthToken(response.data.token, response.data.refreshToken);
    
    return response.data;
  }

  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
  }): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Échec de l\'inscription');
    }

    return response.data;
  }

  async getCurrentUser(): Promise<AuthUser> {
    const response = await apiClient.get<AuthUser>('/auth/me');
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Utilisateur non trouvé');
    }

    return response.data;
  }

  async refreshToken(): Promise<AuthResponse> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('Token de rafraîchissement manquant');
    }

    const response = await apiClient.post<AuthResponse>('/auth/refresh', { refreshToken });
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Erreur de rafraîchissement');
    }

    // Update stored tokens
    setAuthToken(response.data.token, response.data.refreshToken);
    return response.data;
  }

  async updateProfile(data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
  }): Promise<AuthUser> {
    const response = await apiClient.put<AuthUser>('/auth/profile', data);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Erreur lors de la mise à jour du profil');
    }

    return response.data;
  }

  async getSessions(): Promise<Session[]> {
    const response = await apiClient.get<Session[]>('/auth/sessions');
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Erreur lors de la récupération des sessions');
    }

    return response.data;
  }

  async disconnectSession(sessionId: string): Promise<void> {
    const response = await apiClient.delete(`/auth/sessions/${sessionId}`);
    
    if (!response.success) {
      throw new Error(response.error || 'Erreur lors de la déconnexion de la session');
    }
  }

  async disconnectAllSessions(): Promise<void> {
    const response = await apiClient.delete('/auth/sessions');
    
    if (!response.success) {
      throw new Error(response.error || 'Erreur lors de la déconnexion des sessions');
    }
  }

  async forgotPassword(email: string): Promise<void> {
    const response = await apiClient.post('/auth/forgot-password', { email });
    
    if (!response.success) {
      throw new Error(response.error || 'Erreur lors de l\'envoi de l\'email');
    }
  }

  async resetPassword(token: string, password: string): Promise<void> {
    const response = await apiClient.post('/auth/reset-password', { token, password });
    
    if (!response.success) {
      throw new Error(response.error || 'Erreur lors de la réinitialisation');
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const response = await apiClient.post('/auth/change-password', {
      currentPassword,
      newPassword
    });
    
    if (!response.success) {
      throw new Error(response.error || 'Erreur lors du changement de mot de passe');
    }
  }

  async validateToken(): Promise<boolean> {
    try {
      const token = getAuthToken();
      if (!token) return false;

      const response = await apiClient.get('/auth/validate');
      return response.success;
    } catch (error) {
      return false;
    }
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.warn('Logout API call failed:', error);
    } finally {
      removeAuthToken();
      localStorage.removeItem('ecomobile_user');
      localStorage.removeItem('refresh_token');
    }
  }

  async verifyEmail(data: { userId: string; token: string }): Promise<boolean> {
    const response = await apiClient.post<{ verified: boolean }>('/auth/verify-email', data);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Erreur lors de la vérification de l\'email');
    }

    return response.data.verified;
  }

  async resendVerification(email: string): Promise<boolean> {
    const response = await apiClient.post<{ resent: boolean }>('/auth/resend-verification', { email });
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Erreur lors de l\'envoi de l\'email de vérification');
    }

    return response.data.resent;
  }

  // Helper methods for permission checking
  hasPermission(user: AuthUser | null, resource: string, action: string): boolean {
    if (!user || !user.permissions) return false;
    
    if (user.role === 'SUPER_ADMIN') return true;
    
    const specificPermission = `${resource}:${action}`;
    const managePermission = `${resource}:manage`;
    const adminManagePermission = 'admin:manage';
    
    return user.permissions.includes(specificPermission) ||
           user.permissions.includes(managePermission) ||
           user.permissions.includes(adminManagePermission);
  }

  hasRole(user: AuthUser | null, role: string | string[]): boolean {
    if (!user) return false;
    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(user.role);
  }

  hasAnyPermission(user: AuthUser | null, permissions: Array<{ resource: string; action: string }>): boolean {
    if (!user) return false;
    return permissions.some(p => this.hasPermission(user, p.resource, p.action));
  }

  hasAllPermissions(user: AuthUser | null, permissions: Array<{ resource: string; action: string }>): boolean {
    if (!user) return false;
    return permissions.every(p => this.hasPermission(user, p.resource, p.action));
  }

  isActiveUser(user: AuthUser | null): boolean {
    if (!user) return false;
  
    return user.isActive === true && user.status === 'active';
  }

  canAccessAdminPanel(user: AuthUser | null): boolean {
    if (!user || !this.isActiveUser(user)) return false;

    if (user.status === 'blocked' || user.status === 'pending') return false;
  
    return ['ADMIN', 'SUPER_ADMIN', 'EMPLOYEE'].includes(user.role);
  }

  async handleTokenRefresh(): Promise<AuthUser | null> {
    try {
      const refreshResponse = await this.refreshToken();
      return refreshResponse.user;
    } catch (error) {
      this.logout();
      throw new Error('Session expirée, veuillez vous reconnecter');
    }
  }

  getFormattedPermissions(user: AuthUser | null): string[] {
    return user?.permissions || [];
  }

  isAdmin(user: AuthUser | null): boolean {
    return this.hasRole(user, ['ADMIN', 'SUPER_ADMIN']);
  }

  isSuperAdmin(user: AuthUser | null): boolean {
    return this.hasRole(user, 'SUPER_ADMIN');
  }

  isEmployee(user: AuthUser | null): boolean {
    return this.hasRole(user, 'EMPLOYEE');
  }

  isRegularUser(user: AuthUser | null): boolean {
    return this.hasRole(user, 'USER');
  }
}

export const authService = new AuthService();

export type { AuthUser as User };