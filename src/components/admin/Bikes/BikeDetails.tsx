import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Bike as BikeIcon, Battery, MapPin, Signal, ArrowLeft, Activity, Settings, ShieldOff, UserX, X, Search } from 'lucide-react';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Card } from '../../ui/card';
import { bikeService } from '../../../services/api/bike.service';
import { adminService } from '../../../services/api/admin.service';
import { useTranslation } from '../../../lib/i18n';
import { toast } from 'sonner';

export function BikeDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [bike, setBike] = useState<any>(null);
  const [bikeStats, setBikeStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [blockLoading, setBlockLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onBack = () => navigate('/admin/bikes');
  const onNavigateToTrips = () => navigate(`/admin/bikes/${id}/trips`);
  const onNavigateToMaintenance = () => navigate(`/admin/bikes/${id}/maintenance`);
  const onNavigateToMap = () => navigate(`/admin/bikes/${id}/map`);

  useEffect(() => {
    if (id) {
      loadBikeData();
      loadBlockedUsers();
    }
  }, [id]);

  const loadBikeData = async () => {
    try {
      setLoading(true);

      const [bikeData, statsData] = await Promise.all([
        bikeService.getBikeById(id!),
        bikeService.getBikeStats(id!)
      ]);

      setBike(bikeData);
      setBikeStats(statsData);
    } catch (error) {
      console.error('Error loading bike data:', error);
      toast.error('Erreur lors du chargement des données du vélo');
    } finally {
      setLoading(false);
    }
  };

  const loadBlockedUsers = async () => {
    try {
      const data = await adminService.getBlockedUsersForBike(id!);
      setBlockedUsers(data);
    } catch (error) {
      console.error('Error loading blocked users:', error);
    }
  };

  const handleUserSearch = (query: string) => {
    setUserSearch(query);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!query.trim()) { setSearchResults([]); return; }
    searchTimeout.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await adminService.searchFreeDaysUsers(query);
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  const handleBlockUser = async (userId: string) => {
    if (blockedUsers.some(b => b.userId === userId)) {
      toast.error('Cet utilisateur est déjà bloqué pour ce vélo');
      return;
    }
    setBlockLoading(true);
    try {
      await adminService.blockUserFromBike(id!, userId);
      toast.success('Utilisateur bloqué pour ce vélo');
      setUserSearch('');
      setSearchResults([]);
      await loadBlockedUsers();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors du blocage');
    } finally {
      setBlockLoading(false);
    }
  };

  const handleUnblockUser = async (userId: string) => {
    setBlockLoading(true);
    try {
      await adminService.unblockUserFromBike(id!, userId);
      toast.success('Blocage supprimé');
      await loadBlockedUsers();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la suppression du blocage');
    } finally {
      setBlockLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <Button onClick={onBack} variant="ghost" className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('common.back')}
        </Button>
        <Card className="p-12">
          <div className="text-center text-gray-500">
            <BikeIcon className="w-12 h-12 mx-auto mb-3 opacity-50 animate-pulse" />
            <p>Chargement des données du vélo...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (!bike) {
    return (
      <div className="p-4 md:p-8">
        <Button onClick={onBack} variant="ghost" className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('common.back')}
        </Button>
        <Card className="p-12">
          <div className="text-center text-gray-500">
            <BikeIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Vélo non trouvé</p>
          </div>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      'AVAILABLE': { label: t('bikes.available'), variant: 'default' },
      'IN_USE': { label: t('bikes.inUse'), variant: 'secondary' },
      'MAINTENANCE': { label: t('bikes.maintenance'), variant: 'destructive' },
      'UNAVAILABLE': { label: 'Indisponible', variant: 'outline' }
    };
    const config = variants[status] || { label: status, variant: 'outline' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getBatteryColor = (level: number) => {
    if (level > 60) return 'text-green-600 bg-green-50 border-green-200';
    if (level > 30) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button onClick={onBack} variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-green-600">{bike.code}</h1>
            <p className="text-gray-600">ID: {bike.id}</p>
          </div>
        </div>
        {getStatusBadge(bike.status)}
      </div>

      {/* Main Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="mb-4">Informations Générales</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Code</p>
              <p className="text-gray-900">{bike.code}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">ID</p>
              <p className="text-gray-900 font-mono">{bike.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Modèle</p>
              <p className="text-gray-900">{bike.model}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">QR Code</p>
              <p className="text-gray-900 font-mono text-xs">{bike.qrCode}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="mb-4">Localisation</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Coordonnées GPS</p>
              <p className="text-gray-900 font-mono">
                {bike.latitude && bike.longitude 
                  ? `${bike.latitude.toFixed(4)}, ${bike.longitude.toFixed(4)}`
                  : 'Position non disponible'
                }
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Dernière Mise à Jour</p>
              <p className="text-gray-900 text-sm">
                {new Date(bike.updatedAt).toLocaleString('fr-FR')}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={`p-6 border ${getBatteryColor(bike.batteryLevel || 0)}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm mb-1">{t('bikes.battery')}</p>
              <p className="text-3xl">{bike.batteryLevel || 0}%</p>
            </div>
            <Battery className="w-10 h-10" />
          </div>
          <div className="mt-3 bg-white/50 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-current transition-all"
              style={{ width: `${bike.batteryLevel || 0}%` }}
            />
          </div>
        </Card>

        <Card className="p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Statut</p>
              <p className="text-lg text-gray-900">{bike.status}</p>
            </div>
            <Signal className="w-10 h-10 text-gray-600" />
          </div>
        </Card>

        <Card className="p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Dernière Maintenance</p>
              <p className="text-sm text-gray-900">
                {bike.lastMaintenanceAt 
                  ? new Date(bike.lastMaintenanceAt).toLocaleDateString('fr-FR')
                  : 'Aucune'
                }
              </p>
            </div>
            <Settings className="w-10 h-10 text-gray-600" />
          </div>
        </Card>
      </div>

      {/* Statistics */}
      {bikeStats && (
        <Card className="p-6">
          <h3 className="mb-4">Statistiques d'Utilisation</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-600">Distance Totale</p>
              <p className="text-gray-900 text-2xl">{bikeStats.totalDistance || 0} km</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Nombre de Trajets</p>
              <p className="text-gray-900 text-2xl">{bikeStats.totalRides || 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Revenus Générés</p>
              <p className="text-gray-900 text-2xl">{(bikeStats.totalRevenue || 0).toLocaleString()} FCFA</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Utilisation</p>
              <p className="text-gray-900 text-2xl">
                {bikeStats.totalRides > 0 ? 'Actif' : 'Inactif'}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Maintenance Logs */}
      {bike.maintenanceLogs && bike.maintenanceLogs.length > 0 && (
        <Card className="p-6">
          <h3 className="mb-4">Dernières Maintenances</h3>
          <div className="space-y-3">
            {bike.maintenanceLogs.slice(0, 3).map((log: any) => (
              <div key={log.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-sm font-medium">{log.type}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(log.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <p className="text-sm text-gray-600">{log.description}</p>
                {log.cost && (
                  <p className="text-sm text-green-600 mt-1">
                    Coût: {log.cost.toLocaleString()} FCFA
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Utilisateurs bloqués */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <ShieldOff className="w-5 h-5 text-red-500" />
          <h3 className="mb-0">Accès restreint</h3>
          <Badge variant="secondary">{blockedUsers.length}</Badge>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Les utilisateurs listés ici ne verront pas ce vélo et ne pourront pas le déverrouiller.
        </p>

        {/* Recherche et ajout */}
        <div className="relative mb-4">
          <div className="flex items-center gap-2 border rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-green-500">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder="Rechercher un utilisateur à bloquer..."
              value={userSearch}
              onChange={(e) => handleUserSearch(e.target.value)}
              className="flex-1 outline-none text-sm bg-transparent"
            />
            {userSearch && (
              <button type="button" aria-label="Effacer la recherche" onClick={() => { setUserSearch(''); setSearchResults([]); }}>
                <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
          {searchResults.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {isSearching ? (
                <div className="p-3 text-center text-sm text-gray-500">Recherche...</div>
              ) : (
                searchResults
                  .filter(u => !blockedUsers.some(b => b.userId === u.id))
                  .map(user => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleBlockUser(user.id)}
                      disabled={blockLoading}
                      className="w-full flex items-center gap-3 p-3 hover:bg-red-50 text-left border-b last:border-0 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 text-sm font-medium shrink-0">
                        {user.firstName?.[0]}{user.lastName?.[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                      <span className="ml-auto text-xs text-red-500 shrink-0">Bloquer</span>
                    </button>
                  ))
              )}
            </div>
          )}
        </div>

        {/* Liste des utilisateurs bloqués */}
        {blockedUsers.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Aucun utilisateur bloqué</p>
        ) : (
          <div className="space-y-2">
            {blockedUsers.map(block => (
              <div key={block.id} className="flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-lg">
                <div className="w-9 h-9 rounded-full bg-red-200 flex items-center justify-center text-red-700 text-sm font-medium shrink-0">
                  {block.user?.firstName?.[0]}{block.user?.lastName?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {block.user?.firstName} {block.user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{block.user?.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleUnblockUser(block.userId)}
                  disabled={blockLoading}
                  className="shrink-0 p-1.5 rounded hover:bg-red-200 text-red-600 transition-colors"
                  title="Supprimer le blocage"
                >
                  <UserX className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button 
          variant="outline" 
          className="h-auto py-4"
          onClick={onNavigateToTrips}
        >
          <div className="flex flex-col items-center gap-2">
            <Activity className="w-6 h-6" />
            <span>Historique des Trajets</span>
          </div>
        </Button>
        <Button 
          variant="outline" 
          className="h-auto py-4"
          onClick={onNavigateToMaintenance}
        >
          <div className="flex flex-col items-center gap-2">
            <Settings className="w-6 h-6" />
            <span>Historique Maintenance</span>
          </div>
        </Button>
        <Button 
          variant="outline" 
          className="h-auto py-4"
          onClick={onNavigateToMap}
        >
          <div className="flex flex-col items-center gap-2">
            <MapPin className="w-6 h-6" />
            <span>Voir sur la Carte</span>
          </div>
        </Button>
      </div>
    </div>
  );
}