import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { AlertTriangle, DollarSign, Bike, User } from 'lucide-react';
import { toast } from 'sonner';
import { walletService } from '../../../services/api/wallet.service';
import { bikeService, type BikePosition } from '../../../services/api/bike.service';
import { userService, type User as UserType } from '../../../services/api/user.service';
import { incidentService } from '../../../services/api/incident.service';

interface AdminChargeModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  preselectedUserId?: string;
  preselectedBikeId?: string;
}

export function AdminChargeModal({ 
  open, 
  onClose, 
  onSuccess,
  preselectedUserId,
  preselectedBikeId 
}: AdminChargeModalProps) {
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
      loadData();
    }
  }, [open]);

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

  const handleSubmit = async () => {
    if (!formData.userId || !formData.amount || !formData.reason) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Le montant doit être supérieur à 0');
      return;
    }

    try {
      setIsLoading(true);

      // Appeler l'API pour créer la charge via le service
      await incidentService.createAdminCharge({
        userId: formData.userId,
        bikeId: formData.bikeId && formData.bikeId !== 'none' ? formData.bikeId : undefined,
        amount,
        reason: formData.reason,
        description: formData.description
      });

      toast.success(`Charge de ${amount} FCFA affectée avec succès`);
      
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
      console.error('Error creating charge:', error);
      toast.error(error.message || 'Erreur lors de la création de la charge');
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Affecter une charge à un utilisateur
          </DialogTitle>
          <DialogDescription>
            Créez une charge administrative qui sera déduite de la caution de l'utilisateur
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {loadingData ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-500">Chargement...</p>
            </div>
          ) : (
            <>
              {/* Sélection utilisateur */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Utilisateur *
                </Label>
                <Select 
                  value={formData.userId} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, userId: value }))}
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
                </Label>
                <Input
                  type="number"
                  placeholder="Ex: 5000"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  min="1"
                />
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

              {/* Warning */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  ⚠️ Cette charge sera déduite de la caution de l'utilisateur. 
                  Si la caution est insuffisante, le montant restant sera ajouté au solde négatif.
                </p>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading || loadingData || !formData.userId || !formData.amount || !formData.reason}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {isLoading ? 'Traitement...' : 'Affecter la charge'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}