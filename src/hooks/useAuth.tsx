// hooks/useAuth.tsx
import React, { useState, useEffect, useContext, createContext } from 'react';
import { authService, AuthUser } from '../services/api/auth.service';
import { getAuthToken, TokenManager } from '../services/api/client';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<AuthUser>) => void;
  hasPermission: (resource: string, action: string) => boolean;
  hasRole: (role: string | string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = getAuthToken();
      if (token) {
        try {
          if (TokenManager.isTokenExpired(token)) {
            throw new Error('Token expired');
          }
          const userData = await authService.getCurrentUser();
          setUser(userData);
        } catch (error) {
          console.error('Auth initialization failed:', error);
          authService.logout();
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const authData = await authService.login({ email, password });
    setUser(authData.user);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const updateUser = (userData: Partial<AuthUser>) => {
    setUser(prev => prev ? { ...prev, ...userData } : null);
  };

  const hasPermission = (resource: string, action: string): boolean => {
    if (!user) return false;
    
    // Super admin a tous les droits - vérification prioritaire
    if (user.role === 'SUPER_ADMIN') return true;
    
    // Si pas de permissions définies, pas d'accès (sauf SUPER_ADMIN)
    if (!user.permissions || !Array.isArray(user.permissions)) return false;
    
    const specificPermission = `${resource}:${action}`;
    const managePermission = `${resource}:manage`;
    const adminManagePermission = 'admin:manage';
    
    return user.permissions.includes(specificPermission) ||
           user.permissions.includes(managePermission) ||
           user.permissions.includes(adminManagePermission);
  };

  const hasRole = (role: string | string[]): boolean => {
    if (!user) return false;
    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      login, 
      logout, 
      updateUser,
      hasPermission,
      hasRole
    }}>
      {children}
    </AuthContext.Provider>
  );
}