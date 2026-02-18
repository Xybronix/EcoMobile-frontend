import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, RefreshCw, Zap, Signal, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { Button } from '../../ui/button';
import { Card } from '../../ui/card';
import { bikeService } from '../../../services/api/bike.service';
import { toast } from 'sonner';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface BikeMarker {
  id: string;
  code: string;
  gpsDeviceId?: string;
  model: string;
  status: string;
  isActive?: boolean;
  latitude: number | null;
  longitude: number | null;
  battery: number;
  gpsSignal?: number;
  gsmSignal?: number;
  speed?: number;
  direction?: number;
  isOnline?: boolean;
  lastUpdate?: string;
  locationName?: string;
  equipment?: string[];
  deviceStatus?: string;
  syncError?: string;
  pricingPlan?: any;
}

interface MapMarker {
  id: string;
  marker: L.Marker;
  bikeData: BikeMarker;
}

export function BikeMap() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<MapMarker[]>([]);
  const mapInitializedRef = useRef<boolean>(false);
  
  const [bikes, setBikes] = useState<BikeMarker[]>([]);
  const [selectedBike, setSelectedBike] = useState<BikeMarker | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showInactive, setShowInactive] = useState(true);
  const [showOffline, setShowOffline] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Coordonnées par défaut (Douala, Cameroun)
  const defaultCenter: [number, number] = [4.0511, 9.7679];

  const handleBack = () => {
    if (id) {
      navigate(`/admin/bikes/${id}`);
    } else {
      navigate('/admin/bikes');
    }
  };

  // Initialiser la carte de façon robuste
  useEffect(() => {
    if (!mapContainerRef.current || mapInitializedRef.current) return;

    const initializeMap = async () => {
      try {
        // Attendre que le DOM soit prêt
        await new Promise(resolve => setTimeout(resolve, 200));

        if (!mapContainerRef.current) return;

        // Vérifier que le conteneur a une taille
        const { clientWidth, clientHeight } = mapContainerRef.current;
        if (clientWidth === 0 || clientHeight === 0) {
          console.warn('Map container has no size, retrying...');
          setTimeout(initializeMap, 200);
          return;
        }

        // Configuration des icônes Leaflet
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });

        // Créer la carte
        const map = L.map(mapContainerRef.current, {
          zoomControl: true,
          attributionControl: true,
          dragging: true,
          touchZoom: true,
          scrollWheelZoom: true,
          doubleClickZoom: true,
          fadeAnimation: true,
          markerZoomAnimation: true,
        });

        // Définir la vue
        map.setView(defaultCenter, 12);

        // Ajouter les tuiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map);

        mapInstanceRef.current = map;
        mapInitializedRef.current = true;
        setMapReady(true);

        // Forcer plusieurs invalidations de taille pour être sûr
        setTimeout(() => {
          if (mapInstanceRef.current && mapContainerRef.current) {
            mapInstanceRef.current.invalidateSize(true);
          }
        }, 100);

        setTimeout(() => {
          if (mapInstanceRef.current && mapContainerRef.current) {
            mapInstanceRef.current.invalidateSize(true);
          }
        }, 500);
      } catch (error) {
        // console.error('Error initializing map:', error);
        toast.error('Erreur lors du chargement de la carte');
      }
    };

    initializeMap();

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
          mapInitializedRef.current = false;
        } catch (error) {
          console.warn('Error cleaning up map:', error);
        }
      }
    };
  }, []);

  // Charger les vélos
  useEffect(() => {
    loadBikes();
    
    const interval = setInterval(() => {
      if (!loading && mapInstanceRef.current) {
        refreshPositions();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [id]);

  // Mettre à jour les marqueurs quand les données ou filtres changent
  useEffect(() => {
    if (mapInstanceRef.current && bikes.length > 0 && mapReady) {
      updateMarkers();
    }
  }, [bikes, showInactive, showOffline, mapReady]);

  // Forcer le redimensionnement quand la carte est prête
  useEffect(() => {
    if (mapReady && mapInstanceRef.current) {
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize(true);
        }
      }, 200);
    }
  }, [mapReady]);

  const loadBikes = async () => {
    try {
      setLoading(true);
      setApiError(null);
      
      if (id) {
        // Vélo spécifique
        try {
          const bike = await bikeService.getBikeById(id);
          if (bike) {
            setSelectedBike(bike as BikeMarker);
            setBikes([bike as BikeMarker]);
          } else {
            setBikes([]);
            toast.error('Vélo non trouvé');
          }
        } catch (error) {
          console.error('Error loading specific bike:', error);
          setApiError('Impossible de charger les informations du vélo');
          toast.error('Erreur lors du chargement du vélo');
          setBikes([]);
        }
      } else {
        // Tous les vélos
        try {
          // Essayer d'abord avec les positions en temps réel
          const positions = await bikeService.getRealtimePositions();
          if (positions && positions.length > 0) {
            setBikes(positions);
          } else {
            // Fallback sur getAllBikes
            const response = await bikeService.getAllBikes({ page: 1, limit: 1000 });
            const bikesData = Array.isArray(response) ? response : (response?.bikes || []);
            setBikes(bikesData);
          }
        } catch (error) {
          console.error('Error loading bikes:', error);
          setApiError('Erreur lors du chargement des vélos');
          toast.error('Erreur lors du chargement des vélos');
          setBikes([]);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshPositions = async () => {
    if (isRefreshing) return;

    try {
      setIsRefreshing(true);
      setApiError(null);
      
      try {
        await bikeService.syncGpsData();
      } catch (syncError) {
        console.warn('GPS sync failed:', syncError);
      }
      
      if (id) {
        const bike = await bikeService.getBikeById(id);
        if (bike) {
          setSelectedBike(bike as BikeMarker);
          setBikes([bike as BikeMarker]);
          toast.success('Vélo mis à jour');
        }
      } else {
        const positions = await bikeService.getRealtimePositions();
        if (positions && positions.length > 0) {
          setBikes(positions);
          toast.success(`${positions.length} positions mises à jour`);
        } else {
          await loadBikes();
        }
      }
    } catch (error) {
      console.error('Error refreshing positions:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setIsRefreshing(false);
    }
  };

  const getMarkerColor = (bike: BikeMarker): string => {
    if (bike.isActive === false) return '#6b7280';
    if (!bike.isOnline && bike.status !== 'MAINTENANCE') return '#9ca3af';
    
    switch (bike.status) {
      case 'AVAILABLE':
        return bike.battery < 20 ? '#ef4444' : (bike.battery < 50 ? '#f59e0b' : '#10b981');
      case 'IN_USE':
        return '#3b82f6';
      case 'MAINTENANCE':
        return '#dc2626';
      default:
        return '#6b7280';
    }
  };

  const updateMarkers = () => {
    if (!mapInstanceRef.current) return;

    // Filtrer les vélos avec coordonnées valides
    const visibleBikes = bikes.filter(bike => {
      if (!bike.latitude || !bike.longitude) return false;
      if (isNaN(bike.latitude) || isNaN(bike.longitude)) return false;
      if (bike.latitude < -90 || bike.latitude > 90) return false;
      if (bike.longitude < -180 || bike.longitude > 180) return false;
      
      if (!showInactive && bike.isActive === false) return false;
      if (!showOffline && !bike.isOnline) return false;
      
      return true;
    });

    // Nettoyer les anciens marqueurs
    markersRef.current.forEach(mapMarker => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(mapMarker.marker);
      }
    });
    markersRef.current = [];

    if (visibleBikes.length === 0) return;

    // Ajouter les nouveaux marqueurs
    visibleBikes.forEach(bike => {
      if (!bike.latitude || !bike.longitude) return;

      const markerColor = getMarkerColor(bike);
      const showInactiveDot = bike.isActive === false;
      const showOfflineDot = !bike.isOnline && bike.isActive !== false;

      const markerHtml = `
        <div style="position: relative; width: 32px; height: 32px; cursor: pointer;">
          <div style="
            width: 32px;
            height: 32px;
            background-color: ${markerColor};
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 14px;
            font-weight: bold;
            transition: transform 0.2s;
          ">
            ${bike.isOnline ? '●' : '○'}
          </div>
          ${showInactiveDot ? `
            <div style="
              position: absolute;
              top: -2px;
              right: -2px;
              width: 12px;
              height: 12px;
              background-color: #ef4444;
              border-radius: 50%;
              border: 2px solid white;
              box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            "></div>
          ` : ''}
          ${showOfflineDot ? `
            <div style="
              position: absolute;
              top: -2px;
              left: -2px;
              width: 12px;
              height: 12px;
              background-color: #6b7280;
              border-radius: 50%;
              border: 2px solid white;
              box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            "></div>
          ` : ''}
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'custom-bike-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16]
      });

      const marker = L.marker([bike.latitude, bike.longitude], { 
        icon: customIcon,
        riseOnHover: true 
      });

      const popupContent = `
        <div style="padding: 16px; min-width: 240px; max-width: 300px;">
          <div style="font-weight: 600; font-size: 16px; margin-bottom: 12px; color: #1f2937; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">
            🚲 ${bike.code}
          </div>
          
          <div style="font-size: 13px; color: #4b5563; margin-bottom: 12px;">
            ${bike.model}
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; font-size: 13px;">
            <div>
              <div style="color: #6b7280; margin-bottom: 2px;">Statut</div>
              <div style="font-weight: 500; color: ${getMarkerColor(bike)};">
                ${bike.status === 'AVAILABLE' ? '✅ Disponible' : 
                  bike.status === 'IN_USE' ? '🔄 En utilisation' : 
                  bike.status === 'MAINTENANCE' ? '🔧 Maintenance' : bike.status}
              </div>
            </div>
            <div>
              <div style="color: #6b7280; margin-bottom: 2px;">Batterie</div>
              <div style="font-weight: 500; color: ${bike.battery > 60 ? '#10b981' : bike.battery > 30 ? '#f59e0b' : '#ef4444'};">
                ⚡ ${bike.battery}%
              </div>
            </div>
            <div>
              <div style="color: #6b7280; margin-bottom: 2px;">État</div>
              <div style="font-weight: 500; color: ${bike.isActive ? '#10b981' : '#ef4444'};">
                ${bike.isActive ? '✅ Actif' : '❌ Inactif'}
              </div>
            </div>
            <div>
              <div style="color: #6b7280; margin-bottom: 2px;">Connexion</div>
              <div style="font-weight: 500; color: ${bike.isOnline ? '#10b981' : '#ef4444'};">
                ${bike.isOnline ? '📶 En ligne' : '📴 Hors ligne'}
              </div>
            </div>
          </div>

          ${bike.locationName ? `
            <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px; display: flex; align-items: center; gap: 4px;">
              <span>📍</span>
              <span style="word-break: break-word;">${bike.locationName}</span>
            </div>
          ` : ''}

          ${bike.lastUpdate ? `
            <div style="font-size: 11px; color: #9ca3af; margin-bottom: 12px;">
              🕐 ${new Date(bike.lastUpdate).toLocaleString('fr-FR')}
            </div>
          ` : ''}

          <button 
            onclick="window.location.href='/admin/bikes/${bike.id}'" 
            style="
              width: 100%;
              padding: 10px;
              background-color: #16a34a;
              color: white;
              border: none;
              border-radius: 6px;
              font-size: 13px;
              font-weight: 500;
              cursor: pointer;
              transition: background-color 0.2s;
              margin-top: 4px;
            "
            onmouseover="this.style.backgroundColor='#15803d'"
            onmouseout="this.style.backgroundColor='#16a34a'"
          >
            Voir les détails
          </button>
        </div>
      `;

      marker.bindPopup(popupContent, {
        maxWidth: 320,
        className: 'custom-bike-popup'
      });

      marker.addTo(mapInstanceRef.current!);
      markersRef.current.push({ id: bike.id, marker, bikeData: bike });
    });

    // Ajuster la vue
    setTimeout(() => {
      if (mapInstanceRef.current && markersRef.current.length > 0) {
        if (markersRef.current.length === 1) {
          const marker = markersRef.current[0].marker;
          mapInstanceRef.current!.setView(marker.getLatLng(), 15);
        } else {
          const group = L.featureGroup(markersRef.current.map(m => m.marker));
          mapInstanceRef.current!.fitBounds(group.getBounds().pad(0.1));
        }
      }
    }, 300);
  };

  // Statistiques
  const activeBikes = bikes.filter(b => b.isActive !== false);
  const inactiveBikes = bikes.filter(b => b.isActive === false);
  const onlineBikes = bikes.filter(b => b.isOnline && b.isActive !== false);
  const offlineBikes = bikes.filter(b => !b.isOnline || b.isActive === false);
  const bikesWithGps = bikes.filter(b => b.latitude && b.longitude && !isNaN(b.latitude) && !isNaN(b.longitude));
  const bikesWithoutGps = bikes.filter(b => !b.latitude || !b.longitude || isNaN(b.latitude) || isNaN(b.longitude));

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button onClick={handleBack} variant="ghost" size="icon" className="flex-shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-green-600">
              {selectedBike ? `Carte - ${selectedBike.code}` : 'Carte des vélos'}
            </h1>
            <p className="text-sm text-gray-600">
              {bikesWithGps.length} vélo{bikesWithGps.length > 1 ? 's' : ''} avec position GPS
              {bikesWithoutGps.length > 0 && ` (${bikesWithoutGps.length} sans GPS)`}
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={showInactive ? "default" : "outline"}
            size="sm"
            onClick={() => setShowInactive(!showInactive)}
            className="flex items-center gap-2"
          >
            {showInactive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            Inactifs ({inactiveBikes.length})
          </Button>
          
          <Button
            variant={showOffline ? "default" : "outline"}
            size="sm"
            onClick={() => setShowOffline(!showOffline)}
            className="flex items-center gap-2"
          >
            {showOffline ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            Hors ligne ({offlineBikes.length})
          </Button>

          <Button 
            onClick={refreshPositions} 
            disabled={isRefreshing}
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Sync...' : 'Actualiser'}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{bikes.length}</p>
            </div>
            <Zap className="w-8 h-8 text-blue-600" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Actifs</p>
              <p className="text-2xl font-bold text-green-600">{activeBikes.length}</p>
            </div>
            <Eye className="w-8 h-8 text-green-600" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Inactifs</p>
              <p className="text-2xl font-bold text-red-600">{inactiveBikes.length}</p>
            </div>
            <EyeOff className="w-8 h-8 text-red-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">En ligne</p>
              <p className="text-2xl font-bold text-blue-600">{onlineBikes.length}</p>
            </div>
            <Signal className="w-8 h-8 text-blue-600" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avec GPS</p>
              <p className="text-2xl font-bold text-purple-600">{bikesWithGps.length}</p>
            </div>
            <MapPin className="w-8 h-8 text-purple-600" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Sans GPS</p>
              <p className="text-2xl font-bold text-gray-600">{bikesWithoutGps.length}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-gray-600" />
          </div>
        </Card>
      </div>

      {/* Carte */}
      <Card className="relative overflow-hidden" style={{ height: '70vh', minHeight: '600px' }}>
        {/* Conteneur de la carte avec styles inline pour garantir l'affichage */}
        <div
          ref={mapContainerRef}
          style={{
            width: '100%',
            height: '100%',
            position: 'relative',
            zIndex: 1,
            backgroundColor: '#f0f0f0',
            borderRadius: '8px',
            overflow: 'hidden'
          }}
        />
        
        {/* Indicateur de chargement de la carte */}
        {!mapReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-90 z-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Initialisation de la carte...</p>
            </div>
          </div>
        )}
        
        {/* Légende */}
        {mapReady && bikesWithGps.length > 0 && (
          <div className="absolute bottom-4 left-4 bg-white p-4 rounded-lg shadow-lg max-w-xs z-10 pointer-events-auto border border-gray-200">
            <h4 className="text-sm font-medium mb-3 text-gray-900">Légende</h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm flex-shrink-0" />
                <span className="text-gray-700">Disponible (batterie OK)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-orange-500 rounded-full border-2 border-white shadow-sm flex-shrink-0" />
                <span className="text-gray-700">Disponible (batterie faible)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-sm flex-shrink-0" />
                <span className="text-gray-700">Batterie critique / Maintenance</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-sm flex-shrink-0" />
                <span className="text-gray-700">En utilisation</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm" />
                  <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
                </div>
                <span className="text-gray-700">Point rouge = Inactif</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-white text-[8px]">
                    ○
                  </div>
                  <div className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-gray-400 rounded-full border-2 border-white" />
                </div>
                <span className="text-gray-700">Point gris = Hors ligne</span>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Message si aucun vélo avec GPS */}
      {!loading && bikesWithGps.length === 0 && (
        <Card className="p-8 text-center">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun vélo avec GPS</h3>
          <p className="text-gray-600">
            Les vélos avec position GPS apparaîtront sur la carte.
          </p>
        </Card>
      )}
    </div>
  );
}