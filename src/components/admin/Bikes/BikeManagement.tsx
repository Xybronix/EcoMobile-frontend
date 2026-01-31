import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bike, Battery, MapPin, Signal, DollarSign, AlertCircle, Search, Filter, Plus, Edit, Trash2, X, Check, User } from 'lucide-react';
import { Card } from '../../ui/card';
import { Input } from '../../ui/input';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { bikeService, type CreateBikeData, type UpdateBikeData, BikePosition } from '../../../services/api/bike.service';
import { companyService, PricingPlan } from '../../../services/api/company.service';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Pagination } from '../../Pagination';
import { useTranslation } from '../../../lib/i18n';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../ui/dialog';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { Checkbox } from '../../ui/checkbox';
import { toast } from 'sonner';
import { ExportButtons } from '../ExportButtons';
import { LocationSelector } from './LocationSelector';

interface LocationData {
  name: string;
  displayName: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  address: string;
}

interface BikeFormData {
  code: string;
  model: string;
  status: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'UNAVAILABLE';
  location: LocationData | null;
  maintenanceReason?: string;
  maintenanceDetails?: string;
  gpsDeviceId?: string;
  equipment: string[];
  pricingPlanId?: string;
}

// Liste des équipements disponibles
const availableEquipment = [
  { id: 'headlight', label: 'Phares avant' },
  { id: 'taillight', label: 'Feu arrière' },
  { id: 'basket', label: 'Panier' },
  { id: 'rack', label: 'Porte-bagages' },
  { id: 'bell', label: 'Sonnette' },
  { id: 'mudguards', label: 'Garde-boue' },
  { id: 'lock', label: 'Antivol' },
  { id: 'reflectors', label: 'Réflecteurs' },
];

export function BikeManagement() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [bikes, setBikes] = useState<BikePosition[]>([]);
  const [availablePlans, setAvailablePlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [locations, setLocations] = useState<string[]>([]);
  const itemsPerPage = 9;

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedBike, setSelectedBike] = useState<BikePosition | null>(null);

  // Form data
  const [formData, setFormData] = useState<BikeFormData>({
    code: '',
    model: 'EcoMobile Pro X1',
    status: 'AVAILABLE',
    location: null,
    maintenanceReason: '',
    maintenanceDetails: '',
    gpsDeviceId: '',
    equipment: ['headlight', 'taillight', 'bell', 'lock'],
    pricingPlanId: 'none'
  });

  const [formErrors, setFormErrors] = useState<Partial<Record<keyof BikeFormData, string>>>({});

  useEffect(() => {
    loadBikes();
    loadAvailablePlans();
  }, [currentPage, statusFilter, locationFilter, searchTerm]);

  const loadBikes = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit: itemsPerPage
      };

      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      if (searchTerm) {
        params.search = searchTerm;
      }

      const response = await bikeService.getAllBikes(params);
      
      const adaptedBikes: BikePosition[] = response.bikes.map((bike: any) => {
        let status: BikePosition['status'] = 'AVAILABLE';
        if (bike.status) {
          switch (bike.status.toUpperCase()) {
            case 'AVAILABLE':
              status = 'AVAILABLE';
              break;
            case 'IN_USE':
              status = 'IN_USE';
              break;
            case 'MAINTENANCE':
              status = 'MAINTENANCE';
              break;
            case 'UNAVAILABLE':
              status = 'UNAVAILABLE';
              break;
            default:
              status = 'AVAILABLE';
          }
        }

        return {
          id: bike.id,
          name: bike.code,
          code: bike.code,
          qrCode: bike.qrCode,
          gpsDeviceId: bike.gpsDeviceId,
          imei: bike.gpsDeviceId || bike.id,
          model: bike.model || 'EcoMobile Pro X1',
          brand: 'EcoMobile',
          status,
          isActive: bike.isActive ?? true,
          latitude: bike.latitude || 0,
          longitude: bike.longitude || 0,
          locationName: bike.locationName,
          battery: bike.batteryLevel || bike.battery || 0,
          gpsSignal: bike.gpsSignal,
          gsmSignal: bike.gsmSignal,
          speed: bike.speed,
          direction: bike.direction,
          isOnline: bike.isOnline,
          lastUpdate: bike.updatedAt || new Date().toISOString(),
          deviceStatus: bike.deviceStatus,
          equipment: bike.equipment || [],
          maintenanceReason: bike.maintenanceReason,
          maintenanceDetails: bike.maintenanceDetails,
          pricingPlan: bike.pricingPlan,
          distance: bike.distance,
          totalTrips: bike.totalTrips,
          createdAt: bike.createdAt || new Date().toISOString(),
          updatedAt: bike.updatedAt || new Date().toISOString(),
          syncError: bike.syncError,
          syncStatus: bike.syncStatus,
          zone: bike.locationName || 'Position non définie',
          location: bike.locationName,
          coordinates: bike.latitude && bike.longitude ? {
            lat: bike.latitude,
            lng: bike.longitude
          } : undefined,
          currentUser: bike.currentUser || null,
        };
      });

      setBikes(adaptedBikes);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotalItems(response.pagination?.total || 0);

      // Extraire les localisations uniques pour le filtre
      const uniqueLocations = [...new Set(adaptedBikes.map(bike => bike.location || 'Position non définie'))];
      setLocations(uniqueLocations);

    } catch (error) {
      console.error('Erreur lors du chargement des vélos:', error);
      toast.error(t('bikes.error'));
    } finally {
      setLoading(false);
    }
  };

  const loadAvailablePlans = async () => {
    try {
      const pricingConfig = await companyService.getPricing();
      setAvailablePlans(pricingConfig.plans.filter(plan => plan.isActive));
    } catch (error) {
      console.error('Erreur lors du chargement des plans:', error);
    }
  };

  const filteredBikes = bikes.filter((bike) => {
    const matchesSearch = bike.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (bike.model || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (bike.location || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || bike.status === statusFilter;
    const matchesLocation = locationFilter === 'all' || bike.location === locationFilter;
    return matchesSearch && matchesStatus && matchesLocation;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      'available': { label: 'Disponible', variant: 'default' },
      'in-use': { label: 'En utilisation', variant: 'secondary' },
      'maintenance': { label: 'Maintenance', variant: 'destructive' },
      'unavailable': { label: 'Indisponible', variant: 'outline' }
    };
    const config = variants[status] || { label: status, variant: 'outline' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getBatteryColor = (level: number) => {
    if (level > 60) return 'text-green-600';
    if (level > 30) return 'text-orange-600';
    return 'text-red-600';
  };

  const getSignalColor = (level: number) => {
    if (level > 80) return 'text-green-600';
    if (level > 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof BikeFormData, string>> = {};
    
    if (!formData.code.trim()) {
      errors.code = t('common.required');
    }
    
    if (!formData.model.trim()) {
      errors.model = t('common.required');
    }
    
    if (!formData.location) {
      errors.location = 'La localisation est requise';
    }

    if (formData.status === 'MAINTENANCE' && !formData.maintenanceReason?.trim()) {
      errors.maintenanceReason = t('common.required');
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const toggleEquipment = (equipmentId: string) => {
    setFormData(prev => ({
      ...prev,
      equipment: prev.equipment.includes(equipmentId)
        ? prev.equipment.filter(id => id !== equipmentId)
        : [...prev.equipment, equipmentId]
    }));
  };

  const handleAddBike = () => {
    setFormData({
      code: '',
      model: 'EcoMobile Pro X1',
      status: 'AVAILABLE',
      location: null,
      maintenanceReason: '',
      maintenanceDetails: '',
      gpsDeviceId: '',
      equipment: ['headlight', 'taillight', 'bell', 'lock'],
      pricingPlanId: 'none'
    });
    setFormErrors({});
    setIsAddDialogOpen(true);
  };

  const handleEditBike = (bike: BikePosition) => {
    setSelectedBike(bike);
    setFormData({
      code: bike.code,
      model: bike.model || 'EcoMobile Pro X1',
      status: bike.status.toUpperCase() as 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'UNAVAILABLE',
      location: bike.coordinates ? {
        name: bike.location || 'Position',
        displayName: bike.location || 'Position',
        coordinates: bike.coordinates,
        address: bike.location || 'Position'
      } : null,
      maintenanceReason: bike.maintenanceReason || '',
      maintenanceDetails: bike.maintenanceDetails || '',
      gpsDeviceId: bike.gpsDeviceId || '',
      equipment: bike.equipment || ['headlight', 'taillight', 'bell', 'lock'],
      pricingPlanId: bike.pricingPlan?.id || 'none'
    });
    setFormErrors({});
    setIsEditDialogOpen(true);
  };

  const handleDeleteBike = (bike: BikePosition) => {
    setSelectedBike(bike);
    setIsDeleteDialogOpen(true);
  };

  const handleSaveNew = async () => {
    if (!validateForm()) {
      toast.error(t('common.error'));
      return;
    }
    
    try {
      const bikeData: CreateBikeData = {
        code: formData.code,
        model: formData.model,
        status: formData.status,
        latitude: formData.location?.coordinates.lat,
        longitude: formData.location?.coordinates.lng,
        locationName: formData.location?.displayName,
        gpsDeviceId: formData.gpsDeviceId,
        equipment: formData.equipment,
        pricingPlanId: formData.pricingPlanId === 'none' ? undefined : formData.pricingPlanId
      };
      
      await bikeService.createBike(bikeData);
    
      if (formData.pricingPlanId === 'none') {
        toast.warning('Vélo créé sans plan tarifaire. Il ne sera pas visible dans l\'application client.');
      } else {
        toast.success(`${t('bikes.createSuccess')}: "${formData.code}"`);
      }

      setIsAddDialogOpen(false);
      await loadBikes();
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      toast.error(t('bikes.createError'));
    }
  };

  const handleSaveEdit = async () => {
    if (!validateForm() || !selectedBike) {
      toast.error(t('common.error'));
      return;
    }
    
    try {
      const bikeData: UpdateBikeData = {
        code: formData.code,
        model: formData.model,
        status: formData.status,
        latitude: formData.location?.coordinates.lat,
        longitude: formData.location?.coordinates.lng,
        locationName: formData.location?.displayName,
        gpsDeviceId: formData.gpsDeviceId,
        equipment: formData.equipment,
        maintenanceReason: formData.maintenanceReason,
        maintenanceDetails: formData.maintenanceDetails,
        pricingPlanId: formData.pricingPlanId === 'none' ? undefined : formData.pricingPlanId
      };
      
      await bikeService.updateBike(selectedBike.id, bikeData);
      
      if (formData.pricingPlanId === 'none') {
        toast.warning('Vélo modifié sans plan tarifaire. Il ne sera pas visible dans l\'application client.');
      } else {
        toast.success(`${t('bikes.updateSuccess')}: "${formData.code}"`);
      }

      setIsEditDialogOpen(false);
      await loadBikes();
    } catch (error) {
      console.error('Erreur lors de la modification:', error);
      toast.error(t('bikes.updateError'));
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedBike) return;
    
    try {
      await bikeService.deleteBike(selectedBike.id);
      toast.success(`${t('bikes.deleteSuccess')}: "${selectedBike.code}"`);
      setIsDeleteDialogOpen(false);
      await loadBikes();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error(t('bikes.deleteError'));
    }
  };

  const stats = {
    totalBikes: totalItems,
    availableBikes: bikes.filter(b => b.status === 'AVAILABLE').length,
    bikesInUse: bikes.filter(b => b.status === 'IN_USE').length,
    bikesInMaintenance: bikes.filter(b => b.status === 'MAINTENANCE').length,
  };

  const exportData = filteredBikes.map(bike => ({
    Code: bike.code,
    Modèle: bike.model || '',
    Localisation: bike.location || '',
    Batterie: `${bike.battery}%`,
    'Signal GPS': bike.gpsSignal ? `${bike.gpsSignal}%` : 'N/A',
    'Signal GSM': bike.gsmSignal ? `${bike.gsmSignal}%` : 'N/A',
    Statut: bike.status,
    'Dernière MAJ': new Date(bike.lastUpdate).toLocaleDateString('fr-FR')
  }));

  if (loading) {
    return (
      <div className="p-4 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <Bike className="w-12 h-12 mx-auto mb-4 text-green-600 animate-pulse" />
          <p className="text-gray-600">{t('bikes.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-green-600">{t('bikes.management')}</h1>
          <p className="text-gray-600">{t('bikes.monitoring')}</p>
        </div>
        <div className="flex gap-2">
          <ExportButtons 
            data={exportData} 
            filename="velos"
            headers={Object.keys(exportData[0] || {})}
          />
          <Button onClick={handleAddBike} aria-label={t('aria.add')}>
            <Plus className="w-4 h-4 mr-2" />
            {t('bikes.addNew')}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Vélos</p>
              <p className="text-gray-900">{stats.totalBikes}</p>
            </div>
            <Bike className="w-8 h-8 text-green-600" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Disponibles</p>
              <p className="text-gray-900">{stats.availableBikes}</p>
            </div>
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <div className="w-4 h-4 bg-green-600 rounded-full" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">En Utilisation</p>
              <p className="text-gray-900">{stats.bikesInUse}</p>
            </div>
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <div className="w-4 h-4 bg-blue-600 rounded-full" />
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Maintenance</p>
              <p className="text-gray-900">{stats.bikesInMaintenance}</p>
            </div>
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <div className="w-4 h-4 bg-red-600 rounded-full" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder={t('bikes.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              aria-label={t('aria.search')}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full lg:w-[200px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder={t('bikes.filterStatus')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="AVAILABLE">Disponible</SelectItem>
              <SelectItem value="IN_USE">En utilisation</SelectItem>
              <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
              <SelectItem value="UNAVAILABLE">Indisponible</SelectItem>
            </SelectContent>
          </Select>
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className="w-full lg:w-[200px]">
              <MapPin className="w-4 h-4 mr-2" />
              <SelectValue placeholder={t('bikes.filterLocation')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les lieux</SelectItem>
              {locations.map((location) => (
                <SelectItem key={location} value={location}>
                  {location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Bikes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBikes.map((bike) => (
          <Card key={bike.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3>{bike.code}</h3>
                <p className="text-xs text-gray-500">{bike.model}</p>
              </div>
              {getStatusBadge(bike.status)}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Battery className={`w-4 h-4 ${getBatteryColor(bike.battery)}`} />
                  <span className="text-sm text-gray-600">Batterie</span>
                </div>
                <span className={`text-sm ${getBatteryColor(bike.battery)}`}>
                  {bike.battery}%
                </span>
              </div>

              {bike.gpsSignal !== undefined && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Signal className={`w-4 h-4 ${getSignalColor(bike.gpsSignal)}`} />
                    <span className="text-sm text-gray-600">Signal GPS</span>
                  </div>
                  <span className={`text-sm ${getSignalColor(bike.gpsSignal)}`}>
                    {bike.gpsSignal}%
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Localisation</span>
                </div>
                <span className="text-sm text-gray-900 max-w-32 truncate" title={bike.location}>
                  {bike.location}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Plan</span>
                </div>
                <span className="text-sm text-gray-900 max-w-32 truncate" title={bike.pricingPlan?.name || 'Aucun plan'}>
                  {bike.pricingPlan?.name || 'Aucun plan'}
                </span>
              </div>

              {bike.currentUser && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
                  <User className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-blue-700">
                    <p className="font-semibold">Utilisé par:</p>
                    <p>{bike.currentUser.firstName} {bike.currentUser.lastName}</p>
                    <p className="text-blue-600">{bike.currentUser.email}</p>
                  </div>
                </div>
              )}

              {!bike.pricingPlan && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-700">
                    <p>Pas de plan tarifaire - invisible pour les utilisateurs</p>
                  </div>
                </div>
              )}

              {bike.speed !== undefined && bike.speed > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Vitesse</span>
                  <span className="text-sm text-blue-600">{bike.speed} km/h</span>
                </div>
              )}

              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Mis à jour: {new Date(bike.lastUpdate).toLocaleString('fr-FR')}
                </p>
              </div>

              {((bike.battery < 20 && bike.battery > 0) || (bike.gpsSignal !== undefined && bike.gpsSignal < 50) || bike.status === 'MAINTENANCE') && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-red-700 space-y-1">
                    {bike.battery < 20 && bike.battery > 0 && <p>Batterie faible ({bike.battery}%)</p>}
                    {bike.battery === 0 && <p>Batterie vide (0%)</p>}
                    {bike.gpsSignal !== undefined && bike.gpsSignal < 50 && <p>Signal GPS faible</p>}
                    {bike.status === 'MAINTENANCE' && <p>Maintenance requise</p>}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex flex-col gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate(`/admin/bikes/${bike.id}`)}
                  className="w-full"
                  aria-label={t('aria.viewDetails')}
                >
                  {t('common.viewDetails')}
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEditBike(bike)}
                    title={t('common.edit')}
                    aria-label={t('aria.edit')}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteBike(bike)}
                    title={t('common.delete')}
                    aria-label={t('aria.delete')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredBikes.length === 0 && (
        <Card className="p-12">
          <div className="text-center text-gray-500">
            <Bike className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>{t('common.noData')}</p>
            <p className="text-sm mt-1">{t('bikes.noResults')}</p>
          </div>
        </Card>
      )}

      {/* Pagination */}
      {totalItems > 0 && (
        <Card className="p-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </Card>
      )}

      {/* Add Bike Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{t('bikes.addNew')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Code du vélo *</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="FB001, BIKE-001..."
                  className={formErrors.code ? 'border-red-500' : ''}
                />
                {formErrors.code && <p className="text-xs text-red-500 mt-1">{formErrors.code}</p>}
              </div>
              <div>
                <Label>Modèle *</Label>
                <Input
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder="EcoMobile Pro X1"
                  className={formErrors.model ? 'border-red-500' : ''}
                />
                {formErrors.model && <p className="text-xs text-red-500 mt-1">{formErrors.model}</p>}
              </div>
            </div>

            <div>
              <Label>ID GPS (optionnel)</Label>
              <Input
                value={formData.gpsDeviceId || ''}
                onChange={(e) => setFormData({ ...formData, gpsDeviceId: e.target.value })}
                placeholder="GPS-12345"
              />
              <p className="text-xs text-gray-500 mt-1">
                Identifiant du dispositif GPS pour synchronisation automatique
              </p>
            </div>

            <div>
              <Label>Plan Tarifaire (optionnel)</Label>
              <Select 
                value={formData.pricingPlanId || 'none'} 
                onValueChange={(value) => setFormData({ ...formData, pricingPlanId: value === 'none' ? undefined : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un plan tarifaire" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun plan (vélo non visible dans l'app)</SelectItem>
                  {availablePlans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id!}>
                      {plan.name} - {plan.hourlyRate.toLocaleString()} FCFA/h
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-amber-600 mt-1">
                Sans plan tarifaire, ce vélo ne sera pas disponible pour les utilisateurs de l'application
              </p>
            </div>

            <LocationSelector
              value={formData.location}
              onChange={(location) => setFormData({ ...formData, location })}
              error={formErrors.location}
            />

            {/* Équipements du vélo */}
            <div>
              <Label>Équipements du vélo</Label>
              <p className="text-xs text-gray-500 mb-3">
                Sélectionnez les équipements inclus avec ce vélo
              </p>
              <div className="grid grid-cols-2 gap-3">
                {availableEquipment.map((equip) => (
                  <div key={equip.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`add-${equip.id}`}
                      checked={formData.equipment.includes(equip.id)}
                      onCheckedChange={() => toggleEquipment(equip.id)}
                    />
                    <Label
                      htmlFor={`add-${equip.id}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {equip.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} aria-label={t('aria.cancel')}>
              <X className="w-4 h-4 mr-2" />
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSaveNew} aria-label={t('aria.save')}>
              <Check className="w-4 h-4 mr-2" />
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Bike Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl  max-h-[80vh] overflow-y-auto" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{t('common.edit')} - {selectedBike?.code}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Code du vélo *</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className={formErrors.code ? 'border-red-500' : ''}
                />
                {formErrors.code && <p className="text-xs text-red-500 mt-1">{formErrors.code}</p>}
              </div>
              <div>
                <Label>Modèle *</Label>
                <Input
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  className={formErrors.model ? 'border-red-500' : ''}
                />
                {formErrors.model && <p className="text-xs text-red-500 mt-1">{formErrors.model}</p>}
              </div>
            </div>

            <div>
              <Label>{t('common.status')}</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'UNAVAILABLE') => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AVAILABLE">Disponible</SelectItem>
                  <SelectItem value="IN_USE">En utilisation</SelectItem>
                  <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                  <SelectItem value="UNAVAILABLE">Indisponible</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.status === 'MAINTENANCE' && (
              <>
                <div>
                  <Label>Raison de la maintenance *</Label>
                  <Select 
                    value={formData.maintenanceReason || 'default-reason'} 
                    onValueChange={(value: string) => setFormData({ ...formData, maintenanceReason: value === 'default-reason' ? '' : value })}
                  >
                    <SelectTrigger className={formErrors.maintenanceReason ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Sélectionner une raison" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default-reason">Sélectionner une raison</SelectItem>
                      <SelectItem value="Freins défectueux">Freins défectueux</SelectItem>
                      <SelectItem value="Batterie à remplacer">Batterie à remplacer</SelectItem>
                      <SelectItem value="Pneu crevé">Pneu crevé</SelectItem>
                      <SelectItem value="Problème électronique">Problème électronique</SelectItem>
                      <SelectItem value="Dommage structurel">Dommage structurel</SelectItem>
                      <SelectItem value="Maintenance préventive">Maintenance préventive</SelectItem>
                      <SelectItem value="Autre">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                  {formErrors.maintenanceReason && <p className="text-xs text-red-500 mt-1">{formErrors.maintenanceReason}</p>}
                </div>
                <div>
                  <Label>Détails supplémentaires</Label>
                  <Textarea
                    value={formData.maintenanceDetails || ''}
                    onChange={(e) => setFormData({ ...formData, maintenanceDetails: e.target.value })}
                    placeholder="Décrivez le problème en détail..."
                    rows={3}
                  />
                </div>
              </>
            )}

            <div>
              <Label>Plan Tarifaire (optionnel)</Label>
              <Select 
                value={formData.pricingPlanId || 'none'} 
                onValueChange={(value) => setFormData({ ...formData, pricingPlanId: value === 'none' ? undefined : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un plan tarifaire" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun plan (vélo non visible dans l'app)</SelectItem>
                  {availablePlans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id!}>
                      {plan.name} - {plan.hourlyRate.toLocaleString()} FCFA/h
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-amber-600 mt-1">
                Sans plan tarifaire, ce vélo ne sera pas disponible pour les utilisateurs de l'application
              </p>
            </div>

            <LocationSelector
              value={formData.location}
              onChange={(location) => setFormData({ ...formData, location })}
              error={formErrors.location}
            />

            {/* Équipements du vélo */}
            <div>
              <Label>Équipements du vélo</Label>
              <p className="text-xs text-gray-500 mb-3">
                {t('bikes.editEquipment')}
              </p>
              <div className="grid grid-cols-2 gap-3">
                {availableEquipment.map((equip) => (
                  <div key={equip.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-${equip.id}`}
                      checked={formData.equipment.includes(equip.id)}
                      onCheckedChange={() => toggleEquipment(equip.id)}
                    />
                    <Label
                      htmlFor={`edit-${equip.id}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {equip.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} aria-label={t('aria.cancel')}>
              <X className="w-4 h-4 mr-2" />
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSaveEdit} aria-label={t('aria.save')}>
              <Check className="w-4 h-4 mr-2" />
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{t('common.confirmDelete')}</DialogTitle>
            <DialogDescription>
              {t('bikes.deleteConfirm').replace('{code}', selectedBike?.code || '')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} aria-label={t('aria.cancel')}>
              <X className="w-4 h-4 mr-2" />
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete} aria-label={t('aria.delete')}>
              <Trash2 className="w-4 h-4 mr-2" />
              {t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}