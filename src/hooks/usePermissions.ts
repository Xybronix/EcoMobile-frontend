// hooks/usePermissions.ts
import { useAuth } from './useAuth';

export interface PermissionCheck {
  resource: string;
  action: string;
}

export function usePermissions() {
  const { user } = useAuth();

  const hasPermission = (resource: string, action: string): boolean => {
    if (!user) return false;
    
    // Super admin a tous les droits - vérification prioritaire
    if (user.role === 'SUPER_ADMIN') return true;
    
    // Si pas de permissions définies pour l'utilisateur, pas d'accès (sauf SUPER_ADMIN)
    if (!user.permissions || !Array.isArray(user.permissions)) return false;
    
    // Vérifier la permission spécifique
    const specificPermission = `${resource}:${action}`;
    const managePermission = `${resource}:manage`;
    const adminManagePermission = 'admin:manage';
    
    return user.permissions.includes(specificPermission) ||
           user.permissions.includes(managePermission) ||
           user.permissions.includes(adminManagePermission);
  };

  const hasAnyPermission = (permissions: PermissionCheck[]): boolean => {
    if (!user) return false;
    
    // Super admin a tous les droits
    if (user.role === 'SUPER_ADMIN') return true;
    
    return permissions.some(p => hasPermission(p.resource, p.action));
  };

  const hasAllPermissions = (permissions: PermissionCheck[]): boolean => {
    if (!user) return false;
    
    // Super admin a tous les droits
    if (user.role === 'SUPER_ADMIN') return true;
    
    return permissions.every(p => hasPermission(p.resource, p.action));
  };

  const hasRole = (role: string | string[]): boolean => {
    if (!user) return false;
    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(user.role);
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    user,
    permissions: user?.permissions || []
  };
}