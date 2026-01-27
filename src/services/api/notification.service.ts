import { apiClient } from './client';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error' | 'promotion' | 'ride_started' | 'ride_ended' | 'wallet_deposit' | 'wallet_withdrawal';
  isRead: boolean;
  createdAt: string;
  category?: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  today: number;
  thisWeek: number;
}

export interface CreateNotificationRequest {
  userIds: string[];
  title: string;
  message: string;
  type: string;
  category?: string;
  sendEmail?: boolean;
}

export interface PromotionResponse {
  notifications: number;
  emailsSent: number;
  emailsFailed: number;
}

export interface BulkEmailResponse {
  emailsSent: number;
  emailsFailed: number;
  total: number;
}

export class NotificationService {
  async getNotifications(filter?: 'all' | 'unread'): Promise<Notification[]> {
    try {
      const params = filter && filter !== 'all' ? { filter } : undefined;
      const response = await apiClient.get<{ notifications: Notification[] }>('/notifications', params);
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Erreur lors de la récupération des notifications');
      }

      // Trier par date de création (plus récent en premier)
      const notifications = response.data.notifications || response.data as any;
      return Array.isArray(notifications) 
        ? notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        : [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  async getUnreadCount(): Promise<number> {
    try {
      const response = await apiClient.get<{ unreadCount: number }>('/notifications/unread-count');
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Erreur lors de la récupération du nombre de notifications non lues');
      }

      return response.data.unreadCount || 0;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      throw error;
    }
  }

  async markAsRead(notificationId: string): Promise<void> {
    try {
      const response = await apiClient.put(`/notifications/${notificationId}/read`);
      
      if (!response.success) {
        throw new Error(response.error || 'Erreur lors du marquage comme lu');
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  async markAllAsRead(): Promise<void> {
    try {
      const response = await apiClient.put('/notifications/read-all');
      
      if (!response.success) {
        throw new Error(response.error || 'Erreur lors du marquage de toutes les notifications comme lues');
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  async deleteNotification(notificationId: string): Promise<void> {
    try {
      const response = await apiClient.delete(`/notifications/${notificationId}`);
      
      if (!response.success) {
        throw new Error(response.error || 'Erreur lors de la suppression de la notification');
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  async bulkDeleteNotifications(notificationIds: string[]): Promise<void> {
    try {
      const response = await apiClient.post('/notifications/bulk-delete', { 
        notificationIds 
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Erreur lors de la suppression en lot');
      }
    } catch (error) {
      console.error('Error bulk deleting notifications:', error);
      throw error;
    }
  }

  async getStats(): Promise<NotificationStats> {
    try {
      const notifications = await this.getNotifications();
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      return {
        total: notifications.length,
        unread: notifications.filter(n => !n.isRead).length,
        today: notifications.filter(n => {
          const notifDate = new Date(n.createdAt);
          return notifDate >= today;
        }).length,
        thisWeek: notifications.filter(n => {
          const notifDate = new Date(n.createdAt);
          return notifDate >= weekAgo;
        }).length,
      };
    } catch (error) {
      console.error('Error calculating stats:', error);
      return { total: 0, unread: 0, today: 0, thisWeek: 0 };
    }
  }

  async sendPromotion(data: {
    userIds: string[];
    subject: string;
    title: string;
    message: string;
    ctaUrl?: string;
    sendEmail?: boolean;
  }): Promise<PromotionResponse> {
    try {
      const response = await apiClient.post<PromotionResponse>('/notifications/send-promotion', data);
      
      if (!response.success) {
        throw new Error(response.error || 'Erreur lors de l\'envoi de la promotion');
      }

      return (response.data || { notifications: 0, emailsSent: 0, emailsFailed: 0 }) as PromotionResponse;
    } catch (error) {
      console.error('Error sending promotion:', error);
      throw error;
    }
  }

  async sendBulkEmail(data: {
    emails: string[];
    subject: string;
    title: string;
    message: string;
    ctaUrl?: string;
    ctaText?: string;
  }): Promise<BulkEmailResponse> {
    try {
      const response = await apiClient.post<BulkEmailResponse>('/notifications/send-bulk-email', data);
      
      if (!response.success) {
        throw new Error(response.error || 'Erreur lors de l\'envoi en lot');
      }

      return (response.data || { emailsSent: 0, emailsFailed: 0, total: 0 }) as BulkEmailResponse;
    } catch (error) {
      console.error('Error sending bulk email:', error);
      throw error;
    }
  }
}

export const notificationService = new NotificationService();