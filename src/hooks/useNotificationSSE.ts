import { useEffect, useRef, useState } from 'react';
import { useAuth } from './useAuth';
import { notificationService } from '../services/api/notification.service';
import { getAuthToken } from '../services/api/client';

/** Une seule connexion SSE par URL : évite les doublons si plusieurs composants utilisent le hook */
let sharedConnection: { url: string; es: EventSource; refCount: number } | null = null;

/**
 * Hook pour utiliser Server-Sent Events (SSE) pour les notifications en temps réel.
 * Une seule connexion SSE, mise à jour du compteur uniquement quand le serveur envoie un événement.
 */
export function useNotificationSSE() {
  const { user } = useAuth();
  const token = getAuthToken();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const reconnectAttempts = useRef<number>(0);
  const maxReconnectAttempts = 2;
  const reconnectDelayMs = 5000;
  const pollIntervalMs = 60000;
  const cleanupPollingRef = useRef<(() => void) | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!token || !user) {
      return;
    }

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:10000/api/v1';
    const sseUrl = `${apiUrl}/notifications/stream?token=${encodeURIComponent(token)}`;

    const fallbackToPolling = () => {
      cleanupPollingRef.current?.();
      let pollInterval: ReturnType<typeof setInterval> | null = null;
      pollInterval = setInterval(() => {
        notificationService.getUnreadCount().then(setUnreadCount).catch(() => {});
      }, pollIntervalMs);
      cleanupPollingRef.current = () => {
        if (pollInterval) clearInterval(pollInterval);
        cleanupPollingRef.current = null;
      };
    };

    const connectSSE = () => {
      if (sharedConnection?.url === sseUrl && sharedConnection.es.readyState === EventSource.OPEN) {
        sharedConnection.refCount += 1;
        setIsConnected(true);
        return;
      }
      if (sharedConnection?.url === sseUrl) {
        sharedConnection.es.close();
        sharedConnection = null;
      }

      try {
        const eventSource = new EventSource(sseUrl, { withCredentials: true });

        eventSource.onopen = () => {
          sharedConnection = { url: sseUrl, es: eventSource, refCount: 1 };
          setIsConnected(true);
          reconnectAttempts.current = 0;
        };

        eventSource.onmessage = (event: MessageEvent) => {
          if (event.data?.startsWith(':')) return;
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'unread_count' && typeof data.count === 'number') setUnreadCount(data.count);
          } catch {}
        };

        eventSource.addEventListener('notification', (event: MessageEvent) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'notification') setUnreadCount((prev) => prev + 1);
          } catch {}
        });

        eventSource.addEventListener('unread_count', (event: MessageEvent) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'unread_count' && typeof data.count === 'number') setUnreadCount(data.count);
          } catch {}
        });

        eventSource.onerror = () => {
          setIsConnected(false);
          eventSource.close();
          if (sharedConnection?.url === sseUrl) sharedConnection = null;

          if (reconnectAttempts.current < maxReconnectAttempts) {
            reconnectAttempts.current += 1;
            reconnectTimeoutRef.current = setTimeout(connectSSE, reconnectDelayMs);
          } else {
            fallbackToPolling();
          }
        };

        sharedConnection = { url: sseUrl, es: eventSource, refCount: 1 };
      } catch {
        setIsConnected(false);
        fallbackToPolling();
      }
    };

    // Un seul appel initial (cache 30s côté notificationService)
    notificationService.getUnreadCount().then(setUnreadCount).catch(() => {});
    connectSSE();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      cleanupPollingRef.current?.();
      cleanupPollingRef.current = null;
      if (sharedConnection?.url === sseUrl) {
        sharedConnection.refCount -= 1;
        if (sharedConnection.refCount <= 0) {
          sharedConnection.es.close();
          sharedConnection = null;
        }
      }
    };
  }, [token, user]);

  return { unreadCount, isConnected };
}
