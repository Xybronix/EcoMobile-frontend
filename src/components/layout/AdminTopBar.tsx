import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { Home, Globe, User, LogOut, Settings, Menu, ChevronDown, Bell } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../lib/i18n';
import { notificationService } from '../../services/api/notification.service';
import { usePermissions } from '../../hooks/usePermissions';
import { ProtectedAccess } from '../shared/ProtectedAccess';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

interface AdminTopBarProps {
  onToggleSidebar: () => void;
  onToggleMobileMenu: () => void;
}

export function AdminTopBar({ onToggleSidebar, onToggleMobileMenu }: AdminTopBarProps) {
  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useTranslation();
  const { hasPermission } = usePermissions();
  const navigate = useNavigate();
  
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(0);
  const [loadingNotifications, setLoadingNotifications] = useState<boolean>(false);

  const canReadNotifications = hasPermission('notifications', 'read');

  useEffect(() => {
    const loadUnreadCount = async () => {
      if (!canReadNotifications) {
        return;
      }

      try {
        setLoadingNotifications(true);
        const count = await notificationService.getUnreadCount();
        setUnreadNotificationsCount(count);
      } catch (error) {
        setUnreadNotificationsCount(0);
      } finally {
        setLoadingNotifications(false);
      }
    };

    loadUnreadCount();
  }, [canReadNotifications]);

  useEffect(() => {
    if (!canReadNotifications) return;

    const interval = setInterval(async () => {
      try {
        const count = await notificationService.getUnreadCount();
        setUnreadNotificationsCount(count);
      } catch (error) {
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [canReadNotifications]);

  const handleBackToLanding = () => {
    navigate('/');
  };

  const handleNavigateToProfile = () => {
    navigate('/admin/profile');
  };

  const handleNavigateToNotifications = () => {
    navigate('/admin/notifications');
  };

  const handleNavigateToSettings = () => {
    navigate('/admin/settings');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 left-0 right-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-40 h-16">
      <div className="flex items-center justify-between px-4 h-full">
        <div className="flex items-center gap-3">
          {/* Bouton menu mobile - visible uniquement sur mobile */}
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden flex p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Ouvrir le menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Bouton toggle sidebar - visible uniquement sur desktop */}
          <button
            onClick={onToggleSidebar}
            className="hidden md:flex p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Réduire la sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToLanding}
            className="hover:bg-gray-100 dark:hover:bg-gray-700 hidden sm:flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span className="hidden md:inline">{t('nav.backToSite')}</span>
          </Button>

          {/* Bouton notifications - seulement si l'utilisateur a les permissions */}
          {canReadNotifications && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNavigateToNotifications}
              className="hover:bg-gray-100 dark:hover:bg-gray-700 relative"
              disabled={loadingNotifications}
            >
              <Bell className={`w-5 h-5 ${loadingNotifications ? 'animate-pulse' : ''}`} />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-1 right-1 min-w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center px-1">
                  {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
                </span>
              )}
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="hover:bg-gray-100 dark:hover:bg-gray-700 gap-1">
                <Globe className="w-4 h-4" />
                <span className="hidden sm:inline">{language === 'fr' ? 'FR' : 'EN'}</span>
                <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuLabel>{t('common.language')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setLanguage('fr')}
                className={language === 'fr' ? 'bg-green-50 dark:bg-green-900' : ''}
              >
                🇫🇷 Français
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setLanguage('en')}
                className={language === 'en' ? 'bg-green-50 dark:bg-green-900' : ''}
              >
                🇬🇧 English
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="hover:bg-gray-100 dark:hover:bg-gray-700 gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.name?.charAt(0) || 'A'}
                  </span>
                </div>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-medium">{user?.name || 'Admin User'}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{user?.role || 'Administrateur'}</span>
                </div>
                <ChevronDown className="w-3 h-3 hidden sm:inline" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user?.name || 'Admin User'}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email || 'admin@freebike.com'}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleNavigateToProfile} className="cursor-pointer">
                <User className="w-4 h-4 mr-2" />
                {t('common.myProfile')}
              </DropdownMenuItem>
              <ProtectedAccess 
                mode="component" 
                resource="settings" 
                action="read"
                showFallback={false}
              >
                <DropdownMenuItem onClick={handleNavigateToSettings} className="cursor-pointer">
                  <Settings className="w-4 h-4 mr-2" />
                  {t('common.settings')}
                </DropdownMenuItem>
              </ProtectedAccess>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 dark:text-red-400">
                <LogOut className="w-4 h-4 mr-2" />
                {t('auth.logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}