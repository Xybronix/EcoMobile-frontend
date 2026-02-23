import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Card } from '../../ui/card';
import { Input } from '../../ui/input';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { useTranslation } from '../../../lib/i18n';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { logService, ActivityLog } from '../../../services/api/log.service';
import { userService } from '../../../services/api/user.service';
import { toast } from 'sonner';
import { usePermissions } from '../../../hooks/usePermissions';
import { ExportButtons } from '../ExportButtons';

export function ActivityLogs() {
  const { can } = usePermissions();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [userFilter, setUserFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [resourceFilter, setResourceFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    thisWeek: 0,
    thisMonth: 0
  });
  const { t } = useTranslation();

  useEffect(() => {
    loadData();
  }, [pagination.page, userFilter, actionFilter, resourceFilter, startDate, endDate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search) {
        loadLogs();
      } else if (!search) {
        loadLogs();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const loadData = async () => {
    await Promise.all([loadLogs(), loadUsers()]);
  };

  const loadLogs = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: pagination.page,
        limit: pagination.limit
      };

      if (userFilter !== 'all') params.userId = userFilter;
      if (actionFilter !== 'all') params.action = actionFilter;
      if (resourceFilter !== 'all') params.resource = resourceFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (search) params.search = search;

      const data = await logService.getActivityLogs(params);
      setLogs(data.logs);
      setPagination(data.pagination);

      // Calculate stats
      calculateStats(data.logs);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors du chargement des logs');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await userService.getAllUsers({ limit: 1000 });
      setUsers(data.users);
    } catch (error: any) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
    }
  };

  const calculateStats = (allLogs: ActivityLog[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    setStats({
      total: allLogs.length,
      today: allLogs.filter(log => new Date(log.createdAt) >= today).length,
      thisWeek: allLogs.filter(log => new Date(log.createdAt) >= thisWeek).length,
      thisMonth: allLogs.filter(log => new Date(log.createdAt) >= thisMonth).length
    });
  };

  const getCategoryBadge = (resource: string) => {
    const colors: Record<string, string> = {
      BIKE: 'bg-blue-100 text-blue-800',
      USER: 'bg-green-100 text-green-800',
      INCIDENT: 'bg-red-100 text-red-800',
      PRICING: 'bg-purple-100 text-purple-800',
      ROLE: 'bg-orange-100 text-orange-800',
      PERMISSION: 'bg-yellow-100 text-yellow-800',
      SETTINGS: 'bg-gray-100 text-gray-800'
    };
    return (
      <Badge variant="outline" className={colors[resource] || 'bg-gray-100 text-gray-800'}>
        {resource}
      </Badge>
    );
  };

  const getActionBadge = (action: string) => {
    const colors: Record<string, string> = {
      CREATE: 'bg-green-100 text-green-800',
      UPDATE: 'bg-blue-100 text-blue-800',
      DELETE: 'bg-red-100 text-red-800',
      VIEW: 'bg-gray-100 text-gray-800',
      LOGIN: 'bg-purple-100 text-purple-800',
      LOGOUT: 'bg-orange-100 text-orange-800'
    };
    return (
      <Badge variant="outline" className={colors[action] || 'bg-gray-100 text-gray-800'}>
        {action}
      </Badge>
    );
  };

  // Get unique actions and resources for filters
  const uniqueActions = [...new Set(logs.map(log => log.action))];
  const uniqueResources = [...new Set(logs.map(log => log.resource))];

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-green-600">{t('logs.activity')}</h1>
          <p className="text-gray-600">{t('logs.overview')}</p>
        </div>
        {can.exportLogs() && (
          <ExportButtons
            data={logs.map(log => ({
              Utilisateur: log.userId || 'Système',
              Action: log.action,
              Ressource: log.resource,
              Détails: log.details || '',
              'Adresse IP': log.ipAddress || '',
              Date: new Date(log.createdAt).toLocaleString('fr-FR')
            }))}
            filename="journaux-activite"
            headers={['Utilisateur', 'Action', 'Ressource', 'Détails', 'Adresse IP', 'Date']}
          />
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Actions</p>
          <p className="text-gray-900">{stats.total}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Aujourd'hui</p>
          <p className="text-gray-900">{stats.today}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Cette Semaine</p>
          <p className="text-gray-900">{stats.thisWeek}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Ce Mois</p>
          <p className="text-gray-900">{stats.thisMonth}</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder={t('common.search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={userFilter} onValueChange={setUserFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrer par utilisateur" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les utilisateurs</SelectItem>
              {users.map(user => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrer par action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les actions</SelectItem>
              {uniqueActions.map(action => (
                <SelectItem key={action} value={action}>{action}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={resourceFilter} onValueChange={setResourceFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrer par ressource" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les ressources</SelectItem>
              {uniqueResources.map(resource => (
                <SelectItem key={resource} value={resource}>{resource}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="Du"
            />
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="Au"
            />
          </div>
        </div>
      </Card>

      {/* Logs Table */}
      <Card>
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Heure</TableHead>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Ressource</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString('fr-FR')}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">
                        {log.user ? `${log.user.firstName} ${log.user.lastName}` : 'Système'}
                      </p>
                      {log.user?.email && (
                        <p className="text-xs text-gray-500">{log.user.email}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getActionBadge(log.action)}
                  </TableCell>
                  <TableCell>
                    {getCategoryBadge(log.resource)}
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      <p className="text-sm truncate">{log.details}</p>
                      {log.resourceId && (
                        <p className="text-xs text-gray-500">ID: {log.resourceId}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-xs text-gray-500">{log.ipAddress || '-'}</p>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t">
            <p className="text-sm text-gray-600">
              Affichage de {((pagination.page - 1) * pagination.limit) + 1} à {Math.min(pagination.page * pagination.limit, pagination.total)} sur {pagination.total} résultats
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
              >
                Précédent
              </Button>
              <Button
                variant="outline"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.totalPages}
              >
                Suivant
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}