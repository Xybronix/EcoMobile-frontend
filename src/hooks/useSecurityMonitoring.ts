// hooks/useSecurityMonitoring.ts
import React, { useState, useEffect, useRef } from 'react';
import { monitoringService, SuspiciousMovement } from '../services/api/monitoring.service';
import { toast } from 'sonner';

export function useSecurityMonitoring(enableRealTime: boolean = true) {
  const [suspiciousMovements, setSuspiciousMovements] = useState<SuspiciousMovement[]>([]);
  const [activeAlert, setActiveAlert] = useState<SuspiciousMovement | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout>();
  const alertSoundRef = useRef<HTMLAudioElement>();

  useEffect(() => {
    // Créer le son d'alerte
    alertSoundRef.current = new Audio('/sounds/alert.mp3');
    alertSoundRef.current.volume = 0.7;

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (enableRealTime) {
      startMonitoring();
    } else {
      stopMonitoring();
    }

    return () => stopMonitoring();
  }, [enableRealTime]);

  const startMonitoring = () => {
    if (isMonitoring) return;

    setIsMonitoring(true);
    
    // Vérification initiale
    checkSuspiciousMovements();
    
    // Puis toutes les 30 secondes
    intervalRef.current = setInterval(() => {
      checkSuspiciousMovements();
    }, 30000);

    console.log('🔍 Security monitoring started');
  };

  const stopMonitoring = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
    setIsMonitoring(false);
    console.log('🔍 Security monitoring stopped');
  };

  const checkSuspiciousMovements = async () => {
    try {
      const movements = await monitoringService.getSuspiciousMovements();
      
      // Vérifier s'il y a de nouveaux mouvements suspects
      const newMovements = movements.filter(movement => 
        !suspiciousMovements.find(existing => 
          existing.bikeId === movement.bikeId && 
          existing.movement.timeDetected === movement.movement.timeDetected
        )
      );

      if (newMovements.length > 0) {
        setSuspiciousMovements(prev => [...newMovements, ...prev]);
        
        // Afficher l'alerte pour le mouvement le plus critique
        const criticalMovement = newMovements.find(m => m.movement.isOutsideDepositZone) || newMovements[0];
        setActiveAlert(criticalMovement);
        
        // Jouer le son d'alerte
        try {
          alertSoundRef.current?.play();
        } catch (error) {
          console.log('Could not play alert sound');
        }

        // Toast d'alerte
        toast.error(
          `🚨 ALERTE SÉCURITÉ: Vélo ${criticalMovement.bikeCode} en mouvement suspect!`,
          {
            duration: 10000,
            action: {
              label: 'Voir',
              onClick: () => setActiveAlert(criticalMovement)
            }
          }
        );
      }
    } catch (error) {
      console.error('Error checking suspicious movements:', error);
    }
  };

  const markAsHandled = async (bikeId: string, action: string, note?: string) => {
    try {
      await monitoringService.markAlertAsHandled(bikeId, action, note);
      
      // Retirer de la liste des mouvements suspects
      setSuspiciousMovements(prev => 
        prev.filter(movement => movement.bikeId !== bikeId)
      );
      
      // Fermer l'alerte active si c'est ce vélo
      if (activeAlert?.bikeId === bikeId) {
        setActiveAlert(null);
      }
      
    } catch (error: any) {
      throw new Error(error.message || 'Erreur lors du traitement de l\'alerte');
    }
  };

  return {
    suspiciousMovements,
    activeAlert,
    isMonitoring,
    setActiveAlert,
    markAsHandled,
    startMonitoring,
    stopMonitoring
  };
}