import { apiClient } from './client';

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
  createdAt?: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  employeeCount: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export class RolesService {
  async getAllRoles(): Promise<Role[]> {
    const response = await apiClient.get<Role[]>('/admin/roles');
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Erreur lors de la récupération des rôles');
    }

    return response.data;
  }

  async getRoleById(id: string): Promise<Role> {
    const response = await apiClient.get<Role>(`/admin/roles/${id}`);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Rôle non trouvé');
    }

    return response.data;
  }

  async createRole(data: {
    name: string;
    description: string;
    permissions: string[];
  }): Promise<Role> {
    const response = await apiClient.post<Role>('/admin/roles', data);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Erreur lors de la création du rôle');
    }

    return response.data;
  }

  async updateRole(id: string, data: {
    name?: string;
    description?: string;
    permissions?: string[];
  }): Promise<Role> {
    const response = await apiClient.put<Role>(`/admin/roles/${id}`, data);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Erreur lors de la modification du rôle');
    }

    return response.data;
  }

  async updateRolePermissions(id: string, permissions: string[]): Promise<Role> {
    const response = await apiClient.put<Role>(`/admin/roles/${id}/permissions`, { permissions });
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Erreur lors de la mise à jour des permissions');
    }

    return response.data;
  }

  async deleteRole(id: string): Promise<void> {
    const response = await apiClient.delete(`/admin/roles/${id}`);
    
    if (!response.success) {
      throw new Error(response.error || 'Erreur lors de la suppression du rôle');
    }
  }

  async getAllPermissions(): Promise<Permission[]> {
    const response = await apiClient.get<Permission[]>('/admin/permissions');
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Erreur lors de la récupération des permissions');
    }

    return response.data;
  }

  async assignRoleToEmployees(roleId: string, employeeIds: string[]): Promise<void> {
    const response = await apiClient.put(`/admin/roles/${roleId}/assign`, { employeeIds });
    
    if (!response.success) {
      throw new Error(response.error || 'Erreur lors de l\'assignation du rôle');
    }
  }
}

export const rolesService = new RolesService();