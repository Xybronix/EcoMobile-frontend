import React, { useState, useEffect } from 'react';
import { DollarSign, Bike, Battery, MapPin, Plus, Edit, Check, X, Clock, Tag, Trash2, Eye, EyeOff } from 'lucide-react';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { companyService, PricingPlan, PricingRule, PricingConfig as PricingConfigType, Promotion } from '../../../services/api/company.service';
import { bikeService } from '../../../services/api/bike.service';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../ui/dialog';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Switch } from '../../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Textarea } from '../../ui/textarea';
import { toast } from 'sonner';
import { useTranslation } from '../../../lib/i18n';

export function PricingConfig() {
  const { t } = useTranslation();
  const [pricingConfig, setPricingConfig] = useState<PricingConfigType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Dialog states
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
  const [selectedRule, setSelectedRule] = useState<PricingRule | null>(null);
  const [isEditingPlan, setIsEditingPlan] = useState(false);
  const [isEditingRule, setIsEditingRule] = useState(false);
  const [isAddingNewPlan, setIsAddingNewPlan] = useState(false);
  const [isAddingNewRule, setIsAddingNewRule] = useState(false);
  const [isPromotionDialogOpen, setIsPromotionDialogOpen] = useState(false);
  const [isDeletingPlan, setIsDeletingPlan] = useState<string | null>(null);
  const [isDeletingRule, setIsDeletingRule] = useState<string | null>(null);
  const [isDeletingPromotion, setIsDeletingPromotion] = useState<string | null>(null);
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
  const [isViewingPromotion, setIsViewingPromotion] = useState(false);
  const [selectedPlanForDetails, setSelectedPlanForDetails] = useState<PricingPlan | null>(null);
  const [isPlanDetailsDialogOpen, setIsPlanDetailsDialogOpen] = useState(false);
  const [planBikes, setPlanBikes] = useState<any[]>([]);
  const [planBikesLoading, setPlanBikesLoading] = useState(false);

  // Form states
  const [editedPlan, setEditedPlan] = useState({
    name: '',
    hourlyRate: 0,
    dailyRate: 0,
    weeklyRate: 0,
    monthlyRate: 0,
    minimumHours: 1,
    discount: 0,
    isActive: true,
    conditions: [] as string[],
    hasOverride: false,
    overTimeType: 'PERCENTAGE_REDUCTION' as 'FIXED_PRICE' | 'PERCENTAGE_REDUCTION',
    overTimeValue: 0,
    // Plages horaires pour chaque type de forfait
    hourlyStartHour: null as number | null,
    hourlyEndHour: null as number | null,
    dailyStartHour: null as number | null,
    dailyEndHour: null as number | null,
    weeklyStartHour: null as number | null,
    weeklyEndHour: null as number | null,
    monthlyStartHour: null as number | null,
    monthlyEndHour: null as number | null
  });

  const [editedRule, setEditedRule] = useState({
    name: '',
    dayOfWeek: null as number | null,
    startHour: null as number | null,
    endHour: null as number | null,
    multiplier: 1,
    isActive: true,
    priority: 0
  });

  const [editedPromotion, setEditedPromotion] = useState({
    name: '',
    description: '',
    discountType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED_AMOUNT',
    discountValue: 0,
    startDate: '',
    endDate: '',
    usageLimit: undefined as number | undefined,
    planIds: [] as string[]
  });

  const [formErrors, setFormErrors] = useState<{
    name?: string;
    hourlyRate?: string;
    dailyRate?: string;
    weeklyRate?: string;
    monthlyRate?: string;
    multiplier?: string;
  }>({});

  const daysOfWeek = [
    { value: null, label: 'Tous les jours' },
    { value: 0, label: 'Dimanche' },
    { value: 1, label: 'Lundi' },
    { value: 2, label: 'Mardi' },
    { value: 3, label: 'Mercredi' },
    { value: 4, label: 'Jeudi' },
    { value: 5, label: 'Vendredi' },
    { value: 6, label: 'Samedi' },
  ];

  useEffect(() => {
    const loadPricing = async () => {
      try {
        const data = await companyService.getPricing();
        const plansWithOverrides = data.plans?.map(plan => ({
          ...plan,
          override: plan.override ?? undefined
        })) || [];
        
        setPricingConfig({
          ...data,
          plans: plansWithOverrides
        });
      } catch (error) {
        toast.error('Erreur lors du chargement de la configuration tarifaire');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPricing();
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price);
  };

  const validatePlanForm = (): boolean => {
    const errors: typeof formErrors = {};
    
    if (!editedPlan.name.trim()) {
      errors.name = 'Le nom est requis';
    }
    
    // Accepter les montants 0 et les inputs vides (seront traités comme 0)
    // Pas de validation stricte sur les tarifs car ils peuvent être 0 ou vides

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateRuleForm = (): boolean => {
    const errors: typeof formErrors = {};
    
    if (!editedRule.name.trim()) {
      errors.name = 'Le nom est requis';
    }
    
    if (editedRule.multiplier <= 0) {
      errors.multiplier = 'Le multiplicateur doit être supérieur à 0';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePromotionForm = (): boolean => {
    if (!editedPromotion.name.trim()) {
      toast.error('Le nom de la promotion est requis');
      return false;
    }

    if (editedPromotion.discountValue <= 0) {
      toast.error('La valeur de réduction doit être supérieure à 0');
      return false;
    }

    if (editedPromotion.discountType === 'PERCENTAGE' && editedPromotion.discountValue > 100) {
      toast.error('La réduction en pourcentage ne peut pas dépasser 100%');
      return false;
    }

    const startDate = new Date(editedPromotion.startDate);
    const endDate = new Date(editedPromotion.endDate);
    
    if (endDate <= startDate) {
      toast.error('La date de fin doit être après la date de début');
      return false;
    }

    if (editedPromotion.planIds.length === 0) {
      toast.error('Veuillez sélectionner au moins un plan');
      return false;
    }

    return true;
  };

  const handleSavePlan = async () => {
    if (!validatePlanForm()) {
      toast.error('Veuillez corriger les erreurs');
      return;
    }

    const planData = {
      name: editedPlan.name,
      hourlyRate: editedPlan.hourlyRate,
      dailyRate: editedPlan.dailyRate,
      weeklyRate: editedPlan.weeklyRate,
      monthlyRate: editedPlan.monthlyRate,
      minimumHours: editedPlan.minimumHours,
      discount: editedPlan.discount,
      isActive: editedPlan.isActive,
      conditions: editedPlan.conditions
    }; 

    try {
      let planId: string | undefined;
      
      if (isAddingNewPlan) {
        const newPlanResponse = await companyService.createPlan(planData);
        const newPlan = newPlanResponse.data;
        planId = newPlan.id;

        const updatedPlans = [...(pricingConfig?.plans || []), newPlan];
        const newConfig = {
          ...pricingConfig,
          plans: updatedPlans
        };
        setPricingConfig(newConfig as PricingConfigType);
        
        toast.success(`Nouveau plan "${editedPlan.name}" créé avec succès`);
      } else {
        const updatedPlans = (pricingConfig?.plans || []).map(plan => 
          plan.id === (selectedPlan?.id ?? '') 
            ? { ...plan, ...editedPlan, id: selectedPlan!.id }
            : plan
        );

        const newConfig = {
          ...pricingConfig,
          plans: updatedPlans
        };

        await companyService.updatePricing(newConfig);
        
        const freshData = await companyService.getPricing();
        setPricingConfig(freshData);
        
        const updatedPlan = freshData.plans?.find(p => p.name === editedPlan.name);
        planId = updatedPlan?.id;

        if (!planId) {
          planId = selectedPlan?.id;
        }
        
        toast.success(`Plan "${editedPlan.name}" mis à jour avec succès`);
      }

      if (planId) {
        if (editedPlan.hasOverride && editedPlan.overTimeValue > 0) {
          try {
            await companyService.createPlanOverride(
              planId, 
              editedPlan.overTimeType, 
              editedPlan.overTimeValue,
              {
                hourlyStartHour: editedPlan.hourlyStartHour,
                hourlyEndHour: editedPlan.hourlyEndHour,
                dailyStartHour: editedPlan.dailyStartHour,
                dailyEndHour: editedPlan.dailyEndHour,
                weeklyStartHour: editedPlan.weeklyStartHour,
                weeklyEndHour: editedPlan.weeklyEndHour,
                monthlyStartHour: editedPlan.monthlyStartHour,
                monthlyEndHour: editedPlan.monthlyEndHour
              }
            );
          } catch (error: any) {
            toast.error('Erreur lors de la création de la tarification spéciale');
          }
        } else {
          try {
            await companyService.deletePlanOverride(planId);
          } catch (error: any) {
          }
        }
        
        const finalData = await companyService.getPricing();
        setPricingConfig(finalData);
      }
      
      setIsEditingPlan(false);
      setIsAddingNewPlan(false);
      setSelectedPlan(null);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la sauvegarde');
      console.error('Erreur sauvegarde plan:', error);
    }
  };

  const handleSaveRule = async () => {
    if (!validateRuleForm()) {
      toast.error('Veuillez corriger les erreurs');
      return;
    }

    try {
      const updatedRules: PricingRule[] = (isAddingNewRule 
        ? [...(pricingConfig?.rules || []), { 
            ...editedRule, 
            id: Date.now().toString(),
            startHour: editedRule.startHour ?? undefined, 
            endHour: editedRule.endHour ?? undefined, 
            dayOfWeek: editedRule.dayOfWeek ?? undefined 
          }]
        : (pricingConfig?.rules || []).map(rule => 
            rule.id === (selectedRule?.id ?? '')
              ? { 
                  ...editedRule, 
                  id: selectedRule!.id,
                  startHour: editedRule.startHour ?? undefined,
                  endHour: editedRule.endHour ?? undefined,
                  dayOfWeek: editedRule.dayOfWeek ?? undefined
                }
              : rule
          )
      ) as PricingRule[];

      const newConfig = {
        ...pricingConfig,
        rules: updatedRules
      };

      await companyService.updatePricing(newConfig);
      setPricingConfig(newConfig as PricingConfigType);
      
      toast.success(isAddingNewRule ? 
        `Nouvelle règle "${editedRule.name}" créée avec succès` : 
        `Règle "${editedRule.name}" mise à jour avec succès`
      );
      
      setIsEditingRule(false);
      setIsAddingNewRule(false);
      setSelectedRule(null);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la sauvegarde');
    }
  };

  const handleSavePromotion = async () => {
    if (!validatePromotionForm()) {
      return;
    }

    try {
      if (selectedPromotion) {
        // Mise à jour d'une promotion existante
        await companyService.updatePromotion(selectedPromotion.id!, editedPromotion);
        toast.success(`Promotion "${editedPromotion.name}" mise à jour avec succès`);
      } else {
        // Création d'une nouvelle promotion
        await companyService.createPromotion(editedPromotion);
        toast.success(`Promotion "${editedPromotion.name}" créée avec succès`);
      }
      
      // Recharger la configuration
      const data = await companyService.getPricing();
      setPricingConfig(data);
      
      setIsPromotionDialogOpen(false);
      resetPromotionForm();
    } catch (error: any) {
      toast.error(error.message || `Erreur lors de ${selectedPromotion ? 'la mise à jour' : 'la création'} de la promotion`);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    try {
      await companyService.deletePlan(planId);
      
      // Recharger la configuration
      const data = await companyService.getPricing();
      setPricingConfig(data);
      
      toast.success('Plan supprimé avec succès');
      setIsDeletingPlan(null);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la suppression du plan');
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    try {
      await companyService.deleteRule(ruleId);
      
      // Recharger la configuration
      const data = await companyService.getPricing();
      setPricingConfig(data);
      
      toast.success('Règle supprimée avec succès');
      setIsDeletingRule(null);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la suppression de la règle');
    }
  };

  const handleDeletePromotion = async (promotionId: string) => {
    try {
      await companyService.deletePromotion(promotionId);
      
      // Recharger la configuration
      const data = await companyService.getPricing();
      setPricingConfig(data);
      
      toast.success('Promotion supprimée avec succès');
      setIsDeletingPromotion(null);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la suppression de la promotion');
    }
  };

  const handleTogglePlanStatus = async (plan: PricingPlan) => {
    try {
      const updatedPlans = (pricingConfig?.plans || []).map(p => 
        p.id === plan.id 
          ? { ...p, isActive: !p.isActive }
          : p
      );

      const newConfig = {
        ...pricingConfig,
        plans: updatedPlans
      };

      await companyService.updatePricing(newConfig);
      setPricingConfig(newConfig as PricingConfigType);
      
      toast.success(`Plan ${!plan.isActive ? 'activé' : 'désactivé'} avec succès`);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la mise à jour du plan');
    }
  };

  const handleToggleRuleStatus = async (rule: PricingRule) => {
    try {
      const updatedRules = (pricingConfig?.rules || []).map(r => 
        r.id === rule.id 
          ? { ...r, isActive: !r.isActive }
          : r
      );

      const newConfig = {
        ...pricingConfig,
        rules: updatedRules
      };

      await companyService.updatePricing(newConfig);
      setPricingConfig(newConfig as PricingConfigType);
      
      toast.success(`Règle ${!rule.isActive ? 'activée' : 'désactivée'} avec succès`);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la mise à jour de la règle');
    }
  }

  const handleTogglePromotionStatus = async (promotion: Promotion) => {
    try {
      await companyService.togglePromotionStatus(promotion.id!, !promotion.isActive);
      
      // Recharger la configuration
      const data = await companyService.getPricing();
      setPricingConfig(data);
      
      toast.success(`Promotion ${!promotion.isActive ? 'activée' : 'désactivée'} avec succès`);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la modification du statut de la promotion');
    }
  };

  const handleEditPlan = (plan: PricingPlan) => {
    setSelectedPlan(plan);

    const hasOverride = !!plan.override;
    const override = plan.override;

    setEditedPlan({
      name: plan.name,
      hourlyRate: plan.hourlyRate,
      dailyRate: plan.dailyRate,
      weeklyRate: plan.weeklyRate,
      monthlyRate: plan.monthlyRate,
      minimumHours: plan.minimumHours,
      discount: plan.discount,
      isActive: plan.isActive,
      conditions: plan.conditions || [],
      hasOverride: hasOverride,
      overTimeType: override?.overTimeType || 'PERCENTAGE_REDUCTION',
      overTimeValue: override?.overTimeValue || 0,
      hourlyStartHour: override?.hourlyStartHour ?? null,
      hourlyEndHour: override?.hourlyEndHour ?? null,
      dailyStartHour: override?.dailyStartHour ?? null,
      dailyEndHour: override?.dailyEndHour ?? null,
      weeklyStartHour: override?.weeklyStartHour ?? null,
      weeklyEndHour: override?.weeklyEndHour ?? null,
      monthlyStartHour: override?.monthlyStartHour ?? null,
      monthlyEndHour: override?.monthlyEndHour ?? null
    });
    setFormErrors({});
    setIsEditingPlan(true);
  };

  const handleEditRule = (rule: PricingRule) => {
    setSelectedRule(rule);
    setEditedRule({
      name: rule.name,
      dayOfWeek: rule.dayOfWeek || null,
      startHour: rule.startHour || null,
      endHour: rule.endHour || null,
      multiplier: rule.multiplier,
      isActive: rule.isActive,
      priority: rule.priority
    });
    setFormErrors({});
    setIsEditingRule(true);
  };

  const handleAddNewPlan = () => {
    setEditedPlan({
      name: '',
      hourlyRate: 0,
      dailyRate: 0,
      weeklyRate: 0,
      monthlyRate: 0,
      minimumHours: 1,
      discount: 0,
      isActive: true,
      conditions: [],
      hasOverride: false,
      overTimeType: 'PERCENTAGE_REDUCTION' as 'FIXED_PRICE' | 'PERCENTAGE_REDUCTION',
      overTimeValue: 0,
      hourlyStartHour: null,
      hourlyEndHour: null,
      dailyStartHour: null,
      dailyEndHour: null,
      weeklyStartHour: null,
      weeklyEndHour: null,
      monthlyStartHour: null,
      monthlyEndHour: null
    });
    setFormErrors({});
    setIsAddingNewPlan(true);
  };

  const handleAddNewRule = () => {
    setEditedRule({
      name: '',
      dayOfWeek: null,
      startHour: null,
      endHour: null,
      multiplier: 1,
      isActive: true,
      priority: 0
    });
    setFormErrors({});
    setIsAddingNewRule(true);
  };

  const resetPromotionForm = () => {
    setEditedPromotion({
      name: '',
      description: '',
      discountType: 'PERCENTAGE',
      discountValue: 0,
      startDate: new Date().toISOString().slice(0, 16),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      usageLimit: undefined,
      planIds: []
    });
    setSelectedPromotion(null);
    setFormErrors({});
  };

  const handleAddNewPromotion = () => {
    resetPromotionForm();
    setIsPromotionDialogOpen(true);
  };

  const handleViewPromotion = (promotion: Promotion) => {
    setSelectedPromotion(promotion);
    setIsViewingPromotion(true);
  };

  const handleEditPromotion = (promotion: Promotion) => {
    setSelectedPromotion(promotion);
    setEditedPromotion({
      name: promotion.name,
      description: promotion.description || '',
      discountType: promotion.discountType,
      discountValue: promotion.discountValue,
      startDate: new Date(promotion.startDate).toISOString().slice(0, 16),
      endDate: new Date(promotion.endDate).toISOString().slice(0, 16),
      usageLimit: promotion.usageLimit || undefined,
      planIds: promotion.plans?.map(p => p.planId) || []
    });
    setIsPromotionDialogOpen(true);
  };

  const handlePromotionDialogClose = () => {
    setIsPromotionDialogOpen(false);
    resetPromotionForm();
  };

  const handleViewPlanDetails = async (plan: PricingPlan) => {
    setSelectedPlanForDetails(plan);
    setIsPlanDetailsDialogOpen(true);
    setPlanBikesLoading(true);
    
    try {
      // Récupérer tous les vélos avec ce plan
      const allBikes = await bikeService.getAllBikes({ page: 1, limit: 100 });

      let allBikesData = [...allBikes.bikes];

      if (allBikes.pagination && allBikes.pagination.totalPages > 1) {
        for (let page = 2; page <= allBikes.pagination.totalPages; page++) {
          const moreBikes = await bikeService.getAllBikes({ page, limit: 100 });
          allBikesData = [...allBikesData, ...moreBikes.bikes];
        }
      }

      const bikesWithThisPlan = allBikes.bikes.filter(bike => bike.pricingPlan?.id === plan.id);
      setPlanBikes(bikesWithThisPlan);
    } catch (error) {
      console.error('Erreur lors du chargement des vélos du plan:', error);
      toast.error('Erreur lors du chargement des vélos');
      setPlanBikes([]);
    } finally {
      setPlanBikesLoading(false);
    }
  };

  if (isLoading) {
    return <div className="p-8">Chargement...</div>;
  }

  const activePlans = pricingConfig?.plans?.filter(p => p.isActive) || [];
  const activeRules = pricingConfig?.rules?.filter(r => r.isActive) || [];
  const activePromotions = pricingConfig?.promotions?.filter(p => p.isActive) || [];

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-green-600">{t('pricing.management') || 'Configuration Tarifaire'}</h1>
          <p className="text-gray-600">{t('pricing.overview') || 'Gestion des tarifs et règles de tarification dynamique'}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleAddNewPromotion} variant="outline" aria-label={t('aria.addPromotion') || 'Ajouter une nouvelle promotion'} title={t('aria.addPromotion') || 'Ajouter une nouvelle promotion'}>
            <Tag className="w-4 h-4 mr-2" />
            {t('pricing.newPromotion') || 'Nouvelle Promotion'}
          </Button>
          <Button onClick={handleAddNewRule} variant="outline" aria-label={t('aria.addRule') || 'Ajouter une nouvelle règle'} title={t('aria.addRule') || 'Ajouter une nouvelle règle'}>
            <Clock className="w-4 h-4 mr-2" />
            {t('pricing.newRule') || 'Nouvelle Règle'}
          </Button>
          <Button onClick={handleAddNewPlan} aria-label={t('aria.addPlan') || 'Ajouter un nouveau forfait'} title={t('aria.addPlan') || 'Ajouter un nouveau forfait'}>
            <Plus className="w-4 h-4 mr-2" />
            {t('pricing.newPlan') || 'Nouveau Plan'}
          </Button>
        </div>
      </div>

      {/* Pricing Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('pricing.unlockFee') || 'Frais de Déverrouillage'}</p>
              <p className="text-gray-900">{formatPrice(pricingConfig?.unlockFee || 0)} FCFA</p>
            </div>
            <div className="bg-green-100 text-green-600 p-3 rounded-lg">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Plans Actifs</p>
              <p className="text-gray-900">{activePlans.length}</p>
            </div>
            <div className="bg-blue-100 text-blue-600 p-3 rounded-lg">
              <Check className="w-6 h-6" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('pricing.activeRules') || 'Règles Actives'}</p>
              <p className="text-gray-900">{activeRules.length}</p>
            </div>
            <div className="bg-orange-100 text-orange-600 p-3 rounded-lg">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('pricing.activePromotions') || 'Promotions Actives'}</p>
              <p className="text-gray-900">{activePromotions.length}</p>
            </div>
            <div className="bg-purple-100 text-purple-600 p-3 rounded-lg">
              <Tag className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Pricing Plans */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2>{t('pricing.pricingPlans') || 'Plans Tarifaires'}</h2>
          <div className="flex items-center gap-2">
            <Badge variant={activePlans.length === pricingConfig?.plans?.length ? "default" : "outline"}>
              {activePlans.length}/{pricingConfig?.plans?.length || 0} {t('pricing.active') || 'actifs'}
            </Badge>
            <Button onClick={handleAddNewPlan} aria-label={t('aria.addPlan') || 'Ajouter un nouveau forfait'} title={t('aria.addPlan') || 'Ajouter un nouveau forfait'}>
              <Plus className="w-4 h-4 mr-2" />
              {t('pricing.newPlan') || 'Nouveau Plan'}
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {pricingConfig?.plans?.map((plan) => (
            <Card key={plan.id} className={`p-6 ${!plan.isActive ? 'opacity-60 bg-gray-50' : ''}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    plan.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                  }`}>
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3>{plan.name}</h3>
                      {!plan.isActive && (
                        <Badge variant="secondary" className="text-xs">Inactif</Badge>
                      )}
                      {plan.override && (
                        <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">Overtime</Badge>
                      )}
                    </div>
                    {plan.discount > 0 && (
                      <Badge variant="outline" className="mt-1">-{plan.discount}%</Badge>
                    )}
                    <p className="text-xs text-gray-500">Min. {plan.minimumHours}h</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewPlanDetails(plan)}
                    title="Voir les détails et vélos associés"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Détails
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleTogglePlanStatus(plan)}
                    title={plan.isActive ? (t('pricing.deactivate') || 'Désactiver') : (t('pricing.activate') || 'Activer')}
                    aria-label={plan.isActive ? (t('aria.deactivate') || 'Désactiver') : (t('aria.activate') || 'Activer')}
                  >
                    {plan.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditPlan(plan)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsDeletingPlan(plan.id!)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Heure</p>
                  <p className="text-gray-900">{formatPrice(plan.hourlyRate)} FCFA</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Jour</p>
                  <p className="text-gray-900">{formatPrice(plan.dailyRate)} FCFA</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Semaine</p>
                  <p className="text-gray-900">{formatPrice(plan.weeklyRate)} FCFA</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Mois</p>
                  <p className="text-gray-900">{formatPrice(plan.monthlyRate)} FCFA</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Dynamic Pricing Rules */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h2>Règles de Tarification Dynamique</h2>
            <Badge variant={activeRules.length === pricingConfig?.rules?.length ? "default" : "outline"}>
              {activeRules.length}/{pricingConfig?.rules?.length || 0} {t('pricing.active') || 'actives'}
            </Badge>
          </div>
          <Button variant="outline" onClick={handleAddNewRule} aria-label={t('aria.addRule') || 'Ajouter une nouvelle règle'} title={t('aria.addRule') || 'Ajouter une nouvelle règle'}>
            <Plus className="w-4 h-4 mr-2" />
            {t('pricing.newRule') || 'Ajouter une Règle'}
          </Button>
        </div>
        <div className="space-y-4">
          {pricingConfig?.rules?.map((rule) => (
            <div key={rule.id} className={`flex items-center justify-between p-4 rounded-lg ${
              rule.isActive ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 opacity-60'
            }`}>
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${
                  rule.isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{rule.name}</p>
                    {!rule.isActive && (
                      <Badge variant="secondary" className="text-xs">Inactive</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>
                      {rule.dayOfWeek !== null 
                        ? daysOfWeek.find(d => d.value === rule.dayOfWeek)?.label
                        : 'Tous les jours'
                      }
                    </span>
                    {rule.startHour !== null && rule.endHour !== null && (
                      <span>{rule.startHour}h - {rule.endHour}h</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-blue-600">
                    x{rule.multiplier}
                  </p>
                  <p className="text-xs text-gray-500">Multiplicateur</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleRuleStatus(rule)}
                    title={rule.isActive ? (t('pricing.deactivate') || 'Désactiver') : (t('pricing.activate') || 'Activer')}
                    aria-label={rule.isActive ? (t('aria.deactivate') || 'Désactiver') : (t('aria.activate') || 'Activer')}
                  >
                    {rule.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditRule(rule)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsDeletingRule(rule.id!)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {pricingConfig?.rules?.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Aucune règle créée</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={handleAddNewRule}
              >
                <Plus className="w-4 h-4 mr-2" />
                Créer votre première règle
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Promotions */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h2>Promotions</h2>
            <Badge variant={activePromotions.length === pricingConfig?.promotions?.length ? "default" : "outline"}>
              {activePromotions.length}/{pricingConfig?.promotions?.length || 0} actives
            </Badge>
          </div>
          <Button variant="outline" onClick={handleAddNewPromotion} aria-label={t('aria.addPromotion') || 'Ajouter une nouvelle promotion'} title={t('aria.addPromotion') || 'Ajouter une nouvelle promotion'}>
            <Plus className="w-4 h-4 mr-2" />
            {t('pricing.newPromotion') || 'Ajouter une Promotion'}
          </Button>
        </div>
        <div className="space-y-4">
          {pricingConfig?.promotions?.map((promotion) => (
            <div key={promotion.id} className={`flex items-center justify-between p-4 rounded-lg border ${
              promotion.isActive 
                ? 'bg-orange-50 border-orange-200' 
                : 'bg-gray-50 border-gray-200 opacity-60'
            }`}>
              <div className="flex items-center gap-4 flex-1">
                <div className={`p-2 rounded-lg ${
                  promotion.isActive ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  <Tag className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium">{promotion.name}</p>
                    {!promotion.isActive && (
                      <Badge variant="secondary" className="text-xs">Inactive</Badge>
                    )}
                    {new Date(promotion.endDate) < new Date() && (
                      <Badge variant="destructive" className="text-xs">Expirée</Badge>
                    )}
                    {new Date(promotion.startDate) > new Date() && (
                      <Badge variant="outline" className="text-xs">Programmée</Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    <span className={`font-medium ${
                      promotion.discountType === 'PERCENTAGE' 
                        ? 'text-green-600' 
                        : 'text-blue-600'
                    }`}>
                      {promotion.discountType === 'PERCENTAGE' 
                        ? `${promotion.discountValue}% de réduction`
                        : `${formatPrice(promotion.discountValue)} FCFA de réduction`
                      }
                    </span>
                    <span>
                      {new Date(promotion.startDate).toLocaleDateString('fr-FR')} - {new Date(promotion.endDate).toLocaleDateString('fr-FR')}
                    </span>
                    {promotion.usageLimit && (
                      <span className="flex items-center gap-1">
                        <span className="font-medium">{promotion.usageCount || 0}</span>
                        <span>/</span>
                        <span>{promotion.usageLimit} utilisations</span>
                      </span>
                    )}
                    {promotion.plans && promotion.plans.length > 0 && (
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {promotion.plans.length} plan(s) concerné(s)
                      </span>
                    )}
                  </div>
                  {promotion.description && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                      {promotion.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right mr-4">
                  <p className="text-sm font-medium text-orange-600">
                    {promotion.usageCount || 0} utilisations
                  </p>
                  <p className="text-xs text-gray-500">Total</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewPromotion(promotion)}
                    title={t('aria.viewDetails') || 'Voir les détails'}
                    aria-label={t('aria.viewDetails') || 'Voir les détails'}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleTogglePromotionStatus(promotion)}
                    title={promotion.isActive ? (t('pricing.deactivate') || 'Désactiver') : (t('pricing.activate') || 'Activer')}
                    aria-label={promotion.isActive ? (t('aria.deactivate') || 'Désactiver') : (t('aria.activate') || 'Activer')}
                  >
                    {promotion.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditPromotion(promotion)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsDeletingPromotion(promotion.id!)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    disabled={(promotion.usageCount || 0) > 0}
                    title={(promotion.usageCount || 0) > 0 ? (t('pricing.cannotDeleteUsed') || 'Impossible de supprimer une promotion utilisée') : (t('aria.delete') || 'Supprimer')}
                    aria-label={(promotion.usageCount || 0) > 0 ? (t('pricing.cannotDeleteUsed') || 'Impossible de supprimer une promotion utilisée') : (t('aria.delete') || 'Supprimer')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {pricingConfig?.promotions?.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Tag className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Aucune promotion créée</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={handleAddNewPromotion}
              >
                <Plus className="w-4 h-4 mr-2" />
                Créer votre première promotion
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Plan Edit/Add Dialog */}
      {(isEditingPlan || isAddingNewPlan) && (
        <Dialog open={isEditingPlan || isAddingNewPlan} onOpenChange={() => {
          setIsEditingPlan(false);
          setIsAddingNewPlan(false);
        }}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle>
                {isAddingNewPlan ? 'Nouveau Plan Tarifaire' : `Modifier le Plan: ${selectedPlan?.name}`}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nom du Plan *</Label>
                <Input
                  value={editedPlan.name}
                  onChange={(e) => setEditedPlan({ ...editedPlan, name: e.target.value })}
                  className={formErrors.name ? 'border-red-500' : ''}
                />
                {formErrors.name && <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tarif Horaire (FCFA) *</Label>
                  <Input
                    type="number"
                    value={editedPlan.hourlyRate}
                    onChange={(e) => setEditedPlan({ ...editedPlan, hourlyRate: parseInt(e.target.value) || 0 })}
                    className={formErrors.hourlyRate ? 'border-red-500' : ''}
                  />
                  {formErrors.hourlyRate && <p className="text-xs text-red-500 mt-1">{formErrors.hourlyRate}</p>}
                </div>
                <div>
                  <Label>Minimum d'Heures</Label>
                  <Input
                    type="number"
                    min="1"
                    value={editedPlan.minimumHours}
                    onChange={(e) => setEditedPlan({ ...editedPlan, minimumHours: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div>
                  <Label>Tarif Journalier (FCFA) *</Label>
                  <Input
                    type="number"
                    value={editedPlan.dailyRate}
                    onChange={(e) => setEditedPlan({ ...editedPlan, dailyRate: parseInt(e.target.value) || 0 })}
                    className={formErrors.dailyRate ? 'border-red-500' : ''}
                  />
                  {formErrors.dailyRate && <p className="text-xs text-red-500 mt-1">{formErrors.dailyRate}</p>}
                </div>
                <div>
                  <Label>Réduction (%)</Label>
                  <Input
                    type="number"
                    value={editedPlan.discount}
                    onChange={(e) => setEditedPlan({ ...editedPlan, discount: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>Tarif Hebdomadaire (FCFA) *</Label>
                  <Input
                    type="number"
                    value={editedPlan.weeklyRate}
                    onChange={(e) => setEditedPlan({ ...editedPlan, weeklyRate: parseInt(e.target.value) || 0 })}
                    className={formErrors.weeklyRate ? 'border-red-500' : ''}
                  />
                  {formErrors.weeklyRate && <p className="text-xs text-red-500 mt-1">{formErrors.weeklyRate}</p>}
                </div>
                <div>
                  <Label>Tarif Mensuel (FCFA) *</Label>
                  <Input
                    type="number"
                    value={editedPlan.monthlyRate}
                    onChange={(e) => setEditedPlan({ ...editedPlan, monthlyRate: parseInt(e.target.value) || 0 })}
                    className={formErrors.monthlyRate ? 'border-red-500' : ''}
                  />
                  {formErrors.monthlyRate && <p className="text-xs text-red-500 mt-1">{formErrors.monthlyRate}</p>}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editedPlan.hasOverride}
                    onCheckedChange={(checked: boolean) => setEditedPlan({ 
                      ...editedPlan, 
                      hasOverride: checked,
                      overTimeValue: checked ? editedPlan.overTimeValue : 0
                    })}
                  />
                  <Label>Tarification spéciale hors forfait</Label>
                  {editedPlan.hasOverride && (
                    <Badge variant="outline" className="ml-2">
                      {editedPlan.overTimeValue > 0 ? 'Configuré' : 'À configurer'}
                    </Badge>
                  )}
                </div>

                {editedPlan.hasOverride && (
                  <Card className="p-4 bg-yellow-50 border-yellow-200">
                    <h4 className="text-sm font-medium mb-3 text-yellow-800">
                      Configuration Overtime (Hors heures forfait)
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Type de tarification</Label>
                        <Select 
                          value={editedPlan.overTimeType} 
                          onValueChange={(value: 'FIXED_PRICE' | 'PERCENTAGE_REDUCTION') => 
                            setEditedPlan({ ...editedPlan, overTimeType: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PERCENTAGE_REDUCTION">Réduction en %</SelectItem>
                            <SelectItem value="FIXED_PRICE">Prix fixe</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>
                          {editedPlan.overTimeType === 'FIXED_PRICE' 
                            ? 'Prix fixe (FCFA)' 
                            : 'Réduction (%)'}
                        </Label>
                        <Input
                          type="number"
                          value={editedPlan.overTimeValue}
                          onChange={(e) => setEditedPlan({ 
                            ...editedPlan, 
                            overTimeValue: parseFloat(e.target.value) || 0 
                          })}
                          min="0"
                          max={editedPlan.overTimeType === 'PERCENTAGE_REDUCTION' ? "100" : undefined}
                          placeholder={
                            editedPlan.overTimeType === 'FIXED_PRICE' 
                              ? 'Ex: 500' 
                              : 'Ex: 10'
                          }
                        />
                      </div>
                    </div>
                    <p className="text-xs text-yellow-700 mt-2">
                      Cette règle s'applique quand les utilisateurs avec forfait dépassent les heures couvertes par leur abonnement.
                      {editedPlan.overTimeValue > 0 && (
                        <span className="font-medium ml-1">
                          Configuration actuelle: {editedPlan.overTimeValue}
                          {editedPlan.overTimeType === 'FIXED_PRICE' ? ' FCFA' : '%'}
                        </span>
                      )}
                    </p>
                    
                    {/* Plages horaires pour chaque type de forfait */}
                    <div className="mt-4 space-y-3">
                      <h5 className="text-sm font-medium text-yellow-800 mb-2">Plages horaires des forfaits (0-23h)</h5>
                      
                      {/* Forfait horaire */}
                      <div className="grid grid-cols-3 gap-2 items-end">
                        <Label className="text-xs">Forfait horaire</Label>
                        <div>
                          <Label className="text-xs">Début</Label>
                          <Input
                            type="number"
                            min="0"
                            max="23"
                            value={editedPlan.hourlyStartHour ?? ''}
                            onChange={(e) => setEditedPlan({ 
                              ...editedPlan, 
                              hourlyStartHour: e.target.value ? parseInt(e.target.value) : null 
                            })}
                            placeholder="Ex: 8"
                            className="h-8"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Fin</Label>
                          <Input
                            type="number"
                            min="0"
                            max="23"
                            value={editedPlan.hourlyEndHour ?? ''}
                            onChange={(e) => setEditedPlan({ 
                              ...editedPlan, 
                              hourlyEndHour: e.target.value ? parseInt(e.target.value) : null 
                            })}
                            placeholder="Ex: 19"
                            className="h-8"
                          />
                        </div>
                      </div>
                      
                      {/* Forfait journalier */}
                      <div className="grid grid-cols-3 gap-2 items-end">
                        <Label className="text-xs">Forfait journalier</Label>
                        <div>
                          <Label className="text-xs">Début</Label>
                          <Input
                            type="number"
                            min="0"
                            max="23"
                            value={editedPlan.dailyStartHour ?? ''}
                            onChange={(e) => setEditedPlan({ 
                              ...editedPlan, 
                              dailyStartHour: e.target.value ? parseInt(e.target.value) : null 
                            })}
                            placeholder="Ex: 8"
                            className="h-8"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Fin</Label>
                          <Input
                            type="number"
                            min="0"
                            max="23"
                            value={editedPlan.dailyEndHour ?? ''}
                            onChange={(e) => setEditedPlan({ 
                              ...editedPlan, 
                              dailyEndHour: e.target.value ? parseInt(e.target.value) : null 
                            })}
                            placeholder="Ex: 19"
                            className="h-8"
                          />
                        </div>
                      </div>
                      
                      {/* Forfait hebdomadaire */}
                      <div className="grid grid-cols-3 gap-2 items-end">
                        <Label className="text-xs">Forfait hebdomadaire</Label>
                        <div>
                          <Label className="text-xs">Début</Label>
                          <Input
                            type="number"
                            min="0"
                            max="23"
                            value={editedPlan.weeklyStartHour ?? ''}
                            onChange={(e) => setEditedPlan({ 
                              ...editedPlan, 
                              weeklyStartHour: e.target.value ? parseInt(e.target.value) : null 
                            })}
                            placeholder="Ex: 8"
                            className="h-8"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Fin</Label>
                          <Input
                            type="number"
                            min="0"
                            max="23"
                            value={editedPlan.weeklyEndHour ?? ''}
                            onChange={(e) => setEditedPlan({ 
                              ...editedPlan, 
                              weeklyEndHour: e.target.value ? parseInt(e.target.value) : null 
                            })}
                            placeholder="Ex: 19"
                            className="h-8"
                          />
                        </div>
                      </div>
                      
                      {/* Forfait mensuel */}
                      <div className="grid grid-cols-3 gap-2 items-end">
                        <Label className="text-xs">Forfait mensuel</Label>
                        <div>
                          <Label className="text-xs">Début</Label>
                          <Input
                            type="number"
                            min="0"
                            max="23"
                            value={editedPlan.monthlyStartHour ?? ''}
                            onChange={(e) => setEditedPlan({ 
                              ...editedPlan, 
                              monthlyStartHour: e.target.value ? parseInt(e.target.value) : null 
                            })}
                            placeholder="Ex: 8"
                            className="h-8"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Fin</Label>
                          <Input
                            type="number"
                            min="0"
                            max="23"
                            value={editedPlan.monthlyEndHour ?? ''}
                            onChange={(e) => setEditedPlan({ 
                              ...editedPlan, 
                              monthlyEndHour: e.target.value ? parseInt(e.target.value) : null 
                            })}
                            placeholder="Ex: 19"
                            className="h-8"
                          />
                        </div>
                      </div>
                      
                      <p className="text-xs text-yellow-600 mt-2">
                        Définissez les heures de validité pour chaque type de forfait. En dehors de ces heures, les prix hors forfait s'appliquent.
                      </p>
                    </div>
                  </Card>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={editedPlan.isActive}
                  onCheckedChange={(checked: boolean) => setEditedPlan({ ...editedPlan, isActive: checked })}
                />
                <Label>Plan Actif</Label>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => {
                setIsEditingPlan(false);
                setIsAddingNewPlan(false);
              }}>
                <X className="w-4 h-4 mr-2" />
                Annuler
              </Button>
              <Button onClick={handleSavePlan}>
                <Check className="w-4 h-4 mr-2" />
                Sauvegarder
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Rule Edit/Add Dialog */}
      {(isEditingRule || isAddingNewRule) && (
        <Dialog open={isEditingRule || isAddingNewRule} onOpenChange={() => {
          setIsEditingRule(false);
          setIsAddingNewRule(false);
        }}>
          <DialogContent className="max-w-2xl" aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle>
                {isAddingNewRule ? 'Nouvelle Règle de Tarification' : `Modifier la Règle: ${selectedRule?.name}`}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nom de la Règle *</Label>
                <Input
                  value={editedRule.name}
                  onChange={(e) => setEditedRule({ ...editedRule, name: e.target.value })}
                  className={formErrors.name ? 'border-red-500' : ''}
                />
                {formErrors.name && <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Jour de la Semaine</Label>
                  <Select 
                    value={editedRule.dayOfWeek?.toString() || 'null'} 
                    onValueChange={(value: string) => setEditedRule({ 
                      ...editedRule, 
                      dayOfWeek: value === 'null' ? null : parseInt(value) 
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un jour" />
                    </SelectTrigger>
                    <SelectContent>
                      {daysOfWeek.map((day) => (
                        <SelectItem key={day.value?.toString() || 'null'} value={day.value?.toString() || 'null'}>
                          {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Multiplicateur *</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={editedRule.multiplier}
                    onChange={(e) => setEditedRule({ ...editedRule, multiplier: parseFloat(e.target.value) || 1 })}
                    className={formErrors.multiplier ? 'border-red-500' : ''}
                  />
                  {formErrors.multiplier && <p className="text-xs text-red-500 mt-1">{formErrors.multiplier}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Heure de Début</Label>
                  <Input
                    type="number"
                    min="0"
                    max="23"
                    value={editedRule.startHour || ''}
                    onChange={(e) => setEditedRule({ ...editedRule, startHour: e.target.value ? parseInt(e.target.value) : null })}
                    placeholder="0-23"
                  />
                </div>
                <div>
                  <Label>Heure de Fin</Label>
                  <Input
                    type="number"
                    min="0"
                    max="23"
                    value={editedRule.endHour || ''}
                    onChange={(e) => setEditedRule({ ...editedRule, endHour: e.target.value ? parseInt(e.target.value) : null })}
                    placeholder="0-23"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Priorité</Label>
                  <Input
                    type="number"
                    value={editedRule.priority}
                    onChange={(e) => setEditedRule({ ...editedRule, priority: parseInt(e.target.value) || 0 })}
                  />
                  <p className="text-xs text-gray-500 mt-1">Plus la priorité est élevée, plus la règle sera appliquée en premier</p>
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Switch
                    checked={editedRule.isActive}
                    onCheckedChange={(checked: boolean) => setEditedRule({ ...editedRule, isActive: checked })}
                  />
                  <Label>Règle Active</Label>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => {
                setIsEditingRule(false);
                setIsAddingNewRule(false);
              }}>
                <X className="w-4 h-4 mr-2" />
                Annuler
              </Button>
              <Button onClick={handleSaveRule}>
                <Check className="w-4 h-4 mr-2" />
                Sauvegarder
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Promotion Dialog (Création et Modification) */}
      {isPromotionDialogOpen && (
        <Dialog open={isPromotionDialogOpen} onOpenChange={handlePromotionDialogClose}>
          <DialogContent className="max-w-2xl" aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle>
                {selectedPromotion ? `Modifier la Promotion: ${selectedPromotion.name}` : 'Nouvelle Promotion'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nom de la Promotion *</Label>
                  <Input
                    value={editedPromotion.name}
                    onChange={(e) => setEditedPromotion({ ...editedPromotion, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Type de Réduction</Label>
                  <Select 
                    value={editedPromotion.discountType} 
                    onValueChange={(value: 'PERCENTAGE' | 'FIXED_AMOUNT') => 
                      setEditedPromotion({ ...editedPromotion, discountType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENTAGE">Pourcentage (%)</SelectItem>
                      <SelectItem value="FIXED_AMOUNT">Montant fixe (FCFA)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={editedPromotion.description}
                  onChange={(e) => setEditedPromotion({ ...editedPromotion, description: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Valeur de Réduction *</Label>
                  <Input
                    type="number"
                    value={editedPromotion.discountValue}
                    onChange={(e) => setEditedPromotion({ ...editedPromotion, discountValue: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>Date de Début</Label>
                  <Input
                    type="datetime-local"
                    value={editedPromotion.startDate}
                    onChange={(e) => setEditedPromotion({ ...editedPromotion, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Date de Fin</Label>
                  <Input
                    type="datetime-local"
                    value={editedPromotion.endDate}
                    onChange={(e) => setEditedPromotion({ ...editedPromotion, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>Limite d'Utilisation (optionnel)</Label>
                <Input
                  type="number"
                  value={editedPromotion.usageLimit || ''}
                  onChange={(e) => setEditedPromotion({ 
                    ...editedPromotion, 
                    usageLimit: e.target.value ? parseInt(e.target.value) : undefined 
                  })}
                  placeholder="Laissez vide pour illimité"
                />
              </div>

              <div>
                <Label>Plans Concernés *</Label>
                <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto">
                  {pricingConfig?.plans?.filter(plan => plan.isActive).map((plan) => (
                    <div key={plan.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`promotion-plan-${plan.id}`}
                        checked={editedPromotion.planIds.includes(plan.id!)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEditedPromotion({
                              ...editedPromotion,
                              planIds: [...editedPromotion.planIds, plan.id!]
                            });
                          } else {
                            setEditedPromotion({
                              ...editedPromotion,
                              planIds: editedPromotion.planIds.filter(id => id !== plan.id)
                            });
                          }
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <Label htmlFor={`promotion-plan-${plan.id}`} className="text-sm font-normal cursor-pointer">
                        {plan.name}
                      </Label>
                    </div>
                  ))}
                </div>
                {pricingConfig?.plans?.filter(plan => plan.isActive).length === 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Aucun plan actif disponible
                  </p>
                )}
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={handlePromotionDialogClose}>
                <X className="w-4 h-4 mr-2" />
                Annuler
              </Button>
              <Button onClick={handleSavePromotion}>
                <Check className="w-4 h-4 mr-2" />
                {selectedPromotion ? 'Mettre à jour' : 'Créer la Promotion'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Promotion View Details Dialog */}
      {isViewingPromotion && selectedPromotion && (
        <Dialog open={isViewingPromotion} onOpenChange={() => setIsViewingPromotion(false)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Détails de la Promotion</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nom</Label>
                  <p className="font-medium">{selectedPromotion.name}</p>
                </div>
                <div>
                  <Label>Statut</Label>
                  <div className="flex items-center gap-2">
                    <Badge variant={selectedPromotion.isActive ? "default" : "secondary"}>
                      {selectedPromotion.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    {new Date(selectedPromotion.endDate) < new Date() && (
                      <Badge variant="destructive">Expirée</Badge>
                    )}
                  </div>
                </div>
              </div>

              {selectedPromotion.description && (
                <div>
                  <Label>Description</Label>
                  <p className="text-gray-700">{selectedPromotion.description}</p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Type de réduction</Label>
                  <p className="font-medium">
                    {selectedPromotion.discountType === 'PERCENTAGE' ? 'Pourcentage' : 'Montant fixe'}
                  </p>
                </div>
                <div>
                  <Label>Valeur</Label>
                  <p className="font-medium text-green-600">
                    {selectedPromotion.discountType === 'PERCENTAGE' 
                      ? `${selectedPromotion.discountValue}%`
                      : `${formatPrice(selectedPromotion.discountValue)} FCFA`
                    }
                  </p>
                </div>
                <div>
                  <Label>Utilisations</Label>
                  <p className="font-medium">
                    {selectedPromotion.usageCount || 0}
                    {selectedPromotion.usageLimit && ` / ${selectedPromotion.usageLimit}`}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date de début</Label>
                  <p>{new Date(selectedPromotion.startDate).toLocaleString('fr-FR')}</p>
                </div>
                <div>
                  <Label>Date de fin</Label>
                  <p>{new Date(selectedPromotion.endDate).toLocaleString('fr-FR')}</p>
                </div>
              </div>

              {selectedPromotion.plans && selectedPromotion.plans.length > 0 && (
                <div>
                  <Label>Plans concernés</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedPromotion.plans.map((promotionPlan) => (
                      <Badge key={promotionPlan.planId} variant="outline">
                        {promotionPlan.plan?.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewingPromotion(false)}>
                Fermer
              </Button>
              <Button onClick={() => {
                setIsViewingPromotion(false);
                handleEditPromotion(selectedPromotion);
              }}>
                <Edit className="w-4 h-4 mr-2" />
                Modifier
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Plan Details Dialog */}
      {isPlanDetailsDialogOpen && selectedPlanForDetails && (
        <Dialog open={isPlanDetailsDialogOpen} onOpenChange={setIsPlanDetailsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <DollarSign className="w-6 h-6 text-green-600" />
                Détails du Plan : {selectedPlanForDetails.name}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Informations du plan */}
              <Card className="p-4">
                <h3 className="text-lg mb-4">Informations Tarifaires</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Heure</p>
                    <p className="text-lg font-medium">{formatPrice(selectedPlanForDetails.hourlyRate)} FCFA</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Jour</p>
                    <p className="text-lg font-medium">{formatPrice(selectedPlanForDetails.dailyRate)} FCFA</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Semaine</p>
                    <p className="text-lg font-medium">{formatPrice(selectedPlanForDetails.weeklyRate)} FCFA</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Mois</p>
                    <p className="text-lg font-medium">{formatPrice(selectedPlanForDetails.monthlyRate)} FCFA</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                  <div>
                    <p className="text-sm text-gray-600">Durée minimum</p>
                    <p className="font-medium">{selectedPlanForDetails.minimumHours}h</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Réduction</p>
                    <p className="font-medium">{selectedPlanForDetails.discount}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Statut</p>
                    <Badge variant={selectedPlanForDetails.isActive ? "default" : "secondary"}>
                      {selectedPlanForDetails.isActive ? 'Actif' : 'Inactif'}
                    </Badge>
                  </div>
                </div>

                {/* Section Override */}
                {selectedPlanForDetails.override && (
                  <Card className="p-4 mt-4 bg-yellow-50 border-yellow-200">
                    <h4 className="text-lg font-medium text-yellow-800 mb-3">
                      Tarification Spéciale Hors Forfait
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-yellow-700">Type de tarification</p>
                        <p className="font-medium">
                          {selectedPlanForDetails.override.overTimeType === 'FIXED_PRICE' 
                            ? 'Prix fixe' 
                            : 'Réduction en pourcentage'
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-yellow-700">
                          {selectedPlanForDetails.override.overTimeType === 'FIXED_PRICE' 
                            ? 'Prix fixe' 
                            : 'Pourcentage de réduction'
                          }
                        </p>
                        <p className="font-medium">
                          {selectedPlanForDetails.override.overTimeType === 'FIXED_PRICE' 
                            ? `${formatPrice(selectedPlanForDetails.override.overTimeValue)} FCFA`
                            : `${selectedPlanForDetails.override.overTimeValue}%`
                          }
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-yellow-600 mt-2">
                      Cette tarification s'applique quand les utilisateurs dépassent les heures couvertes par leur forfait.
                    </p>
                  </Card>
                )}
              </Card>

              {/* Vélos associés */}
              <Card className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg">Vélos Associés ({planBikes.length})</h3>
                  <Badge variant="outline">
                    {planBikes.length} vélo(s)
                  </Badge>
                </div>
                
                {planBikesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
                      <p className="text-gray-600">Chargement des vélos...</p>
                    </div>
                  </div>
                ) : planBikes.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
                    {planBikes.map((bike: any) => (
                      <div key={bike.id} className="border rounded-lg p-3 bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-medium text-sm">{bike.code}</p>
                            <p className="text-xs text-gray-500">{bike.model}</p>
                          </div>
                          <Badge 
                            variant={
                              bike.status === 'AVAILABLE' ? 'default' :
                              bike.status === 'IN_USE' ? 'secondary' :
                              bike.status === 'MAINTENANCE' ? 'destructive' : 'outline'
                            }
                            className="text-xs"
                          >
                            {bike.status}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <span className="flex items-center gap-1">
                            <Battery className="w-3 h-3" />
                            {bike.battery}%
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {bike.location || 'N/A'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Bike className="w-6 h-6 text-gray-400" />
                    </div>
                    <p>Aucun vélo associé à ce plan</p>
                    <p className="text-sm mt-1">Assignez des vélos à ce plan lors de leur création ou modification</p>
                  </div>
                )}
              </Card>
              
              {/* Statistiques d'utilisation */}
              <Card className="p-4">
                <h3 className="text-lg mb-4">Statistiques d'Utilisation</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{planBikes.filter(b => b.status === 'AVAILABLE').length}</p>
                    <p className="text-sm text-gray-600">Disponibles</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{planBikes.filter(b => b.status === 'IN_USE').length}</p>
                    <p className="text-sm text-gray-600">En utilisation</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">{planBikes.filter(b => b.status === 'MAINTENANCE').length}</p>
                    <p className="text-sm text-gray-600">Maintenance</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-600">{planBikes.filter(b => b.battery < 30).length}</p>
                    <p className="text-sm text-gray-600">Batterie faible</p>
                  </div>
                </div>
              </Card>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setIsPlanDetailsDialogOpen(false)}>
                <X className="w-4 h-4 mr-2" />
                Fermer
              </Button>
              <Button onClick={() => {
                setIsPlanDetailsDialogOpen(false);
                handleEditPlan(selectedPlanForDetails);
              }}>
                <Edit className="w-4 h-4 mr-2" />
                Modifier ce Plan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialogues de confirmation de suppression */}
      {isDeletingPlan && (
        <Dialog open={!!isDeletingPlan} onOpenChange={() => setIsDeletingPlan(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmer la suppression</DialogTitle>
            </DialogHeader>
            <p>Êtes-vous sûr de vouloir supprimer ce plan ? Cette action est irréversible.</p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeletingPlan(null)}>
                Annuler
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => handleDeletePlan(isDeletingPlan!)}
              >
                Supprimer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {isDeletingRule && (
        <Dialog open={!!isDeletingRule} onOpenChange={() => setIsDeletingRule(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmer la suppression</DialogTitle>
            </DialogHeader>
            <p>Êtes-vous sûr de vouloir supprimer cette règle ? Cette action est irréversible.</p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeletingRule(null)}>
                Annuler
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => handleDeleteRule(isDeletingRule!)}
              >
                Supprimer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {isDeletingPromotion && (
        <Dialog open={!!isDeletingPromotion} onOpenChange={() => setIsDeletingPromotion(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmer la suppression</DialogTitle>
            </DialogHeader>
            <p>Êtes-vous sûr de vouloir supprimer cette promotion ? Cette action est irréversible.</p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeletingPromotion(null)}>
                Annuler
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => handleDeletePromotion(isDeletingPromotion!)}
              >
                Supprimer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}