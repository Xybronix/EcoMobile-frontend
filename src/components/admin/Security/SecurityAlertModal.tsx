import React, { useState } from 'react';
import { AlertTriangle, Clock, User, Eye, CheckCircle, XCircle } from 'lucide-react';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { monitoringService, SuspiciousMovement } from '../../../services/api/monitoring.service';
import { useTranslation } from '../../../lib/i18n';
import { toast } from 'sonner';

interface SecurityAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  suspiciousMovement: SuspiciousMovement | null;
  onViewOnMap: (bikeId: string, location: { lat: number; lng: number }) => void;
  onMarkAsHandled: (bikeId: string, action: string, note?: string) => Promise<void>;
}

export function SecurityAlertModal({ 
  isOpen, 
  onClose, 
  suspiciousMovement, 
  onViewOnMap,
  onMarkAsHandled 
}: SecurityAlertModalProps) {
  const { t } = useTranslation();
  const [isHandling, setIsHandling] = useState(false);

  if (!suspiciousMovement) return null;

  const formatTimeAgo = (date: Date) => {
    const diffMs = new Date().getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Il y a ${diffHours}h${diffMins % 60}min`;
    return date.toLocaleString();
  };

  const handleMarkAsResolved = async (action: string, note?: string) => {
    try {
      setIsHandling(true);
      await onMarkAsHandled(suspiciousMovement.bikeId, action, note);
      toast.success(`Alerte marquée comme traitée: ${action}`);
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors du traitement');
    } finally {
      setIsHandling(false);
    }
  };

  const getSeverityColor = () => {
    if (suspiciousMovement.movement.isOutsideDepositZone) return '#dc2626';
    return '#f59e0b';
  };

  const getSeverityLabel = () => {
    if (suspiciousMovement.movement.isOutsideDepositZone) return 'CRITIQUE';
    return 'ATTENTION';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        {/* Alert Header */}
        <div 
          className="px-6 py-4 text-white"
          style={{ backgroundColor: getSeverityColor() }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-white">
              <AlertTriangle size={24} />
              <div>
                <div className="text-lg font-bold">
                  🚨 ALERTE SÉCURITÉ - VÉLO EN MOUVEMENT SUSPECT
                </div>
                <div className="text-sm opacity-90">
                  {getSeverityLabel()} - Intervention requise
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-6">
          {/* Bike Information */}
          <Card className="p-4 border-l-4" style={{ borderLeftColor: getSeverityColor() }}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="text-xl font-bold text-gray-900">
                  🚲 {suspiciousMovement.bikeCode}
                </div>
                <div className="text-sm text-gray-600">
                  Statut: <Badge variant={suspiciousMovement.status === 'AVAILABLE' ? 'default' : 'secondary'}>
                    {suspiciousMovement.status === 'AVAILABLE' ? 'Disponible' : 'Maintenance'}
                  </Badge>
                </div>
              </div>
              <Badge 
                variant="destructive" 
                className="text-xs"
                style={{ backgroundColor: getSeverityColor() }}
              >
                {getSeverityLabel()}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">
                  📍 Position actuelle
                </div>
                <div className="text-xs text-gray-600">
                  {suspiciousMovement.currentLocation.lat.toFixed(6)}, {suspiciousMovement.currentLocation.lng.toFixed(6)}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">
                  📍 Dernière position connue
                </div>
                <div className="text-xs text-gray-600">
                  {suspiciousMovement.lastKnownLocation.lat.toFixed(6)}, {suspiciousMovement.lastKnownLocation.lng.toFixed(6)}
                </div>
              </div>
            </div>
          </Card>

          {/* Movement Details */}
          <Card className="p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Clock size={16} />
              Détails du mouvement
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold" style={{ color: getSeverityColor() }}>
                  {suspiciousMovement.movement.distance}m
                </div>
                <div className="text-xs text-gray-600">Distance déplacée</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">
                  {formatTimeAgo(suspiciousMovement.movement.timeDetected)}
                </div>
                <div className="text-xs text-gray-600">Mouvement détecté</div>
              </div>
              <div className="text-center">
                <div className={`text-lg font-semibold ${suspiciousMovement.movement.isOutsideDepositZone ? 'text-red-600' : 'text-orange-600'}`}>
                  {suspiciousMovement.movement.isOutsideDepositZone ? '❌ HORS ZONE' : '⚠️ EN ZONE'}
                </div>
                <div className="text-xs text-gray-600">Zone de dépôt</div>
              </div>
            </div>
          </Card>

          {/* Last Ride Information */}
          {suspiciousMovement.lastRide && (
            <Card className="p-4 bg-orange-50 border-orange-200">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <User size={16} />
                Dernier utilisateur
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-gray-700">
                    👤 Utilisateur
                  </div>
                  <div className="text-sm text-gray-900 font-medium">
                    {suspiciousMovement.lastRide.userName}
                  </div>
                  <div className="text-xs text-gray-600">
                    ID: {suspiciousMovement.lastRide.userId}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700">
                    🕐 Fin du trajet
                  </div>
                  <div className="text-sm text-gray-900">
                    {suspiciousMovement.lastRide.endTime.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-600">
                    {formatTimeAgo(suspiciousMovement.lastRide.endTime)} 
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => onViewOnMap(suspiciousMovement.bikeId, suspiciousMovement.currentLocation)}
              variant="outline"
              className="flex-1"
            >
              <Eye size={16} className="mr-2" />
              Voir sur la carte
            </Button>
            
            <Button
              onClick={() => handleMarkAsResolved('Vélo vérifié - position normale')}
              disabled={isHandling}
              variant="outline"
              className="flex-1"
            >
              <CheckCircle size={16} className="mr-2" />
              {isHandling ? 'Traitement...' : 'Marquer comme résolu'}
            </Button>
            
            <Button
              onClick={() => handleMarkAsResolved('Vol confirmé - vélo volé', 'Vélo signalé volé, police contactée')}
              disabled={isHandling}
              variant="destructive"
              className="flex-1"
            >
              <XCircle size={16} className="mr-2" />
              Signaler vol
            </Button>
          </div>

          {/* Warning Message */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertTriangle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <div className="font-semibold text-red-800 mb-1">
                  ⚠️ ATTENTION - Action immédiate requise
                </div>
                <div className="text-red-700">
                  Ce vélo se déplace sans trajet actif démarré. 
                  {suspiciousMovement.movement.isOutsideDepositZone && (
                    <span className="font-semibold"> Il est également en dehors des zones de dépôt autorisées.</span>
                  )}
                  {' '}Vérifiez immédiatement la situation sur le terrain ou contactez les autorités si nécessaire.
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}