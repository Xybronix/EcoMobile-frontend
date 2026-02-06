import { useEffect, useRef, useState } from 'react';
import { useAuth } from './useAuth';
import { notificationService } from '../services/api/notification.service';
import { getAuthToken } from '../services/api/client';

/**
 * Hook pour utiliser Server-Sent Events (SSE) pour les notifications en temps réel
 * Remplace le polling et réduit drastiquement le nombre de requêtes
 */
export function useNotificationSSE() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttempts = useRef<number>(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000; // 3 secondes

  useEffect(() => {
    const token = getAuthToken();
    if (!token || !user) {
      return;
    }

    const connectSSE = () => {
      // Fermer la connexion existante si elle existe
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'https://env-freebike-xybronix.hidora.com/api/v1';
        // EventSource ne supporte pas les headers personnalisés, on passe le token en query param
        const sseUrl = `${apiUrl}/notifications/stream?token=${encodeURIComponent(token)}`;

        // Créer la connexion SSE
        const eventSource = new EventSource(sseUrl, {
          withCredentials: true,
        });

        // Ajouter le token dans les headers via une requête fetch personnalisée
        // Note: EventSource ne supporte pas les headers personnalisés nativement
        // On utilise une approche alternative avec fetch et un EventSource polyfill ou on passe le token en query param
        // Pour l'instant, on utilise l'authentification via cookie/session si disponible
        // Sinon, on peut utiliser un proxy ou modifier le backend pour accepter le token en query param

        eventSource.onopen = () => {
          console.log('[SSE] Connected to notification stream');
          setIsConnected(true);
          reconnectAttempts.current = 0;
        };

        eventSource.onmessage = (event) => {
          // Les messages de heartbeat sont ignorés (commencent par ':')
          if (event.data.startsWith(':')) {
            return;
          }

          try {
            const data = JSON.parse(event.data);
            if (data.type === 'unread_count') {
              setUnreadCount(data.count);
            }
          } catch (error) {
            console.error('[SSE] Error parsing message:', error);
          }
        };

        eventSource.addEventListener('notification', (event: MessageEvent) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'notification') {
              // Mettre à jour le nombre de notifications non lues
              setUnreadCount((prev) => prev + 1);
            }
          } catch (error) {
            console.error('[SSE] Error parsing notification event:', error);
          }
        });

        eventSource.addEventListener('unread_count', (event: MessageEvent) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'unread_count') {
              setUnreadCount(data.count);
            }
          } catch (error) {
            console.error('[SSE] Error parsing unread_count event:', error);
          }
        });

        eventSource.onerror = (error) => {
          console.error('[SSE] Connection error:', error);
          setIsConnected(false);
          eventSource.close();

          // Tentative de reconnexion
          if (reconnectAttempts.current < maxReconnectAttempts) {
            reconnectAttempts.current += 1;
            reconnectTimeoutRef.current = setTimeout(() => {
              connectSSE();
            }, reconnectDelay * reconnectAttempts.current);
          } else {
            console.error('[SSE] Max reconnection attempts reached. Falling back to polling.');
            // Fallback vers polling si SSE échoue
            cleanupPolling = fallbackToPolling();
          }
        };

        eventSourceRef.current = eventSource;
      } catch (error) {
        console.error('[SSE] Error creating EventSource:', error);
        setIsConnected(false);
        fallbackToPolling();
      }
    };

    const fallbackToPolling = () => {
      // Fallback vers polling toutes les 60 secondes (au lieu de 30)
      // Cette fonction retourne une fonction de nettoyage
      let pollInterval: ReturnType<typeof setInterval> | null = null;
      
      pollInterval = setInterval(async () => {
        try {
          const count = await notificationService.getUnreadCount();
          setUnreadCount(count);
        } catch (error) {
          console.error('[SSE Fallback] Error fetching unread count:', error);
        }
      }, 60000); // 60 secondes au lieu de 30

      return () => {
        if (pollInterval) {
          clearInterval(pollInterval);
        }
      };
    };
    
    let cleanupPolling: (() => void) | null = null;

    // Charger le nombre initial
    notificationService.getUnreadCount()
      .then(setUnreadCount)
      .catch(console.error);

    // Connecter au stream SSE
    connectSSE();

    // Nettoyage
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (cleanupPolling) {
        cleanupPolling();
      }
    };
  }, [token]);

  return { unreadCount, isConnected };
}
