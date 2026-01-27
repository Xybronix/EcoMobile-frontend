import { apiClient } from './client';

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  roleId?: string;
  status: 'active' | 'blocked';
  createdAt: string;
  updatedAt: string;
  permissions?: string[];
}

export interface PaginatedEmployees {
  employees: Employee[];
  total: number;
  pages: number;
  currentPage: number;
}

export class EmployeeService {
  async getAllEmployees(params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
  }): Promise<PaginatedEmployees> {
    const queryParams: any = { ...params };
    
    if (!queryParams.role || queryParams.role === 'all') {
      delete queryParams.role;
    }

    const response = await apiClient.get<any>('/users', queryParams);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Erreur lors de la récupération des employés');
    }

    let employees, total, pages, currentPage;

    if (Array.isArray(response.data)) {
      employees = response.data;
      total = employees.length;
      pages = 1;
      currentPage = 1;
    } else {
      employees = response.data.users || response.data.employees || response.data.data || [];
      total = response.data.total || 0;
      pages = response.data.totalPages || response.data.pages || 0;
      currentPage = response.data.currentPage || 1;
    }

    const filteredEmployees = employees.filter((user: any) => {
      const userRole = user.roleRelation?.name || user.role;
      return userRole && userRole !== 'USER';
    });

    const adaptedEmployees = filteredEmployees.map((user: any) => ({
      ...user,
      name: `${user.firstName} ${user.lastName}`,
      role: user.roleRelation?.name || user.role || 'N/A',
      roleId: user.roleId || null,
      status: user.isActive ? 'active' : 'blocked'
    }));

    return {
      employees: adaptedEmployees,
      total: filteredEmployees.length,
      pages: Math.ceil(filteredEmployees.length / (params?.limit || 20)),
      currentPage
    };
  }

  async getEmployeeById(id: string): Promise<Employee> {
    const response = await apiClient.get<any>(`/users/${id}`);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Employé non trouvé');
    }

    const user = response.data;
    return {
      ...user,
      name: `${user.firstName} ${user.lastName}`,
      role: user.roleRelation?.name || user.role || 'N/A',
      roleId: user.roleId || null,
      status: user.isActive ? 'active' : 'blocked'
    };
  }

  async createEmployee(data: {
    name: string;
    email: string;
    phone: string;
    role: string;
    password: string;
  }): Promise<Employee> {
    const nameParts = data.name.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || firstName;

    const response = await apiClient.post<any>('/users', {
      firstName,
      lastName,
      email: data.email,
      phone: data.phone,
      password: data.password,
      roleId: data.role
    });
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Erreur lors de la création de l\'employé');
    }

    const user = response.data;
    return {
      ...user,
      name: `${user.firstName} ${user.lastName}`,
      role: user.roleRelation?.name || user.role,
      roleId: user.roleId || null,
      status: user.isActive ? 'active' : 'blocked'
    };
  }

  async updateEmployee(id: string, data: Partial<Employee>): Promise<Employee> {
    const updateData: any = { ...data };

    if (data.name) {
      const nameParts = data.name.trim().split(' ');
      updateData.firstName = nameParts[0];
      updateData.lastName = nameParts.slice(1).join(' ') || nameParts[0];
      delete updateData.name;
    }

    if (data.status) {
      updateData.isActive = data.status === 'active';
      delete updateData.status;
    }

    if (data.roleId) {
      updateData.roleId = data.roleId;
    }

    const response = await apiClient.put<any>(`/users/${id}`, updateData);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Erreur lors de la modification de l\'employé');
    }

    const user = response.data;
    return {
      ...user,
      name: `${user.firstName} ${user.lastName}`,
      role: user.roleRelation?.name || user.role,
      roleId: user.roleId || null,
      status: user.isActive ? 'active' : 'blocked'
    };
  }

  async updateEmployeeRole(id: string, roleId: string): Promise<Employee> {
    const response = await apiClient.put<any>(`/users/${id}/role`, { roleId });
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Erreur lors de la modification du rôle');
    }

    const user = response.data;
    return {
      ...user,
      name: `${user.firstName} ${user.lastName}`,
      role: user.roleRelation?.name || user.role,
      roleId: user.roleId || null,
      status: user.isActive ? 'active' : 'blocked'
    };
  }

  async toggleEmployeeStatus(id: string, status: 'active' | 'blocked'): Promise<Employee> {
    const response = await apiClient.put<any>(`/users/${id}/status`, { 
      status,
      isActive: status === 'active' 
    });
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Erreur lors de la modification du statut');
    }

    const user = response.data;
    return {
      ...user,
      name: `${user.firstName} ${user.lastName}`,
      role: user.roleRelation?.name || user.role,
      roleId: user.roleId || null,
      status: user.isActive ? 'active' : 'blocked'
    };
  }

  async deleteEmployee(id: string): Promise<void> {
    const response = await apiClient.delete(`/users/${id}`);
    
    if (!response.success) {
      throw new Error(response.error || 'Erreur lors de la suppression de l\'employé');
    }
  }
}

export const employeeService = new EmployeeService();