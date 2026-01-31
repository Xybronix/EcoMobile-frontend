import React, { useState, useEffect } from 'react';
import { AlertTriangle, Search, Check, X, Clock, Eye } from 'lucide-react';
import { Card } from '../../ui/card';
import { Input } from '../../ui/input';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { incidentService, Incident } from '../../../services/api/incident.service';
import { Dialog, DialogContent, DialogHeader, DialogDescription, DialogTitle, DialogFooter } from '../../ui/dialog';
import { Textarea } from '../../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { toast } from 'sonner';
import { useTranslation } from '../../../lib/i18n';

export function IncidentManagement() {
  const { t } = useTranslation();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    loadIncidents();
  }, [statusFilter, pagination.page]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadIncidents();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const loadIncidents = async () => {
    try {
      setIsLoading(true);
      const data = await incidentService.getIncidents({
        ...(statusFilter !== 'all' && { status: statusFilter }),
        page: pagination.page,
        limit: pagination.limit
      });
      
      // Filtrer côté client pour la recherche (temporaire)
      let filteredIncidents = data.incidents;
      if (searchTerm) {
        filteredIncidents = data.incidents.filter(incident =>
          incident.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          incident.bikeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          incident.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      setIncidents(filteredIncidents);
      setPagination(data.pagination);
    } catch (error) {
      toast.error('Erreur lors du chargement des signalements');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      'OPEN': { label: 'En attente', variant: 'outline' },
      'IN_PROGRESS': { label: 'En traitement', variant: 'default' },
      'RESOLVED': { label: 'Résolu', variant: 'secondary' },
      'CLOSED': { label: 'Fermé', variant: 'destructive' }
    };
    const config = variants[status] || { label: status, variant: 'outline' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const labels: Record<string, string> = {
      'technical': 'Technique',
      'accident': 'Accident',
      'damaged': 'Endommagé',
      'payment': 'Paiement',
      'theft': 'Vol'
    };
    return <Badge variant="outline">{labels[type] || type}</Badge>;
  };

  const handleApprove = async () => {
    if (!selectedIncident || !refundAmount || parseFloat(refundAmount) <= 0) {
      toast.error('Veuillez entrer un montant de remboursement valide');
      return;
    }

    try {
      await incidentService.updateIncident(selectedIncident.id, {
        status: 'RESOLVED',
        refundAmount: parseFloat(refundAmount),
        adminNote: adminNote || `Incident approuvé avec remboursement de ${refundAmount} FCFA`
      });
      
      toast.success(`Signalement approuvé - Remboursement de ${refundAmount} FCFA`);
      setSelectedIncident(null);
      setRefundAmount('');
      setAdminNote('');
      loadIncidents();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de l\'approbation');
    }
  };

  const handleReject = async () => {
    if (!selectedIncident || !adminNote) {
      toast.error('Veuillez fournir une raison pour le rejet');
      return;
    }

    try {
      await incidentService.updateIncident(selectedIncident.id, {
        status: 'CLOSED',
        refundAmount: 0,
        adminNote: adminNote
      });
      
      toast.success('Signalement rejeté avec succès');
      setSelectedIncident(null);
      setRefundAmount('');
      setAdminNote('');
      loadIncidents();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors du rejet');
    }
  };

  const pendingCount = incidents.filter(i => i.status === 'OPEN').length;
  const inProgressCount = incidents.filter(i => i.status === 'IN_PROGRESS').length;
  const resolvedCount = incidents.filter(i => i.status === 'RESOLVED').length;
  const totalRefunds = incidents
    .filter(i => i.refundAmount)
    .reduce((sum, i) => sum + (i.refundAmount || 0), 0);

  if (isLoading && incidents.length === 0) {
    return <div className="p-8">Chargement...</div>;
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-green-600">{t('incidents.management') || 'Gestion des Signalements'}</h1>
        <p className="text-gray-600">{t('incidents.overview') || 'Traitement des incidents et remboursements'}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">En Attente</p>
              <p className="text-gray-900">{pendingCount}</p>
            </div>
            <div className="bg-orange-100 text-orange-600 p-3 rounded-lg">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">En Traitement</p>
              <p className="text-gray-900">{inProgressCount}</p>
            </div>
            <div className="bg-blue-100 text-blue-600 p-3 rounded-lg">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Résolus</p>
              <p className="text-gray-900">{resolvedCount}</p>
            </div>
            <div className="bg-green-100 text-green-600 p-3 rounded-lg">
              <Check className="w-6 h-6" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Remboursements</p>
              <p className="text-gray-900">{totalRefunds.toLocaleString()} FCFA</p>
            </div>
            <div className="bg-purple-100 text-purple-600 p-3 rounded-lg">
              <AlertTriangle className="w-6 h-6" />
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
              placeholder={t('incidents.searchPlaceholder') || 'Rechercher par utilisateur, vélo ou description...'}
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
              <SelectItem value="OPEN">En attente</SelectItem>
              <SelectItem value="IN_PROGRESS">En traitement</SelectItem>
              <SelectItem value="RESOLVED">Résolu</SelectItem>
              <SelectItem value="CLOSED">Fermé</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Incidents List */}
      <div className="space-y-4">
        {incidents.map((incident) => (
          <Card key={incident.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-start gap-3 mb-3">
                  <div className="bg-red-100 text-red-600 p-2 rounded-lg">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h4 className="text-gray-900">{incident.userName}</h4>
                      {getStatusBadge(incident.status)}
                      {getTypeBadge(incident.type)}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{incident.description}</p>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                      <span>Vélo: {incident.bikeName}</span>
                      <span>•</span>
                      <span>{new Date(incident.createdAt).toLocaleString('fr-FR')}</span>
                      {incident.refundAmount && (
                        <>
                          <span>•</span>
                          <span className="text-green-600">
                            Remboursement: {incident.refundAmount} FCFA
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedIncident(incident)}
                  aria-label={t('aria.viewIncidentDetails') || 'Voir les détails du signalement'}
                  title={t('aria.viewIncidentDetails') || 'Voir les détails du signalement'}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {t('common.viewDetails')}
                </Button>
                {incident.status === 'OPEN' && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      setSelectedIncident(incident);
                      setRefundAmount('200');
                    }}
                    aria-label={t('aria.processIncident') || 'Traiter le signalement'}
                    title={t('aria.processIncident') || 'Traiter le signalement'}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    {t('incidents.process') || 'Traiter'}
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {incidents.length === 0 && !isLoading && (
        <Card className="p-12">
          <div className="text-center text-gray-500">
            <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Aucun signalement trouvé</p>
            <p className="text-sm mt-1">Essayez de modifier vos filtres</p>
          </div>
        </Card>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            disabled={pagination.page === 1}
          >
            Précédent
          </Button>
          <span className="px-4 py-2 text-sm text-gray-600">
            Page {pagination.page} sur {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            disabled={pagination.page === pagination.totalPages}
          >
            Suivant
          </Button>
        </div>
      )}

      {/* Incident Details Dialog */}
      {selectedIncident && (
        <Dialog open={!!selectedIncident} onOpenChange={() => setSelectedIncident(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Détails du Signalement</DialogTitle>
              <DialogDescription>
                Informations détaillées sur le signalement et options de traitement
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Utilisateur</p>
                  <p className="text-gray-900">{selectedIncident.userName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Vélo</p>
                  <p className="text-gray-900">{selectedIncident.bikeName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Type</p>
                  {getTypeBadge(selectedIncident.type)}
                </div>
                <div>
                  <p className="text-sm text-gray-600">Statut</p>
                  {getStatusBadge(selectedIncident.status)}
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-600 mb-1">Date</p>
                  <p className="text-gray-900">{new Date(selectedIncident.createdAt).toLocaleString('fr-FR')}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">Description</p>
                <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedIncident.description}</p>
              </div>

              {selectedIncident.status === 'OPEN' && (
                <>
                  <div>
                    <label className="text-sm text-gray-600 mb-2 block">Montant du Remboursement (FCFA)</label>
                    <Input
                      type="number"
                      placeholder="Ex: 200"
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 mb-2 block">Note Administrateur</label>
                    <Textarea
                      placeholder="Commentaire ou raison de la décision..."
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      rows={3}
                    />
                  </div>
                </>
              )}

              {selectedIncident.adminNote && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Note Administrateur</p>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedIncident.adminNote}</p>
                </div>
              )}

              {selectedIncident.refundAmount && selectedIncident.refundAmount > 0 ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Montant Remboursé</p>
                  <p className="text-green-600">{selectedIncident.refundAmount} FCFA</p>
                </div>
              ) : selectedIncident.status === 'CLOSED' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Statut</p>
                  <p className="text-red-600">Incident rejeté</p>
                  {selectedIncident.adminNote && (
                    <p className="text-sm text-red-600 mt-1">Raison: {selectedIncident.adminNote}</p>
                  )}
                </div>
              )}
            </div>

            {selectedIncident.status === 'OPEN' && (
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setSelectedIncident(null)}>
                  Annuler
                </Button>
                <Button variant="destructive" onClick={handleReject}>
                  <X className="w-4 h-4 mr-2" />
                  Rejeter
                </Button>
                <Button variant="default" onClick={handleApprove}>
                  <Check className="w-4 h-4 mr-2" />
                  Approuver
                </Button>
              </DialogFooter>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}