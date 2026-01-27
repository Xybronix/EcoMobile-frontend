import React, { useState, useEffect } from 'react';
import { Save, Building2, Mail, MapPin, CreditCard, Facebook, Twitter, Instagram, Linkedin, Globe } from 'lucide-react';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { companyService, CompanySettings as CompanySettingsType } from '../../../services/api/company.service';
import { useTranslation } from '../../../lib/i18n';
import { toast } from 'sonner';

export function CompanySettings() {
  const [settings, setSettings] = useState<CompanySettingsType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await companyService.getSettings();
        setSettings(data);
      } catch (error) {
        toast.error('Erreur lors du chargement des paramètres');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setIsSaving(true);
    try {
      await companyService.updateSettings(settings);
      toast.success('Paramètres enregistrés avec succès');
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !settings) {
    return <div className="p-8">Chargement...</div>;
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-green-600">{t('settings.company')}</h1>
          <p className="text-gray-600">{t('settings.companyInfo')}</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Enregistrement...' : t('common.save')}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Information */}
        <Card className="p-6">
          <h2 className="mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-green-600" />
            Informations de l'Entreprise
          </h2>
          <div className="space-y-4">
            <div>
              <Label>Nom de l'Entreprise</Label>
              <Input
                value={settings.companyName}
                onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
              />
            </div>
            <div>
              <Label>{t('common.description')}</Label>
              <Textarea
                value={settings.description || ''}
                onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
        </Card>

        {/* Contact Information */}
        <Card className="p-6">
          <h2 className="mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5 text-green-600" />
            {t('settings.contactInfo')}
          </h2>
          <div className="space-y-4">
            <div>
              <Label>{t('common.email')}</Label>
              <Input
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
              />
            </div>
            <div>
              <Label>{t('common.phone')}</Label>
              <Input
                type="tel"
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
              />
            </div>
          </div>
        </Card>

        {/* Address */}
        <Card className="p-6">
          <h2 className="mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-green-600" />
            {t('common.address')}
          </h2>
          <div className="space-y-4">
            <div>
              <Label>{t('common.address')}</Label>
              <Input
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Ville</Label>
                <Input
                  value={settings.city}
                  onChange={(e) => setSettings({ ...settings, city: e.target.value })}
                />
              </div>
              <div>
                <Label>Pays</Label>
                <Input
                  value={settings.country}
                  onChange={(e) => setSettings({ ...settings, country: e.target.value })}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Payment Information */}
        <Card className="p-6">
          <h2 className="mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-green-600" />
            {t('settings.paymentInfo')}
          </h2>
          <div className="space-y-4">
            <div>
              <Label>Numéro Orange Money</Label>
              <Input
                type="tel"
                value={settings.orangeMoneyNumber}
                onChange={(e) => setSettings({ ...settings, orangeMoneyNumber: e.target.value })}
                placeholder="+237 6XX XXX XXX"
              />
            </div>
            <div>
              <Label>Numéro Mobile Money</Label>
              <Input
                type="tel"
                value={settings.mobileMoneyNumber}
                onChange={(e) => setSettings({ ...settings, mobileMoneyNumber: e.target.value })}
                placeholder="+237 6XX XXX XXX"
              />
            </div>
          </div>
        </Card>

        {/* Social Media */}
        <Card className="p-6 lg:col-span-2">
          <h2 className="mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-green-600" />
            {t('settings.socialMedia')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="flex items-center gap-2">
                <Facebook className="w-4 h-4" />
                Facebook
              </Label>
              <Input
                value={settings.facebook || ''}
                onChange={(e) => setSettings({ ...settings, facebook: e.target.value })}
                placeholder="https://facebook.com/..."
              />
            </div>
            <div>
              <Label className="flex items-center gap-2">
                <Twitter className="w-4 h-4" />
                Twitter
              </Label>
              <Input
                value={settings.twitter || ''}
                onChange={(e) => setSettings({ ...settings, twitter: e.target.value })}
                placeholder="https://twitter.com/..."
              />
            </div>
            <div>
              <Label className="flex items-center gap-2">
                <Instagram className="w-4 h-4" />
                Instagram
              </Label>
              <Input
                value={settings.instagram || ''}
                onChange={(e) => setSettings({ ...settings, instagram: e.target.value })}
                placeholder="https://instagram.com/..."
              />
            </div>
            <div>
              <Label className="flex items-center gap-2">
                <Linkedin className="w-4 h-4" />
                LinkedIn
              </Label>
              <Input
                value={settings.linkedin || ''}
                onChange={(e) => setSettings({ ...settings, linkedin: e.target.value })}
                placeholder="https://linkedin.com/company/..."
              />
            </div>
            <div>
              <Label className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Site Web
              </Label>
              <Input
                value={settings.website || ''}
                onChange={(e) => setSettings({ ...settings, website: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}