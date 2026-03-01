import React, { useState, useEffect } from 'react';
import { UserCog, Search, Plus, Edit, Trash2, Ban, CheckCircle, Eye, EyeOff, X, Check, KeyRound, Copy } from 'lucide-react';
import { Card } from '../../ui/card';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Label } from '../../ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Pagination } from '../../Pagination';
import { employeeService, Employee } from '../../../services/api/employee.service';
import { rolesService, Role } from '../../../services/api/roles.service';
import { adminService } from '../../../services/api/admin.service';
import { useTranslation } from '../../../lib/i18n';
import { toast } from 'sonner';
import { ExportButtons } from '../ExportButtons';
import { usePermissions } from '../../../hooks/usePermissions';

interface EmployeeFormData {
  name: string;
  email: string;
  phone: string;
  role: string;
  password: string;
  status: 'active' | 'blocked';
}

export function EmployeeManagement() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const { t } = useTranslation();
  const { can } = usePermissions();
  const [currentPage, setCurrentPage] = useState(1);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 10;
  
  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const [resetPwdDialog, setResetPwdDialog] = useState<{
    open: boolean;
    employee: Employee | null;
    newPassword: string;
    showPassword: boolean;
    loading: boolean;
    generatedPassword: string | null;
  }>({ open: false, employee: null, newPassword: '', showPassword: false, loading: false, generatedPassword: null });

  const openResetPwdDialog = (emp: Employee) => {
    setResetPwdDialog({ open: true, employee: emp, newPassword: '', showPassword: false, loading: false, generatedPassword: null });
  };

  const closeResetPwdDialog = () => {
    setResetPwdDialog({ open: false, employee: null, newPassword: '', showPassword: false, loading: false, generatedPassword: null });
  };

  const handleGenerateEmployeePassword = async () => {
    if (!resetPwdDialog.employee) return;
    setResetPwdDialog(prev => ({ ...prev, loading: true }));
    try {
      const result = await adminService.resetUserPassword(resetPwdDialog.employee.id, { generateNew: true });
      setResetPwdDialog(prev => ({ ...prev, loading: false, generatedPassword: result.password || null, newPassword: '' }));
      toast.success('Mot de passe généré automatiquement');
    } catch (error) {
      setResetPwdDialog(prev => ({ ...prev, loading: false }));
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la génération');
    }
  };

  const handleConfirmResetEmployeePassword = async () => {
    if (!resetPwdDialog.employee) return;
    if (!resetPwdDialog.newPassword && !resetPwdDialog.generatedPassword) {
      toast.error('Veuillez saisir un mot de passe ou en générer un automatiquement');
      return;
    }
    if (resetPwdDialog.generatedPassword) { closeResetPwdDialog(); return; }
    setResetPwdDialog(prev => ({ ...prev, loading: true }));
    try {
      await adminService.resetUserPassword(resetPwdDialog.employee.id, { newPassword: resetPwdDialog.newPassword });
      toast.success('Mot de passe réinitialisé avec succès');
      closeResetPwdDialog();
    } catch (error) {
      setResetPwdDialog(prev => ({ ...prev, loading: false }));
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la réinitialisation');
    }
  };

  // Form data
  const [formData, setFormData] = useState<EmployeeFormData>({
    name: '',
    email: '',
    phone: '',
    role: '',
    password: '',
    status: 'active'
  });

  // Form errors
  const [formErrors, setFormErrors] = useState<Partial<EmployeeFormData>>({});

  // Obtenir les rôles filtrés (exclure USER)
  const getFilteredRoles = () => {
    return roles.filter(role => role.name !== 'USER');
  };

  useEffect(() => {
    loadEmployees();
    loadRoles();
  }, [currentPage]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      loadEmployees();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [search, roleFilter]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      
      // Convertir l'ID du rôle en nom du rôle pour le backend
      let roleForBackend: string | undefined = undefined;
      if (roleFilter !== 'all') {
        const selectedRole = roles.find(r => r.id === roleFilter);
        roleForBackend = selectedRole?.name;
      }
      
      const result = await employeeService.getAllEmployees({
        page: currentPage,
        limit: itemsPerPage,
        search: search.trim() || undefined,
        role: roleForBackend
      });
      setEmployees(result.employees);
      setPagination({
        total: result.total,
        totalPages: result.pages,
        currentPage: currentPage
      });
    } catch (error) {
      console.error('Erreur lors du chargement des employés:', error);
      toast.error('Erreur lors du chargement des employés');
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const rolesData = await rolesService.getAllRoles();
      setRoles(rolesData);
    } catch (error) {
      console.error('Erreur lors du chargement des rôles:', error);
    }
  };

  // Reinitialize filters
  const resetFilters = () => {
    setSearch('');
    setRoleFilter('all');
    setCurrentPage(1);
  };

  const validateForm = (): boolean => {
    const errors: Partial<EmployeeFormData> = {};
    
    if (!formData.name.trim()) {
      errors.name = t('common.required');
    }
    
    if (!formData.email.trim()) {
      errors.email = t('common.required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = t('common.invalidEmail');
    }
    
    if (!formData.phone.trim()) {
      errors.phone = t('common.required');
    } else if (!/^[0-9+\s()-]{8,}$/.test(formData.phone)) {
      errors.phone = t('common.invalidPhone');
    }
    
    if (!formData.role) {
      errors.role = t('common.required');
    }

    if (!selectedEmployee && !formData.password.trim()) {
      errors.password = t('common.required');
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAdd = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: '',
      password: '',
      status: 'active'
    });
    setFormErrors({});
    setIsAddDialogOpen(true);
  };

  const handleView = (emp: Employee) => {
    setSelectedEmployee(emp);
    setIsViewDialogOpen(true);
  };

  const handleEdit = (emp: Employee) => {
    setSelectedEmployee(emp);
    const currentRole = roles.find(r => r.name === emp.role);
    setFormData({
      name: emp.name || `${emp.firstName} ${emp.lastName}`,
      email: emp.email,
      phone: emp.phone,
      role: currentRole?.id || '',
      password: '',
      status: emp.status
    });
    setFormErrors({});
    setIsEditDialogOpen(true);
  };

  const handleDelete = (emp: Employee) => {
    setSelectedEmployee(emp);
    setIsDeleteDialogOpen(true);
  };

  const handleBlock = async (id: string, name: string) => {
    try {
      await employeeService.toggleEmployeeStatus(id, 'blocked');
      toast.success(`Employé ${name} bloqué avec succès`);
      await loadEmployees();
    } catch (error) {
      console.error('Erreur lors du blocage:', error);
      toast.error('Erreur lors du blocage de l\'employé');
    }
  };

  const handleUnblock = async (id: string, name: string) => {
    try {
      await employeeService.toggleEmployeeStatus(id, 'active');
      toast.success(`Employé ${name} débloqué avec succès`);
      await loadEmployees();
    } catch (error) {
      console.error('Erreur lors du déblocage:', error);
      toast.error('Erreur lors du déblocage de l\'employé');
    }
  };

  const handleSaveNew = async () => {
    if (!validateForm()) {
      toast.error(t('common.error'));
      return;
    }
    
    try {
      await employeeService.createEmployee({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        password: formData.password
      });
      toast.success(`Employé "${formData.name}" créé avec succès`);
      setIsAddDialogOpen(false);
      await loadEmployees();
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      toast.error('Erreur lors de la création de l\'employé');
    }
  };

  const handleSaveEdit = async () => {
    if (!validateForm()) {
      toast.error(t('common.error'));
      return;
    }
    
    if (!selectedEmployee) return;
    
    try {
      await employeeService.updateEmployee(selectedEmployee.id, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        status: formData.status
      });

      // Update role separately if changed
      const currentRole = roles.find(r => r.name === selectedEmployee.role);
      if (formData.role !== currentRole?.id) {
        await employeeService.updateEmployeeRole(selectedEmployee.id, formData.role);
      }

      toast.success(`Employé "${formData.name}" modifié avec succès`);
      setIsEditDialogOpen(false);
      await loadEmployees();
    } catch (error) {
      console.error('Erreur lors de la modification:', error);
      toast.error('Erreur lors de la modification de l\'employé');
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedEmployee) return;
    
    try {
      await employeeService.deleteEmployee(selectedEmployee.id);
      toast.success(`Employé "${selectedEmployee.name}" supprimé avec succès`);
      setIsDeleteDialogOpen(false);
      await loadEmployees();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error('Erreur lors de la suppression de l\'employé');
    }
  };

  const stats = {
    total: pagination?.total || 0,
    active: employees.filter(e => e.status === 'active').length,
    blocked: employees.filter(e => e.status === 'blocked').length,
    uniqueRoles: [...new Set(employees.map(e => e.role))].length
  };

  // Préparer les données pour l'export
  const exportData = employees.map(emp => ({
    Nom: emp.name,
    Email: emp.email,
    Téléphone: emp.phone,
    Rôle: emp.role,
    'Date d\'embauche': emp.createdAt || 'N/A',
    Statut: emp.status === 'active' ? 'Actif' : 'Bloqué'
  }));

  if (loading) {
    return (
      <div className="p-4 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <UserCog className="w-12 h-12 mx-auto mb-4 text-green-600 animate-pulse" />
          <p className="text-gray-600">Chargement des employés...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-green-600">{t('employees.management')}</h1>
          <p className="text-gray-600">{t('employees.overview')}</p>
        </div>
        <div className="flex gap-2">
          {can.exportEmployees() && (
            <ExportButtons
              data={exportData}
              filename="employes"
              headers={['Nom', 'Email', 'Téléphone', 'Rôle', 'Date d\'embauche', 'Statut']}
            />
          )}
          {can.createEmployee() && (
            <Button onClick={handleAdd}>
              <Plus className="w-4 h-4 mr-2" />
              {t('employees.addNew')}
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">{t('employees.total')}</p>
          <p className="text-gray-900">{stats.total}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">{t('common.active')}</p>
          <p className="text-gray-900">{stats.active}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">{t('common.blocked')}</p>
          <p className="text-gray-900">{stats.blocked}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Rôles</p>
          <p className="text-gray-900">{stats.uniqueRoles}</p>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder={t('common.search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Filters */}
          <div className="relative flex-1">
            <Select 
              value={roleFilter} 
              onValueChange={setRoleFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filtrer par rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les rôles</SelectItem>
                {getFilteredRoles().map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reinitialise Bouton */}
          {(search || roleFilter && roleFilter !== 'all') && (
            <Button 
              variant="outline" 
              onClick={resetFilters}
              className="whitespace-nowrap"
            >
              <X className="w-4 h-4 mr-2" />
              Réinitialiser
            </Button>
          )}
        </div>
      </Card>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('common.name')}</TableHead>
              <TableHead>{t('common.email')}</TableHead>
              <TableHead>{t('employees.role')}</TableHead>
              <TableHead>{t('common.status')}</TableHead>
              <TableHead className="text-center">{t('common.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map((emp) => (
              <TableRow key={emp.id}>
                <TableCell>
                  <div>
                    <p className="text-sm">{emp.name}</p>
                    <p className="text-xs text-gray-500">{emp.phone}</p>
                  </div>
                </TableCell>
                <TableCell>{emp.email}</TableCell>
                <TableCell>
                  <Badge variant="outline">{emp.role}</Badge>
                </TableCell>
                <TableCell>
                  {emp.status === 'active' ? (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      {t('common.active')}
                    </Badge>
                  ) : (
                    <Badge variant="destructive">{t('common.blocked')}</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleView(emp)} title={t('common.view')}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    {can.updateEmployee() && (
                      <Button variant="outline" size="sm" onClick={() => handleEdit(emp)} title={t('common.edit')}>
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                    {can.updateEmployee() && (
                      emp.status === 'active' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleBlock(emp.id, emp.name)}
                          title={t('common.block')}
                        >
                          <Ban className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUnblock(emp.id, emp.name)}
                          title={t('common.unblock')}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      )
                    )}
                    {can.deleteEmployee() && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(emp)}
                        title={t('common.delete')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                    {can.resetEmployeePassword() && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openResetPwdDialog(emp)}
                        title="Réinitialiser le mot de passe"
                      >
                        <KeyRound className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {/* Pagination */}
        {pagination && pagination.total > 0 && (
          <div className="p-4 border-t">
            <Pagination
              currentPage={currentPage}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </Card>

      {/* Empty State */}
      {employees.length === 0 && !loading && (
        <Card className="p-12">
          <div className="text-center text-gray-500">
            <UserCog className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Aucun employé trouvé</p>
            <p className="text-sm mt-1">Essayez de modifier votre recherche</p>
          </div>
        </Card>
      )}

      {/* Add Employee Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{t('employees.addNew')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('common.name')} *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Jean Dupont"
                className={formErrors.name ? 'border-red-500' : ''}
              />
              {formErrors.name && <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>}
            </div>
            <div>
              <Label>{t('common.email')} *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="jean.dupont@ecomobile.cm"
                className={formErrors.email ? 'border-red-500' : ''}
              />
              {formErrors.email && <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>}
            </div>
            <div>
              <Label>{t('common.phone')} *</Label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+237 6XX XX XX XX"
                className={formErrors.phone ? 'border-red-500' : ''}
              />
              {formErrors.phone && <p className="text-xs text-red-500 mt-1">{formErrors.phone}</p>}
            </div>
            <div>
              <Label>Mot de passe temporaire *</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                className={formErrors.password ? 'border-red-500' : ''}
              />
              {formErrors.password && <p className="text-xs text-red-500 mt-1">{formErrors.password}</p>}
              <p className="text-xs text-gray-500 mt-1">L'employé devra changer ce mot de passe à sa première connexion</p>
            </div>
            <div>
              <Label>{t('employees.role')} *</Label>
              <Select 
                value={formData.role} 
                onValueChange={(value: string) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger className={formErrors.role ? 'border-red-500' : ''}>
                  <SelectValue placeholder={t('employees.selectRole')} />
                </SelectTrigger>
                <SelectContent>
                  {getFilteredRoles().map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.role && <p className="text-xs text-red-500 mt-1">{formErrors.role}</p>}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              <X className="w-4 h-4 mr-2" />
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSaveNew}>
              <Check className="w-4 h-4 mr-2" />
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Employee Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{t('common.edit')} - {selectedEmployee?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('common.name')} *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={formErrors.name ? 'border-red-500' : ''}
              />
              {formErrors.name && <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>}
            </div>
            <div>
              <Label>{t('common.email')} *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={formErrors.email ? 'border-red-500' : ''}
              />
              {formErrors.email && <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>}
            </div>
            <div>
              <Label>{t('common.phone')} *</Label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className={formErrors.phone ? 'border-red-500' : ''}
              />
              {formErrors.phone && <p className="text-xs text-red-500 mt-1">{formErrors.phone}</p>}
            </div>
            <div>
              <Label>{t('employees.role')} *</Label>
              <Select 
                value={formData.role} 
                onValueChange={(value: string) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger className={formErrors.role ? 'border-red-500' : ''}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getFilteredRoles().map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.role && <p className="text-xs text-red-500 mt-1">{formErrors.role}</p>}
            </div>
            <div>
              <Label>{t('common.status')}</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value: 'active' | 'blocked') => setFormData({ ...formData, status: value as 'active' | 'blocked' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{t('common.active')}</SelectItem>
                  <SelectItem value="blocked">{t('common.blocked')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              <X className="w-4 h-4 mr-2" />
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSaveEdit}>
              <Check className="w-4 h-4 mr-2" />
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Employee Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{t('employees.viewDetails')}</DialogTitle>
          </DialogHeader>
          {selectedEmployee && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 pb-4 border-b">
                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xl">{selectedEmployee.name.charAt(0)}</span>
                </div>
                <div>
                  <h3>{selectedEmployee.name}</h3>
                  <p className="text-sm text-gray-600">{selectedEmployee.role}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">{t('common.email')}</p>
                  <p className="text-sm">{selectedEmployee.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t('common.phone')}</p>
                  <p className="text-sm">{selectedEmployee.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t('common.status')}</p>
                  {selectedEmployee.status === 'active' ? (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      {t('common.active')}
                    </Badge>
                  ) : (
                    <Badge variant="destructive">{t('common.blocked')}</Badge>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t('employees.hireDate')}</p>
                  <p className="text-sm">{selectedEmployee.createdAt || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewDialogOpen(false)}>
              {t('common.close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetPwdDialog.open} onOpenChange={closeResetPwdDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
            <DialogDescription>
              {resetPwdDialog.employee && `Employé : ${resetPwdDialog.employee.name}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {resetPwdDialog.generatedPassword ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
                <Label className="text-sm text-green-700 font-medium">Mot de passe généré :</Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-white border rounded px-3 py-2 text-sm font-mono select-all">
                    {resetPwdDialog.generatedPassword}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(resetPwdDialog.generatedPassword!);
                      toast.success('Copié dans le presse-papier');
                    }}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-green-600">Communiquez ce mot de passe à l'employé de façon sécurisée.</p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="emp-new-password">Nouveau mot de passe</Label>
                  <div className="relative">
                    <Input
                      id="emp-new-password"
                      type={resetPwdDialog.showPassword ? 'text' : 'password'}
                      placeholder="Saisir un nouveau mot de passe..."
                      value={resetPwdDialog.newPassword}
                      onChange={(e) => setResetPwdDialog(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      onClick={() => setResetPwdDialog(prev => ({ ...prev, showPassword: !prev.showPassword }))}
                    >
                      {resetPwdDialog.showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 border-t border-gray-200" />
                  <span className="text-xs text-gray-400">ou</span>
                  <div className="flex-1 border-t border-gray-200" />
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={resetPwdDialog.loading}
                  onClick={handleGenerateEmployeePassword}
                >
                  {resetPwdDialog.loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2" />
                  ) : (
                    <KeyRound className="w-4 h-4 mr-2" />
                  )}
                  Générer automatiquement
                </Button>
              </>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={closeResetPwdDialog} disabled={resetPwdDialog.loading}>
              Annuler
            </Button>
            {!resetPwdDialog.generatedPassword && (
              <Button
                onClick={handleConfirmResetEmployeePassword}
                disabled={resetPwdDialog.loading || !resetPwdDialog.newPassword}
              >
                {resetPwdDialog.loading && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                )}
                Confirmer
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{t('common.confirmDelete')}</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer l'employé "{selectedEmployee?.name}" ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              <X className="w-4 h-4 mr-2" />
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              {t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}