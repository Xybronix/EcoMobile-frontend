// lib/api/users.js
import { apiClient } from '../../services/api-client';

export const usersApi = {
  // Récupérer tous les utilisateurs (Admin)
  getAllUsers: async (page = 1, limit = 10, role = '') => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(role && { role })
    });
    
    const response = await apiClient(`/users?${params}`);
    return response;
  },

  // Rechercher des utilisateurs
  searchUsers: async (query, page = 1, limit = 10) => {
    const params = new URLSearchParams({
      q: query,
      page: page.toString(),
      limit: limit.toString()
    });
    
    const response = await apiClient(`/users/search?${params}`);
    return response;
  },

  // Récupérer un utilisateur par ID
  getUserById: async (id) => {
    const response = await apiClient(`/users/${id}`);
    return response;
  },

  // Mettre à jour le rôle d'un utilisateur
  updateUserRole: async (id, role) => {
    const response = await apiClient(`/users/${id}/role`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role })
    });
    return response;
  },

  // Changer le statut d'un utilisateur
  toggleUserStatus: async (id, isActive) => {
    const response = await apiClient(`/users/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ isActive })
    });
    return response;
  },

  // Supprimer un utilisateur
  deleteUser: async (id) => {
    const response = await apiClient(`/users/${id}`, {
      method: 'DELETE'
    });
    return response;
  },

  // Statistiques utilisateur
  getUserStats: async (userId) => {
    const response = await apiClient(`/users/${userId}/stats`);
    return response;
  }
};