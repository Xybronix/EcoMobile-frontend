import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, RefreshCw, Zap, Signal, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { Button } from '../../ui/button';
import { Card } from '../../ui/card';
import { bikeService } from '../../../services/api/bike.service';
import { toast } from 'sonner';
import type { FeatureGroup } from 'leaflet';

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

export function BikeMap() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  
  const [bikes, setBikes] = useState<BikeMarker[]>([]);
  const [selectedBike, setSelectedBike] = useState<BikeMarker | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showInactive, setShowInactive] = useState(true);
  const [showOffline, setShowOffline] = useState(true);

  const handleBack = () => {
    if (id) {
      navigate(`/admin/bikes/${id}`);
    } else {
      navigate('/admin/bikes');
    }
  };

  useEffect(() => {
    initializeMap();
    loadBikes();
    
    const interval = setInterval(() => {
      if (!loading) {
        refreshPositions();
      }
    }, 30000);

    return () => {
      clearInterval(interval);
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
      }
    };
  }, [id]);

  useEffect(() => {
    if (leafletMapRef.current && bikes.length > 0) {
      updateMapMarkers();
    }
  }, [bikes, showInactive, showOffline]);

  const initializeMap = async() => {
    if (!mapRef.current) return;

    const L = await import('leaflet');

    const Control = L.Control as any;
    
    // Configuration des icônes (doit être fait avant d'utiliser L)
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });

    // Centrer sur Douala par défaut
    const doualaCenter = [4.0511, 9.7679] as [number, number];
    
    leafletMapRef.current = L.map(mapRef.current).setView(doualaCenter, 12);

    // Ajouter les tuiles OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(leafletMapRef.current);

    // Contrôles personnalisés
    const customControl = new Control({ position: 'topright' });
    customControl.onAdd = function() {
      const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
      div.innerHTML = `
        <a href="#" id="center-map" title="Centrer sur les vélos">
          <svg style="width: 18px; height: 18px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <circle cx="12" cy="12" r="3"></circle>
            <line x1="12" y1="8" x2="12" y2="2"></line>
            <line x1="12" y1="22" x2="12" y2="16"></line>
            <line x1="8" y1="12" x2="2" y2="12"></line>
            <line x1="22" y1="12" x2="16" y2="12"></line>
          </svg>
        </a>
      `;
      return div;
    };
    customControl.addTo(leafletMapRef.current);

    // Event listener pour centrer
    setTimeout(() => {
      const centerBtn = document.getElementById('center-map');
      if (centerBtn) {
        centerBtn.onclick = (e) => {
          e.preventDefault();
          centerMapOnBikes();
        };
      }
    }, 100);
  };

  const getLeaflet = async () => {
    if (typeof window === 'undefined') return null;
    const L = await import('leaflet');
    return L;
  };

  const centerMapOnBikes = async() => {
    const L = await getLeaflet();
    if (!leafletMapRef.current || !bikes.length) return;
    
    const validBikes = bikes.filter(bike => bike.latitude && bike.longitude);
    if (validBikes.length === 0) return;

    if (validBikes.length === 1) {
      leafletMapRef.current.setView([validBikes[0].latitude, validBikes[0].longitude], 16);
    } else {
      const group = (L as any).featureGroup(markersRef.current) as FeatureGroup;
      leafletMapRef.current.fitBounds(group.getBounds().pad(0.1));
    }
  };

  const loadBikes = async () => {
    try {
      setLoading(true);
      
      if (id) {
        // Vélo spécifique
        const bike = await bikeService.getBikeById(id);
        if (bike && bike.latitude && bike.longitude) {
          setSelectedBike(bike as BikeMarker);
          setBikes([bike as BikeMarker]);
        }
      } else {
        const allBikes = await bikeService.getAllBikes({ page: 1, limit: 100 });
        setBikes(allBikes.bikes || []);
      }
    } catch (error) {
      console.error('Error loading bikes for map:', error);
      toast.error('Erreur lors du chargement des vélos');
    } finally {
      setLoading(false);
    }
  };

  const refreshPositions = async () => {
    try {
      setIsRefreshing(true);
      
      await bikeService.syncGpsData();
      
      if (id) {
        const bike = await bikeService.getBikeById(id);
        if (bike) {
          setSelectedBike(bike as BikeMarker);
          setBikes([bike as BikeMarker]);
        }
      } else {
        const [positions, allBikes] = await Promise.all([
          bikeService.getRealtimePositions(),
          bikeService.getAllBikes({ page: 1, limit: 100 })
        ]);
        
        const mergedBikes = allBikes.bikes.map(bike => {
          const realtimeData = positions.find(p => p.id === bike.id);
          return realtimeData || bike;
        });
        
        setBikes(mergedBikes);
      }
      
      toast.success('Positions mises à jour');
    } catch (error) {
      console.error('Error refreshing positions:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setIsRefreshing(false);
    }
  };

  const updateMapMarkers = async() => {
    const L = await getLeaflet();
    if (!leafletMapRef.current || !L) return;

    // Clear existing markers
    markersRef.current.forEach(marker => leafletMapRef.current.removeLayer(marker));
    markersRef.current = [];

    // Filter bikes based on toggle states
    const visibleBikes = bikes.filter(bike => {
      if (!bike.latitude || !bike.longitude) return false;
      
      if (!showInactive && bike.isActive === false) return false;
      if (!showOffline && !bike.isOnline) return false;
      
      return true;
    });

    // Add markers for visible bikes
    visibleBikes.forEach(bike => {
      if (!bike.latitude || !bike.longitude) return;

      // Customize icon based on status and online state
      const iconColor = getMarkerColor(bike.status, bike.isOnline, bike.isActive);
      const iconHtml = `
        <div style="
          background-color: ${iconColor};
          width: 25px;
          height: 25px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 10px;
        ">
          ${bike.isOnline ? '●' : '○'}
          ${!bike.isActive ? '<div style="position:absolute;top:-2px;right:-2px;width:8px;height:8px;background:red;border-radius:50%;border:1px solid white;"></div>' : ''}
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-bike-marker',
        iconSize: [25, 25],
        iconAnchor: [12.5, 12.5]
      });

      const marker = L.marker([bike.latitude, bike.longitude], { icon: customIcon })
        .addTo(leafletMapRef.current);

      // Popup détaillé
      const popupContent = `
        <div style="min-width: 200px;">
          <div style="font-weight: bold; margin-bottom: 8px; color: #1f2937;">
            ${bike.code} - ${bike.model}
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px; font-size: 12px;">
            <div>
              <strong>Statut:</strong><br>
              <span style="color: ${iconColor};">${bike.status}</span>
            </div>
            <div>
              <strong>État:</strong><br>
              <span style="color: ${bike.isActive ? '#16a34a' : '#dc2626'};">
                ${bike.isActive ? 'Actif' : 'Inactif'}
              </span>
            </div>
            <div>
              <strong>Batterie:</strong><br>
              <span style="color: ${getBatteryColor(bike.battery)};">${bike.battery}%</span>
            </div>
            <div>
              <strong>GPS:</strong><br>
              <span style="color: ${bike.isOnline ? '#16a34a' : '#dc2626'};">
                ${bike.isOnline ? 'En ligne' : 'Hors ligne'}
              </span>
            </div>
          </div>

          ${bike.gpsDeviceId ? `
            <div style="font-size: 11px; color: #6b7280; margin-bottom: 8px;">
              GPS ID: ${bike.gpsDeviceId}
            </div>
          ` : ''}

          ${bike.locationName ? `
            <div style="font-size: 11px; color: #6b7280; margin-bottom: 8px;">
              <svg style="width: 12px; height: 12px; display: inline; vertical-align: middle; margin-right: 4px;" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              ${bike.locationName}
            </div>
          ` : ''}

          ${bike.lastUpdate ? `
            <div style="font-size: 11px; color: #6b7280; margin-bottom: 8px;">
              <svg style="width: 12px; height: 12px; display: inline; vertical-align: middle; margin-right: 4px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              MAJ: ${new Date(bike.lastUpdate).toLocaleString('fr-FR')}
            </div>
          ` : ''}

          <div style="margin-top: 8px;">
            <button 
              onclick="window.location.href='/admin/bikes/${bike.id}'" 
              style="
                background: #16a34a; 
                color: white; 
                border: none; 
                padding: 6px 12px; 
                border-radius: 4px; 
                cursor: pointer;
                font-size: 12px;
                width: 100%;
              "
            >
              Voir détails
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      markersRef.current.push(marker);
    });

    // Auto-center if first load
    if (!loading && visibleBikes.length > 0) {
      setTimeout(() => centerMapOnBikes(), 500);
    }
  };

  const getMarkerColor = (status: string, isOnline: boolean = false, isActive: boolean = true) => {
    if (!isActive) return '#6b7280';
    if (!isOnline && status !== 'MAINTENANCE') return '#9ca3af';
    
    switch (status) {
      case 'AVAILABLE':
        return '#16a34a';
      case 'IN_USE':
        return '#2563eb';
      case 'MAINTENANCE':
        return '#dc2626';
      default:
        return '#6b7280';
    }
  };

  const getBatteryColor = (level: number) => {
    if (level > 60) return '#16a34a';
    if (level > 30) return '#ea580c';
    return '#dc2626';
  };

  // Filtrer les vélos pour les stats
  const activeBikes = bikes.filter(b => b.isActive !== false);
  const inactiveBikes = bikes.filter(b => b.isActive === false);
  const onlineBikes = bikes.filter(b => b.isOnline && b.isActive !== false);
  const offlineBikes = bikes.filter(b => !b.isOnline || b.isActive === false);
  const bikesWithGps = bikes.filter(b => b.gpsDeviceId);
  const bikesWithoutGps = bikes.filter(b => !b.gpsDeviceId);

  if (loading) {
    return (
      <div className="p-4 md:p-8 space-y-6">
        <div className="flex items-center gap-4">
          <Button onClick={handleBack} variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-green-600">Chargement de la carte...</h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header avec contrôles */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button onClick={handleBack} variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-green-600">
              {selectedBike ? `Carte - ${selectedBike.code}` : 'Carte Administrative - Tous les Vélos'}
            </h1>
            <p className="text-gray-600">
              Gestion et supervision de la flotte complète ({bikes.length} vélos)
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Toggle pour vélos inactifs */}
          <Button
            variant={showInactive ? "default" : "outline"}
            size="sm"
            onClick={() => setShowInactive(!showInactive)}
          >
            {showInactive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            Inactifs
          </Button>
          
          {/* Toggle pour vélos hors ligne */}
          <Button
            variant={showOffline ? "default" : "outline"}
            size="sm"
            onClick={() => setShowOffline(!showOffline)}
          >
            {showOffline ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            Hors ligne
          </Button>

          <Button 
            onClick={refreshPositions} 
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Sync...' : 'Actualiser'}
          </Button>
        </div>
      </div>

      {/* Stats détaillées pour admin */}
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

      {/* Carte interactive Leaflet */}
      <Card className="relative overflow-hidden" style={{ height: '70vh' }}>
        <div
          ref={mapRef}
          style={{ height: '100%', width: '100%' }}
          className="relative z-0"
        />
        
        {/* Légende */}
        <div className="absolute bottom-4 left-4 bg-white p-4 rounded-lg shadow-lg max-w-xs">
          <h4 className="text-sm font-medium mb-3">Légende</h4>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-600 rounded-full border border-white" />
              <span>Disponible (actif)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-600 rounded-full border border-white" />
              <span>En utilisation</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-600 rounded-full border border-white" />
              <span>Maintenance</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-400 rounded-full border border-white" />
              <span>Hors ligne / Inactif</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-white border border-gray-400 rounded-full flex items-center justify-center">
                <div className="w-1 h-1 bg-gray-400 rounded-full" />
              </div>
              <span>Point creux = Hors ligne</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-4 h-4 bg-green-600 rounded-full border border-white">
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white" />
              </div>
              <span>Point rouge = Inactif</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Instructions pour admin */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-blue-900 font-medium">Panneau Administrateur</h4>
            <ul className="text-sm text-blue-700 mt-1 space-y-1">
              <li>• <strong>Vue complète :</strong> Tous les vélos (actifs, inactifs, en ligne, hors ligne)</li>
              <li>• <strong>Contrôles :</strong> Basculer l'affichage des vélos inactifs/hors ligne</li>
              <li>• <strong>Couleurs :</strong> Vert=Disponible, Bleu=Utilisé, Rouge=Maintenance, Gris=Inactif/Hors ligne</li>
              <li>• <strong>Détails :</strong> Cliquez sur un marqueur pour voir les informations complètes</li>
              <li>• <strong>Auto-refresh :</strong> Synchronisation automatique toutes les 30 secondes</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}