import { apiClient } from './client';

export interface ChatMessage {
  id: string;
  userId: string;
  message: string;
  isAdmin: boolean;
  createdAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role?: string;
  };
}

export interface ChatUser {
  id: string;
  name: string;
  role: string;
  isOnline: boolean;
  lastSeen?: string;
  unreadCount: number;
}

export interface Conversation {
  userId: string;
  userName: string;
  email: string;
  lastMessage?: ChatMessage;
  messageCount: number;
}

export interface ConversationsResponse {
  conversations: Conversation[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface MessagesResponse {
  messages: ChatMessage[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class ChatService {
  async getAllConversations(page: number = 1, limit: number = 20): Promise<ConversationsResponse> {
    const response = await apiClient.get<ConversationsResponse>('/chat/conversations', { 
      page: page.toString(), 
      limit: limit.toString() 
    });
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Erreur lors de la récupération des conversations');
    }

    return response.data;
  }

  async getUserMessages(userId: string, page: number = 1, limit: number = 50): Promise<MessagesResponse> {
    const response = await apiClient.get<MessagesResponse>(`/chat/users/${userId}/messages`, { 
      page: page.toString(), 
      limit: limit.toString() 
    });
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Erreur lors de la récupération des messages');
    }

    return response.data;
  }

  async sendMessageAsAdmin(userId: string, message: string): Promise<ChatMessage> {
    const response = await apiClient.post<ChatMessage>(`/chat/users/${userId}/messages`, { message });
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Erreur lors de l\'envoi du message');
    }

    return response.data;
  }

  async sendMessage(message: string): Promise<ChatMessage> {
    const response = await apiClient.post<ChatMessage>('/chat/messages', { message });
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Erreur lors de l\'envoi du message');
    }

    return response.data;
  }

  async getMyMessages(page: number = 1, limit: number = 50): Promise<MessagesResponse> {
    const response = await apiClient.get<MessagesResponse>('/chat/messages', { 
      page: page.toString(), 
      limit: limit.toString() 
    });
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Erreur lors de la récupération des messages');
    }

    return response.data;
  }

  async deleteMessage(messageId: string): Promise<void> {
    const response = await apiClient.delete(`/chat/messages/${messageId}`);
    
    if (!response.success) {
      throw new Error(response.error || 'Erreur lors de la suppression du message');
    }
  }
}

export const chatService = new ChatService();