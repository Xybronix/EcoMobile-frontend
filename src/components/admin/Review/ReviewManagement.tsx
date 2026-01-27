import React, { useState, useEffect } from 'react';
import { Star, Check, X, Trash2, MessageCircle, ThumbsUp, ThumbsDown, Plus, Edit } from 'lucide-react';
import { reviewService, Review } from '../../../services/api/review.service';
import { Button } from '../../ui/button';
import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../ui/dialog';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { Label } from '../../ui/label';
import { toast } from 'sonner';
import { Pagination } from '../../Pagination';

export function ReviewManagement() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [allReviews, setAllReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'PENDING' | 'APPROVED' | 'REJECTED'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: 'approve' | 'reject' | 'delete' | null;
    review: Review | null;
    loading: boolean;
  }>({
    open: false,
    type: null,
    review: null,
    loading: false
  });

  const [reviewDialog, setReviewDialog] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    review: Review | null;
    loading: boolean;
  }>({
    open: false,
    mode: 'create',
    review: null,
    loading: false
  });

  const [formData, setFormData] = useState({
    photo: '',
    firstName: '',
    lastName: '',
    socialStatus: '',
    rating: 5,
    comment: ''
  });

  const itemsPerPage = 10;

  // Charger tous les avis
  const loadAllReviews = async () => {
    setIsLoading(true);
    try {
      const response = await reviewService.getAllReviews({
        status: filter === 'all' ? undefined : filter,
        page: currentPage,
        limit: itemsPerPage
      });
      
      // Gérer les différents formats de réponse
      if (response.reviews && response.pagination) {
        setAllReviews(response.reviews);
      } else if (Array.isArray(response)) {
        setAllReviews(response);
      } else if (response.reviews) {
        setAllReviews(response.reviews);
      } else {
        setAllReviews([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des avis:', error);
      toast.error('Erreur lors du chargement des avis');
      setAllReviews([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllReviews();
  }, [filter, currentPage]);

  // Pagination frontend si nécessaire
  useEffect(() => {
    if (allReviews.length <= itemsPerPage) {
      setReviews(allReviews);
    } else {
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      setReviews(allReviews.slice(startIndex, endIndex));
    }
  }, [allReviews, currentPage, itemsPerPage]);

  const openConfirmDialog = (type: 'approve' | 'reject' | 'delete', review: Review) => {
    setConfirmDialog({
      open: true,
      type,
      review,
      loading: false
    });
  };

  const closeConfirmDialog = () => {
    setConfirmDialog({
      open: false,
      type: null,
      review: null,
      loading: false
    });
  };

  const openReviewDialog = (mode: 'create' | 'edit', review?: Review) => {
    if (mode === 'edit' && review) {
      setFormData({
        photo: review.photo || '',
        firstName: review.firstName,
        lastName: review.lastName,
        socialStatus: review.socialStatus,
        rating: review.rating,
        comment: review.comment
      });
      setReviewDialog({
        open: true,
        mode: 'edit',
        review,
        loading: false
      });
    } else {
      setFormData({
        photo: '',
        firstName: '',
        lastName: '',
        socialStatus: '',
        rating: 5,
        comment: ''
      });
      setReviewDialog({
        open: true,
        mode: 'create',
        review: null,
        loading: false
      });
    }
  };

  const closeReviewDialog = () => {
    setReviewDialog({
      open: false,
      mode: 'create',
      review: null,
      loading: false
    });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.lastName || !formData.socialStatus || !formData.comment) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      setReviewDialog(prev => ({ ...prev, loading: true }));

      if (reviewDialog.mode === 'create') {
        await reviewService.createReview(formData);
        toast.success('Avis créé avec succès');
      } else if (reviewDialog.review) {
        await reviewService.updateReview(reviewDialog.review.id, formData);
        toast.success('Avis modifié avec succès');
      }

      await loadAllReviews();
      closeReviewDialog();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la sauvegarde');
    } finally {
      setReviewDialog(prev => ({ ...prev, loading: false }));
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmDialog.review || !confirmDialog.type) return;

    try {
      setConfirmDialog(prev => ({ ...prev, loading: true }));
      setActionLoading(confirmDialog.review.id);

      if (confirmDialog.type === 'delete') {
        await reviewService.deleteReview(confirmDialog.review.id);
        toast.success('Avis supprimé avec succès');
      } else {
        await reviewService.moderateReview(
          confirmDialog.review.id, 
          confirmDialog.type,
          confirmDialog.type === 'reject' ? 'Avis non conforme' : undefined
        );
        toast.success(`Avis ${confirmDialog.type === 'approve' ? 'approuvé' : 'rejeté'} avec succès`);
      }

      await loadAllReviews();
      closeConfirmDialog();
    } catch (error) {
      console.error('Erreur lors de l\'action:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'action');
      setConfirmDialog(prev => ({ ...prev, loading: false }));
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      approved: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200'
    };
    
    const labels = {
      pending: 'En attente',
      approved: 'Approuvé',
      rejected: 'Rejeté'
    };

    return (
      <Badge variant="outline" className={colors[status as keyof typeof colors]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const renderStars = (rating: number, interactive = false, onChange?: (rating: number) => void) => {
    return (
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star 
            key={i} 
            className={`w-5 h-5 cursor-pointer ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
            onClick={() => interactive && onChange?.(i + 1)}
          />
        ))}
        {!interactive && (
          <span className="text-sm text-gray-600 ml-1">({rating}/5)</span>
        )}
      </div>
    );
  };

  // Calcul des statistiques
  const stats = {
    total: allReviews.length,
    pending: allReviews.filter(r => r.status === 'PENDING').length,
    approved: allReviews.filter(r => r.status === 'APPROVED').length,
    rejected: allReviews.filter(r => r.status === 'REJECTED').length,
    averageRating: allReviews.length > 0 
      ? (allReviews.reduce((sum, review) => sum + review.rating, 0) / allReviews.length).toFixed(1)
      : '0.0'
  };

  // Calcul de la pagination
  const totalPages = Math.ceil(allReviews.length / itemsPerPage);
  const totalItems = allReviews.length;

  if (isLoading && allReviews.length === 0) {
    return (
      <div className="p-4 md:p-8 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des avis...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-green-600">Gestion des avis</h1>
          <p className="text-gray-600">Consultez, modérez et gérez les avis des utilisateurs</p>
        </div>
        <Button onClick={() => openReviewDialog('create')}>
          <Plus className="w-4 h-4 mr-2" />
          Créer un avis
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Avis</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <MessageCircle className="w-8 h-8 text-green-600" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">En Attente</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            </div>
            <MessageCircle className="w-8 h-8 text-yellow-600" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Approuvés</p>
              <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
            </div>
            <ThumbsUp className="w-8 h-8 text-blue-600" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Note Moyenne</p>
              <p className="text-2xl font-bold text-gray-900">{stats.averageRating}/5</p>
            </div>
            <Star className="w-8 h-8 text-yellow-600 fill-yellow-600" />
          </div>
        </Card>
      </div>

      {/* Filtres */}
      <Card className="p-4">
        <div className="flex gap-2 flex-wrap">
          {[
            { value: 'all', label: 'Tous', count: stats.total },
            { value: 'PENDING', label: 'En attente', count: stats.pending },
            { value: 'APPROVED', label: 'Approuvés', count: stats.approved },
            { value: 'REJECTED', label: 'Rejetés', count: stats.rejected }
          ].map((status) => (
            <Button
              key={status.value}
              variant={filter === status.value ? 'default' : 'outline'}
              onClick={() => {
                setFilter(status.value as typeof filter);
                setCurrentPage(1);
              }}
              size="sm"
            >
              {status.label}
              <span className="ml-2 bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                {status.count}
              </span>
            </Button>
          ))}
        </div>
      </Card>

      {/* Reviews Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Note</TableHead>
                <TableHead>Commentaire</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviews.map((review) => (
                <TableRow key={review.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {review.photo ? (
                        <img
                          src={review.photo}
                          alt={`${review.firstName} ${review.lastName}`}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {review.firstName?.charAt(0)}{review.lastName?.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium">
                          {review.firstName} {review.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{review.socialStatus}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {renderStars(review.rating)}
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <p className="text-sm line-clamp-2">{review.comment}</p>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(review.status)}
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-gray-600">
                      {review.createdAt ? new Date(review.createdAt).toLocaleDateString('fr-FR') : 'N/A'}
                    </p>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      {/* Boutons de modération - TOUJOURS visibles pour changer le statut à tout moment */}
                      {review.status !== 'APPROVED' && (
                        <Button
                          onClick={() => openConfirmDialog('approve', review)}
                          className="bg-green-600 hover:bg-green-700"
                          size="sm"
                          disabled={actionLoading === review.id}
                        >
                          {actionLoading === review.id ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                      
                      {review.status !== 'REJECTED' && (
                        <Button
                          onClick={() => openConfirmDialog('reject', review)}
                          variant="outline"
                          size="sm"
                          disabled={actionLoading === review.id}
                        >
                          {actionLoading === review.id ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-400"></div>
                          ) : (
                            <X className="w-4 h-4" />
                          )}
                        </Button>
                      )}

                      {/* Bouton d'édition */}
                      <Button
                        onClick={() => openReviewDialog('edit', review)}
                        variant="outline"
                        size="sm"
                        disabled={actionLoading === review.id}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      
                      {/* Bouton de suppression */}
                      <Button
                        onClick={() => openConfirmDialog('delete', review)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50"
                        disabled={actionLoading === review.id}
                      >
                        {actionLoading === review.id ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600"></div>
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination */}
        {totalItems > 0 && (
          <div className="p-4 border-t">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </Card>

      {reviews.length === 0 && !isLoading && (
        <Card className="p-12">
          <div className="text-center text-gray-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Aucun avis trouvé</p>
            <p className="text-sm mt-1">Essayez de modifier vos filtres</p>
          </div>
        </Card>
      )}

      {/* Dialog de création/édition d'avis */}
      <Dialog open={reviewDialog.open} onOpenChange={closeReviewDialog}>
        <DialogContent className="max-w-2xl" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>
              {reviewDialog.mode === 'create' ? 'Créer un avis' : 'Modifier l\'avis'}
            </DialogTitle>
            <DialogDescription>
              {reviewDialog.mode === 'create' 
                ? 'Ajoutez un nouvel avis manuellement' 
                : 'Modifiez les informations de cet avis'
              }
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="Prénom"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName">Nom *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Nom"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="socialStatus">Statut social *</Label>
              <Input
                id="socialStatus"
                value={formData.socialStatus}
                onChange={(e) => setFormData(prev => ({ ...prev, socialStatus: e.target.value }))}
                placeholder="Ex: Étudiant, Employé, Retraité..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="photo">Photo (URL)</Label>
              <Input
                id="photo"
                value={formData.photo}
                onChange={(e) => setFormData(prev => ({ ...prev, photo: e.target.value }))}
                placeholder="https://example.com/photo.jpg"
              />
            </div>

            <div className="space-y-2">
              <Label>Note *</Label>
              <div className="flex items-center gap-2">
                {renderStars(formData.rating, true, (rating) => 
                  setFormData(prev => ({ ...prev, rating }))
                )}
                <span className="text-sm text-gray-600">({formData.rating}/5)</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="comment">Commentaire *</Label>
              <Textarea
                id="comment"
                value={formData.comment}
                onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                placeholder="Partagez votre expérience..."
                rows={4}
                required
              />
            </div>

            <DialogFooter>
              <Button 
                type="button"
                variant="outline" 
                onClick={closeReviewDialog}
                disabled={reviewDialog.loading}
              >
                Annuler
              </Button>
              <Button 
                type="submit"
                disabled={reviewDialog.loading}
              >
                {reviewDialog.loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : null}
                {reviewDialog.mode === 'create' ? 'Créer l\'avis' : 'Modifier l\'avis'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmation pour les actions */}
      <Dialog open={confirmDialog.open} onOpenChange={closeConfirmDialog}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>
              {confirmDialog.type === 'approve' ? 'Approuver l\'avis' : 
               confirmDialog.type === 'reject' ? 'Rejeter l\'avis' : 
               'Supprimer l\'avis'}
            </DialogTitle>
            <DialogDescription>
              {confirmDialog.type === 'approve' 
                ? `Êtes-vous sûr de vouloir approuver l'avis de ${confirmDialog.review?.firstName} ${confirmDialog.review?.lastName} ?`
                : confirmDialog.type === 'reject'
                ? `Êtes-vous sûr de vouloir rejeter l'avis de ${confirmDialog.review?.firstName} ${confirmDialog.review?.lastName} ?`
                : `Êtes-vous sûr de vouloir supprimer définitivement l'avis de ${confirmDialog.review?.firstName} ${confirmDialog.review?.lastName} ? Cette action est irréversible.`
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={closeConfirmDialog}
              disabled={confirmDialog.loading}
            >
              Annuler
            </Button>
            <Button 
              variant={
                confirmDialog.type === 'approve' ? 'default' :
                confirmDialog.type === 'reject' ? 'destructive' :
                'destructive'
              }
              onClick={handleConfirmAction}
              disabled={confirmDialog.loading}
            >
              {confirmDialog.loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : null}
              {confirmDialog.type === 'approve' ? 'Approuver' : 
               confirmDialog.type === 'reject' ? 'Rejeter' : 
               'Supprimer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}