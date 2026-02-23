import React, { useState, useEffect } from 'react';
import { Calendar, Search, Filter, Eye, X, Clock, User, Bike } from 'lucide-react';
import { Card } from '../../ui/card';
import { Input } from '../../ui/input';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../ui/dialog';
import { reservationService } from '../../../services/api/reservation.service';
import { toast } from 'sonner';
import { useTranslation } from '../../../lib/i18n';
import { usePermissions } from '../../../hooks/usePermissions';
import { ExportButtons } from '../ExportButtons';

export function ReservationManagement() {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const [reservations, setReservations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedReservation, setSelectedReservation] = useState<any>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    loadReservations();
  }, [statusFilter, dateFilter, pagination.page]);

  const loadReservations = async () => {
    try {
      setIsLoading(true);
      const data = await reservationService.getAllReservations({
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(dateFilter !== 'all' && { dateFilter }),
        page: pagination.page,
        limit: pagination.limit
      });
      
      setReservations(data.reservations);
      setPagination(data.pagination);
    } catch (error) {
      toast.error('Erreur lors du chargement des réservations');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      'ACTIVE': { label: 'Active', variant: 'default' },
      'COMPLETED': { label: 'Terminée', variant: 'secondary' },
      'CANCELLED': { label: 'Annulée', variant: 'destructive' },
      'EXPIRED': { label: 'Expirée', variant: 'outline' }
    };
    const config = variants[status] || { label: status, variant: 'outline' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const filteredReservations = reservations.filter(reservation => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        reservation.user?.firstName?.toLowerCase().includes(searchLower) ||
        reservation.user?.lastName?.toLowerCase().includes(searchLower) ||
        reservation.user?.email?.toLowerCase().includes(searchLower) ||
        reservation.plan?.name?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-green-600">{t('reservations.management') || 'Gestion des Réservations'}</h1>
          <p className="text-gray-600">{t('reservations.overview') || 'Suivi et gestion des réservations de vélos'}</p>
        </div>
        {can.exportReservations() && (
          <ExportButtons
            data={filteredReservations.map(r => ({
              Utilisateur: `${r.user?.firstName || ''} ${r.user?.lastName || ''}`.trim(),
              Email: r.user?.email || '',
              Plan: r.plan?.name || '',
              'Type de forfait': r.packageType || '',
              Statut: r.status,
              'Date début': new Date(r.startDate).toLocaleDateString('fr-FR'),
              'Date fin': new Date(r.endDate).toLocaleDateString('fr-FR'),
            }))}
            filename="reservations"
            headers={['Utilisateur', 'Email', 'Plan', 'Type de forfait', 'Statut', 'Date début', 'Date fin']}
          />
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Réservations Actives</p>
              <p className="text-gray-900">{reservations.filter(r => r.status === 'ACTIVE').length}</p>
            </div>
            <div className="bg-green-100 text-green-600 p-3 rounded-lg">
              <Calendar className="w-6 h-6" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Aujourd'hui</p>
              <p className="text-gray-900">
                {reservations.filter(r => {
                  const today = new Date().toDateString();
                  return new Date(r.startDate).toDateString() === today;
                }).length}
              </p>
            </div>
            <div className="bg-blue-100 text-blue-600 p-3 rounded-lg">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Cette Semaine</p>
              <p className="text-gray-900">
                {reservations.filter(r => {
                  const weekStart = new Date();
                  weekStart.setDate(weekStart.getDate() - 7);
                  return new Date(r.startDate) >= weekStart;
                }).length}
              </p>
            </div>
            <div className="bg-orange-100 text-orange-600 p-3 rounded-lg">
              <Calendar className="w-6 h-6" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Annulées</p>
              <p className="text-gray-900">{reservations.filter(r => r.status === 'CANCELLED').length}</p>
            </div>
            <div className="bg-red-100 text-red-600 p-3 rounded-lg">
              <X className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder={t('reservations.searchPlaceholder') || 'Rechercher par utilisateur ou plan...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              aria-label={t('aria.search')}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="COMPLETED">Terminée</SelectItem>
              <SelectItem value="CANCELLED">Annulée</SelectItem>
              <SelectItem value="EXPIRED">Expirée</SelectItem>
            </SelectContent>
          </Select>
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filtrer par date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les dates</SelectItem>
              <SelectItem value="today">Aujourd'hui</SelectItem>
              <SelectItem value="week">Cette semaine</SelectItem>
              <SelectItem value="month">Ce mois</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Reservations List */}
      <div className="space-y-4">
        {filteredReservations.map((reservation) => (
          <Card key={reservation.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-start gap-3 mb-3">
                  <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h4 className="text-gray-900">
                        {reservation.user?.firstName} {reservation.user?.lastName}
                      </h4>
                      {getStatusBadge(reservation.status)}
                      <Badge variant="outline">
                        {reservation.packageType}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-2">
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {reservation.user?.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Bike className="w-4 h-4" />
                        Plan: {reservation.plan?.name}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                      <span>Début: {new Date(reservation.startDate).toLocaleString('fr-FR')}</span>
                      <span>•</span>
                      <span>Fin: {new Date(reservation.endDate).toLocaleString('fr-FR')}</span>
                      <span>•</span>
                      <span>Créée: {new Date(reservation.createdAt).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedReservation(reservation)}
                  aria-label={t('aria.viewReservationDetails') || 'Voir les détails de la réservation'}
                  title={t('aria.viewReservationDetails') || 'Voir les détails de la réservation'}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {t('common.viewDetails')}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Reservation Details Dialog */}
      {selectedReservation && (
        <Dialog open={!!selectedReservation} onOpenChange={() => setSelectedReservation(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Détails de la Réservation</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Utilisateur</p>
                  <p className="text-gray-900">
                    {selectedReservation.user?.firstName} {selectedReservation.user?.lastName}
                  </p>
                  <p className="text-sm text-gray-600">{selectedReservation.user?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Statut</p>
                  {getStatusBadge(selectedReservation.status)}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Plan</p>
                  <p className="text-gray-900">{selectedReservation.plan?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Type de forfait</p>
                  <Badge variant="outline">{selectedReservation.packageType}</Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Date de début</p>
                  <p className="text-gray-900">
                    {new Date(selectedReservation.startDate).toLocaleString('fr-FR')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date de fin</p>
                  <p className="text-gray-900">
                    {new Date(selectedReservation.endDate).toLocaleString('fr-FR')}
                  </p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedReservation(null)} aria-label={t('aria.close')}>
                {t('common.close')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}