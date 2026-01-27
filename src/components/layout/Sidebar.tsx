import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Bike, Settings, ChevronDown, ChevronRight, Gauge, CreditCard, MessageSquare, X } from 'lucide-react';
import { useTranslation } from '../../lib/i18n';
import { useCompanyInfo } from '../../hooks/useCompanyInfo';
import { ProtectedAccess } from '../shared/ProtectedAccess';
import { cn } from '../ui/utils';

interface SidebarProps {
  isCollapsed: boolean;
  isMobileMenuOpen: boolean;
  onCloseMobileMenu: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: any;
  path?: string;
  subItems?: { 
    id: string; 
    label: string; 
    path: string; 
    resource?: string; 
    action?: string; 
    role?: string | string[] 
  }[];
  resource?: string;
  action?: string;
  role?: string | string[];
}

export function Sidebar({ isCollapsed, isMobileMenuOpen, onCloseMobileMenu }: SidebarProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { companyName, isLoading } = useCompanyInfo();
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['management', 'finance', 'system']);

  const displayName = isLoading ? 'EcoMobile' : (companyName || 'EcoMobile');

  const menuGroups: MenuItem[] = [
    {
      id: 'dashboard',
      label: t('nav.dashboard'),
      icon: LayoutDashboard,
      path: '/admin/dashboard',
      resource: 'admin',
      action: 'read'
    },
    {
      id: 'management',
      label: 'Gestion',
      icon: Gauge,
      subItems: [
        { 
          id: 'bikes', 
          label: t('nav.bikes'), 
          path: '/admin/bikes',
          resource: 'bikes',
          action: 'read'
        },
        { 
          id: 'bikesAction', 
          label: t('nav.bikeActions'), 
          path: '/admin/bikes/actions',
          resource: 'bikes',
          action: 'read'
        },
        { 
          id: 'users', 
          label: t('nav.users'), 
          path: '/admin/users',
          resource: 'users',
          action: 'read'
        },
        { 
          id: 'incidents', 
          label: t('nav.incidents'), 
          path: '/admin/incidents',
          resource: 'incidents',
          action: 'read'
        },
        { 
          id: 'reviews', 
          label: 'Avis clients', 
          path: '/admin/reviews',
          resource: 'reviews',
          action: 'read'
        },
      ]
    },
    {
      id: 'finance',
      label: 'Finance',
      icon: CreditCard,
      subItems: [
        { 
          id: 'financial', 
          label: t('nav.financial'), 
          path: '/admin/financial',
          resource: 'wallet',
          action: 'read'
        },
        { 
          id: 'wallet-transactions', 
          label: 'Transactions Wallet', 
          path: '/admin/wallet',
          resource: 'wallet',
          action: 'manage'
        },
        { 
          id: 'pricing', 
          label: t('nav.pricing'), 
          path: '/admin/pricing',
          resource: 'pricing',
          action: 'read'
        },
      ]
    },
    {
      id: 'system',
      label: 'Système',
      icon: Settings,
      subItems: [
        { 
          id: 'employees', 
          label: t('nav.employees'), 
          path: '/admin/employees', 
          role: 'SUPER_ADMIN' 
        },
        { 
          id: 'roles', 
          label: t('nav.roles'), 
          path: '/admin/roles',
          resource: 'roles',
          action: 'read'
        },
        { 
          id: 'logs', 
          label: t('nav.logs'), 
          path: '/admin/logs',
          resource: 'logs',
          action: 'read'
        },
      ]
    },
    {
      id: 'chat',
      label: 'Chat Interne',
      icon: MessageSquare,
      path: '/admin/chat',
      resource: 'chat',
      action: 'read'
    },
    {
      id: 'settings',
      label: t('nav.settings'),
      icon: Settings,
      path: '/admin/settings',
      resource: 'settings',
      action: 'read'
    },
  ];

  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev =>
      prev.includes(menuId)
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  const isMenuExpanded = (menuId: string) => expandedMenus.includes(menuId);
  const isPathActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');
  
  const isGroupActive = (item: MenuItem) => {
    if (item.path && isPathActive(item.path)) return true;
    if (item.subItems) {
      return item.subItems.some(sub => isPathActive(sub.path));
    }
    return false;
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    // Fermer le menu mobile après navigation
    onCloseMobileMenu();
  };

  const renderMenuItems = (isMobileVersion = false) => {
    return menuGroups.map((item) => {
      // Vérifier si l'utilisateur peut voir ce menu
      if (item.resource && item.action) {
        return (
          <ProtectedAccess 
            key={item.id}
            mode="component" 
            resource={item.resource} 
            action={item.action}
            showFallback={false}
          >
            <MenuItemComponent 
              item={item}
              isCollapsed={isMobileVersion ? false : isCollapsed}
              isActive={isGroupActive(item)}
              isExpanded={isMenuExpanded(item.id)}
              onToggle={() => toggleMenu(item.id)}
              onNavigate={handleNavigation}
              isMobile={isMobileVersion}
            />
          </ProtectedAccess>
        );
      }

      if (item.role) {
        return (
          <ProtectedAccess 
            key={item.id}
            mode="component" 
            requiredRole={item.role}
            showFallback={false}
          >
            <MenuItemComponent 
              item={item}
              isCollapsed={isMobileVersion ? false : isCollapsed}
              isActive={isGroupActive(item)}
              isExpanded={isMenuExpanded(item.id)}
              onToggle={() => toggleMenu(item.id)}
              onNavigate={handleNavigation}
              isMobile={isMobileVersion}
            />
          </ProtectedAccess>
        );
      }

      return (
        <MenuItemComponent 
          key={item.id}
          item={item}
          isCollapsed={isMobileVersion ? false : isCollapsed}
          isActive={isGroupActive(item)}
          isExpanded={isMenuExpanded(item.id)}
          onToggle={() => toggleMenu(item.id)}
          onNavigate={handleNavigation}
          isMobile={isMobileVersion}
        />
      );
    });
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden md:flex md:flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 overflow-hidden',
          isCollapsed ? 'w-20' : 'w-64'
        )}
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Bike className="w-6 h-6 text-white" />
            </div>
            {!isCollapsed && (
              <div>
                <h1 className="text-xl font-bold text-green-600">{displayName}</h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Admin Dashboard</p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {renderMenuItems(false)}
        </nav>
      </aside>

      {/* Mobile Sidebar - No backdrop overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Invisible clickable area to close menu */}
          <div 
            className="fixed inset-0" 
            onClick={onCloseMobileMenu}
          />
          
          {/* Mobile Sidebar */}
          <div className={cn(
            'fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-white dark:bg-gray-800 shadow-2xl transition-transform duration-300 ease-in-out transform translate-x-0'
          )}>
            {/* Mobile Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Bike className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-green-600">{displayName}</h1>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Admin Dashboard</p>
                </div>
              </div>
              <button
                onClick={onCloseMobileMenu}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                aria-label="Fermer le menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-120px)]">
              {renderMenuItems(true)}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}

interface MenuItemComponentProps {
  item: MenuItem;
  isCollapsed: boolean;
  isActive: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onNavigate: (path: string) => void;
  isMobile: boolean;
}

function MenuItemComponent({ 
  item, 
  isCollapsed, 
  isActive, 
  isExpanded, 
  onToggle, 
  onNavigate,
  isMobile 
}: MenuItemComponentProps) {
  const location = useLocation();
  const Icon = item.icon;
  const hasSubItems = item.subItems && item.subItems.length > 0;
  const isPathActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <div>
      <button
        onClick={() => {
          if (hasSubItems && (!isCollapsed || isMobile)) {
            onToggle();
          } else if (item.path) {
            onNavigate(item.path);
          }
        }}
        className={cn(
          'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left',
          isActive && !hasSubItems
            ? 'bg-green-50 text-green-600 dark:bg-green-900 dark:text-green-400'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
        )}
        title={isCollapsed && !isMobile ? item.label : undefined}
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        {(!isCollapsed || isMobile) && (
          <>
            <span className="text-sm flex-1 text-left">{item.label}</span>
            {hasSubItems && (
              isExpanded ? (
                <ChevronDown className="w-4 h-4 flex-shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 flex-shrink-0" />
              )
            )}
          </>
        )}
      </button>

      {hasSubItems && (!isCollapsed || isMobile) && isExpanded && (
        <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-200 dark:border-gray-600 pl-4">
          {item.subItems!.map((subItem) => {
            // Vérifier les permissions pour chaque sous-élément
            if (subItem.resource && subItem.action) {
              return (
                <ProtectedAccess 
                  key={subItem.id}
                  mode="component" 
                  resource={subItem.resource} 
                  action={subItem.action}
                  showFallback={false}
                >
                  <button
                    onClick={() => onNavigate(subItem.path)}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm text-left',
                      isPathActive(subItem.path)
                        ? 'bg-green-50 text-green-600 dark:bg-green-900 dark:text-green-400'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    )}
                  >
                    {subItem.label}
                  </button>
                </ProtectedAccess>
              );
            }

            if (subItem.role) {
              return (
                <ProtectedAccess 
                  key={subItem.id}
                  mode="component" 
                  requiredRole={subItem.role}
                  showFallback={false}
                >
                  <button
                    onClick={() => onNavigate(subItem.path)}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm text-left',
                      isPathActive(subItem.path)
                        ? 'bg-green-50 text-green-600 dark:bg-green-900 dark:text-green-400'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    )}
                  >
                    {subItem.label}
                  </button>
                </ProtectedAccess>
              );
            }

            return (
              <button
                key={subItem.id}
                onClick={() => onNavigate(subItem.path)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm text-left',
                  isPathActive(subItem.path)
                    ? 'bg-green-50 text-green-600 dark:bg-green-900 dark:text-green-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
              >
                {subItem.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}