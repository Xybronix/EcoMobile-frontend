import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Lock, Monitor, Save, X, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card } from '../../ui/card';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Button } from '../../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { authService } from '../../../services/api/auth.service';
import { useAuth } from '../../../hooks/useAuth';
import { useTranslation } from '../../../lib/i18n';
import { toast } from 'sonner';

interface Session {
  id: string;
  device: string;
  location: string;
  lastActive: string;
  current: boolean;
  ipAddress?: string;
  userAgent?: string;
}

export function AdminProfile() {
  const { user, updateUser } = useAuth();
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [formErrors, setFormErrors] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
  });

  const [passwordErrors, setPasswordErrors] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Initialiser les données du formulaire quand l'utilisateur est chargé
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: (user as any).phone || '',
        address: (user as any).address || '',
      });
    }
  }, [user]);

  // Charger les sessions
  useEffect(() => {
    const loadSessions = async () => {
      try {
        const sessionsData = await authService.getSessions();
        setSessions(sessionsData);
      } catch (error) {
        console.error('Erreur lors du chargement des sessions:', error);
        toast.error('Impossible de charger les sessions');
      } finally {
        setLoadingSessions(false);
      }
    };

    loadSessions();
  }, []);

  // Validation du formulaire de profil
  const validateProfileForm = () => {
    const errors = { firstName: '', lastName: '', email: '', phone: '', address: '' };
    let isValid = true;

    if (!formData.firstName.trim()) {
      errors.firstName = 'Le prénom est requis';
      isValid = false;
    }

    if (!formData.lastName.trim()) {
      errors.lastName = 'Le nom de famille est requis';
      isValid = false;
    }

    if (!formData.email.trim()) {
      errors.email = 'L\'email est requis';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Format d\'email invalide';
      isValid = false;
    }

    if (formData.phone && !/^(\+237|237)?[6][0-9]{8}$/.test(formData.phone.replace(/\s/g, ''))) {
      errors.phone = 'Format de téléphone invalide';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  // Validation du formulaire de mot de passe
  const validatePasswordForm = () => {
    const errors = { currentPassword: '', newPassword: '', confirmPassword: '' };
    let isValid = true;

    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Le mot de passe actuel est requis';
      isValid = false;
    }

    if (!passwordData.newPassword) {
      errors.newPassword = 'Le nouveau mot de passe est requis';
      isValid = false;
    } else if (passwordData.newPassword.length < 8) {
      errors.newPassword = 'Le mot de passe doit contenir au moins 8 caractères';
      isValid = false;
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwordData.newPassword)) {
      errors.newPassword = 'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre';
      isValid = false;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Les mots de passe ne correspondent pas';
      isValid = false;
    }

    setPasswordErrors(errors);
    return isValid;
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateProfileForm()) {
      return;
    }

    setIsUpdatingProfile(true);
    
    try {
      const updatedUser = await authService.updateProfile(formData);
      updateUser(updatedUser);
      toast.success('Profil mis à jour avec succès');
      setIsEditing(false);
      setFormErrors({ firstName: '', lastName: '', email: '', phone: '', address: '' });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la mise à jour');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) {
      return;
    }
    
    setIsChangingPassword(true);
    
    try {
      await authService.changePassword(passwordData.currentPassword, passwordData.newPassword);
      toast.success('Mot de passe mis à jour avec succès');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordErrors({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors du changement de mot de passe');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDisconnectSession = async (sessionId: string) => {
    showConfirmDialog('Êtes-vous sûr de vouloir déconnecter cette session ?', async () => {
      try {
        await authService.disconnectSession(sessionId);
        setSessions(sessions.filter(s => s.id !== sessionId));
        toast.success('Session déconnectée');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Erreur lors de la déconnexion');
      }
    });
  };

  const handleDisconnectAllSessions = async () => {
    const otherSessions = sessions.filter(s => !s.current);
    if (otherSessions.length === 0) {
      toast.info('Aucune autre session à déconnecter');
      return;
    }

    showConfirmDialog(`Êtes-vous sûr de vouloir déconnecter toutes les autres sessions (${otherSessions.length}) ?`, async () => {
      try {
        await authService.disconnectAllSessions();
        setSessions(sessions.filter(s => s.current));
        toast.success('Toutes les autres sessions ont été déconnectées');
      } catch (error) {
        toast.error('Erreur lors de la déconnexion des sessions');
      }
    });
  };

  const handleCancelEdit = () => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: (user as any).phone || '',
        address: (user as any).address || '',
      });
    }
    setIsEditing(false);
    setFormErrors({ firstName: '', lastName: '', email: '', phone: '', address: '' });
  };

  // Custom confirm dialog function
  const showConfirmDialog = (message: string, onConfirm: () => void): void => {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-sm w-full mx-4">
        <div class="flex items-center mb-4">
          <div class="w-10 h-10 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mr-3">
            <svg class="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">Confirmation</h3>
        </div>
        <p class="text-gray-700 dark:text-gray-300 mb-6">${message}</p>
        <div class="flex justify-end space-x-3">
          <button class="cancel-btn px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">Annuler</button>
          <button class="confirm-btn px-4 py-2 bg-red-500 text-white hover:bg-red-600 rounded transition-colors">Confirmer</button>
        </div>
      </div>
    `;
    
    const cancelBtn = modal.querySelector('.cancel-btn');
    const confirmBtn = modal.querySelector('.confirm-btn');
    
    cancelBtn?.addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    confirmBtn?.addEventListener('click', () => {
      document.body.removeChild(modal);
      onConfirm();
    });
    
    document.body.appendChild(modal);
  };

  if (!user) {
    return (
      <div className="p-4 md:p-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  const fullName = `${formData.firstName} ${formData.lastName}`.trim() || user?.name || 'Utilisateur';

  return (
    <div className="p-4 md:p-8 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div>
        <h1 className="text-3xl font-bold text-green-600 dark:text-green-400">Mon Profil</h1>
        <p className="text-gray-600 dark:text-gray-400">Gérez vos informations personnelles et vos paramètres de sécurité</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-white dark:bg-gray-800 p-1">
          <TabsTrigger value="profile" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
            <User className="w-4 h-4 mr-2" />
            Informations
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
            <Lock className="w-4 h-4 mr-2" />
            Sécurité
          </TabsTrigger>
          <TabsTrigger value="sessions" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
            <Monitor className="w-4 h-4 mr-2" />
            Sessions
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-3xl font-semibold">
                    {fullName ? fullName.charAt(0).toUpperCase() : 'U'}
                  </span>
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{fullName}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{user?.role || 'Administrateur'}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-xs text-green-600 dark:text-green-400">Compte vérifié</span>
                  </div>
                </div>
              </div>
              <Button
                variant={isEditing ? 'outline' : 'default'}
                onClick={isEditing ? handleCancelEdit : () => setIsEditing(true)}
                disabled={isUpdatingProfile}
                className={isEditing ? 'border-red-200 text-red-600 hover:bg-red-50' : 'bg-green-600 hover:bg-green-700'}
              >
                {isEditing ? (
                  <>
                    <X className="w-4 h-4 mr-2" />
                    Annuler
                  </>
                ) : (
                  <>
                    <User className="w-4 h-4 mr-2" />
                    Modifier
                  </>
                )}
              </Button>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-gray-700 dark:text-gray-300">Prénom *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => {
                        setFormData({ ...formData, firstName: e.target.value });
                        if (formErrors.firstName) setFormErrors({ ...formErrors, firstName: '' });
                      }}
                      disabled={!isEditing}
                      className={`pl-10 ${formErrors.firstName ? 'border-red-500' : ''} dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100`}
                      required
                      placeholder="Entrez votre prénom"
                    />
                  </div>
                  {formErrors.firstName && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {formErrors.firstName}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-gray-700 dark:text-gray-300">Nom de famille *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => {
                        setFormData({ ...formData, lastName: e.target.value });
                        if (formErrors.lastName) setFormErrors({ ...formErrors, lastName: '' });
                      }}
                      disabled={!isEditing}
                      className={`pl-10 ${formErrors.lastName ? 'border-red-500' : ''} dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100`}
                      required
                      placeholder="Entrez votre nom de famille"
                    />
                  </div>
                  {formErrors.lastName && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {formErrors.lastName}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">Email *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        if (formErrors.email) setFormErrors({ ...formErrors, email: '' });
                      }}
                      disabled={!isEditing}
                      className={`pl-10 ${formErrors.email ? 'border-red-500' : ''} dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100`}
                      required
                      placeholder="votre@email.com"
                    />
                  </div>
                  {formErrors.email && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {formErrors.email}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-gray-700 dark:text-gray-300">Téléphone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => {
                        setFormData({ ...formData, phone: e.target.value });
                        if (formErrors.phone) setFormErrors({ ...formErrors, phone: '' });
                      }}
                      disabled={!isEditing}
                      className={`pl-10 ${formErrors.phone ? 'border-red-500' : ''} dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100`}
                      placeholder="+237 6 XX XX XX XX"
                    />
                  </div>
                  {formErrors.phone && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {formErrors.phone}
                    </p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address" className="text-gray-700 dark:text-gray-300">Adresse</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => {
                        setFormData({ ...formData, address: e.target.value });
                        if (formErrors.address) setFormErrors({ ...formErrors, address: '' });
                      }}
                      disabled={!isEditing}
                      className={`pl-10 ${formErrors.address ? 'border-red-500' : ''} dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100`}
                      placeholder="Votre adresse"
                    />
                  </div>
                  {formErrors.address && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {formErrors.address}
                    </p>
                  )}
                </div>
              </div>

              {isEditing && (
                <div className="flex justify-end space-x-3 pt-4 border-t dark:border-gray-700">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleCancelEdit}
                    disabled={isUpdatingProfile}
                    className="border-gray-300 dark:border-gray-600"
                  >
                    Annuler
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-green-600 hover:bg-green-700"
                    disabled={isUpdatingProfile}
                  >
                    {isUpdatingProfile ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Enregistrement...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Enregistrer les modifications
                      </>
                    )}
                  </Button>
                </div>
              )}
            </form>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <div className="mb-6">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-2 text-gray-900 dark:text-gray-100">
                <Lock className="w-5 h-5 text-green-600 dark:text-green-400" />
                Changer le mot de passe
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Assurez-vous d'utiliser un mot de passe fort et unique (minimum 8 caractères avec majuscule, minuscule et chiffre)
              </p>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="text-gray-700 dark:text-gray-300">Mot de passe actuel *</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => {
                    setPasswordData({ ...passwordData, currentPassword: e.target.value });
                    if (passwordErrors.currentPassword) setPasswordErrors({ ...passwordErrors, currentPassword: '' });
                  }}
                  required
                  disabled={isChangingPassword}
                  className={`${passwordErrors.currentPassword ? 'border-red-500' : ''} dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100`}
                  placeholder="Entrez votre mot de passe actuel"
                />
                {passwordErrors.currentPassword && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {passwordErrors.currentPassword}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-gray-700 dark:text-gray-300">Nouveau mot de passe *</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => {
                    setPasswordData({ ...passwordData, newPassword: e.target.value });
                    if (passwordErrors.newPassword) setPasswordErrors({ ...passwordErrors, newPassword: '' });
                  }}
                  required
                  disabled={isChangingPassword}
                  minLength={8}
                  className={`${passwordErrors.newPassword ? 'border-red-500' : ''} dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100`}
                  placeholder="Minimum 8 caractères (maj, min, chiffre)"
                />
                {passwordErrors.newPassword && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {passwordErrors.newPassword}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-700 dark:text-gray-300">Confirmer le nouveau mot de passe *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => {
                    setPasswordData({ ...passwordData, confirmPassword: e.target.value });
                    if (passwordErrors.confirmPassword) setPasswordErrors({ ...passwordErrors, confirmPassword: '' });
                  }}
                  required
                  disabled={isChangingPassword}
                  className={`${passwordErrors.confirmPassword ? 'border-red-500' : ''} dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100`}
                  placeholder="Répétez le nouveau mot de passe"
                />
                {passwordErrors.confirmPassword && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {passwordErrors.confirmPassword}
                  </p>
                )}
              </div>

              <Button 
                type="submit" 
                className="bg-green-600 hover:bg-green-700"
                disabled={isChangingPassword}
              >
                {isChangingPassword ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Mise à jour...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Mettre à jour le mot de passe
                  </>
                )}
              </Button>
            </form>
          </Card>
        </TabsContent>

        {/* Sessions Tab */}
        <TabsContent value="sessions" className="space-y-6">
          <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2 mb-2 text-gray-900 dark:text-gray-100">
                    <Monitor className="w-5 h-5 text-green-600 dark:text-green-400" />
                    Appareils connectés
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Gérez les appareils où vous êtes actuellement connecté
                  </p>
                </div>
                {sessions.filter(s => !s.current).length > 0 && (
                  <Button
                    variant="outline"
                    onClick={handleDisconnectAllSessions}
                    className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900"
                  >
                    Déconnecter tout
                  </Button>
                )}
              </div>
            </div>

            {loadingSessions ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Chargement des sessions...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sessions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Monitor className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Aucune session trouvée</p>
                  </div>
                ) : (
                  sessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <Monitor className="w-5 h-5 text-gray-400 mt-1" />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900 dark:text-gray-100">{session.device}</p>
                            {session.current && (
                              <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 rounded-full">
                                Session actuelle
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{session.location}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            Dernière activité: {session.lastActive}
                          </p>
                          {session.ipAddress && (
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                              IP: {session.ipAddress}
                            </p>
                          )}
                        </div>
                      </div>
                      {!session.current && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDisconnectSession(session.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900"
                        >
                          Déconnecter
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}