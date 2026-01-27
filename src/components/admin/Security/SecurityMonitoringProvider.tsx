import React, { createContext, useContext } from 'react';
import { SecurityAlertModal } from './SecurityAlertModal';
import { useSecurityMonitoring } from '../../../hooks/useSecurityMonitoring';
import { SuspiciousMovement } from '../../../services/api/monitoring.service';

interface SecurityMonitoringContextType {
  suspiciousMovements: SuspiciousMovement[];
  isMonitoring: boolean;
  showAlert: (movement: SuspiciousMovement) => void;
}

const SecurityMonitoringContext = createContext<SecurityMonitoringContextType | undefined>(undefined);

export function useSecurityMonitoringContext() {
  const context = useContext(SecurityMonitoringContext);
  if (!context) {
    throw new Error('useSecurityMonitoringContext must be used within SecurityMonitoringProvider');
  }
  return context;
}

interface SecurityMonitoringProviderProps {
  children: React.ReactNode;
  onViewBikeOnMap?: (bikeId: string, location: { lat: number; lng: number }) => void;
}

export function SecurityMonitoringProvider({ children, onViewBikeOnMap }: SecurityMonitoringProviderProps) {
  const {
    suspiciousMovements,
    activeAlert,
    isMonitoring,
    setActiveAlert,
    markAsHandled
  } = useSecurityMonitoring(true);

  const showAlert = (movement: SuspiciousMovement) => {
    setActiveAlert(movement);
  };

  const handleViewOnMap = (bikeId: string, location: { lat: number; lng: number }) => {
    if (onViewBikeOnMap) {
      onViewBikeOnMap(bikeId, location);
    } else {
      // Ouvrir dans une nouvelle fenêtre avec Google Maps
      const url = `https://www.google.com/maps?q=${location.lat},${location.lng}&z=16`;
      window.open(url, '_blank');
    }
    setActiveAlert(null);
  };

  return (
    <SecurityMonitoringContext.Provider value={{
      suspiciousMovements,
      isMonitoring,
      showAlert
    }}>
      {children}
      
      {/* Security Alert Modal */}
      <SecurityAlertModal
        isOpen={!!activeAlert}
        onClose={() => setActiveAlert(null)}
        suspiciousMovement={activeAlert}
        onViewOnMap={handleViewOnMap}
        onMarkAsHandled={markAsHandled}
      />
    </SecurityMonitoringContext.Provider>
  );
}