import React, { useState, useEffect } from 'react';
import { Bell, Check, Trash2, AlertCircle, Info, CheckCircle, XCircle, Lock, Search, RefreshCw, Send, Mail } from 'lucide-react';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../ui/dialog';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { Label } from '../../ui/label';
import { Switch } from '../../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { useTranslation } from '../../../lib/i18n';
import { usePermissions } from '../../../hooks/usePermissions';
import { ProtectedAccess } from '../../shared/ProtectedAccess';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { notificationService, Notification } from '../../../services/api/notification.service';
import { toast } from 'sonner';

export function AdminNotifications() {
  const { t } = useTranslation();
  const { hasPermission } = usePermissions();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    today: 0,
    thisWeek: 0
  });

  // État pour la modale de confirmation de suppression
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    notificationId: string | null;
    notificationTitle: string;
    loading: boolean;
  }>({
    open: false,
    notificationId: null,
    notificationTitle: '',
    loading: false
  });

  // État pour la suppression en lot
  const [bulkDelete, setBulkDelete] = useState<{
    selectedIds: Set<string>;
    loading: boolean;
  }>({
    selectedIds: new Set(),
    loading: false
  });

  // État pour la création de notifications
  const [createDialog, setCreateDialog] = useState<{
    open: boolean;
    loading: boolean;
    type: 'promotion' | 'bulk-email';
  }>({
    open: false,
    loading: false,
    type: 'promotion'
  });

  // Formulaire de création de notification
  const [notificationForm, setNotificationForm] = useState({
    // Pour les promotions
    userIds: [] as string[],
    subject: '',
    title: '',
    message: '',
    ctaUrl: '',
    sendEmail: true,
    // Pour les emails en lot
    emails: [] as string[],
    emailsText: '', // Pour saisir les emails en texte
    ctaText: 'En savoir plus'
  });

  // Vérifier les permissions
  const canReadNotifications = hasPermission('notifications', 'read');
  const canUpdateNotifications = hasPermission('notifications', 'update');
  const canDeleteNotifications = hasPermission('notifications', 'delete');
  const canManageNotifications = hasPermission('notifications', 'manage');
  const canCreateNotifications = hasPermission('notifications', 'create');

  // Charger les données uniquement au montage du composant
  useEffect(() => {
    if (canReadNotifications) {
      loadNotifications();
      loadStats();
    } else {
      setLoading(false);
      toast.error('Vous n\'avez pas les permissions pour voir les notifications');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Tableau vide pour charger uniquement au montage

  // Filtrage et recherche
  useEffect(() => {
    let filtered = notifications;

    // Filtre par statut
    if (filter === 'unread') {
      filtered = filtered.filter(notif => !notif.isRead);
    }

    // Filtre par type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(notif => notif.type === typeFilter);
    }

    // Recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(notif => 
        notif.title.toLowerCase().includes(query) ||
        notif.message.toLowerCase().includes(query) ||
        notif.category?.toLowerCase().includes(query)
      );
    }

    setFilteredNotifications(filtered);
  }, [notifications, filter, typeFilter, searchQuery]);

  const loadNotifications = async () => {
    if (!canReadNotifications) {
      toast.error('Vous n\'avez pas les permissions pour voir les notifications');
      return;
    }

    try {
      setLoading(true);
      const data = await notificationService.getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!canReadNotifications) return;

    try {
      const statsData = await notificationService.getStats();
      setStats(statsData);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  };

  const refreshNotifications = async () => {
    setRefreshing(true);
    await Promise.all([loadNotifications(), loadStats()]);
    setRefreshing(false);
    toast.success('Notifications actualisées');
  };

  // Fonctions de création de notifications
  const openCreateDialog = (type: 'promotion' | 'bulk-email') => {
    if (!canCreateNotifications) {
      toast.error('Vous n\'avez pas les permissions pour créer des notifications');
      return;
    }

    setCreateDialog({
      open: true,
      loading: false,
      type
    });

    // Réinitialiser le formulaire
    setNotificationForm({
      userIds: [],
      subject: '',
      title: '',
      message: '',
      ctaUrl: '',
      sendEmail: true,
      emails: [],
      emailsText: '',
      ctaText: 'En savoir plus'
    });
  };

  const closeCreateDialog = () => {
    setCreateDialog({
      open: false,
      loading: false,
      type: 'promotion'
    });
  };

  const handleSendPromotion = async () => {
    if (!canCreateNotifications) {
      toast.error('Vous n\'avez pas les permissions pour créer des notifications');
      return;
    }

    // Validation des champs obligatoires
    if (!notificationForm.subject.trim() || !notificationForm.title.trim() || !notificationForm.message.trim()) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    // Si aucun utilisateur spécifique, on doit au moins avoir un utilisateur
    if (notificationForm.userIds.length === 0) {
      toast.error('Veuillez spécifier au moins un utilisateur. Pour l\'instant, vous devez fournir des IDs utilisateur.');
      return;
    }

    try {
      setCreateDialog(prev => ({ ...prev, loading: true }));

      const result = await notificationService.sendPromotion({
        userIds: notificationForm.userIds,
        subject: notificationForm.subject,
        title: notificationForm.title,
        message: notificationForm.message,
        ctaUrl: notificationForm.ctaUrl || undefined,
        sendEmail: notificationForm.sendEmail
      });

      toast.success(`Promotion envoyée avec succès ! ${result.notifications} notifications créées, ${result.emailsSent} emails envoyés.`);
      
      // Recharger les notifications et fermer la modale
      await loadNotifications();
      await loadStats();
      closeCreateDialog();
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la promotion:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'envoi');
      setCreateDialog(prev => ({ ...prev, loading: false }));
    }
  };

  const handleSendBulkEmail = async () => {
    if (!canCreateNotifications) {
      toast.error('Vous n\'avez pas les permissions pour envoyer des emails en lot');
      return;
    }

    // Validation des champs obligatoires
    if (!notificationForm.subject.trim() || !notificationForm.title.trim() || !notificationForm.message.trim()) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    // Parser les emails depuis le texte
    const emailList = notificationForm.emailsText
      .split(/[,\n;]/)
      .map(email => email.trim())
      .filter(email => email && /\S+@\S+\.\S+/.test(email));

    if (emailList.length === 0) {
      toast.error('Veuillez fournir au moins une adresse email valide');
      return;
    }

    try {
      setCreateDialog(prev => ({ ...prev, loading: true }));

      const result = await notificationService.sendBulkEmail({
        emails: emailList,
        subject: notificationForm.subject,
        title: notificationForm.title,
        message: notificationForm.message,
        ctaUrl: notificationForm.ctaUrl || undefined,
        ctaText: notificationForm.ctaText
      });

      toast.success(`Emails envoyés ! ${result.emailsSent} envoyés avec succès, ${result.emailsFailed} échecs sur ${result.total} total.`);
      
      closeCreateDialog();
    } catch (error) {
      console.error('Erreur lors de l\'envoi des emails en lot:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'envoi');
      setCreateDialog(prev => ({ ...prev, loading: false }));
    }
  };

  const getIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'promotion':
        return <Bell className="w-5 h-5 text-purple-600" />;
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'warning':
        return 'bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800';
      case 'success':
        return 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800';
      case 'promotion':
        return 'bg-purple-50 border-purple-200 dark:bg-purple-950 dark:border-purple-800';
      default:
        return 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800';
    }
  };

  const markAsRead = async (id: string) => {
    if (!canUpdateNotifications) {
      toast.error('Vous n\'avez pas les permissions pour marquer les notifications comme lues');
      return;
    }

    try {
      await notificationService.markAsRead(id);
      setNotifications(notifications.map(notif =>
        notif.id === id ? { ...notif, isRead: true } : notif
      ));
      setStats(prev => ({ ...prev, unread: Math.max(0, prev.unread - 1) }));
      toast.success('Notification marquée comme lue');
    } catch (error) {
      console.error('Erreur lors du marquage:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors du marquage');
    }
  };

  const markAllAsRead = async () => {
    if (!canUpdateNotifications) {
      toast.error('Vous n\'avez pas les permissions pour marquer les notifications comme lues');
      return;
    }

    try {
      await notificationService.markAllAsRead();
      setNotifications(notifications.map(notif => ({ ...notif, isRead: true })));
      setStats(prev => ({ ...prev, unread: 0 }));
      toast.success('Toutes les notifications marquées comme lues');
    } catch (error) {
      console.error('Erreur lors du marquage:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors du marquage');
    }
  };

  const openDeleteDialog = (notification: Notification) => {
    if (!canDeleteNotifications) {
      toast.error('Vous n\'avez pas les permissions pour supprimer des notifications');
      return;
    }

    setDeleteDialog({
      open: true,
      notificationId: notification.id,
      notificationTitle: notification.title,
      loading: false
    });
  };

  const closeDeleteDialog = () => {
    setDeleteDialog({
      open: false,
      notificationId: null,
      notificationTitle: '',
      loading: false
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteDialog.notificationId || !canDeleteNotifications) return;

    try {
      setDeleteDialog(prev => ({ ...prev, loading: true }));
      
      await notificationService.deleteNotification(deleteDialog.notificationId);
      const deletedNotif = notifications.find(n => n.id === deleteDialog.notificationId);
      
      setNotifications(notifications.filter(notif => notif.id !== deleteDialog.notificationId));
      setStats(prev => ({
        ...prev,
        total: Math.max(0, prev.total - 1),
        unread: deletedNotif && !deletedNotif.isRead ? Math.max(0, prev.unread - 1) : prev.unread
      }));
      
      toast.success('Notification supprimée');
      closeDeleteDialog();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la suppression');
      setDeleteDialog(prev => ({ ...prev, loading: false }));
    }
  };

  const handleBulkSelection = (notificationId: string, selected: boolean) => {
    setBulkDelete(prev => {
      const newSelectedIds = new Set(prev.selectedIds);
      if (selected) {
        newSelectedIds.add(notificationId);
      } else {
        newSelectedIds.delete(notificationId);
      }
      return { ...prev, selectedIds: newSelectedIds };
    });
  };

  const handleSelectAll = () => {
    const visibleIds = filteredNotifications.map(n => n.id);
    setBulkDelete(prev => ({
      ...prev,
      selectedIds: prev.selectedIds.size === visibleIds.length 
        ? new Set() 
        : new Set(visibleIds)
    }));
  };

  const handleBulkDelete = async () => {
    if (!canDeleteNotifications || bulkDelete.selectedIds.size === 0) return;

    try {
      setBulkDelete(prev => ({ ...prev, loading: true }));
      
      const deletePromises = Array.from(bulkDelete.selectedIds).map(id =>
        notificationService.deleteNotification(id)
      );
      
      await Promise.all(deletePromises);
      
      const deletedNotifications = notifications.filter(n => bulkDelete.selectedIds.has(n.id));
      const unreadDeleted = deletedNotifications.filter(n => !n.isRead).length;
      
      setNotifications(notifications.filter(notif => !bulkDelete.selectedIds.has(notif.id)));
      setStats(prev => ({
        ...prev,
        total: Math.max(0, prev.total - bulkDelete.selectedIds.size),
        unread: Math.max(0, prev.unread - unreadDeleted)
      }));
      
      setBulkDelete({ selectedIds: new Set(), loading: false });
      toast.success(`${bulkDelete.selectedIds.size} notifications supprimées`);
    } catch (error) {
      console.error('Erreur lors de la suppression en lot:', error);
      toast.error('Erreur lors de la suppression en lot');
      setBulkDelete(prev => ({ ...prev, loading: false }));
    }
  };

  const getRelativeTime = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now.getTime() - time.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;
    
    return time.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short',
      year: time.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const getUniqueTypes = () => {
    const types = [...new Set(notifications.map(n => n.type))];
    return types.sort();
  };

  // Si l'utilisateur n'a pas les permissions de base
  if (!canReadNotifications) {
    return (
      <div className="p-4 md:p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-green-600">Notifications</h1>
          <p className="text-gray-600 dark:text-gray-400">Gérer vos notifications et alertes système</p>
        </div>
        
        <Card className="p-12">
          <div className="text-center text-red-500">
            <Lock className="w-16 h-16 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Accès refusé</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Vous n'avez pas les permissions nécessaires pour voir les notifications.
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Permission requise: <span className="font-mono bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">notifications:read</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Contactez votre administrateur pour obtenir l'accès
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 md:p-8 space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Chargement des notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-green-600">Notifications</h1>
          <p className="text-gray-600 dark:text-gray-400">Gérer vos notifications et alertes système</p>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          {/* Indicateur de permissions */}
          <Badge variant="outline" className="text-md">
            {canManageNotifications ? 'Gestion complète' : 
             canCreateNotifications ? 'Création/Suppression' :
             canDeleteNotifications ? 'Lecture/Suppression' :
             canUpdateNotifications ? 'Lecture/Modification' : 
             'Lecture seule'}
          </Badge>

          {/* Boutons de création */}
          <ProtectedAccess mode="component" resource="notifications" action="create" fallback={null}>
            <div className="flex gap-2">
              <Button 
                onClick={() => openCreateDialog('promotion')}
                variant="default"
                size="sm"
                className="bg-purple-500 hover:bg-purple-800"
              >
                <Send className="w-4 h-4 mr-2" />
                Envoyer une promotion
              </Button>
              <Button 
                onClick={() => openCreateDialog('bulk-email')}
                variant="outline"
                size="sm"
              >
                <Mail className="w-4 h-4 mr-2" />
                Email en lot
              </Button>
            </div>
          </ProtectedAccess>
          
          {/* Bouton actualiser */}
          <Button 
            onClick={refreshNotifications} 
            variant="outline" 
            size="sm"
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          
          {/* Actions en lot */}
          {canDeleteNotifications && bulkDelete.selectedIds.size > 0 && (
            <Button 
              onClick={handleBulkDelete}
              variant="destructive"
              size="sm"
              disabled={bulkDelete.loading}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Supprimer ({bulkDelete.selectedIds.size})
            </Button>
          )}
          
          <ProtectedAccess mode="component" resource="notifications" action="update" fallback={null}>
            {stats.unread > 0 && (
              <Button onClick={markAllAsRead} variant="outline" size="sm">
                <Check className="w-4 h-4 mr-2" />
                Tout marquer comme lu
              </Button>
            )}
          </ProtectedAccess>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Non lues</p>
          <p className="text-2xl font-bold text-orange-600">{stats.unread}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Aujourd'hui</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.today}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Cette semaine</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.thisWeek}</p>
        </Card>
      </div>

      {/* Filtres et recherche */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Rechercher dans les notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                {getUniqueTypes().map(type => (
                  <SelectItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs value={filter} onValueChange={(value: any) => setFilter(value)}>
        <TabsList className="grid w-full grid-cols-2 lg:w-auto">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Toutes ({stats.total})
          </TabsTrigger>
          <TabsTrigger value="unread" className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Non lues ({stats.unread})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="space-y-4 mt-6">
          {/* Sélection en lot */}
          {canDeleteNotifications && filteredNotifications.length > 0 && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <input
                type="checkbox"
                checked={filteredNotifications.length > 0 && bulkDelete.selectedIds.size === filteredNotifications.length}
                onChange={handleSelectAll}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {bulkDelete.selectedIds.size === 0 ? 'Sélectionner tout' : 
                 `${bulkDelete.selectedIds.size} notification(s) sélectionnée(s)`}
              </span>
            </div>
          )}

          {filteredNotifications.length === 0 ? (
            <Card className="p-12">
              <div className="text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg">
                  {searchQuery || typeFilter !== 'all' ? 'Aucun résultat' : 'Aucune notification'}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  {searchQuery || typeFilter !== 'all' 
                    ? 'Essayez de modifier vos critères de recherche'
                    : filter === 'unread' 
                    ? 'Toutes vos notifications sont lues' 
                    : 'Vous n\'avez pas encore de notifications'
                  }
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notification) => (
                <Card
                  key={notification.id}
                  className={`p-4 border-l-4 transition-all duration-200 hover:shadow-md ${
                    !notification.isRead ? 'bg-gray-50 dark:bg-gray-800' : ''
                  } ${getTypeColor(notification.type)}`}
                >
                  <div className="flex items-start gap-4">
                    {canDeleteNotifications && (
                      <input
                        type="checkbox"
                        checked={bulkDelete.selectedIds.has(notification.id)}
                        onChange={(e) => handleBulkSelection(notification.id, e.target.checked)}
                        className="mt-1 rounded border-gray-300"
                      />
                    )}
                    
                    <div className="flex-shrink-0 mt-1">
                      {getIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-gray-900 dark:text-gray-100 font-medium">
                            {notification.title}
                          </h3>
                          {!notification.isRead && (
                            <Badge variant="default" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                              Nouveau
                            </Badge>
                          )}
                          {notification.category && (
                            <Badge variant="outline" className="text-xs">
                              {notification.category}
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {getRelativeTime(notification.createdAt)}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 leading-relaxed">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center justify-end gap-2">
                        <ProtectedAccess mode="component" resource="notifications" action="update" fallback={null}>
                          {!notification.isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                              className="h-auto py-1 px-2 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
                            >
                              <Check className="w-3 h-3 mr-1" />
                              Marquer comme lu
                            </Button>
                          )}
                        </ProtectedAccess>
                        
                        <ProtectedAccess 
                          mode="component" 
                          resource="notifications" 
                          action="delete"
                          fallback={
                            <div className="flex items-center gap-1 text-gray-400" title="Suppression non autorisée">
                              <Lock className="w-3 h-3" />
                              <span className="text-xs">Restreint</span>
                            </div>
                          }
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteDialog(notification)}
                            className="h-auto py-1 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Supprimer
                          </Button>
                        </ProtectedAccess>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Message d'information sur les permissions */}
          {filteredNotifications.length > 0 && (!canUpdateNotifications || !canDeleteNotifications) && (
            <Card className="p-4 bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
              <div className="flex items-center gap-3">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-medium">Permissions limitées</p>
                  <p className="text-blue-700 dark:text-blue-300">
                    {!canUpdateNotifications && !canDeleteNotifications 
                      ? 'Vous pouvez uniquement consulter les notifications.'
                      : !canUpdateNotifications 
                      ? 'Vous ne pouvez pas marquer les notifications comme lues.'
                      : 'Vous ne pouvez pas supprimer les notifications.'
                    }
                  </p>
                </div>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog de confirmation de suppression */}
      <Dialog open={deleteDialog.open} onOpenChange={closeDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer la notification</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer la notification "{deleteDialog.notificationTitle}" ? 
              Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={closeDeleteDialog}
              disabled={deleteDialog.loading}
            >
              Annuler
            </Button>
            <Button 
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteDialog.loading}
            >
              {deleteDialog.loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de création de notifications */}
      <Dialog open={createDialog.open} onOpenChange={closeCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {createDialog.type === 'promotion' ? (
                <>
                  <Send className="w-5 h-5 text-purple-600" />
                  Envoyer une promotion
                </>
              ) : (
                <>
                  <Mail className="w-5 h-5 text-blue-600" />
                  Envoyer des emails en lot
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {createDialog.type === 'promotion' 
                ? 'Créer et envoyer une notification promotionnelle aux utilisateurs avec option d\'email'
                : 'Envoyer des emails marketing à une liste d\'adresses email'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Champs communs */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="subject" className="text-right">
                Sujet *
              </Label>
              <Input
                id="subject"
                value={notificationForm.subject}
                onChange={(e) => setNotificationForm(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Sujet de l'email"
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Titre *
              </Label>
              <Input
                id="title"
                value={notificationForm.title}
                onChange={(e) => setNotificationForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Titre de la notification"
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="message" className="text-right pt-2">
                Message *
              </Label>
              <Textarea
                id="message"
                value={notificationForm.message}
                onChange={(e) => setNotificationForm(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Contenu du message..."
                className="col-span-3 min-h-[120px]"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="ctaUrl" className="text-right">
                URL d'action
              </Label>
              <Input
                id="ctaUrl"
                value={notificationForm.ctaUrl}
                onChange={(e) => setNotificationForm(prev => ({ ...prev, ctaUrl: e.target.value }))}
                placeholder="https://example.com"
                className="col-span-3"
              />
            </div>

            {/* Champs spécifiques selon le type */}
            {createDialog.type === 'promotion' ? (
              <>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="userIds" className="text-right pt-2">
                    IDs Utilisateurs *
                  </Label>
                  <Textarea
                    id="userIds"
                    value={notificationForm.userIds.join('\n')}
                    onChange={(e) => setNotificationForm(prev => ({ 
                      ...prev, 
                      userIds: e.target.value.split('\n').map(id => id.trim()).filter(Boolean)
                    }))}
                    placeholder={`uuid-1\nuuid-2\nuuid-3\n...\n\nUn ID par ligne`}
                    className="col-span-3 min-h-[100px]"
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="sendEmail" className="text-right">
                    Envoyer par email
                  </Label>
                  <div className="col-span-3 flex items-center space-x-2">
                    <Switch
                      id="sendEmail"
                      checked={notificationForm.sendEmail}
                      onCheckedChange={(checked: any) => setNotificationForm(prev => ({ ...prev, sendEmail: checked }))}
                    />
                    <span className="text-sm text-gray-600">
                      {notificationForm.sendEmail ? 'Emails activés' : 'Notifications seulement'}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="emails" className="text-right pt-2">
                    Emails *
                  </Label>
                  <Textarea
                    id="emails"
                    value={notificationForm.emailsText}
                    onChange={(e) => setNotificationForm(prev => ({ ...prev, emailsText: e.target.value }))}
                    placeholder={`email1@example.com\nemail2@example.com, email3@example.com\nemail4@example.com; email5@example.com\n\nSéparez par des virgules, points-virgules ou nouvelles lignes`}
                    className="col-span-3 min-h-[120px]"
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="ctaText" className="text-right">
                    Texte du bouton
                  </Label>
                  <Input
                    id="ctaText"
                    value={notificationForm.ctaText}
                    onChange={(e) => setNotificationForm(prev => ({ ...prev, ctaText: e.target.value }))}
                    placeholder="En savoir plus"
                    className="col-span-3"
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={closeCreateDialog}
              disabled={createDialog.loading}
            >
              Annuler
            </Button>
            <Button 
              onClick={createDialog.type === 'promotion' ? handleSendPromotion : handleSendBulkEmail}
              disabled={createDialog.loading}
              className={createDialog.type === 'promotion' ? 'bg-purple-600 hover:bg-purple-700' : ''}
            >
              {createDialog.loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              {createDialog.type === 'promotion' ? 'Envoyer la promotion' : 'Envoyer les emails'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}