import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Search, MoreVertical, Paperclip, Smile, AlertCircle, Lock, RefreshCw } from 'lucide-react';
import { Card } from '../../ui/card';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { useAuth } from '../../../hooks/useAuth';
import { usePermissions } from '../../../hooks/usePermissions';
import { ProtectedAccess } from '../../shared/ProtectedAccess';
import { ScrollArea } from '../../ui/scroll-area';
import { chatService, ChatMessage, Conversation } from '../../../services/api/chat.service';
import { toast } from 'sonner';

interface ChatUser {
  id: string;
  name: string;
  role: string;
  isOnline: boolean;
  lastSeen?: string;
  unreadCount: number;
}

export function AdminChat() {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Vérifier les permissions
  const canReadChat = hasPermission('chat', 'read');
  const canSendMessages = hasPermission('chat', 'create');
  const canManageChat = hasPermission('chat', 'manage');

  useEffect(() => {
    if (canReadChat) {
      loadConversations();
    } else {
      setLoading(false);
      toast.error('Vous n\'avez pas les permissions pour accéder au chat');
    }
  }, [canReadChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const loadConversations = async () => {
    if (!canReadChat) {
      toast.error('Vous n\'avez pas les permissions pour voir les conversations');
      return;
    }

    try {
      setLoading(true);
      const result = await chatService.getAllConversations();
      setConversations(result.conversations || []);
      
      // Auto-select first conversation if available
      if (result.conversations.length > 0 && !selectedUser) {
        const firstConv = result.conversations[0];
        const chatUser: ChatUser = {
          id: firstConv.userId,
          name: firstConv.userName,
          role: 'USER', // Default role since not provided by backend
          isOnline: false, // Backend should provide this
          unreadCount: 0 // Will be updated by backend
        };
        setSelectedUser(chatUser);
        loadMessages(firstConv.userId);
      }
    } catch (error: any) {
      console.error('Erreur lors du chargement des conversations:', error);
      toast.error(error.message || 'Erreur lors du chargement des conversations');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (userId: string) => {
    if (!canReadChat) {
      toast.error('Vous n\'avez pas les permissions pour voir les messages');
      return;
    }

    try {
      setLoadingMessages(true);
      const result = await chatService.getUserMessages(userId);
      setMessages(result.messages || []);
    } catch (error: any) {
      console.error('Erreur lors du chargement des messages:', error);
      toast.error(error.message || 'Erreur lors du chargement des messages');
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSelectUser = (conversation: Conversation) => {
    if (!canReadChat) {
      toast.error('Vous n\'avez pas les permissions pour voir cette conversation');
      return;
    }

    const chatUser: ChatUser = {
      id: conversation.userId,
      name: conversation.userName,
      role: 'USER',
      isOnline: false,
      unreadCount: 0
    };
    setSelectedUser(chatUser);
    loadMessages(conversation.userId);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUser || sendingMessage) return;

    if (!canSendMessages) {
      toast.error('Vous n\'avez pas les permissions pour envoyer des messages');
      return;
    }

    try {
      setSendingMessage(true);
      const message = await chatService.sendMessageAsAdmin(selectedUser.id, newMessage);
      
      // Add message to current conversation
      setMessages(prev => [...prev, message]);
      setNewMessage('');
      
      // Update conversation list to reflect new message
      loadConversations();
      
      // Scroll to bottom
      setTimeout(scrollToBottom, 100);
      
      toast.success('Message envoyé avec succès');
    } catch (error: any) {
      console.error('Erreur lors de l\'envoi du message:', error);
      toast.error(error.message || 'Erreur lors de l\'envoi du message');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && canSendMessages) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSearch = (value: string) => {
    if (!canReadChat) {
      toast.error('Vous n\'avez pas les permissions pour rechercher dans les conversations');
      return;
    }
    setSearchTerm(value);
  };

  const getRelativeTime = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now.getTime() - time.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    return `Il y a ${days}j`;
  };

  const filteredConversations = conversations.filter(conv =>
    conv.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Si l'utilisateur n'a pas les permissions de base, afficher un accès refusé
  if (!canReadChat) {
    return (
      <div className="flex flex-col h-screen">
        <div className="p-6 border-b border-gray-200 bg-white">
          <h1 className="text-2xl font-bold text-green-600">Chat Interne</h1>
          <p className="text-gray-600">Communication entre membres de l'équipe</p>
        </div>
        
        <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
          <Card className="p-12 max-w-md w-full mx-4">
            <div className="text-center text-red-500">
              <AlertCircle className="w-16 h-16 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Accès refusé</h3>
              <p className="text-gray-600 mb-4">
                Vous n'avez pas les permissions nécessaires pour accéder au chat interne.
              </p>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500">
                  Permission requise: <span className="font-mono">chat:read</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Contactez votre administrateur pour obtenir l'accès
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-green-600">Chat Interne</h1>
            <p className="text-gray-600">Communication entre membres de l'équipe</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-md">
              {canManageChat ? 'Gestion complète' : 
               canSendMessages ? 'Lecture/Écriture' : 
               'Lecture seule'}
            </Badge>
            {!canSendMessages && (
              <div className="flex items-center gap-1 text-orange-600">
                <Lock className="w-4 h-4" />
                <span className="text-xs">Messages restreints</span>
              </div>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadConversations}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-0 overflow-hidden">
        {/* Users List */}
        <div className="w-80 border-r border-gray-200 bg-white flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Rechercher un utilisateur..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
                disabled={!canReadChat}
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="divide-y divide-gray-100">
              {filteredConversations.length > 0 ? (
                filteredConversations.map((conversation) => (
                  <button
                    key={conversation.userId}
                    onClick={() => handleSelectUser(conversation)}
                    className={`w-full p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors text-left ${
                      selectedUser?.id === conversation.userId ? 'bg-green-50 border-l-4 border-l-green-600' : ''
                    }`}
                    disabled={!canReadChat}
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium">{conversation.userName.charAt(0)}</span>
                      </div>
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-gray-400 border-2 border-white rounded-full" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium truncate">{conversation.userName}</p>
                        <span className="text-xs text-gray-400">
                          {conversation.messageCount} msg
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{conversation.email}</p>
                      {conversation.lastMessage && (
                        <div className="mt-1">
                          <p className="text-xs text-gray-400 truncate">
                            {conversation.lastMessage.isAdmin ? 'Vous: ' : ''}{conversation.lastMessage.message}
                          </p>
                          <p className="text-xs text-gray-300">
                            {getRelativeTime(conversation.lastMessage.createdAt)}
                          </p>
                        </div>
                      )}
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Aucune conversation trouvée</p>
                  {searchTerm && (
                    <p className="text-xs text-gray-400 mt-1">
                      Essayez un autre terme de recherche
                    </p>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-white">
          {selectedUser ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium">{selectedUser.name.charAt(0)}</span>
                    </div>
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-gray-400 border-2 border-white rounded-full" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{selectedUser.name}</p>
                    <p className="text-xs text-gray-500">Utilisateur</p>
                  </div>
                </div>
                
                <ProtectedAccess mode="component" resource="chat" action="manage" fallback={null}>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </ProtectedAccess>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 bg-gradient-to-b from-gray-50 to-gray-100">
                <div className="p-6 space-y-4">
                  {loadingMessages ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        <p className="text-sm text-gray-500">Chargement des messages...</p>
                      </div>
                    </div>
                  ) : messages.length > 0 ? (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${
                          message.isAdmin ? 'flex-row-reverse' : ''
                        }`}
                      >
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-md">
                            <span className="text-white text-xs font-medium">
                              {message.isAdmin ? 'A' : message.user?.firstName?.charAt(0) || 'U'}
                            </span>
                          </div>
                        </div>
                        <div className={`flex-1 max-w-md ${message.isAdmin ? 'flex flex-col items-end' : ''}`}>
                          <div className={`flex items-center gap-2 mb-1 ${message.isAdmin ? 'flex-row-reverse' : ''}`}>
                            <span className="text-xs font-medium text-gray-600">
                              {message.isAdmin ? 'Vous' : `${message.user?.firstName || 'Utilisateur'} ${message.user?.lastName || ''}`}
                            </span>
                            <span className="text-xs text-gray-400">
                              {getRelativeTime(message.createdAt)}
                            </span>
                          </div>
                          <div
                            className={`inline-block px-4 py-3 rounded-2xl ${
                              message.isAdmin
                                ? 'bg-green-600 text-white rounded-br-sm shadow-md'
                                : 'bg-white text-gray-900 rounded-bl-sm shadow-md border border-gray-100'
                            }`}
                          >
                            <p className="text-sm break-words">{message.message}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center text-gray-500">
                        <User className="w-16 h-16 mx-auto mb-4 opacity-30" />
                        <p>Aucun message dans cette conversation</p>
                        <p className="text-sm text-gray-400 mt-1">
                          {canSendMessages ? 'Envoyez le premier message !' : 'Cette conversation est vide'}
                        </p>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Message Input */}
              <ProtectedAccess 
                mode="component" 
                resource="chat" 
                action="create"
                fallback={
                  <div className="p-4 border-t border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-center gap-2 text-gray-500">
                      <Lock className="w-4 h-4" />
                      <p className="text-sm">Vous n'avez pas les permissions pour envoyer des messages</p>
                    </div>
                  </div>
                }
              >
                <div className="p-4 border-t border-gray-200 bg-white shadow-lg">
                  <div className="flex items-center gap-2">
                    <ProtectedAccess mode="component" resource="chat" action="manage" fallback={null}>
                      <Button variant="ghost" size="icon" className="hover:bg-green-50">
                        <Paperclip className="w-5 h-5 text-gray-600" />
                      </Button>
                      <Button variant="ghost" size="icon" className="hover:bg-green-50">
                        <Smile className="w-5 h-5 text-gray-600" />
                      </Button>
                    </ProtectedAccess>
                    
                    <Input
                      placeholder={canSendMessages ? "Écrire un message..." : "Lecture seule - Envoi non autorisé"}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="flex-1"
                      disabled={sendingMessage || !canSendMessages}
                    />
                    
                    <Button 
                      onClick={handleSendMessage} 
                      disabled={!newMessage.trim() || sendingMessage || !canSendMessages}
                      className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
                      title={!canSendMessages ? "Vous n'avez pas les permissions pour envoyer des messages" : "Envoyer le message"}
                    >
                      {sendingMessage ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  
                  {!canSendMessages && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-orange-600">
                      <AlertCircle className="w-3 h-3" />
                      <span>Mode lecture seule - Permission 'chat:create' requise pour envoyer des messages</span>
                    </div>
                  )}
                </div>
              </ProtectedAccess>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
              <div className="text-center">
                <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-12 h-12 text-green-600 opacity-50" />
                </div>
                <p className="text-lg font-medium text-gray-600">Sélectionnez une conversation</p>
                <p className="text-sm text-gray-400 mt-2">
                  Choisissez un contact pour commencer à {canSendMessages ? 'discuter' : 'voir la conversation'}
                </p>
                
                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
                  <div className={`w-2 h-2 rounded-full ${canSendMessages ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                  {canSendMessages ? 'Mode interactif' : 'Mode lecture seule'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}