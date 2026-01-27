// components/shared/ProtectedAccess.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '../../hooks/usePermissions';
import { Bike, AlertCircle, Lock, ShieldOff, Home, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

interface ProtectedAccessProps {
  children?: React.ReactNode;
  requiredRole?: string | string[];
  requiredPermissions?: Array<{ resource: string; action: string }>;
  resource?: string;
  action?: string;
  fallback?: React.ReactNode;
  mode?: 'route' | 'component'; // route = page entière, component = élément dans la page
  showFallback?: boolean;
  redirectTo?: string;
  requireAll?: boolean;
}

export function ProtectedAccess({
  children,
  requiredRole,
  requiredPermissions = [],
  resource,
  action,
  fallback,
  mode = 'component',
  showFallback = true,
  redirectTo,
  requireAll = false
}: ProtectedAccessProps) {
  const { user, isLoading } = useAuth();
  const { hasPermission, hasRole, hasAnyPermission, hasAllPermissions } = usePermissions();
  const location = useLocation();

  // Construire la liste des permissions à vérifier
  const permissionsToCheck = [...requiredPermissions];
  if (resource && action) {
    permissionsToCheck.push({ resource, action });
  }

  // Loading state pour les routes
  if (isLoading && mode === 'route') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center mb-4 mx-auto">
            <Bike className="w-10 h-10 text-white animate-pulse" />
          </div>
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Vérification de l'authentification...</p>
        </div>
      </div>
    );
  }

  // Vérifier l'authentification pour les routes
  if (!user && mode === 'route') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si pas d'utilisateur pour les composants, ne rien afficher
  if (!user && mode === 'component') {
    return showFallback ? (fallback || null) : null;
  }

  let hasAccess = true;
  let errorType: 'role' | 'permission' | 'inactive' = 'permission';
  let errorDetails = '';

  // Vérifier si l'utilisateur est actif
  if (user && !user.isActive) {
    hasAccess = false;
    errorType = 'inactive';
    errorDetails = 'Votre compte a été désactivé';
  }

  // Vérifier les rôles
  if (hasAccess && requiredRole && !hasRole(requiredRole)) {
    hasAccess = false;
    errorType = 'role';
    const roles = Array.isArray(requiredRole) ? requiredRole.join(', ') : requiredRole;
    errorDetails = `Rôle requis: ${roles} | Votre rôle: ${user?.role}`;
  }

  // Vérifier les permissions
  if (hasAccess && permissionsToCheck.length > 0) {
    const hasRequiredPermissions = requireAll 
      ? hasAllPermissions(permissionsToCheck)
      : hasAnyPermission(permissionsToCheck);

    if (!hasRequiredPermissions) {
      hasAccess = false;
      errorType = 'permission';
      errorDetails = `Permissions requises: ${permissionsToCheck.map(p => `${p.resource}:${p.action}`).join(', ')}`;
    }
  }

  // Si l'accès est autorisé, afficher le contenu
  if (hasAccess) {
    return <>{children || null}</>;
  }

  // Gestion des accès refusés selon le mode
  if (mode === 'route') {
    return <AccessDeniedPage 
      errorType={errorType} 
      errorDetails={errorDetails} 
      redirectTo={redirectTo}
      user={user}
    />;
  }

  // Pour les composants, afficher le fallback ou rien
  return showFallback ? (fallback || <AccessDeniedComponent errorType={errorType} />) : null;
}

// Composant pour affichage page entière
function AccessDeniedPage({ 
  errorType, 
  errorDetails, 
  redirectTo,
  user 
}: { 
  errorType: 'role' | 'permission' | 'inactive';
  errorDetails: string;
  redirectTo?: string;
  user: any;
}) {
  const getErrorConfig = () => {
    switch (errorType) {
      case 'role':
        return {
          icon: ShieldOff,
          title: 'Accès Refusé',
          message: 'Vous n\'avez pas le rôle nécessaire pour accéder à cette page.',
          bgColor: 'from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20',
          iconBg: 'bg-red-100 dark:bg-red-900/50',
          iconColor: 'text-red-600 dark:text-red-400',
          titleColor: 'text-red-600 dark:text-red-400'
        };
      case 'permission':
        return {
          icon: Lock,
          title: 'Permission Insuffisante',
          message: 'Vous n\'avez pas la permission d\'accéder à cette fonctionnalité.',
          bgColor: 'from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20',
          iconBg: 'bg-orange-100 dark:bg-orange-900/50',
          iconColor: 'text-orange-600 dark:text-orange-400',
          titleColor: 'text-orange-600 dark:text-orange-400'
        };
      case 'inactive':
        return {
          icon: AlertCircle,
          title: 'Compte Désactivé',
          message: 'Votre compte a été désactivé. Contactez l\'administrateur.',
          bgColor: 'from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20',
          iconBg: 'bg-gray-100 dark:bg-gray-900/50',
          iconColor: 'text-gray-600 dark:text-gray-400',
          titleColor: 'text-gray-600 dark:text-gray-400'
        };
      default:
        return {
          icon: AlertCircle,
          title: 'Accès Refusé',
          message: 'Vous n\'avez pas accès à cette ressource.',
          bgColor: 'from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20',
          iconBg: 'bg-red-100 dark:bg-red-900/50',
          iconColor: 'text-red-600 dark:text-red-400',
          titleColor: 'text-red-600 dark:text-red-400'
        };
    }
  };

  const config = getErrorConfig();
  const Icon = config.icon;

  return (
    <div className={`min-h-screen bg-gradient-to-br ${config.bgColor} flex items-center justify-center p-4`}>
      <Card className="p-8 max-w-lg w-full text-center shadow-xl">
        <div className={`w-20 h-20 ${config.iconBg} rounded-full flex items-center justify-center mb-6 mx-auto`}>
          <Icon className={`w-10 h-10 ${config.iconColor}`} />
        </div>
        
        <h2 className={`text-2xl font-bold ${config.titleColor} mb-4`}>
          {config.title}
        </h2>
        
        <p className="text-gray-600 dark:text-gray-400 mb-4 text-lg">
          {config.message}
        </p>
        
        {errorDetails && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {errorDetails}
            </p>
          </div>
        )}

        {user && (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-600 dark:text-blue-400">
              Connecté en tant que: <span className="font-medium">{user.name}</span>
            </p>
            <p className="text-xs text-blue-500 dark:text-blue-400">
              {user.email} • {user.role}
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Button>
          
          <Button
            onClick={() => window.location.href = redirectTo || (user?.role === 'USER' ? '/' : '/admin/dashboard')}
            className="flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            {user?.role === 'USER' ? 'Accueil' : 'Dashboard'}
          </Button>
        </div>
      </Card>
    </div>
  );
}

// Composant compact pour utilisation dans les pages
function AccessDeniedComponent({ errorType }: { errorType: 'role' | 'permission' | 'inactive' }) {
  const getConfig = () => {
    switch (errorType) {
      case 'role':
        return { icon: ShieldOff, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' };
      case 'permission':
        return { icon: Lock, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' };
      default:
        return { icon: AlertCircle, color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-gray-900/20' };
    }
  };

  const config = getConfig();
  const Icon = config.icon;

  return (
    <div className={`${config.bg} rounded-lg p-4 text-center`}>
      <Icon className={`w-8 h-8 ${config.color} mx-auto mb-2`} />
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Accès restreint
      </p>
    </div>
  );
}

// Alias pour compatibilité
export const ProtectedRoute = ProtectedAccess;
export const ProtectedComponent = ProtectedAccess;