import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Wrench, Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '../../ui/button';
import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { bikeService } from '../../../services/api/bike.service';
import { toast } from 'sonner';

export function BikeMaintenanceHistory() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [maintenanceLogs, setMaintenanceLogs] = useState<any[]>([]);
  const [bike, setBike] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalInterventions: 0,
    totalCost: 0,
    lastMaintenance: null as string | null,
    nextMaintenance: null as string | null
  });

  const handleBack = () => {
    navigate(`/admin/bikes/${id}`);
  };

  useEffect(() => {
    if (id) {
      loadMaintenanceData();
    }
  }, [id]);

  const loadMaintenanceData = async () => {
    try {
      setLoading(true);
      
      const [bikeData, maintenanceData] = await Promise.all([
        bikeService.getBikeById(id!),
        bikeService.getMaintenanceHistory(id!, {page: 1, limit: 50})
      ]);

      setBike(bikeData);
      setMaintenanceLogs(maintenanceData.maintenance || []);

      // Calculate stats
      const completedLogs = maintenanceData.maintenance?.filter((log: any) => log.cost) || [];
      const totalCost = completedLogs.reduce((sum: number, log: any) => sum + (log.cost || 0), 0);
      
      setStats({
        totalInterventions: completedLogs.length,
        totalCost,
        lastMaintenance: bikeData?.updatedAt || null,
        nextMaintenance: null 
      });

    } catch (error) {
      console.error('Error loading maintenance data:', error);
      toast.error('Erreur lors du chargement des données de maintenance');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (log: any) => {
    // Simuler le statut basé sur la présence de données
    const isCompleted = log.cost !== null && log.cost !== undefined;
    
    if (isCompleted) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Terminé
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        <AlertCircle className="w-3 h-3 mr-1" />
        Planifié
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8 space-y-6">
        <div className="flex items-center gap-4">
          <Button onClick={handleBack} variant="ghost" size="icon">
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
        <Button onClick={handleBack} variant="ghost" size="icon">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-green-600">Historique de Maintenance</h1>
          <p className="text-gray-600">Vélo {bike?.code || id}</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Interventions Totales</p>
          <p className="text-gray-900 text-2xl">{stats.totalInterventions}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Coût Total</p>
          <p className="text-gray-900 text-2xl">
            {stats.totalCost.toLocaleString()} FCFA
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Dernière Maintenance</p>
          <p className="text-gray-900">
            {stats.lastMaintenance 
              ? new Date(stats.lastMaintenance).toLocaleDateString('fr-FR')
              : 'Aucune'
            }
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Prochaine Maintenance</p>
          <p className="text-gray-900">
            {stats.nextMaintenance 
              ? new Date(stats.nextMaintenance).toLocaleDateString('fr-FR')
              : 'À planifier'
            }
          </p>
        </Card>
      </div>

      {/* Maintenance Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Technicien</TableHead>
                <TableHead>Coût</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {maintenanceLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>{new Date(log.createdAt).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{log.type}</Badge>
                  </TableCell>
                  <TableCell className="max-w-xs">{log.description}</TableCell>
                  <TableCell>{log.performedBy || 'Non spécifié'}</TableCell>
                  <TableCell>
                    {log.cost > 0 ? `${log.cost.toLocaleString()} FCFA` : '-'}
                  </TableCell>
                  <TableCell>{getStatusBadge(log)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {maintenanceLogs.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <Wrench className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Aucun historique de maintenance trouvé</p>
          </div>
        )}
      </Card>
    </div>
  );
}