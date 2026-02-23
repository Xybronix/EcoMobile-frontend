import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Search, Star, DollarSign, Activity, Ban, CheckCircle, Mail, Phone, Shield, AlertCircle } from 'lucide-react';
import { Card } from '../../ui/card';
import { Input } from '../../ui/input';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../ui/dialog';
import { toast } from 'sonner';
import { Pagination } from '../../Pagination';
import { useTranslation } from '../../../lib/i18n';
import { usePermissions } from '../../../hooks/usePermissions';
import { ProtectedAccess } from '../../shared/ProtectedAccess';
import { ExportButtons } from '../ExportButtons';
import { userService, type User } from '../../../services/api/user.service';

export function UserManagement() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { hasPermission, can } = usePermissions();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: 'block' | 'unblock' | null;
    user: User | null;
    loading: boolean;
  }>({
    open: false,
    type: null,
    user: null,
    loading: false
  });

  const itemsPerPage = 10;

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await userService.getAllUsers({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm || undefined
      });

      // Plus besoin de faire des requêtes individuelles pour chaque utilisateur
      const usersWithDetails = response.users.map((user) => {
        return {
          ...user,
          accountBalance: user.accountBalance || 0,
          totalSpent: user.totalSpent || 0,
          totalTrips: user.totalTrips || 0,
          depositBalance: user.depositBalance || 0,
          reliabilityScore: Number(user.reliabilityScore) || 0,
          name: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email
        };
      });
      
      setUsers(usersWithDetails);
      setTotalUsers(response.total || 0);
      setTotalPages(response.pages || 0);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors du chargement des utilisateurs');
      setUsers([]);
      setTotalUsers(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [currentPage, searchTerm]);

  const handleSearch = (value: string) => {
    if (!hasPermission('users', 'read')) {
      toast.error('Vous n\'avez pas les permissions pour rechercher des utilisateurs');
      return;
    }
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const openConfirmDialog = (type: 'block' | 'unblock', user: User) => {
    if (!hasPermission('users', 'update')) {
      toast.error(`Vous n'avez pas les permissions pour ${type === 'block' ? 'bloquer' : 'débloquer'} des utilisateurs`);
      return;
    }

    setConfirmDialog({
      open: true,
      type,
      user,
      loading: false
    });
  };

  const closeConfirmDialog = () => {
    setConfirmDialog({
      open: false,
      type: null,
      user: null,
      loading: false
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmDialog.user || !confirmDialog.type) return;

    if (!hasPermission('users', 'update')) {
      toast.error('Vous n\'avez pas les permissions pour cette action');
      closeConfirmDialog();
      return;
    }

    try {
      setConfirmDialog(prev => ({ ...prev, loading: true }));

      if (confirmDialog.type === 'block') {
        await userService.blockUser(confirmDialog.user.id);
        toast.success(`Utilisateur ${confirmDialog.user.name || 'inconnu'} bloqué avec succès`);
      } else {
        await userService.unblockUser(confirmDialog.user.id);
        toast.success(`Utilisateur ${confirmDialog.user.name || 'inconnu'} débloqué avec succès`);
      }

      await loadUsers();
      closeConfirmDialog();
    } catch (error) {
      console.error('Erreur lors de l\'action:', error);
      toast.error(error instanceof Error ? error.message : `Erreur lors du ${confirmDialog.type === 'block' ? 'blocage' : 'déblocage'}`);
      setConfirmDialog(prev => ({ ...prev, loading: false }));
    }
  };

  const handleViewDetails = (user: User) => {
    if (!hasPermission('users', 'read')) {
      toast.error('Vous n\'avez pas les permissions pour voir les détails de cet utilisateur');
      return;
    }

    navigate(`/admin/users/${user.id}`)
  };

  const getStatusBadge = (status: string | undefined) => {
    if (!status) {
      return <Badge variant="secondary">Inconnu</Badge>;
    }
    
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Actif</Badge>;
      case 'blocked':
      case 'suspended':
      case 'banned':
        return <Badge className="bg-red-100 text-red-800">Bloqué</Badge>;
      case 'pending_verification':
        return <Badge className="bg-yellow-100 text-yellow-800">En attente de validation</Badge>;
      case 'pending':
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800">En attente</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Calculate stats from current users data with safe fallbacks
  const totalBalance = users.reduce((sum, user) => sum + (user.accountBalance || 0), 0);
  const totalSpent = users.reduce((sum, user) => sum + (user.totalSpent || 0), 0);
  const totalTrips = users.reduce((sum, user) => sum + (user.totalTrips || 0), 0);
  const totalDeposit = users.reduce((sum, user) => sum + (user.depositBalance || 0), 0);

  // Prepare export data with safe fallbacks
  const exportData = users.map(user => ({
    'Nom Complet': [user.firstName, user.lastName].filter(Boolean).join(' ') || 'N/A',
    Email: user.email || 'N/A',
    Téléphone: user.phone || 'N/A',
    'Solde Wallet': `${(user.accountBalance || 0).toLocaleString()} FCFA`,
    Caution: `${(user.depositBalance || 0).toLocaleString()} FCFA`,
    'Total Dépensé': `${(user.totalSpent || 0).toLocaleString()} FCFA`,
    Trajets: user.totalTrips || 0,
    Statut: user.status === 'active' ? 'Actif' : 'Bloqué',
    'Date d\'inscription': user.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : 'N/A'
  }));

  // Helper function to get valid users for stats
  const getValidUsersForStats = () => {
    return users.filter(user => user.name && typeof user.name === 'string');
  };

  const validUsers = getValidUsersForStats();

  if (loading && users.length === 0) {
    return (
      <div className="p-4 md:p-8 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">{t('users.loading') || 'Chargement des utilisateurs...'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-green-600">{t('users.management')}</h1>
          <p className="text-gray-600">{t('users.overview')}</p>
        </div>
        {can.exportUsers() && (
          <ExportButtons
            data={exportData}
            filename="utilisateurs"
            headers={['Nom', 'Email', 'Téléphone', 'Solde', 'Total Dépensé', 'Trajets', 'Statut']}
          />
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('users.total')}</p>
              <p className="text-2xl font-bold text-gray-900">{totalUsers || 0}</p>
            </div>
            <Users className="w-8 h-8 text-green-600" />
          </div>
        </Card>
        
        <ProtectedAccess 
          mode="component" 
          resource="wallet" 
          action="read" 
          showFallback={false}
          fallback={
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{t('users.totalBalance')}</p>
                  <p className="text-sm text-gray-500">{t('users.notAccessible')}</p>
                </div>
                <DollarSign className="w-8 h-8 text-gray-400" />
              </div>
            </Card>
          }
        >
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('users.totalBalance')}</p>
                <p className="text-2xl font-bold text-gray-900">{totalBalance.toLocaleString()} FCFA</p>
                <p className="text-xs text-gray-500">
                  {t('users.deposit')}: {totalDeposit.toLocaleString()} FCFA
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-600" />
            </div>
          </Card>
        </ProtectedAccess>
        
        <ProtectedAccess 
          mode="component" 
          resource="wallet" 
          action="read" 
          showFallback={false}
          fallback={
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{t('users.totalSpent')}</p>
                  <p className="text-sm text-gray-500">{t('users.notAccessible')}</p>
                </div>
                <DollarSign className="w-8 h-8 text-gray-400" />
              </div>
            </Card>
          }
        >
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('users.totalSpent')}</p>
                <p className="text-2xl font-bold text-gray-900">{totalSpent.toLocaleString()} FCFA</p>
              </div>
              <DollarSign className="w-8 h-8 text-yellow-600" />
            </div>
          </Card>
        </ProtectedAccess>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('users.totalTrips')}</p>
              <p className="text-2xl font-bold text-gray-900">{totalTrips || 0}</p>
            </div>
            <Activity className="w-8 h-8 text-purple-600" />
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder={t('users.searchPlaceholder') || 'Rechercher par nom, email ou téléphone...'}
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
            aria-label={t('aria.search')}
          />
        </div>
      </Card>

      {/* Users Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('users.table.user')}</TableHead>
                <TableHead>{t('users.table.contact')}</TableHead>
                <ProtectedAccess mode="component" resource="wallet" action="read" showFallback={false}>
                  <TableHead className="text-right">{t('users.table.balance')}</TableHead>
                </ProtectedAccess>
                <TableHead className="text-right">{t('users.table.deposit')}</TableHead>
                <TableHead className="text-center">{t('users.table.trips')}</TableHead>
                <ProtectedAccess mode="component" resource="wallet" action="read" showFallback={false}>
                  <TableHead className="text-right">{t('users.table.expenses')}</TableHead>
                </ProtectedAccess>
                <TableHead className="text-center">{t('users.table.score')}</TableHead>
                <TableHead className="text-center">{t('users.table.verification')}</TableHead>
                <TableHead className="text-center">{t('users.table.status')}</TableHead>
                <TableHead className="text-center">{t('users.table.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium">{[user.firstName, user.lastName].filter(Boolean).join(' ') || 'N/A'}</p>
                      <p className="text-xs text-gray-500">
                        Membre depuis {user.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : 'Date inconnue'}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p className="text-gray-600">{user.email || 'N/A'}</p>
                      <p className="text-gray-500">{user.phone || 'N/A'}</p>
                    </div>
                  </TableCell>
                  <ProtectedAccess mode="component" resource="wallet" action="read" showFallback={false}>
                    <TableCell className="text-right">
                      <span className={(user.accountBalance || 0) > 0 ? 'text-green-600' : 'text-gray-500'}>
                        {(user.accountBalance || 0).toLocaleString()} FCFA
                      </span>
                    </TableCell>
                  </ProtectedAccess>
                  <TableCell className="text-right">
                    <span className="text-blue-600">
                      {(user.depositBalance || 0).toLocaleString()} FCFA
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Activity className="w-4 h-4 text-gray-400" />
                      <span>{user.totalTrips || 0}</span>
                    </div>
                  </TableCell>
                  <ProtectedAccess mode="component" resource="wallet" action="read" showFallback={false}>
                    <TableCell className="text-right">
                      {(user.totalSpent || 0).toLocaleString()} FCFA
                    </TableCell>
                  </ProtectedAccess>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span>{(user.reliabilityScore || 0).toFixed(1)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      {user.emailVerified ? (
                        <CheckCircle className="w-4 h-4 text-green-600" aria-label={t('users.emailVerified') || 'Email vérifié'} />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-yellow-600" aria-label={t('users.emailNotVerified') || 'Email non vérifié'} />
                      )}
                      {user.phoneVerified ? (
                        <span aria-label={t('users.phoneVerified') || 'Téléphone vérifié'}>
                          <Phone className="w-4 h-4 text-green-600" />
                        </span>
                      ) : (
                        <span aria-label={t('users.phoneNotVerified') || 'Téléphone non vérifié'}>
                          <Phone className="w-4 h-4 text-gray-400" />
                        </span>
                      )}
                      {user.accountVerified ? (
                        <span aria-label={t('users.accountVerified') || 'Compte validé'}>
                          <Shield className="w-4 h-4 text-green-600" />
                        </span>
                      ) : (
                        <span aria-label={t('users.accountPending') || 'Compte en attente'}>
                          <Shield className="w-4 h-4 text-yellow-600" />
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {getStatusBadge(user.status)}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewDetails(user)}
                        aria-label={t('aria.viewUserDetails') || `Voir les détails de ${user.name || 'l\'utilisateur'}`}
                        title={t('aria.viewUserDetails') || `Voir les détails de ${user.name || 'l\'utilisateur'}`}
                      >
                        {t('common.viewDetails')}
                      </Button>
                      
                      <ProtectedAccess mode="component" resource="users" action="update" showFallback={false}>
                        {user.status === 'active' ? (
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={actionLoading === user.id}
                            onClick={() => openConfirmDialog('block', user)}
                            aria-label={t('aria.blockUser') || `Bloquer ${user.name || 'l\'utilisateur'}`}
                            title={t('users.block')}
                          >
                            {actionLoading === user.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : (
                              <Ban className="w-4 h-4" />
                            )}
                          </Button>
                        ) : (
                          <Button
                            variant="default"
                            size="sm"
                            disabled={actionLoading === user.id}
                            onClick={() => openConfirmDialog('unblock', user)}
                            aria-label={t('aria.unblockUser') || `Débloquer ${user.name || 'l\'utilisateur'}`}
                            title={t('users.unblock')}
                          >
                            {actionLoading === user.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                          </Button>
                        )}
                      </ProtectedAccess>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination */}
        {totalUsers > 0 && (
          <div className="p-4 border-t">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalUsers}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </Card>

      {users.length === 0 && !loading && (
        <Card className="p-12">
          <div className="text-center text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>{t('users.noUsersFound') || 'Aucun utilisateur trouvé'}</p>
            <p className="text-sm mt-1">{t('users.tryModifyingSearch') || 'Essayez de modifier votre recherche'}</p>
          </div>
        </Card>
      )}

      {/* User Segments - Visible seulement avec permissions wallet ET si il y a des utilisateurs valides */}
      <ProtectedAccess mode="component" resource="wallet" action="read" showFallback={false}>
        {validUsers.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Meilleurs Clients</h3>
              <div className="space-y-3">
                {validUsers.length > 0 ? (
                  validUsers
                    .filter(user => (user.totalSpent || 0) > 0)
                    .sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0))
                    .slice(0, 3)
                    .map((user, index) => (
                      <div key={user.id} className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-yellow-700">{index + 1}</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{user.name}</p>
                          <p className="text-xs text-gray-500">{(user.totalSpent || 0).toLocaleString()} FCFA</p>
                        </div>
                      </div>
                    ))
                ) : (
                  <p className="text-sm text-gray-500">{t('users.noClientsYet')}</p>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">{t('users.mostActive')}</h3>
              <div className="space-y-3">
                {validUsers.length > 0 ? (
                  validUsers
                    .filter(user => (user.totalTrips || 0) > 0)
                    .sort((a, b) => (b.totalTrips || 0) - (a.totalTrips || 0))
                    .slice(0, 3)
                    .map((user, index) => (
                      <div key={user.id} className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-700">{index + 1}</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.totalTrips || 0} trajet(s)</p>
                        </div>
                      </div>
                    ))
                ) : (
                  <p className="text-sm text-gray-500">{t('users.noActiveMembersYet')}</p>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">{t('users.bestScores')}</h3>
              <div className="space-y-3">
                {validUsers.length > 0 ? (
                  validUsers
                    .filter(user => (user.reliabilityScore || 0) > 0)
                    .sort((a, b) => (b.reliabilityScore || 0) - (a.reliabilityScore || 0))
                    .slice(0, 3)
                    .map((user, index) => (
                      <div key={user.id} className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-green-700">{index + 1}</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{user.name}</p>
                          <p className="text-xs text-gray-500">
                            <Star className="w-3 h-3 inline text-yellow-500 fill-yellow-500" /> {(user.reliabilityScore || 0).toFixed(1)}
                          </p>
                        </div>
                      </div>
                    ))
                ) : (
                  <p className="text-sm text-gray-500">{t('users.noScoresYet')}</p>
                )}
              </div>
            </Card>
          </div>
        )}
      </ProtectedAccess>

      {/* Dialog de confirmation */}
      <Dialog open={confirmDialog.open} onOpenChange={closeConfirmDialog}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>
              {confirmDialog.type === 'block' ? (t('users.blockUser') || 'Bloquer l\'utilisateur') : (t('users.unblockUser') || 'Débloquer l\'utilisateur')}
            </DialogTitle>
            <DialogDescription>
              {confirmDialog.type === 'block'
                ? `Êtes-vous sûr de vouloir bloquer ${confirmDialog.user?.name || 'cet utilisateur'} ?`
                : `Êtes-vous sûr de vouloir débloquer ${confirmDialog.user?.name || 'cet utilisateur'} ?`
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={closeConfirmDialog}
              disabled={confirmDialog.loading}
              aria-label={t('aria.cancel')}
            >
              {t('common.cancel')}
            </Button>
            <Button 
              variant={confirmDialog.type === 'block' ? 'destructive' : 'default'}
              onClick={handleConfirmAction}
              disabled={confirmDialog.loading}
              aria-label={confirmDialog.type === 'block' ? (t('aria.confirmBlock') || 'Confirmer le blocage') : (t('aria.confirmUnblock') || 'Confirmer le déblocage')}
            >
              {confirmDialog.loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : null}
              {confirmDialog.type === 'block' ? (t('common.block') || 'Bloquer') : (t('common.unblock') || 'Débloquer')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}