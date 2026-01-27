import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Bike as BikeIcon, Battery, MapPin, Signal, ArrowLeft, Activity, Settings } from 'lucide-react';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Card } from '../../ui/card';
import { bikeService } from '../../../services/api/bike.service';
import { useTranslation } from '../../../lib/i18n';
import { toast } from 'sonner';

export function BikeDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [bike, setBike] = useState<any>(null);
  const [bikeStats, setBikeStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const onBack = () => navigate('/admin/bikes');
  const onNavigateToTrips = () => navigate(`/admin/bikes/${id}/trips`);
  const onNavigateToMaintenance = () => navigate(`/admin/bikes/${id}/maintenance`);
  const onNavigateToMap = () => navigate(`/admin/bikes/${id}/map`);

  useEffect(() => {
    if (id) {
      loadBikeData();
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