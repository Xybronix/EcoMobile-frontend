import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Zap, Signal, AlertCircle } from 'lucide-react';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { bikeService } from '../../../services/api/bike.service';
import { toast } from 'sonner';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Styles propres à la carte
const mapStyles = `
  #dashboard-map {
    width: 100%;
    height: 100%;
    position: relative;
    z-index: 1;
  }

  #dashboard-map .leaflet-container {
    width: 100%;
    height: 100%;
    background: #ffffff;
    z-index: 1;
  }

  #dashboard-map .leaflet-control-container {
    z-index: 1000;
  }

  #dashboard-map .leaflet-popup {
    z-index: 1001;
  }

  #dashboard-map .leaflet-control {
    z-index: 1000;
  }

  #dashboard-map .leaflet-pane {
    z-index: 400;
  }
`;

// Injecter les styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = mapStyles;
  styleElement.setAttribute('data-dashboard-map', 'true');
  if (!document.head.querySelector('style[data-dashboard-map]')) {
    document.head.appendChild(styleElement);
  }
}

interface DashboardMapBike {
  id: string;
  code: string;
  model: string;
  latitude: number | null;
  longitude: number | null;
  battery: number;
  isActive?: boolean;
  isOnline?: boolean;
  status: string;
}

interface MapMarker {
  id: string;
  marker: L.Marker;
  bikeData: DashboardMapBike;
}

export function DashboardMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<MapMarker[]>([]);
  const [bikes, setBikes] = useState<DashboardMapBike[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Coordonnées par défaut (Douala, Cameroun)
  const defaultCenter: [number, number] = [4.0511, 9.7679];

  // Initialiser la carte
  useEffect(() => {
    const initMap = async () => {
      if (!mapContainerRef.current || mapInstanceRef.current) {
        return;
      }

      try {
        // S'assurer que le conteneur a une taille
        const { clientWidth, clientHeight } = mapContainerRef.current;
        if (clientWidth === 0 || clientHeight === 0) {
          // Attendre que le conteneur ait une taille
          await new Promise(resolve => setTimeout(resolve, 100));
          return initMap();
        }

        // Configurer les icônes par défaut de Leaflet
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
        }).setView(defaultCenter, 12);

        // Ajouter les tuiles OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 18,
        }).addTo(map);

        mapInstanceRef.current = map;

        // Forcer le redimensionnement
        setTimeout(() => {
          if (mapInstanceRef.current && mapContainerRef.current) {
            mapInstanceRef.current.invalidateSize(true);
          }
        }, 0);
      } catch (error) {
        console.error('Error initializing map:', error);
        toast.error('Erreur lors du chargement de la carte');
      }
    };

    const timer = setTimeout(initMap, 100);
    return () => clearTimeout(timer);
  }, []);

  // Charger les vélos
  useEffect(() => {
    loadBikes();

    // Actualiser les positions toutes les 30 secondes
    const interval = setInterval(() => {
      refreshBikes();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Actualiser les marqueurs quand les vélos changent
  useEffect(() => {
    if (mapInstanceRef.current && bikes.length > 0) {
      updateMarkers();
    }
  }, [bikes]);

  // Nettoyer lors du démontage
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        } catch (error) {
          console.warn('Error cleaning up map:', error);
        }
      }
    };
  }, []);

  const loadBikes = async () => {
    try {
      setIsLoading(true);
      const response = await bikeService.getAllBikes({ limit: 1000 });
      
      if (response && Array.isArray(response)) {
        const bikesWithCoords = response.filter((bike: any) =>
          bike.latitude != null &&
          bike.longitude != null &&
          !isNaN(bike.latitude) &&
          !isNaN(bike.longitude)
        );
        setBikes(bikesWithCoords);
      }
    } catch (error) {
      console.error('Error loading bikes:', error);
      toast.error('Erreur lors du chargement des vélos');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshBikes = async () => {
    if (isRefreshing) return;

    try {
      setIsRefreshing(true);
      await loadBikes();
    } catch (error) {
      console.error('Error refreshing bikes:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const updateMarkers = () => {
    if (!mapInstanceRef.current) return;

    // Supprimer les anciens marqueurs qui ne sont pas dans la liste actuelle
    markersRef.current = markersRef.current.filter(mapMarker => {
      const stillExists = bikes.some(bike => bike.id === mapMarker.id);
      if (!stillExists) {
        mapInstanceRef.current!.removeLayer(mapMarker.marker);
      }
      return stillExists;
    });

    // Ajouter ou mettre à jour les marqueurs
    bikes.forEach(bike => {
      if (!bike.latitude || !bike.longitude) return;

      const existingMarker = markersRef.current.find(m => m.id === bike.id);

      // Déterminer la couleur du marqueur selon le statut
      let markerColor = '#10b981'; // Vert par défaut
      if (!bike.isOnline) {
        markerColor = '#6b7280'; // Gris si offline
      } else if (bike.battery < 20) {
        markerColor = '#ef4444'; // Rouge si batterie faible
      } else if (bike.battery < 50) {
        markerColor = '#f59e0b'; // Orange si batterie moyenne
      }

      // Créer le SVG du marqueur
      const markerHtml = `
        <div style="width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="${markerColor}" stroke="white" stroke-width="2">
            <path d="M12 2C6.48 2 2 6.48 2 12c0 7.25 10 13 10 13s10-5.75 10-13c0-5.52-4.48-10-10-10zm0 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
            <circle cx="12" cy="12" r="3" fill="white"/>
          </svg>
        </div>
      `;

      if (existingMarker) {
        // Mettre à jour la position et l'apparence du marqueur
        existingMarker.marker.setLatLng([bike.latitude, bike.longitude]);
        existingMarker.marker.setIcon(
          L.divIcon({
            html: markerHtml,
            iconSize: [24, 24],
            className: 'bike-marker',
          })
        );
        existingMarker.bikeData = bike;
      } else {
        // Créer un nouveau marqueur
        const marker = L.marker([bike.latitude, bike.longitude], {
          icon: L.divIcon({
            html: markerHtml,
            iconSize: [24, 24],
            className: 'bike-marker',
          }),
        });

        // Ajouter le popup
        const popupContent = `
          <div style="font-size: 12px; max-width: 200px;">
            <strong>${bike.code}</strong>
            <div style="margin-top: 4px; color: #6b7280;">
              <div>${bike.model}</div>
              <div>Batterie: ${bike.battery}%</div>
              <div>Statut: ${bike.status}</div>
              <div style="color: ${bike.isOnline ? '#10b981' : '#ef4444'}; font-weight: 500; margin-top: 4px;">
                ${bike.isOnline ? '🟢 En ligne' : '🔴 Hors ligne'}
              </div>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent);
        marker.addTo(mapInstanceRef.current!);

        markersRef.current.push({
          id: bike.id,
          marker,
          bikeData: bike,
        });
      }
    });

    // Ajuster la vue pour afficher tous les marqueurs
    if (markersRef.current.length > 1) {
      const group = new L.FeatureGroup(markersRef.current.map(m => m.marker));
      mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
    } else if (markersRef.current.length === 1) {
      mapInstanceRef.current.setView(
        markersRef.current[0].marker.getLatLng(),
        14
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-green-600" />
          <h3 className="font-semibold text-gray-900">
            Localisation des Vélos - {bikes.length} vélo{bikes.length > 1 ? 's' : ''}
          </h3>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={refreshBikes}
          disabled={isRefreshing || isLoading}
          className="flex items-center gap-2"
        >
          {isRefreshing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
              Actualisation...
            </>
          ) : (
            <>
              <MapPin className="w-4 h-4" />
              Actualiser
            </>
          )}
        </Button>
      </div>

      {/* Conteneur de la carte */}
      <div
        ref={mapContainerRef}
        id="dashboard-map"
        className="w-full rounded-lg overflow-hidden border border-gray-200"
        style={{ height: '400px', minHeight: '400px' }}
      />

      {/* Légende */}
      {bikes.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#10b981' }}></div>
            <span className="text-xs text-gray-600">Batterie OK</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#f59e0b' }}></div>
            <span className="text-xs text-gray-600">Batterie Faible</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#ef4444' }}></div>
            <span className="text-xs text-gray-600">Batterie Critique</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#6b7280' }}></div>
            <span className="text-xs text-gray-600">Hors ligne</span>
          </div>
        </div>
      )}

      {/* État chargement */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-500">Chargement de la carte...</p>
          </div>
        </div>
      )}

      {/* Pas de vélos */}
      {!isLoading && bikes.length === 0 && (
        <div className="flex items-center justify-center py-8 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">Aucun vélo avec localisation GPS</p>
        </div>
      )}
    </div>
  );
}
