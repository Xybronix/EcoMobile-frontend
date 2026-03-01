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

  // Helpers spécifiques pour les pages admin
  const can = {
    // Dashboard
    viewDashboard: () => hasPermission('dashboard', 'read') || hasPermission('admin', 'read'),
    exportDashboard: () => hasPermission('dashboard', 'export'),

    // Utilisateurs
    viewUsers: () => hasPermission('users', 'read'),
    createUser: () => hasPermission('users', 'create'),
    updateUser: () => hasPermission('users', 'update'),
    deleteUser: () => hasPermission('users', 'delete'),
    exportUsers: () => hasPermission('users', 'export'),
    banUser: () => hasPermission('users', 'ban'),
    verifyUser: () => hasPermission('users', 'verify'),
    resetUserPassword: () => hasPermission('users', 'reset_password'),
    manageUserDeposit: () => hasPermission('users', 'manage_deposit'),
    manageUserWallet: () => hasPermission('users', 'manage_wallet'),
    viewUserDocuments: () => hasPermission('users', 'view_documents'),
    validateUserDocuments: () => hasPermission('users', 'validate_documents'),

    // Vélos
    viewBikes: () => hasPermission('bikes', 'read'),
    createBike: () => hasPermission('bikes', 'create'),
    updateBike: () => hasPermission('bikes', 'update'),
    deleteBike: () => hasPermission('bikes', 'delete'),
    exportBikes: () => hasPermission('bikes', 'export'),
    viewBikeMap: () => hasPermission('bikes', 'view_map'),
    viewBikeTrips: () => hasPermission('bikes', 'view_trips'),
    viewBikeMaintenance: () => hasPermission('bikes', 'view_maintenance'),
    manageBikeActions: () => hasPermission('bikes', 'manage_actions'),

    // Réservations
    viewReservations: () => hasPermission('reservations', 'read'),
    createReservation: () => hasPermission('reservations', 'create'),
    updateReservation: () => hasPermission('reservations', 'update'),
    deleteReservation: () => hasPermission('reservations', 'delete'),
    exportReservations: () => hasPermission('reservations', 'export'),
    cancelReservation: () => hasPermission('reservations', 'cancel'),

    // Trajets
    viewRides: () => hasPermission('rides', 'read'),
    createRide: () => hasPermission('rides', 'create'),
    updateRide: () => hasPermission('rides', 'update'),
    deleteRide: () => hasPermission('rides', 'delete'),
    exportRides: () => hasPermission('rides', 'export'),

    // Maintenance
    viewMaintenance: () => hasPermission('maintenance', 'read'),
    createMaintenance: () => hasPermission('maintenance', 'create'),
    updateMaintenance: () => hasPermission('maintenance', 'update'),
    deleteMaintenance: () => hasPermission('maintenance', 'delete'),
    exportMaintenance: () => hasPermission('maintenance', 'export'),

    // Incidents
    viewIncidents: () => hasPermission('incidents', 'read'),
    createIncident: () => hasPermission('incidents', 'create'),
    updateIncident: () => hasPermission('incidents', 'update'),
    deleteIncident: () => hasPermission('incidents', 'delete'),
    exportIncidents: () => hasPermission('incidents', 'export'),
    resolveIncident: () => hasPermission('incidents', 'resolve'),

    // Avis
    viewReviews: () => hasPermission('reviews', 'read'),
    createReview: () => hasPermission('reviews', 'create'),
    updateReview: () => hasPermission('reviews', 'update'),
    deleteReview: () => hasPermission('reviews', 'delete'),
    exportReviews: () => hasPermission('reviews', 'export'),
    moderateReview: () => hasPermission('reviews', 'moderate'),

    // Finances / Portefeuille
    viewWallet: () => hasPermission('wallet', 'read'),
    updateWallet: () => hasPermission('wallet', 'update'),
    exportWallet: () => hasPermission('wallet', 'export'),
    refundWallet: () => hasPermission('wallet', 'refund'),
    chargeWallet: () => hasPermission('wallet', 'charge'),
    viewTransactions: () => hasPermission('wallet', 'view_transactions'),

    // Paramètres
    viewSettings: () => hasPermission('settings', 'read'),
    updateSettings: () => hasPermission('settings', 'update'),

    // Tarification
    viewPricing: () => hasPermission('pricing', 'read'),
    createPricing: () => hasPermission('pricing', 'create'),
    updatePricing: () => hasPermission('pricing', 'update'),
    deletePricing: () => hasPermission('pricing', 'delete'),
    manageFreeDays: () => hasPermission('pricing', 'manage_free_days'),

    // Chat
    viewChat: () => hasPermission('chat', 'read'),
    sendChat: () => hasPermission('chat', 'create'),
    deleteChat: () => hasPermission('chat', 'delete'),

    // Notifications
    viewNotifications: () => hasPermission('notifications', 'read'),
    sendNotification: () => hasPermission('notifications', 'create'),
    sendBulkNotification: () => hasPermission('notifications', 'send_bulk'),
    deleteNotification: () => hasPermission('notifications', 'delete'),

    // Journaux
    viewLogs: () => hasPermission('logs', 'read'),
    exportLogs: () => hasPermission('logs', 'export'),
    deleteLogs: () => hasPermission('logs', 'delete'),

    // Rôles
    viewRoles: () => hasPermission('roles', 'read'),
    createRole: () => hasPermission('roles', 'create'),
    updateRole: () => hasPermission('roles', 'update'),
    deleteRole: () => hasPermission('roles', 'delete'),
    assignRole: () => hasPermission('roles', 'assign'),

    // Permissions
    viewPermissions: () => hasPermission('permissions', 'read'),
    managePermissions: () => hasPermission('permissions', 'manage'),

    // Employés
    viewEmployees: () => hasPermission('employees', 'read'),
    createEmployee: () => hasPermission('employees', 'create'),
    updateEmployee: () => hasPermission('employees', 'update'),
    deleteEmployee: () => hasPermission('employees', 'delete'),
    exportEmployees: () => hasPermission('employees', 'export'),
    resetEmployeePassword: () => hasPermission('employees', 'reset_password'),

    // Abonnements
    viewSubscriptions: () => hasPermission('subscriptions', 'read'),
    createSubscription: () => hasPermission('subscriptions', 'create'),
    updateSubscription: () => hasPermission('subscriptions', 'update'),
    deleteSubscription: () => hasPermission('subscriptions', 'delete'),
    exportSubscriptions: () => hasPermission('subscriptions', 'export'),

    // Monitoring
    viewMonitoring: () => hasPermission('monitoring', 'read'),
    manageMonitoring: () => hasPermission('monitoring', 'manage'),

    // Documents
    viewDocuments: () => hasPermission('documents', 'read'),
    updateDocument: () => hasPermission('documents', 'update'),
    deleteDocument: () => hasPermission('documents', 'delete'),
    validateDocument: () => hasPermission('documents', 'validate'),
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    can,
    user,
    permissions: user?.permissions || []
  };
}
