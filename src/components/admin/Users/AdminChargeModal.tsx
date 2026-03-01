import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { AlertTriangle, DollarSign, Bike, User, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { walletService } from '../../../services/api/wallet.service';
import { bikeService, type BikePosition } from '../../../services/api/bike.service';
import { userService, type User as UserType } from '../../../services/api/user.service';
import { incidentService } from '../../../services/api/incident.service';
import { useTranslation } from '../../../lib/i18n';

interface AdminChargeModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  preselectedUserId?: string;
  preselectedBikeId?: string;
  chargeId?: string; // ID de la charge à modifier (optionnel)
  isEditMode?: boolean; // Mode édition ou création
}

export function AdminChargeModal({ 
  open, 
  onClose, 
  onSuccess,
  preselectedUserId,
  preselectedBikeId,
  chargeId,
  isEditMode = false
}: AdminChargeModalProps) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<UserType[]>([]);
  const [bikes, setBikes] = useState<BikePosition[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [formData, setFormData] = useState({
    userId: preselectedUserId || '',
    bikeId: preselectedBikeId || 'none',
    amount: '',
    reason: '',
    description: ''
  });

  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);

  useEffect(() => {
    if (open) {
      if (isEditMode && chargeId) {
        loadChargeData();
      } else {
        loadData();
      }
    } else {
      // Reset form when modal closes
      setFormData({
        userId: preselectedUserId || '',
        bikeId: preselectedBikeId || 'none',
        amount: '',
        reason: '',
        description: ''
      });
    }
  }, [open, isEditMode, chargeId]);

  useEffect(() => {
    if (preselectedUserId) {
      setFormData(prev => ({ ...prev, userId: preselectedUserId }));
    }
    if (preselectedBikeId) {
      setFormData(prev => ({ ...prev, bikeId: preselectedBikeId }));
    } else {
      setFormData(prev => ({ ...prev, bikeId: 'none' }));
    }
  }, [preselectedUserId, preselectedBikeId]);

  useEffect(() => {
    if (formData.userId && users.length > 0) {
      const user = users.find(u => u.id === formData.userId);
      setSelectedUser(user || null);
    }
  }, [formData.userId, users]);

  const loadData = async () => {
    try {
      setLoadingData(true);
      const [usersData, bikesData] = await Promise.all([
        userService.getAllUsers({ limit: 100, role: 'USER' }),
        bikeService.getAllBikes({ limit: 100 })
      ]);
      setUsers(usersData.users);
      setBikes(bikesData.bikes);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoadingData(false);
    }
  };

  const loadChargeData = async () => {
    if (!chargeId) return;
    
    try {
      setLoadingData(true);
      
      // Charger les données de base (users et bikes)
      const [usersData, bikesData] = await Promise.all([
        userService.getAllUsers({ limit: 100, role: 'USER' }),
        bikeService.getAllBikes({ limit: 100 })
      ]);
      
      setUsers(usersData.users);
      setBikes(bikesData.bikes);
      
      // Récupérer la charge via l'endpoint admin incidents avec un filtre large
      const incidentData = await incidentService.getIncidents({ limit: 1000 });
      const charge = incidentData.incidents.find((inc: any) => inc.id === chargeId && inc.type === 'admin_charge');
      
      if (charge) {
        // Extraire la raison et la description depuis la description
        // Format: "reason: description" ou juste "reason"
        const descriptionParts = charge.description.split(': ');
        const reason = descriptionParts[0] || '';
        const description = descriptionParts.length > 1 ? descriptionParts.slice(1).join(': ') : '';
        
        setFormData({
          userId: charge.userId,
          bikeId: charge.bikeId || 'none',
          amount: charge.refundAmount?.toString() || '',
          reason: reason,
          description: description
        });
      } else {
        toast.error('Charge non trouvée');
        onClose();
      }
    } catch (error) {
      console.error('Error loading charge data:', error);
      toast.error('Erreur lors du chargement de la charge');
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.userId || !formData.amount || !formData.reason) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount === 0) {
      toast.error('Le montant ne peut pas être zéro');
      return;
    }

    try {
      setIsLoading(true);

      if (isEditMode && chargeId) {
        // Modifier la charge existante
        await incidentService.updateAdminCharge(chargeId, {
          bikeId: formData.bikeId && formData.bikeId !== 'none' ? formData.bikeId : undefined,
          amount,
          reason: formData.reason,
          description: formData.description
        });

        const absAmount = Math.abs(amount);
        toast.success(amount < 0
          ? `Remboursement de ${absAmount} FCFA effectué avec succès`
          : `Charge de ${absAmount} FCFA modifiée avec succès`);
      } else {
        // Créer une nouvelle charge ou un remboursement
        await incidentService.createAdminCharge({
          userId: formData.userId,
          bikeId: formData.bikeId && formData.bikeId !== 'none' ? formData.bikeId : undefined,
          amount,
          reason: formData.reason,
          description: formData.description
        });

        const absAmount = Math.abs(amount);
        toast.success(amount < 0
          ? `Remboursement de ${absAmount} FCFA crédité sur le solde de l'utilisateur`
          : `Charge de ${absAmount} FCFA affectée avec succès`);
      }
      
      // Reset form
      setFormData({
        userId: preselectedUserId || '',
        bikeId: preselectedBikeId || 'none',
        amount: '',
        reason: '',
        description: ''
      });

      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} charge:`, error);
      toast.error(error.message || `Erreur lors de la ${isEditMode ? 'modification' : 'création'} de la charge`);
    } finally {
      setIsLoading(false);
    }
  };

  const reasonOptions = [
    { value: 'damage', label: 'Dommage au vélo' },
    { value: 'theft', label: 'Vol ou perte' },
    { value: 'late_return', label: 'Retour tardif' },
    { value: 'cleaning', label: 'Nettoyage requis' },
    { value: 'repair', label: 'Réparation nécessaire' },
    { value: 'accessory_loss', label: 'Perte d\'accessoire' },
    { value: 'other', label: 'Autre' }
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        {(() => {
          const currentAmount = parseFloat(formData.amount);
          const isRefund = !isNaN(currentAmount) && currentAmount < 0;
          return (
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {isRefund
                  ? <TrendingUp className="w-5 h-5 text-green-500" />
                  : <AlertTriangle className="w-5 h-5 text-orange-500" />}
                {isEditMode
                  ? (isRefund ? 'Modifier le remboursement' : 'Modifier la charge')
                  : (isRefund ? 'Rembourser un utilisateur' : 'Affecter une charge à un utilisateur')}
              </DialogTitle>
              <DialogDescription>
                {isEditMode
                  ? 'Modifiez les informations de la charge/remboursement administratif'
                  : isRefund
                    ? 'Un montant négatif crédite le solde de l\'utilisateur (remboursement).'
                    : 'Un montant positif sera déduit de la caution de l\'utilisateur.'}
              </DialogDescription>
            </DialogHeader>
          );
        })()}

        <div className="space-y-4 py-4">
          {loadingData ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-500">Chargement...</p>
            </div>
          ) : (
            <>
              {/* Sélection utilisateur (désactivé en mode édition) */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Utilisateur *
                </Label>
                <Select 
                  value={formData.userId} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, userId: value }))}
                  disabled={isEditMode}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un utilisateur" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.firstName} {user.lastName} - {user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {selectedUser && (
                  <div className="p-3 bg-gray-50 rounded-lg text-sm">
                    <p><strong>Caution actuelle:</strong> {selectedUser.depositBalance?.toLocaleString() || 0} FCFA</p>
                    <p><strong>Solde wallet:</strong> {selectedUser.accountBalance?.toLocaleString() || 0} FCFA</p>
                  </div>
                )}
              </div>

              {/* Sélection vélo (optionnel) */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Bike className="w-4 h-4" />
                  Vélo concerné (optionnel)
                </Label>
                <Select 
                  value={formData.bikeId} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, bikeId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un vélo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun vélo spécifique</SelectItem>
                    {bikes.map(bike => (
                      <SelectItem key={bike.id} value={bike.id}>
                        {bike.code} - {bike.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Montant */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Montant (FCFA) *
                  <span className="text-xs text-gray-400 font-normal ml-1">— positif = déduction, négatif = remboursement</span>
                </Label>
                <Input
                  type="number"
                  placeholder="Ex: 5000 ou -2000 pour un remboursement"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  className={parseFloat(formData.amount) < 0 ? 'border-green-400 focus:ring-green-400' : ''}
                />
                {parseFloat(formData.amount) < 0 && (
                  <p className="text-xs text-green-600 font-medium">
                    Remboursement de {Math.abs(parseFloat(formData.amount)).toLocaleString()} FCFA → sera ajouté au solde de l'utilisateur
                  </p>
                )}
              </div>

              {/* Raison */}
              <div className="space-y-2">
                <Label>Raison *</Label>
                <Select 
                  value={formData.reason} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, reason: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une raison" />
                  </SelectTrigger>
                  <SelectContent>
                    {reasonOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label>Description détaillée (optionnel)</Label>
                <Textarea
                  placeholder="Décrivez en détail la raison de cette charge..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              {/* Warning adaptatif */}
              {(() => {
                const amt = parseFloat(formData.amount);
                if (!isNaN(amt) && amt < 0) {
                  return (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-sm text-green-800">
                        Ce remboursement sera crédité directement sur le solde wallet de l'utilisateur.
                      </p>
                    </div>
                  );
                }
                return (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                      ⚠️ Cette charge sera déduite de la caution de l'utilisateur.
                      Si la caution est insuffisante, le montant restant sera ajouté au solde négatif.
                    </p>
                  </div>
                );
              })()}
            </>
          )}
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose} 
            disabled={isLoading}
            aria-label={t('aria.cancel') || 'Annuler'}
          >
            {t('common.cancel') || 'Annuler'}
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading || loadingData || !formData.userId || !formData.amount || !formData.reason}
            aria-label={isEditMode ? (t('aria.editCharge') || 'Modifier la charge') : (t('aria.assignCharge') || 'Affecter la charge')}
          >
            {isLoading ? (t('common.processing') || 'Traitement...') : isEditMode ? (t('charges.edit') || 'Modifier la charge') : (t('charges.assign') || 'Affecter la charge')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}