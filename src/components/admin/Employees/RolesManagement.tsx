import React, { useState, useEffect } from 'react';
import { Shield, Plus, Edit, Trash2, Users, X, Check, Loader2, Lock } from 'lucide-react';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { Checkbox } from '../../ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../ui/dialog';
import { rolesService, type Role, type Permission } from '../../../services/api/roles.service';
import { employeeService, type Employee } from '../../../services/api/employee.service';
import { useTranslation } from '../../../lib/i18n';
import { toast } from 'sonner';
import { usePermissions } from '../../../hooks/usePermissions';

interface RoleFormData {
  name: string;
  description: string;
  permissions: string[];
}

// Modal de confirmation personnalisée
function ConfirmDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  type = 'default',
  loading = false 
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'default' | 'danger';
  loading?: boolean;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            <X className="w-4 h-4 mr-2" />
            {cancelText}
          </Button>
          <Button 
            variant={type === 'danger' ? 'destructive' : 'default'} 
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Check className="w-4 h-4 mr-2" />
            )}
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function RolesManagement() {
  const { t } = useTranslation();
  const { can } = usePermissions();
  
  // États pour les données de l'API
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  // Form data
  const [formData, setFormData] = useState<RoleFormData>({
    name: '',
    description: '',
    permissions: []
  });

  // Assign employees data
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);

  // Form errors
  const [formErrors, setFormErrors] = useState<Partial<RoleFormData>>({});

  // Chargement initial des données
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rolesData, permissionsData, employeesData] = await Promise.all([
        rolesService.getAllRoles(),
        rolesService.getAllPermissions(),
        employeeService.getAllEmployees({ limit: 1000 })
      ]);
      setRoles(rolesData);
      setPermissions(permissionsData);
      setEmployees(employeesData.employees);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const permissionsByCategory = permissions.reduce((acc, p) => {
    const category = p.resource || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(p);
    return acc;
  }, {} as Record<string, Permission[]>);

  const validateForm = (): boolean => {
    const errors: Partial<RoleFormData> = {};
    
    if (!formData.name.trim()) {
      errors.name = t('common.required');
    }
    
    if (!formData.description.trim()) {
      errors.description = t('common.required');
    }
    
    if (formData.permissions.length === 0) {
      toast.error(t('roles.permissionRequired'));
      return false;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAdd = () => {
    setFormData({
      name: '',
      description: '',
      permissions: []
    });
    setFormErrors({});
    setIsAddDialogOpen(true);
  };

  const handleEdit = (role: Role) => {
    // Empêcher la modification du rôle SUPER_ADMIN
    if (role.name === 'SUPER_ADMIN') {
      toast.error("Le rôle Super Admin ne peut pas être modifié");
      return;
    }

    setSelectedRole(role);
    setFormData({
      name: role.name,
      description: role.description || '',
      permissions: role.permissions?.map((p: Permission) => p.id) || []
    });
    setFormErrors({});
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (role: Role) => {
    // Empêcher la suppression du rôle SUPER_ADMIN
    if (role.name === 'SUPER_ADMIN') {
      toast.error("Le rôle Super Admin ne peut pas être supprimé");
      return;
    }

    // Vérifier si des utilisateurs ont ce rôle
    if (role.employeeCount && role.employeeCount > 0) {
      toast.error(`Impossible de supprimer ce rôle. ${role.employeeCount} utilisateur(s) possède(nt) encore ce rôle.`);
      return;
    }

    setSelectedRole(role);
    setIsDeleteDialogOpen(true);
  };

  const handleAssign = (role: Role) => {
    setSelectedRole(role);
    // Pre-select employees who already have this role
    const employeesWithRole = employees
      .filter(e => e.roleId === role.id)
      .map(e => e.id);
    setSelectedEmployees(employeesWithRole);
    setIsAssignDialogOpen(true);
  };

  const handleSaveNew = async () => {
    if (!validateForm()) {
      return;
    }
    
    try {
      setActionLoading(true);
      const newRole = await rolesService.createRole({
        name: formData.name,
        description: formData.description,
        permissions: formData.permissions
      });
      await loadData(); // Recharger toutes les données
      toast.success(t('roles.createSuccess'));
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      toast.error(error instanceof Error ? error.message : t('common.error'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!validateForm() || !selectedRole) {
      return;
    }
    
    try {
      setActionLoading(true);
      await rolesService.updateRole(selectedRole.id, {
        name: formData.name,
        description: formData.description,
        permissions: formData.permissions
      });
      await loadData(); // Recharger toutes les données
      toast.success(t('roles.updateSuccess'));
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Erreur lors de la modification:', error);
      toast.error(error instanceof Error ? error.message : t('common.error'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedRole) return;
    
    try {
      setActionLoading(true);
      await rolesService.deleteRole(selectedRole.id);
      await loadData(); // Recharger toutes les données
      toast.success(t('roles.deleteSuccess'));
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error(error instanceof Error ? error.message : t('common.error'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmAssign = async () => {
    if (!selectedRole) return;
    
    try {
      setActionLoading(true);
      await rolesService.assignRoleToEmployees(selectedRole.id, selectedEmployees);
      await loadData(); // Recharger toutes les données
      toast.success(t('roles.assignSuccess'));
      setIsAssignDialogOpen(false);
    } catch (error) {
      console.error('Erreur lors de l\'assignation:', error);
      toast.error(error instanceof Error ? error.message : t('common.error'));
    } finally {
      setActionLoading(false);
    }
  };

  const togglePermission = (permissionId: string) => {
    const newPermissions = formData.permissions.includes(permissionId)
      ? formData.permissions.filter(p => p !== permissionId)
      : [...formData.permissions, permissionId];
    
    setFormData({ ...formData, permissions: newPermissions });
  };

  const toggleEmployee = (employeeId: string) => {
    const newEmployees = selectedEmployees.includes(employeeId)
      ? selectedEmployees.filter(e => e !== employeeId)
      : [...selectedEmployees, employeeId];
    
    setSelectedEmployees(newEmployees);
  };

  const canModifyRole = (role: Role) => {
    return role.name !== 'SUPER_ADMIN';
  };

  const canDeleteRole = (role: Role) => {
    return role.name !== 'SUPER_ADMIN' && (!role.employeeCount || role.employeeCount === 0);
  };

  // État de chargement
  if (loading) {
    return (
      <div className="p-4 md:p-8 space-y-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('roles.management')}</h1>
          <p className="text-gray-600">{t('roles.overview')}</p>
        </div>
        {can.createRole() && (
          <Button onClick={handleAdd}>
            <Plus className="w-4 h-4 mr-2" />
            {t('roles.addNew')}
          </Button>
        )}
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {roles.map((role) => (
          <Card key={role.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  role.name === 'SUPER_ADMIN' 
                    ? 'bg-red-100 text-red-600' 
                    : 'bg-purple-100 text-purple-600'
                }`}>
                  {role.name === 'SUPER_ADMIN' ? (
                    <Lock className="w-6 h-6" />
                  ) : (
                    <Shield className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{role.name}</h3>
                    {role.name === 'SUPER_ADMIN' && (
                      <Badge variant="destructive" className="text-xs">
                        Protégé
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{role.description}</p>
                </div>
              </div>
              <div className="flex gap-2">
                {can.updateRole() && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(role)}
                    title={canModifyRole(role) ? t('common.edit') : "Non modifiable"}
                    disabled={!canModifyRole(role)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                )}
                {can.deleteRole() && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(role)}
                    title={canDeleteRole(role) ? t('common.delete') : "Non supprimable"}
                    disabled={!canDeleteRole(role)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                {role.employeeCount || 0} utilisateur(s)
              </span>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-2">
                Permissions : {role.permissions?.length || 0}
              </p>
              <div className="flex flex-wrap gap-2">
                {role.permissions?.slice(0, 5).map((p) => (
                  <Badge key={p.id} variant="outline">{p.name}</Badge>
                ))}
                {role.permissions && role.permissions.length > 5 && (
                  <Badge variant="outline">+{role.permissions.length - 5}</Badge>
                )}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t">
              {can.assignRole() && (
                <Button variant="outline" className="w-full" size="sm" onClick={() => handleAssign(role)}>
                  <Users className="w-4 h-4 mr-2" />
                  Assigner aux utilisateurs
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* All Permissions by Category (Read-only) */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-xl font-semibold">Toutes les permissions</h2>
          <Badge variant="secondary" className="text-xs">
            Lecture seule
          </Badge>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Les permissions sont en lecture seule et ne peuvent pas être modifiées.
        </p>
        <div className="space-y-6">
          {Object.entries(permissionsByCategory).map(([category, perms]) => (
            <div key={category}>
              <h3 className="text-lg font-medium mb-3 capitalize">{category}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {perms.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Lock className="w-4 h-4 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-gray-500">{p.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Add Role Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Ajouter un nouveau rôle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nom du rôle *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Manager"
                className={formErrors.name ? 'border-red-500' : ''}
              />
              {formErrors.name && <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>}
            </div>
            <div>
              <Label>Description *</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description du rôle..."
                rows={2}
                className={formErrors.description ? 'border-red-500' : ''}
              />
              {formErrors.description && <p className="text-xs text-red-500 mt-1">{formErrors.description}</p>}
            </div>
            <div>
              <Label>Permissions * ({formData.permissions.length} sélectionnée(s))</Label>
              <div className="mt-2 space-y-4 max-h-80 overflow-y-auto p-2 border rounded-lg">
                {Object.entries(permissionsByCategory).map(([category, perms]) => (
                  <div key={category}>
                    <h4 className="font-medium mb-2 capitalize">{category}</h4>
                    <div className="space-y-2">
                      {perms.map((p) => (
                        <div key={p.id} className="flex items-start gap-2">
                          <Checkbox
                            checked={formData.permissions.includes(p.id)}
                            onCheckedChange={() => togglePermission(p.id)}
                          />
                          <div className="flex-1">
                            <p className="text-sm">{p.name}</p>
                            <p className="text-xs text-gray-500">{p.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={actionLoading}>
              <X className="w-4 h-4 mr-2" />
              Annuler
            </Button>
            <Button onClick={handleSaveNew} disabled={actionLoading}>
              {actionLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Sauvegarder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Modifier - {selectedRole?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nom du rôle *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={formErrors.name ? 'border-red-500' : ''}
              />
              {formErrors.name && <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>}
            </div>
            <div>
              <Label>Description *</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                className={formErrors.description ? 'border-red-500' : ''}
              />
              {formErrors.description && <p className="text-xs text-red-500 mt-1">{formErrors.description}</p>}
            </div>
            <div>
              <Label>Permissions * ({formData.permissions.length} sélectionnée(s))</Label>
              <div className="mt-2 space-y-4 max-h-80 overflow-y-auto p-2 border rounded-lg">
                {Object.entries(permissionsByCategory).map(([category, perms]) => (
                  <div key={category}>
                    <h4 className="font-medium mb-2 capitalize">{category}</h4>
                    <div className="space-y-2">
                      {perms.map((p) => (
                        <div key={p.id} className="flex items-start gap-2">
                          <Checkbox
                            checked={formData.permissions.includes(p.id)}
                            onCheckedChange={() => togglePermission(p.id)}
                          />
                          <div className="flex-1">
                            <p className="text-sm">{p.name}</p>
                            <p className="text-xs text-gray-500">{p.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={actionLoading}>
              <X className="w-4 h-4 mr-2" />
              Annuler
            </Button>
            <Button onClick={handleSaveEdit} disabled={actionLoading}>
              {actionLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Sauvegarder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirmer la suppression"
        message={`Êtes-vous sûr de vouloir supprimer le rôle "${selectedRole?.name}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        type="danger"
        loading={actionLoading}
      />

      {/* Assign Employees Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>Assigner le rôle - {selectedRole?.name}</DialogTitle>
            <DialogDescription>
              Sélectionnez les utilisateurs ({selectedEmployees.length} sélectionné(s))
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {employees.map((employee) => (
              <div key={employee.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
                <Checkbox
                  checked={selectedEmployees.includes(employee.id)}
                  onCheckedChange={() => toggleEmployee(employee.id)}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">{employee.name}</p>
                  <p className="text-xs text-gray-500">{employee.email}</p>
                </div>
                {employee.roleId && (
                  <Badge variant="outline">
                    {roles.find(r => r.id === employee.roleId)?.name || 'Rôle inconnu'}
                  </Badge>
                )}
              </div>
            ))}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)} disabled={actionLoading}>
              <X className="w-4 h-4 mr-2" />
              Annuler
            </Button>
            <Button onClick={handleConfirmAssign} disabled={actionLoading}>
              {actionLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Assigner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}