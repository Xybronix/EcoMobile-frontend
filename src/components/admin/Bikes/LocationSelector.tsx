import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Search, Loader2 } from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { bikeService } from '../../../services/api/bike.service';
import { toast } from 'sonner';

interface LocationData {
  name: string;
  displayName: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  address: string;
}

interface LocationSelectorProps {
  value: LocationData | null;
  onChange: (location: LocationData | null) => void;
  error?: string;
}

export function LocationSelector({ value, onChange, error }: LocationSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualCoords, setManualCoords] = useState({ lat: '', lng: '' });
  const [customName, setCustomName] = useState('');

  useEffect(() => {
    if (value) {
      setCustomName(value.displayName || '');
    }
  }, [value]);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchQuery.trim().length > 2) {
        searchLocations();
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchQuery]);

  const searchLocations = async () => {
    try {
      setIsSearching(true);
      const response = await bikeService.searchAreas(searchQuery);
      setSearchResults(response);
    } catch (error) {
      console.error('Erreur de recherche:', error);
      toast.error('Erreur lors de la recherche de lieux');
    } finally {
      setIsSearching(false);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('La géolocalisation n\'est pas supportée par votre navigateur');
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Obtenir l'adresse via reverse geocoding
          const address = await bikeService.reverseGeocode(latitude, longitude);
          
          const locationData: LocationData = {
            name: address || 'Position actuelle',
            displayName: customName || 'Ma position',
            coordinates: { lat: latitude, lng: longitude },
            address: address || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
          };

          onChange(locationData);
          toast.success('Position récupérée avec succès');
        } catch (error) {
          toast.error('Erreur lors de la récupération de l\'adresse');
        } finally {
          setIsGettingLocation(false);
        }
      },
      (error) => {
        setIsGettingLocation(false);
        toast.error('Erreur lors de la récupération de votre position');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleManualCoordinates = async () => {
    const lat = parseFloat(manualCoords.lat);
    const lng = parseFloat(manualCoords.lng);

    if (isNaN(lat) || isNaN(lng)) {
      toast.error('Coordonnées invalides');
      return;
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      toast.error('Coordonnées hors limites');
      return;
    }

    try {
      const address = await bikeService.reverseGeocode(lat, lng);
      
      const locationData: LocationData = {
        name: address || 'Position manuelle',
        displayName: customName || 'Position personnalisée',
        coordinates: { lat, lng },
        address: address || `${lat.toFixed(6)}, ${lng.toFixed(6)}`
      };

      onChange(locationData);
      setShowManualInput(false);
      toast.success('Coordonnées définies avec succès');
    } catch (error) {
      toast.error('Erreur lors de la récupération de l\'adresse');
    }
  };

  const selectLocation = (location: any) => {
    const locationData: LocationData = {
      name: location.name,
      displayName: customName || location.name,
      coordinates: location.location,
      address: `${location.name}, ${location.city || location.region || ''}`
    };

    onChange(locationData);
    setSearchResults([]);
    setSearchQuery('');
  };

  const updateCustomName = (name: string) => {
    setCustomName(name);
    if (value) {
      onChange({
        ...value,
        displayName: name || value.name
      });
    }
  };

  return (
    <div className="space-y-4">
      <Label>Localisation du vélo *</Label>
      
      {/* Nom personnalisé de l'emplacement */}
      <div>
        <Label className="text-sm">Nom de l'emplacement</Label>
        <Input
          placeholder="Ex: Entrepôt Principal, Station Akwa, etc."
          value={customName}
          onChange={(e) => updateCustomName(e.target.value)}
          className="mt-1"
        />
        <p className="text-xs text-gray-500 mt-1">
          Ce nom vous aidera à distinguer cet emplacement des autres dans le même quartier
        </p>
      </div>

      {/* Recherche Google Places */}
      <div className="relative">
        <Label className="text-sm">Rechercher un lieu</Label>
        <div className="relative mt-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Rechercher un quartier, une rue, une ville..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
          )}
        </div>

        {/* Résultats de recherche */}
        {searchResults.length > 0 && (
          <Card className="absolute z-10 w-full mt-1 max-h-60 overflow-y-auto">
            {searchResults.map((location, index) => (
              <div
                key={index}
                className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                onClick={() => selectLocation(location)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-sm">{location.name}</p>
                    <p className="text-xs text-gray-500">
                      {location.city && `${location.city}, `}{location.country}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {location.country === 'CM' ? 'Cameroun' : location.country}
                  </Badge>
                </div>
              </div>
            ))}
          </Card>
        )}
      </div>

      {/* Boutons d'action */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={getCurrentLocation}
          disabled={isGettingLocation}
          className="flex-1"
        >
          {isGettingLocation ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Navigation className="w-4 h-4 mr-2" />
          )}
          Ma position
        </Button>
        
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowManualInput(!showManualInput)}
          className="flex-1"
        >
          <MapPin className="w-4 h-4 mr-2" />
          Coordonnées manuelles
        </Button>
      </div>

      {/* Saisie manuelle des coordonnées */}
      {showManualInput && (
        <Card className="p-4">
          <div className="space-y-3">
            <Label className="text-sm">Coordonnées GPS</Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Latitude</Label>
                <Input
                  placeholder="Ex: 4.0511"
                  value={manualCoords.lat}
                  onChange={(e) => setManualCoords({ ...manualCoords, lat: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs">Longitude</Label>
                <Input
                  placeholder="Ex: 9.7679"
                  value={manualCoords.lng}
                  onChange={(e) => setManualCoords({ ...manualCoords, lng: e.target.value })}
                />
              </div>
            </div>
            <Button onClick={handleManualCoordinates} className="w-full">
              Valider les coordonnées
            </Button>
          </div>
        </Card>
      )}

      {/* Localisation sélectionnée */}
      {value && (
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-green-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-green-900">{value.displayName}</p>
              <p className="text-sm text-green-700">{value.address}</p>
              <p className="text-xs text-green-600 mt-1">
                {value.coordinates.lat.toFixed(6)}, {value.coordinates.lng.toFixed(6)}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onChange(null)}
              className="text-green-700 hover:text-green-900"
            >
              ×
            </Button>
          </div>
        </Card>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}