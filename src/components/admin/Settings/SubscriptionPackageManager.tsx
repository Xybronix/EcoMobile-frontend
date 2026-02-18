import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../ui/dialog';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Switch } from '../../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Textarea } from '../../ui/textarea';
import { toast } from 'sonner';
import { useTranslation } from '../../../lib/i18n';
import { adminService } from '../../../services/api/admin.service';

export function SubscriptionPackageManager() {
  const { t, language } = useTranslation();
  const [packages, setPackages] = useState<any[]>([]);
  const [isLoadingPackages, setIsLoadingPackages] = useState(true);
  const [isAddingPackage, setIsAddingPackage] = useState(false);
  const [isEditingPackage, setIsEditingPackage] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [expandedPackageId, setExpandedPackageId] = useState<string | null>(null);
  
  // Formula states
  const [isAddingFormula, setIsAddingFormula] = useState(false);
  const [isEditingFormula, setIsEditingFormula] = useState(false);
  const [selectedFormula, setSelectedFormula] = useState<any>(null);
  
  // Promotion states
  const [isAddingPromotion, setIsAddingPromotion] = useState(false);
  const [isEditingPromotion, setIsEditingPromotion] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState<any>(null);
  const [promotions, setPromotions] = useState<any[]>([]);
  
  // Confirmation states
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'package' | 'formula' | 'promotion'; id: string; name: string } | null>(null);

  // Form states
  const [packageForm, setPackageForm] = useState({
    name: '',
    description: ''
  });

  const [formulaForm, setFormulaForm] = useState({
    name: '',
    description: '',
    numberOfDays: 1,
    price: 0,
    dayStartHour: 0,
    dayEndHour: 23,
    chargeAfterHours: false,
    afterHoursPrice: 0,
    afterHoursType: 'FIXED_PRICE'
  });

  const [promotionForm, setPromotionForm] = useState({
    name: '',
    description: '',
    discountType: 'PERCENTAGE',
    discountValue: 0,
    startDate: '',
    endDate: '',
    usageLimit: null as number | null,
    packageIds: [] as string[],
    formulaIds: [] as string[]
  });

  useEffect(() => {
    loadPackages();
    loadPromotions();
  }, []);

  const loadPackages = async () => {
    try {
      setIsLoadingPackages(true);
      const data = await adminService.getSubscriptionPackages();
      setPackages(data || []);
    } catch (error: any) {
      console.error('loadPackages error', error);
      toast.error(error?.message || 'Erreur lors du chargement des forfaits');
    } finally {
      setIsLoadingPackages(false);
    }
  };

  const loadPromotions = async () => {
    try {
      const data = await adminService.getPromotions();
      setPromotions(data || []);
    } catch (error: any) {
      console.error('loadPromotions error', error);
    }
  };

  const handleSavePackage = async () => {
    if (!packageForm.name.trim()) {
      toast.error('Le nom du forfait est requis');
      return;
    }

    try {
      if (isEditingPackage && selectedPackage) {
        // UPDATE
        await adminService.updateSubscriptionPackage(selectedPackage.id, packageForm);
        toast.success('Forfait mis à jour');
      } else {
        // CREATE
        await adminService.createSubscriptionPackage(packageForm);
        toast.success('Forfait créé');
      }
      await loadPackages();
      setIsAddingPackage(false);
      setIsEditingPackage(false);
      setPackageForm({ name: '', description: '' });
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const handleDeletePackage = async (packageId: string, packageName: string) => {
    setDeleteConfirm({ type: 'package', id: packageId, name: packageName });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    
    try {
      if (deleteConfirm.type === 'package') {
        await adminService.deleteSubscriptionPackage(deleteConfirm.id);
        toast.success('Forfait supprimé');
        await loadPackages();
      } else if (deleteConfirm.type === 'formula') {
        await adminService.deleteSubscriptionFormula(deleteConfirm.id);
        toast.success('Formule supprimée');
        await loadPackages();
      } else if (deleteConfirm.type === 'promotion') {
        await adminService.deletePromotion(deleteConfirm.id);
        toast.success('Promotion supprimée');
        await loadPromotions();
      }
      setDeleteConfirm(null);
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleSavePromotion = async () => {
    if (!promotionForm.name.trim() || !selectedPackage) {
      toast.error('Le nom et le forfait sont requis');
      return;
    }

    try {
      const payload = {
        ...promotionForm,
        packageIds: [selectedPackage.id],
        discountValue: parseFloat(String(promotionForm.discountValue)) || 0,
        usageLimit: promotionForm.usageLimit ? parseInt(String(promotionForm.usageLimit)) : null
      };

      if (isEditingPromotion && selectedPromotion) {
        await adminService.updatePromotion(selectedPromotion.id, payload);
        toast.success('Promotion mise à jour');
      } else {
        await adminService.createPromotion(payload);
        toast.success('Promotion créée');
      }
      await loadPromotions();
      await loadPackages();
      setIsAddingPromotion(false);
      setIsEditingPromotion(false);
      setSelectedPromotion(null);
      setPromotionForm({
        name: '',
        description: '',
        discountType: 'PERCENTAGE',
        discountValue: 0,
        startDate: '',
        endDate: '',
        usageLimit: null,
        packageIds: [],
        formulaIds: []
      });
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const handleDeletePromotion = async (promotionId: string, promotionName: string) => {
    setDeleteConfirm({ type: 'promotion', id: promotionId, name: promotionName });
  };

  const handleSaveFormula = async () => {
    if (!formulaForm.name.trim() || !selectedPackage) {
      toast.error('Le nom et le forfait sont requis');
      return;
    }

    try {
      if (isEditingFormula && selectedFormula) {
        // UPDATE
        await adminService.updateSubscriptionFormula(selectedFormula.id, { ...formulaForm });
        toast.success('Formule mise à jour');
      } else {
        // CREATE
        await adminService.createSubscriptionFormula({
          ...formulaForm,
          packageId: selectedPackage.id
        });
        toast.success('Formule créée');
      }
      await loadPackages();
      setIsAddingFormula(false);
      setIsEditingFormula(false);
      setSelectedFormula(null);
      setFormulaForm({
        name: '',
        description: '',
        numberOfDays: 1,
        price: 0,
        dayStartHour: 0,
        dayEndHour: 23,
        chargeAfterHours: false,
        afterHoursPrice: 0,
        afterHoursType: 'FIXED_PRICE'
      });
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const handleDeleteFormula = async (formulaId: string, formulaName: string) => {
    setDeleteConfirm({ type: 'formula', id: formulaId, name: formulaName });
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {language === 'fr' ? 'Gestion des Forfaits' : 'Subscription Plans Management'}
        </h2>
        <p className="text-gray-600">
          {language === 'fr' 
            ? 'Créez et gérez les forfaits d\'abonnement, les formules et les promotions.'
            : 'Create and manage subscription packages, formulas, and promotions.'}
        </p>
      </div>

      {/* Add Package Button */}
      <div className="flex justify-end">
        <Button 
          onClick={() => {
            setIsAddingPackage(true);
            setPackageForm({ name: '', description: '' });
          }}
          className="flex items-center gap-2 bg-green-600 text-white hover:bg-green-700"
        >
          <Plus className="w-4 h-4" />
          {language === 'fr' ? 'Nouveau Forfait' : 'New Package'}
        </Button>
      </div>

      {/* Packages List */}
      <div className="space-y-4">
        {packages.length === 0 ? (
          <Card className="p-8 text-center text-gray-500">
            {language === 'fr' ? 'Aucun forfait créé' : 'No packages created'}
          </Card>
        ) : (
          packages.map(pkg => (
            <Card key={pkg.id} className="overflow-hidden">
              {/* Package Header */}
              <div 
                className="p-6 cursor-pointer hover:bg-gray-50 flex items-center justify-between"
                onClick={() => setExpandedPackageId(expandedPackageId === pkg.id ? null : pkg.id)}
              >
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900">{pkg.name}</h3>
                  {pkg.description && (
                    <p className="text-sm text-gray-600 mt-1">{pkg.description}</p>
                  )}
                  <div className="mt-2 text-xs text-gray-500">
                    {language === 'fr' ? 'Formules: ' : 'Formulas: '} {pkg.formulas?.length || 0}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e: { stopPropagation: () => void; }) => {
                      e.stopPropagation();
                      setSelectedPackage(pkg);
                      setPackageForm({ name: pkg.name, description: pkg.description });
                      setIsEditingPackage(true);
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e: { stopPropagation: () => void; }) => {
                      e.stopPropagation();
                      handleDeletePackage(pkg.id, pkg.name);
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                  {expandedPackageId === pkg.id ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>

              {/* Package Details */}
              {expandedPackageId === pkg.id && (
                <div className="border-t p-6 bg-gray-50">
                  {/* Formulas */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-900">
                        {language === 'fr' ? 'Formules' : 'Formulas'}
                      </h4>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedPackage(pkg);
                          setIsAddingFormula(true);
                          setSelectedFormula(null);
                          setFormulaForm({
                            name: '',
                            description: '',
                            numberOfDays: 1,
                            price: 0,
                            dayStartHour: 0,
                            dayEndHour: 23,
                            chargeAfterHours: false,
                            afterHoursPrice: 0,
                            afterHoursType: 'FIXED_PRICE'
                          });
                        }}
                        className="flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        {language === 'fr' ? 'Ajouter' : 'Add'}
                      </Button>
                    </div>

                    {pkg.formulas && pkg.formulas.length > 0 ? (
                      <div className="space-y-2">
                        {pkg.formulas.map((formula: any) => (
                          <div key={formula.id} className="bg-white p-4 rounded-lg border border-gray-200">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h5 className="font-semibold text-gray-900">{formula.name}</h5>
                                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mt-2">
                                  <div><strong>Jours:</strong> {formula.numberOfDays}</div>
                                  <div><strong>Prix:</strong> {formula.price}</div>
                                  <div><strong>Horaires:</strong> {formula.dayStartHour}h-{formula.dayEndHour}h</div>
                                  {formula.chargeAfterHours && (
                                    <div><strong>Après horaire:</strong> {formula.afterHoursPrice}</div>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedFormula(formula);
                                    setFormulaForm(formula);
                                    setIsEditingFormula(true);
                                    setIsAddingFormula(true);
                                  }}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteFormula(formula.id, formula.name)}
                                >
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">
                        {language === 'fr' ? 'Aucune formule' : 'No formulas'}
                      </p>
                    )}
                  </div>

                  {/* Promotions */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-900">
                        {language === 'fr' ? 'Promotions' : 'Promotions'}
                      </h4>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedPackage(pkg);
                          setIsAddingPromotion(true);
                          setIsEditingPromotion(false);
                          setSelectedPromotion(null);
                          setPromotionForm({
                            name: '',
                            description: '',
                            discountType: 'PERCENTAGE',
                            discountValue: 0,
                            startDate: '',
                            endDate: '',
                            usageLimit: null,
                            packageIds: [],
                            formulaIds: []
                          });
                        }}
                        className="flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        {language === 'fr' ? 'Ajouter' : 'Add'}
                      </Button>
                    </div>

                    {pkg.promotions && pkg.promotions.length > 0 ? (
                      <div className="space-y-2">
                        {pkg.promotions.map((promo: any) => (
                          <div key={promo.id} className="bg-white p-4 rounded-lg border border-gray-200">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h5 className="font-semibold text-gray-900">{promo.name}</h5>
                                <p className="text-sm text-gray-600">{promo.description}</p>
                                <div className="text-sm text-gray-600 mt-2">
                                  <strong>{promo.discountValue}</strong> {promo.discountType === 'PERCENTAGE' ? '%' : 'DZD'}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedPromotion(promo);
                                    setPromotionForm(promo);
                                    setIsEditingPromotion(true);
                                    setIsAddingPromotion(true);
                                    setSelectedPackage(pkg);
                                  }}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeletePromotion(promo.id, promo.name)}
                                >
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </Button>
                                <Badge variant={promo.isActive ? 'default' : 'secondary'}>
                                  {promo.isActive ? t('common.active') : t('common.inactive')}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">
                        {language === 'fr' ? 'Aucune promotion' : 'No promotions'}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Package Dialog */}
      <Dialog open={isAddingPackage || isEditingPackage} onOpenChange={(open) => {
        if (!open) {
          setIsAddingPackage(false);
          setIsEditingPackage(false);
          setSelectedPackage(null);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isEditingPackage 
                ? (language === 'fr' ? 'Modifier le Forfait' : 'Edit Package')
                : (language === 'fr' ? 'Nouveau Forfait' : 'New Package')
              }
            </DialogTitle>
            <DialogDescription>
              {language === 'fr' ? 'Remplissez les informations du forfait' : 'Fill in the package information'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>{language === 'fr' ? 'Nom du Forfait' : 'Package Name'}</Label>
              <Input
                value={packageForm.name}
                onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })}
                placeholder={language === 'fr' ? 'Ex: Forfait Standard' : 'Ex: Standard Plan'}
              />
            </div>

            <div>
              <Label>{language === 'fr' ? 'Description' : 'Description'}</Label>
              <Textarea
                value={packageForm.description}
                onChange={(e) => setPackageForm({ ...packageForm, description: e.target.value })}
                placeholder={language === 'fr' ? 'Description du forfait' : 'Package description'}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline"
              onClick={() => {
                setIsAddingPackage(false);
                setIsEditingPackage(false);
              }}
            >
              {language === 'fr' ? 'Annuler' : 'Cancel'}
            </Button>
            <Button 
              className="bg-green-600 text-white hover:bg-green-700"
              onClick={handleSavePackage}
            >
              {language === 'fr' ? 'Enregistrer' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Formula Dialog */}
      <Dialog open={isAddingFormula} onOpenChange={(open) => {
        if (!open) {
          setIsAddingFormula(false);
          setIsEditingFormula(false);
          setSelectedFormula(null);
        }
      }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditingFormula 
                ? (language === 'fr' ? 'Modifier la Formule' : 'Edit Formula')
                : (language === 'fr' ? 'Nouvelle Formule' : 'New Formula')
              }
            </DialogTitle>
            <DialogDescription>
              {language === 'fr' ? 'Configurez les détails de la formule' : 'Configure the formula details'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>{language === 'fr' ? 'Nom' : 'Name'}</Label>
              <Input
                value={formulaForm.name}
                onChange={(e) => setFormulaForm({ ...formulaForm, name: e.target.value })}
                placeholder="Ex: Forfait Jour"
              />
            </div>

            <div>
              <Label>{language === 'fr' ? 'Description' : 'Description'}</Label>
              <Textarea
                value={formulaForm.description}
                onChange={(e) => setFormulaForm({ ...formulaForm, description: e.target.value })}
                placeholder="Description de la formule"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{language === 'fr' ? 'Nombre de Jours' : 'Number of Days'}</Label>
                <Input
                  type="number"
                  value={formulaForm.numberOfDays}
                  onChange={(e) => setFormulaForm({ ...formulaForm, numberOfDays: parseInt(e.target.value) })}
                  min="1"
                />
              </div>

              <div>
                <Label>{language === 'fr' ? 'Prix' : 'Price'}</Label>
                <Input
                  type="number"
                  value={formulaForm.price}
                  onChange={(e) => setFormulaForm({ ...formulaForm, price: parseFloat(e.target.value) })}
                  step="0.01"
                  min="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{language === 'fr' ? 'Heure de Début' : 'Start Hour'}</Label>
                <Input
                  type="number"
                  value={formulaForm.dayStartHour}
                  onChange={(e) => setFormulaForm({ ...formulaForm, dayStartHour: parseInt(e.target.value) })}
                  min="0"
                  max="23"
                />
              </div>

              <div>
                <Label>{language === 'fr' ? 'Heure de Fin' : 'End Hour'}</Label>
                <Input
                  type="number"
                  value={formulaForm.dayEndHour}
                  onChange={(e) => setFormulaForm({ ...formulaForm, dayEndHour: parseInt(e.target.value) })}
                  min="0"
                  max="23"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={formulaForm.chargeAfterHours}
                onCheckedChange={(checked: any) => setFormulaForm({ ...formulaForm, chargeAfterHours: checked })}
              />
              <Label>{language === 'fr' ? 'Facturer après les horaires' : 'Charge after hours'}</Label>
            </div>

            {formulaForm.chargeAfterHours && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{language === 'fr' ? 'Prix Après Horaire' : 'After Hours Price'}</Label>
                  <Input
                    type="number"
                    value={formulaForm.afterHoursPrice}
                    onChange={(e) => setFormulaForm({ ...formulaForm, afterHoursPrice: parseFloat(e.target.value) })}
                    step="0.01"
                    min="0"
                  />
                </div>

                <div>
                  <Label>{language === 'fr' ? 'Type' : 'Type'}</Label>
                  <Select value={formulaForm.afterHoursType} onValueChange={(value) => setFormulaForm({ ...formulaForm, afterHoursType: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FIXED_PRICE">
                        {language === 'fr' ? 'Prix Fixe' : 'Fixed Price'}
                      </SelectItem>
                      <SelectItem value="PERCENTAGE">
                        {language === 'fr' ? 'Pourcentage' : 'Percentage'}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline"
              onClick={() => {
                setIsAddingFormula(false);
                setIsEditingFormula(false);
              }}
            >
              {language === 'fr' ? 'Annuler' : 'Cancel'}
            </Button>
            <Button 
              className="bg-green-600 text-white hover:bg-green-700"
              onClick={handleSaveFormula}
            >
              {language === 'fr' ? 'Enregistrer' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Promotion Dialog */}
      <Dialog open={isAddingPromotion} onOpenChange={(open) => {
        if (!open) {
          setIsAddingPromotion(false);
          setIsEditingPromotion(false);
          setSelectedPromotion(null);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isEditingPromotion 
                ? (language === 'fr' ? 'Modifier la Promotion' : 'Edit Promotion')
                : (language === 'fr' ? 'Nouvelle Promotion' : 'New Promotion')
              }
            </DialogTitle>
            <DialogDescription>
              {language === 'fr' ? 'Configurez les détails de la promotion' : 'Configure the promotion details'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>{language === 'fr' ? 'Nom' : 'Name'}</Label>
              <Input
                value={promotionForm.name}
                onChange={(e) => setPromotionForm({ ...promotionForm, name: e.target.value })}
                placeholder="Ex: Réduction 20%"
              />
            </div>

            <div>
              <Label>{language === 'fr' ? 'Description' : 'Description'}</Label>
              <Textarea
                value={promotionForm.description}
                onChange={(e) => setPromotionForm({ ...promotionForm, description: e.target.value })}
                placeholder="Description de la promotion"
              />
            </div>

            <div>
              <Label>{language === 'fr' ? 'Type de Réduction' : 'Discount Type'}</Label>
              <Select value={promotionForm.discountType} onValueChange={(value) => setPromotionForm({ ...promotionForm, discountType: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENTAGE">
                    {language === 'fr' ? 'Pourcentage' : 'Percentage'}
                  </SelectItem>
                  <SelectItem value="FIXED_AMOUNT">
                    {language === 'fr' ? 'Montant Fixe' : 'Fixed Amount'}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>{language === 'fr' ? 'Valeur de Réduction' : 'Discount Value'}</Label>
              <Input
                type="number"
                value={promotionForm.discountValue || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setPromotionForm({ ...promotionForm, discountValue: val === '' ? 0 : parseFloat(val) || 0 });
                }}
                step="0.01"
                min="0"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{language === 'fr' ? 'Date de Début' : 'Start Date'}</Label>
                <Input
                  type="date"
                  value={promotionForm.startDate}
                  onChange={(e) => setPromotionForm({ ...promotionForm, startDate: e.target.value })}
                />
              </div>

              <div>
                <Label>{language === 'fr' ? 'Date de Fin' : 'End Date'}</Label>
                <Input
                  type="date"
                  value={promotionForm.endDate}
                  onChange={(e) => setPromotionForm({ ...promotionForm, endDate: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>{language === 'fr' ? 'Limite d\'Utilisation' : 'Usage Limit'}</Label>
              <Input
                type="number"
                value={promotionForm.usageLimit || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setPromotionForm({ ...promotionForm, usageLimit: val === '' ? null : parseInt(val) || null });
                }}
                min="1"
                placeholder={language === 'fr' ? 'Laissez vide pour illimité' : 'Leave empty for unlimited'}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline"
              onClick={() => {
                setIsAddingPromotion(false);
                setIsEditingPromotion(false);
                setSelectedPromotion(null);
              }}
            >
              {language === 'fr' ? 'Annuler' : 'Cancel'}
            </Button>
            <Button 
              className="bg-green-600 text-white hover:bg-green-700"
              onClick={handleSavePromotion}
            >
              {language === 'fr' ? 'Enregistrer' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirm !== null} onOpenChange={(open) => {
        if (!open) setDeleteConfirm(null);
      }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{language === 'fr' ? 'Confirmer la Suppression' : 'Confirm Deletion'}</DialogTitle>
            <DialogDescription>
              {language === 'fr' 
                ? `Êtes-vous sûr de vouloir supprimer "${deleteConfirm?.name}" ? Cette action est définitive.`
                : `Are you sure you want to delete "${deleteConfirm?.name}"? This action cannot be undone.`
              }
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button 
              variant="outline"
              onClick={() => setDeleteConfirm(null)}
            >
              {language === 'fr' ? 'Annuler' : 'Cancel'}
            </Button>
            <Button 
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={confirmDelete}
            >
              {language === 'fr' ? 'Supprimer' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
