import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Clock, DollarSign } from 'lucide-react';
import { Button } from '../../ui/button';
import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { useTranslation } from '../../../lib/i18n';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { ridesService } from '../../../services/api/ride.service';
import { toast } from 'sonner';

interface Trip {
  id: string;
  startTime: string;
  endTime: string;
  duration: number;
  distance: number;
  cost: number;
  startLocation: string;
  endLocation: string;
  userName: string;
  status: 'COMPLETED' | 'CANCELLED' | 'IN_PROGRESS';
}

export function BikeTripHistory() {
  const { id: bikeId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [bikeName, setBikeName] = useState('');
  const [stats, setStats] = useState({
    totalTrips: 0,
    totalDistance: 0,
    totalTime: 0,
    totalRevenue: 0
  });

  const onBack = () => navigate(`/admin/bikes/${bikeId}`);

  useEffect(() => {
    if (bikeId) {
      loadTrips();
    }
  }, [bikeId]);

  const loadTrips = async () => {
    try {
      setLoading(true);
      if (!bikeId) return;
      
      const data = await ridesService.getBikeTrips(bikeId);
      
      const formattedTrips = data.trips?.map((trip: any) => ({
        id: trip.id,
        startTime: trip.startTime,
        endTime: trip.endTime || '',
        duration: trip.duration || 0,
        distance: trip.distance || 0,
        cost: trip.cost || 0,
        startLocation: `${trip.startLatitude?.toFixed(4)}, ${trip.startLongitude?.toFixed(4)}` || 'Position inconnue',
        endLocation: trip.endLatitude && trip.endLongitude 
          ? `${trip.endLatitude.toFixed(4)}, ${trip.endLongitude.toFixed(4)}`
          : 'Position inconnue',
        userName: trip.userName || 'Utilisateur inconnu',
        status: trip.status
      })) || [];

      setTrips(formattedTrips);
      setBikeName(data.bikeName || `Vélo ${bikeId}`);

      // Calculate stats
      const completedTrips = formattedTrips.filter((trip: Trip) => trip.status === 'COMPLETED');
      setStats({
        totalTrips: formattedTrips.length,
        totalDistance: completedTrips.reduce((sum, trip) => sum + trip.distance, 0),
        totalTime: completedTrips.reduce((sum, trip) => sum + trip.duration, 0),
        totalRevenue: completedTrips.reduce((sum, trip) => sum + trip.cost, 0)
      });

    } catch (error) {
      console.error('Erreur lors du chargement des trajets:', error);
      toast.error('Erreur lors du chargement des trajets');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'COMPLETED': { label: 'Terminé', variant: 'default' as const },
      'CANCELLED': { label: 'Annulé', variant: 'destructive' as const },
      'IN_PROGRESS': { label: 'En cours', variant: 'secondary' as const }
    };
    const config = variants[status as keyof typeof variants] || { label: status, variant: 'outline' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8 space-y-6">
        <div className="flex items-center gap-4">
          <Button onClick={onBack} variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-green-600">Chargement...</h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button onClick={onBack} variant="ghost" size="icon">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-green-600">Historique des Trajets</h1>
          <p className="text-gray-600">{bikeName}</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Trajets</p>
          <p className="text-gray-900 text-2xl">{stats.totalTrips}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Distance Totale</p>
          <p className="text-gray-900 text-2xl">
            {stats.totalDistance.toFixed(1)} km
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Temps Total</p>
          <p className="text-gray-900 text-2xl">
            {Math.round(stats.totalTime / 60)} h
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Revenus Générés</p>
          <p className="text-gray-900 text-2xl">
            {stats.totalRevenue.toLocaleString()} FCFA
          </p>
        </Card>
      </div>

      {/* Trips Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Trajet</TableHead>
                <TableHead>Durée</TableHead>
                <TableHead>Distance</TableHead>
                <TableHead>Coût</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trips.map((trip) => (
                <TableRow key={trip.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm">{new Date(trip.startTime).toLocaleDateString('fr-FR')}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(trip.startTime).toLocaleTimeString('fr-FR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{trip.userName}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-green-600" />
                        <span className="truncate max-w-32">{trip.startLocation}</span>
                      </p>
                      {trip.endLocation && trip.endLocation !== 'Position inconnue' && (
                        <p className="flex items-center gap-1 text-gray-500">
                          <MapPin className="w-3 h-3 text-red-600" />
                          <span className="truncate max-w-32">{trip.endLocation}</span>
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>{trip.duration} min</span>
                    </div>
                  </TableCell>
                  <TableCell>{trip.distance.toFixed(1)} km</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <span>{trip.cost.toLocaleString()} FCFA</span>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(trip.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {trips.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Aucun trajet trouvé pour ce vélo</p>
          </div>
        )}
      </Card>
    </div>
  );
}