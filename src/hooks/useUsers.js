// hooks/useUsers.js
import { useState, useEffect } from 'react';
import { usersApi } from '../lib/api/users';
import { toast } from 'sonner@2.0.3';

export const useUsers = (page = 1, limit = 10, searchTerm = '') => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let response;
      if (searchTerm.trim()) {
        response = await usersApi.searchUsers(searchTerm, page, limit);
      } else {
        response = await usersApi.getAllUsers(page, limit);
      }

      if (response.success) {
        setUsers(response.data.users || []);
        setTotalPages(response.data.totalPages || 0);
        setTotalUsers(response.data.total || 0);
      } else {
        throw new Error(response.message || 'Erreur lors du chargement des utilisateurs');
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, limit, searchTerm]);

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? false : true;
      const response = await usersApi.toggleUserStatus(userId, newStatus);
      
      if (response.success) {
        // Mettre à jour l'utilisateur dans la liste locale
        setUsers(prev => prev.map(user => 
          user.id === userId 
            ? { ...user, isActive: newStatus, status: newStatus ? 'active' : 'blocked' }
            : user
        ));
        
        toast.success(newStatus ? 'Utilisateur activé' : 'Utilisateur bloqué');
        return response.data;
      } else {
        throw new Error(response.message);
      }
    } catch (err) {
      toast.error(err.message);
      throw err;
    }
  };

  return {
    users,
    loading,
    error,
    totalPages,
    totalUsers,
    refetch: fetchUsers,
    toggleUserStatus
  };
};

export const useUser = (userId) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return;

    const fetchUser = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await usersApi.getUserById(userId);
        
        if (response.success) {
          setUser(response.data);
        } else {
          throw new Error(response.message || 'Utilisateur non trouvé');
        }
      } catch (err) {
        setError(err.message);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  return { user, loading, error };
};