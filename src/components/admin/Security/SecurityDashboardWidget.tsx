import React from 'react';
import { AlertTriangle, Shield } from 'lucide-react';
import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { useSecurityMonitoring } from '../../../hooks/useSecurityMonitoring';

export function SecurityDashboardWidget() {
  const { suspiciousMovements, isMonitoring } = useSecurityMonitoring();
  
  const criticalAlerts = suspiciousMovements.filter(m => m.movement.isOutsideDepositZone).length;
  const warningAlerts = suspiciousMovements.filter(m => !m.movement.isOutsideDepositZone).length;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Shield size={20} className="text-green-600" />
          Surveillance Sécurité
        </h3>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isMonitoring ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
          <span className="text-xs text-gray-600">
            {isMonitoring ? 'Actif' : 'Inactif'}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Alert Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className={`text-2xl font-bold ${criticalAlerts > 0 ? 'text-red-600' : 'text-gray-400'}`}>
              {criticalAlerts}
            </div>
            <div className="text-xs text-gray-600">Critiques</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${warningAlerts > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
              {warningAlerts}
            </div>
            <div className="text-xs text-gray-600">Attention</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {suspiciousMovements.length === 0 ? '✓' : suspiciousMovements.length}
            </div>
            <div className="text-xs text-gray-600">
              {suspiciousMovements.length === 0 ? 'Sécurisé' : 'Total'}
            </div>
          </div>
        </div>

        {/* Recent Alerts */}
        {suspiciousMovements.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Alertes récentes</h4>
            {suspiciousMovements.slice(0, 3).map((movement) => (
              <div key={movement.bikeId} className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={16} className="text-red-600" />
                  <div>
                    <p className="text-sm font-medium text-red-800">
                      {movement.bikeCode}
                    </p>
                    <p className="text-xs text-red-600">
                      {movement.movement.distance}m déplacé
                    </p>
                  </div>
                </div>
                <Badge variant="destructive" className="text-xs">
                  {movement.movement.isOutsideDepositZone ? 'HORS ZONE' : 'SUSPECT'}
                </Badge>
              </div>
            ))}
            
            {suspiciousMovements.length > 3 && (
              <p className="text-xs text-gray-500 text-center">
                +{suspiciousMovements.length - 3} autres alertes...
              </p>
            )}
          </div>
        )}

        {/* Status Message */}
        <div className="text-center">
          {suspiciousMovements.length === 0 ? (
            <p className="text-sm text-green-700 bg-green-50 p-2 rounded">
              ✅ Tous les vélos sont en sécurité
            </p>
          ) : (
            <p className="text-sm text-red-700 bg-red-50 p-2 rounded">
              ⚠️ {suspiciousMovements.length} vélo{suspiciousMovements.length > 1 ? 's' : ''} nécessite{suspiciousMovements.length === 1 ? '' : 'nt'} une attention
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}