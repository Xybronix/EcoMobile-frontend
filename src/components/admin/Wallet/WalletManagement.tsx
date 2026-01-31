import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, Search, DollarSign, Activity, Clock, CheckCircle, XCircle, Eye, Filter, Calendar, User, CreditCard } from 'lucide-react';
import { Card } from '../../ui/card';
import { Input } from '../../ui/input';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Textarea } from '../../ui/textarea';
import { toast } from 'sonner';
import { Pagination } from '../../Pagination';
import { useTranslation } from '../../../lib/i18n';
import { usePermissions } from '../../../hooks/usePermissions';
import { ProtectedAccess } from '../../shared/ProtectedAccess';
import { ExportButtons } from '../ExportButtons';
import { walletService, type WalletTransaction, type TransactionFilters } from '../../../services/api/wallet.service';

export function WalletManagement() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Filtres
  const [filters, setFilters] = useState<TransactionFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  
  // Dialog pour actions sur transactions en espèces
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    type: 'validate' | 'reject' | null;
    transaction: WalletTransaction | null;
    loading: boolean;
    reason?: string;
    adminNote?: string;
  }>({
    open: false,
    type: null,
    transaction: null,
    loading: false
  });

  // Dialog pour les détails de transaction
  const [detailsDialog, setDetailsDialog] = useState<{
    open: boolean;
    transaction: WalletTransaction | null;
    loading: boolean;
  }>({
    open: false,
    transaction: null,
    loading: false
  });

  // Stats globales
  const [globalStats, setGlobalStats] = useState({
    totalBalance: 0,
    totalTransactions: 0,
    pendingCashRequests: 0,
    completedTransactions: 0,
    failedTransactions: 0,
    totalDeposited: 0,
    totalWithdrawn: 0
  });

  const itemsPerPage = 20;
  const isLoadingRef = useRef(false);
  const statsLoadedRef = useRef(false);

  const loadTransactions = async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    
    try {
      setLoading(true);
      const response = await walletService.getAllTransactions(
        currentPage,
        itemsPerPage,
        {
          ...filters,
          ...(searchTerm && { search: searchTerm })
        }
      );
      
      setTransactions(response.transactions || []);
      setTotalTransactions(response.pagination.total || 0);
      setTotalPages(response.pagination.totalPages || 0);
    } catch (error) {
      console.error('Erreur lors du chargement des transactions:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors du chargement des transactions');
      setTransactions([]);
      setTotalTransactions(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  };

  const loadGlobalStats = async () => {
    if (statsLoadedRef.current) return;
    statsLoadedRef.current = true;
    
    try {
      const stats = await walletService.getGlobalWalletStats();
      setGlobalStats(stats);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
      // Ne pas afficher d'erreur pour les stats, c'est pas critique
      statsLoadedRef.current = false; // Réessayer au prochain chargement
    }
  };

  const loadTransactionDetails = async (transactionId: string) => {
    try {
      setDetailsDialog(prev => ({ ...prev, loading: true }));
      const transaction = await walletService.getAdminTransactionById(transactionId);
      setDetailsDialog({
        open: true,
        transaction,
        loading: false
      });
    } catch (error) {
      console.error('Erreur lors du chargement des détails:', error);
      toast.error('Erreur lors du chargement des détails de la transaction');
      setDetailsDialog({
        open: false,
        transaction: null,
        loading: false
      });
    }
  };

  // Charger les transactions uniquement quand currentPage change
  useEffect(() => {
    loadTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  // Charger les stats une seule fois au montage
  useEffect(() => {
    if (hasPermission('wallet', 'read') && !statsLoadedRef.current) {
      loadGlobalStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recharger quand les filtres changent (mais seulement si on est sur la page 1)
  useEffect(() => {
    if (currentPage === 1) {
      loadTransactions();
    } else {
      setCurrentPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters)]);

  const handleSearch = (value: string) => {
    if (!hasPermission('wallet', 'read')) {
      toast.error('Vous n\'avez pas les permissions pour rechercher des transactions');
      return;
    }
    setSearchTerm(value);
    setCurrentPage(1);
  };

  // Debounce pour la recherche
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm !== undefined) {
        setCurrentPage(1);
        loadTransactions();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const handleFilterChange = (key: keyof TransactionFilters, value: string) => {
    const newFilters = { ...filters };
    if (value && value !== 'all') {
      newFilters[key] = value;
    } else {
      delete newFilters[key];
    }
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const openActionDialog = (type: 'validate' | 'reject', transaction: WalletTransaction) => {
    if (!hasPermission('wallet', 'manage')) {
      toast.error(`Vous n'avez pas les permissions pour ${type === 'validate' ? 'valider' : 'rejeter'} des transactions`);
      return;
    }

    setActionDialog({
      open: true,
      type,
      transaction,
      loading: false,
      reason: '',
      adminNote: ''
    });
  };

  const closeActionDialog = () => {
    setActionDialog({
      open: false,
      type: null,
      transaction: null,
      loading: false
    });
  };

  const closeDetailsDialog = () => {
    setDetailsDialog({
      open: false,
      transaction: null,
      loading: false
    });
  };

  const handleConfirmAction = async () => {
    if (!actionDialog.transaction || !actionDialog.type) return;

    if (!hasPermission('wallet', 'manage')) {
      toast.error('Vous n\'avez pas les permissions pour cette action');
      closeActionDialog();
      return;
    }

    if (actionDialog.type === 'reject' && !actionDialog.reason?.trim()) {
      toast.error('La raison du rejet est obligatoire');
      return;
    }

    try {
      setActionDialog(prev => ({ ...prev, loading: true }));

      if (actionDialog.type === 'validate') {
        await walletService.validateCashDeposit(
          actionDialog.transaction.id, 
          actionDialog.adminNote
        );
        toast.success(`Transaction validée avec succès`);
      } else {
        await walletService.rejectCashDeposit(
          actionDialog.transaction.id, 
          actionDialog.reason!
        );
        toast.success(`Transaction rejetée`);
      }

      statsLoadedRef.current = false; // Réinitialiser pour recharger les stats
      await loadTransactions();
      await loadGlobalStats();
      closeActionDialog();
    } catch (error) {
      console.error('Erreur lors de l\'action:', error);
      toast.error(error instanceof Error ? error.message : `Erreur lors de l'${actionDialog.type === 'validate' ? 'acceptation' : 'rejet'}`);
      setActionDialog(prev => ({ ...prev, loading: false }));
    }
  };

  const getTransactionTypeBadge = (type: string) => {
    const typeMap: { [key: string]: { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } } = {
      'DEPOSIT': { label: t('wallet.mobileDeposit') || 'Dépôt OM/MoMo', variant: 'default' },
      'CASH_DEPOSIT': { label: t('wallet.cashDeposit') || 'Dépôt Espèces', variant: 'secondary' },
      'WITHDRAWAL': { label: t('wallet.withdrawal') || 'Retrait', variant: 'destructive' },
      'RIDE_PAYMENT': { label: t('wallet.ridePayment') || 'Paiement Course', variant: 'outline' },
      'REFUND': { label: t('wallet.refund') || 'Remboursement', variant: 'default' },
      'DAMAGE_CHARGE': { label: t('wallet.damageCharge') || 'Charge de dégâts', variant: 'destructive' }
    };

    const config = typeMap[type] || { label: type, variant: 'outline' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStatusBadge = (status: string, type?: string) => {
    if (type === 'CASH_DEPOSIT') {
      switch (status) {
        case 'PENDING':
          return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">{t('wallet.status.pending') || 'En attente'}</Badge>;
        case 'COMPLETED':
          return <Badge variant="default" className="bg-green-100 text-green-800">{t('wallet.status.validated') || 'Validée'}</Badge>;
        case 'FAILED':
          return <Badge variant="destructive">{t('wallet.status.rejected') || 'Rejetée'}</Badge>;
        case 'CANCELLED':
          return <Badge variant="outline">{t('wallet.status.cancelled') || 'Annulée'}</Badge>;
        default:
          return <Badge variant="outline">{status}</Badge>;
      }
    }

    switch (status) {
      case 'COMPLETED':
        return <Badge variant="default" className="bg-green-100 text-green-800">{t('wallet.status.completed') || 'Complétée'}</Badge>;
      case 'PENDING':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">{t('wallet.status.inProgress') || 'En cours'}</Badge>;
      case 'FAILED':
        return <Badge variant="destructive">{t('wallet.status.failed') || 'Échouée'}</Badge>;
      case 'CANCELLED':
        return <Badge variant="outline">{t('wallet.status.cancelled') || 'Annulée'}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const canPerformAction = (transaction: WalletTransaction) => {
    return transaction.type === 'CASH_DEPOSIT' && 
           transaction.status === 'PENDING' && 
           hasPermission('wallet', 'manage');
  };

  const exportData = transactions.map(transaction => ({
    ID: transaction.id,
    Type: transaction.type,
    Montant: `${transaction.amount.toLocaleString()} FCFA`,
    Frais: `${transaction.fees.toLocaleString()} FCFA`,
    'Montant Total': `${transaction.totalAmount.toLocaleString()} FCFA`,
    Statut: transaction.status,
    'Méthode de Paiement': transaction.paymentMethod || 'N/A',
    Utilisateur: transaction.wallet?.user ? `${transaction.wallet.user.firstName} ${transaction.wallet.user.lastName}` : 'N/A',
    Email: transaction.wallet?.user?.email || 'N/A',
    'Date de Création': new Date(transaction.createdAt).toLocaleDateString('fr-FR'),
    'Date de Validation': transaction.validatedAt ? new Date(transaction.validatedAt).toLocaleDateString('fr-FR') : 'N/A',
    'Raison du Rejet': transaction.rejectionReason || 'N/A'
  }));

  if (loading && transactions.length === 0) {
    return (
      <div className="p-4 md:p-8 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">{t('wallet.loading') || 'Chargement des transactions...'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-green-600">{t('wallet.management') || 'Gestion des Portefeuilles'}</h1>
          <p className="text-gray-600">{t('wallet.overview') || 'Gestion des transactions et des demandes de recharge'}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            aria-label={t('aria.toggleFilters') || 'Afficher/Masquer les filtres'}
            title={t('aria.toggleFilters') || 'Afficher/Masquer les filtres'}
          >
            <Filter className="w-4 h-4 mr-2" />
            {t('common.filters') || 'Filtres'}
          </Button>
          <ExportButtons 
            data={exportData} 
            filename="transactions-portefeuilles"
            headers={Object.keys(exportData[0] || {})}
          />
        </div>
      </div>

      {/* Cartes de statistiques */}
      <ProtectedAccess mode="component" resource="wallet" action="read" showFallback={false}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('wallet.totalBalance') || 'Solde Total'}</p>
                <p className="text-2xl font-bold text-gray-900">{globalStats.totalBalance.toLocaleString()} FCFA</p>
              </div>
              <Wallet className="w-8 h-8 text-green-600" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('wallet.pendingRequests') || 'Demandes en Attente'}</p>
                <p className="text-2xl font-bold text-yellow-600">{globalStats.pendingCashRequests}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('wallet.totalTransactions') || 'Total Transactions'}</p>
                <p className="text-2xl font-bold text-gray-900">{globalStats.totalTransactions}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-600" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('wallet.totalDeposited') || 'Total Déposé'}</p>
                <p className="text-2xl font-bold text-gray-900">{globalStats.totalDeposited.toLocaleString()} FCFA</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </Card>
        </div>
      </ProtectedAccess>

      {/* Barre de recherche et filtres */}
      <Card className="p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder={t('wallet.searchPlaceholder') || "Rechercher par ID, email ou nom d'utilisateur..."}
              aria-label={t('aria.search')}
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm('');
              setFilters({});
              setCurrentPage(1);
            }}
            aria-label={t('aria.resetFilters') || 'Réinitialiser les filtres'}
            title={t('aria.resetFilters') || 'Réinitialiser les filtres'}
            >
              {t('common.reset') || 'Réinitialiser'}
            </Button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
            <Select value={filters.type || 'all'} onValueChange={(value) => handleFilterChange('type', value)}>
              <SelectTrigger>
                <SelectValue placeholder={t('wallet.transactionType') || 'Type de transaction'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('wallet.allTypes') || 'Tous les types'}</SelectItem>
                <SelectItem value="CASH_DEPOSIT">{t('wallet.cashDeposit') || 'Dépôt Espèces'}</SelectItem>
                <SelectItem value="DEPOSIT">{t('wallet.mobileDeposit') || 'Dépôt OM/MoMo'}</SelectItem>
                <SelectItem value="WITHDRAWAL">{t('wallet.withdrawal') || 'Retrait'}</SelectItem>
                <SelectItem value="RIDE_PAYMENT">{t('wallet.ridePayment') || 'Paiement Course'}</SelectItem>
                <SelectItem value="REFUND">{t('wallet.refund') || 'Remboursement'}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.status || 'all'} onValueChange={(value) => handleFilterChange('status', value)}>
              <SelectTrigger>
                <SelectValue placeholder={t('wallet.status') || 'Statut'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('wallet.allStatuses') || 'Tous les statuts'}</SelectItem>
                <SelectItem value="PENDING">{t('wallet.status.pending') || 'En attente'}</SelectItem>
                <SelectItem value="COMPLETED">{t('wallet.status.completed') || 'Complétée'}</SelectItem>
                <SelectItem value="FAILED">{t('wallet.status.failed') || 'Échouée'}</SelectItem>
                <SelectItem value="CANCELLED">{t('wallet.status.cancelled') || 'Annulée'}</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              placeholder={t('wallet.startDate') || 'Date de début'}
              aria-label={t('wallet.startDate') || 'Date de début'}
              value={filters.dateFrom || ''}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            />

            <Input
              type="date"
              placeholder={t('wallet.endDate') || 'Date de fin'}
              aria-label={t('wallet.endDate') || 'Date de fin'}
              value={filters.dateTo || ''}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            />
          </div>
        )}
      </Card>

      {/* Tableau des transactions */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('wallet.table.transaction') || 'Transaction'}</TableHead>
                <TableHead>{t('wallet.table.user') || 'Utilisateur'}</TableHead>
                <TableHead>{t('wallet.table.type') || 'Type'}</TableHead>
                <TableHead className="text-right">{t('wallet.table.amount') || 'Montant'}</TableHead>
                <TableHead className="text-center">{t('wallet.table.status') || 'Statut'}</TableHead>
                <TableHead className="text-center">{t('wallet.table.date') || 'Date'}</TableHead>
                <TableHead className="text-center">{t('wallet.table.actions') || 'Actions'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{transaction.id.slice(-8)}</p>
                      {transaction.paymentMethod && (
                        <p className="text-xs text-gray-500">{transaction.paymentMethod}</p>
                      )}
                      {transaction.rejectionReason && (
                        <p className="text-xs text-red-600">Rejet: {transaction.rejectionReason}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {transaction.wallet?.user ? (
                      <div className="space-y-1">
                        <p className="text-sm font-medium">
                          {transaction.wallet.user.firstName} {transaction.wallet.user.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{transaction.wallet.user.email}</p>
                        <p className="text-xs text-gray-500">{transaction.wallet.user.phone}</p>
                      </div>
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {getTransactionTypeBadge(transaction.type)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="space-y-1">
                      <p className="font-medium">{transaction.amount.toLocaleString()} FCFA</p>
                      {transaction.fees > 0 && (
                        <p className="text-xs text-gray-500">Frais: {transaction.fees.toLocaleString()} FCFA</p>
                      )}
                      <p className="text-xs font-medium">Total: {transaction.totalAmount.toLocaleString()} FCFA</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {getStatusBadge(transaction.status, transaction.type)}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="space-y-1">
                      <p className="text-sm">{new Date(transaction.createdAt).toLocaleDateString('fr-FR')}</p>
                      <p className="text-xs text-gray-500">{new Date(transaction.createdAt).toLocaleTimeString('fr-FR')}</p>
                      {transaction.validatedAt && (
                        <p className="text-xs text-green-600">
                          Validé: {new Date(transaction.validatedAt).toLocaleDateString('fr-FR')}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadTransactionDetails(transaction.id)}
                        disabled={detailsDialog.loading}
                        aria-label={t('aria.viewTransactionDetails') || 'Voir les détails de la transaction'}
                        title={t('aria.viewTransactionDetails') || 'Voir les détails de la transaction'}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      
                      {/* Ne pas afficher les boutons de validation pour les charges admin (DAMAGE_CHARGE déjà validées) */}
                      {transaction.type !== 'DAMAGE_CHARGE' && (
                        <ProtectedAccess 
                          mode="component" 
                          resource="wallet" 
                          action="update" 
                          showFallback={false}
                          fallback={
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => openActionDialog('validate', transaction)}
                              disabled={actionLoading === transaction.id}
                              aria-label={t('aria.validateTransaction') || 'Valider la transaction'}
                              title={t('aria.validateTransaction') || 'Valider la transaction'}
                            >
                              {actionLoading === transaction.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              ) : (
                                <CheckCircle className="w-4 h-4" />
                              )}
                            </Button>
                          }
                        />
                      )}

                      <ProtectedAccess 
                        mode="component" 
                        resource="wallet" 
                        action="update" 
                        showFallback={false}
                        fallback={
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => openActionDialog('reject', transaction)}
                            disabled={actionLoading === transaction.id}
                          >
                            {actionLoading === transaction.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : (
                              <XCircle className="w-4 h-4" />
                            )}
                          </Button>
                        }
                      />

                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => openActionDialog('reject', transaction)}
                        disabled={actionLoading === transaction.id}
                      >
                        {actionLoading === transaction.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination */}
        {totalTransactions > 0 && (
          <div className="p-4 border-t">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalTransactions}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </Card>

      {transactions.length === 0 && !loading && (
        <Card className="p-12">
          <div className="text-center text-gray-500">
            <Wallet className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Aucune transaction trouvée</p>
            <p className="text-sm mt-1">Essayez de modifier vos critères de recherche</p>
          </div>
        </Card>
      )}

      {/* Dialog de détails de transaction */}
      <Dialog open={detailsDialog.open} onOpenChange={closeDetailsDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Détails de la Transaction
            </DialogTitle>
            {detailsDialog.transaction && (
              <DialogDescription>
                Transaction ID: {detailsDialog.transaction.id}
              </DialogDescription>
            )}
          </DialogHeader>
          
          {detailsDialog.loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          ) : detailsDialog.transaction ? (
            <div className="space-y-6">
              {/* Informations de base */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Type</h4>
                    {getTransactionTypeBadge(detailsDialog.transaction.type)}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Statut</h4>
                    {getStatusBadge(detailsDialog.transaction.status, detailsDialog.transaction.type)}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Méthode de Paiement</h4>
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-gray-500" />
                      <span>{detailsDialog.transaction.paymentMethod || 'N/A'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Montant</h4>
                    <p className="text-lg font-semibold">{detailsDialog.transaction.amount.toLocaleString()} FCFA</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Frais</h4>
                    <p>{detailsDialog.transaction.fees.toLocaleString()} FCFA</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Total</h4>
                    <p className="text-lg font-semibold">{detailsDialog.transaction.totalAmount.toLocaleString()} FCFA</p>
                  </div>
                </div>
              </div>

              {/* Informations utilisateur */}
              {detailsDialog.transaction.wallet?.user && (
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Informations Utilisateur
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Nom :</span>
                      <span className="ml-2 font-medium">
                        {detailsDialog.transaction.wallet.user.firstName} {detailsDialog.transaction.wallet.user.lastName}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Email :</span>
                      <span className="ml-2">{detailsDialog.transaction.wallet.user.email}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Téléphone :</span>
                      <span className="ml-2">{detailsDialog.transaction.wallet.user.phone}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Membre depuis :</span>
                      <span className="ml-2">{new Date(detailsDialog.transaction.wallet.user.createdAt).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Dates et timeline */}
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Timeline
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Créée le :</span>
                    <span>{new Date(detailsDialog.transaction.createdAt).toLocaleString('fr-FR')}</span>
                  </div>
                  {detailsDialog.transaction.validatedAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Validée le :</span>
                      <span className="text-green-600">{new Date(detailsDialog.transaction.validatedAt).toLocaleString('fr-FR')}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Modifiée le :</span>
                    <span>{new Date(detailsDialog.transaction.updatedAt).toLocaleString('fr-FR')}</span>
                  </div>
                </div>
              </div>

              {/* Métadonnées et notes */}
              {(detailsDialog.transaction.metadata || detailsDialog.transaction.rejectionReason) && (
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-700 mb-3">Informations supplémentaires</h4>
                  {detailsDialog.transaction.rejectionReason && (
                    <div className="bg-red-50 p-3 rounded-lg mb-3">
                      <span className="text-red-800 font-medium">Raison du rejet :</span>
                      <p className="text-red-700 mt-1">{detailsDialog.transaction.rejectionReason}</p>
                    </div>
                  )}
                  {detailsDialog.transaction.metadata && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <span className="text-gray-700 font-medium">Métadonnées :</span>
                      <pre className="text-xs text-gray-600 mt-1 overflow-x-auto">
                        {JSON.stringify(detailsDialog.transaction.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : null}
          
          <DialogFooter>
            <Button variant="outline" onClick={closeDetailsDialog}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog d'action sur les transactions en espèces */}
      <Dialog open={actionDialog.open} onOpenChange={closeActionDialog}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.type === 'validate' ? 'Valider la demande de recharge' : 'Rejeter la demande de recharge'}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.type === 'validate' 
                ? `Êtes-vous sûr de vouloir valider cette demande de recharge de ${actionDialog.transaction?.amount.toLocaleString()} FCFA ? Le montant sera crédité au portefeuille de l'utilisateur.`
                : `Êtes-vous sûr de vouloir rejeter cette demande de recharge de ${actionDialog.transaction?.amount.toLocaleString()} FCFA ?`
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {actionDialog.type === 'validate' ? (
              <div>
                <label className="text-sm font-medium">Note administrative (optionnelle)</label>
                <Textarea
                  placeholder="Ajouter une note..."
                  value={actionDialog.adminNote || ''}
                  onChange={(e) => setActionDialog(prev => ({ ...prev, adminNote: e.target.value }))}
                  rows={3}
                />
              </div>
            ) : (
              <div>
                <label className="text-sm font-medium text-red-600">Raison du rejet *</label>
                <Textarea
                  placeholder="Veuillez indiquer la raison du rejet..."
                  value={actionDialog.reason || ''}
                  onChange={(e) => setActionDialog(prev => ({ ...prev, reason: e.target.value }))}
                  rows={3}
                  required
                />
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={closeActionDialog}
              disabled={actionDialog.loading}
            >
              Annuler
            </Button>
            <Button 
              variant={actionDialog.type === 'validate' ? 'default' : 'destructive'}
              onClick={handleConfirmAction}
              disabled={actionDialog.loading || (actionDialog.type === 'reject' && !actionDialog.reason?.trim())}
            >
              {actionDialog.loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : null}
              {actionDialog.type === 'validate' ? 'Valider' : 'Rejeter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}