import React from 'react';
import { Bike, Facebook, Instagram, Twitter, Mail, Phone, MapPin, Globe } from 'lucide-react';
import { useI18n } from '../../lib/i18n';
import { useCompanyInfo } from '../../hooks/useCompanyInfo';

interface SocialLink {
  name: string;
  icon: React.ComponentType<any>;
  href: string;
}

export function Footer() {
  const { t } = useI18n();
  const {
    companyName,
    description,
    email,
    phone,
    address,
    city,
    country,
    facebook,
    twitter,
    instagram,
    website,
    isLoading
  } = useCompanyInfo();

  const displayName = isLoading ? 'FreeBike' : (companyName || 'FreeBike');
  const displayEmail = email || `info@${displayName.toLowerCase()}.cm`;
  const displayPhone = phone || '+237 690 60 11 86';
  const displayLocation = address ? `${address}, ${city}, ${country}` : `${city || 'Douala'}, ${country || 'Cameroun'}`;
  const displayTagline = description || t('footer.tagline');

  const footerLinks = {
    company: [
      { name: t('footer.company.about'), href: '#' },
      { name: t('footer.company.careers'), href: '#' },
      { name: t('footer.company.press'), href: '#' },
      { name: t('footer.company.blog'), href: '#' },
    ],
    support: [
      { name: t('footer.support.help'), href: '#' },
      { name: t('footer.support.safety'), href: '#' },
      { name: t('footer.support.terms'), href: '#' },
      { name: t('footer.support.privacy'), href: '#' },
    ],
    contact: [
      { name: displayEmail, href: `mailto:${displayEmail}`, icon: Mail },
      { name: displayPhone, href: `tel:${displayPhone.replace(/\s/g, '')}`, icon: Phone },
      { name: displayLocation, href: '#', icon: MapPin },
    ],
  };

  // Fonction helper pour créer les liens sociaux avec type safety
  const createSocialLinks = (): SocialLink[] => {
    const links: SocialLink[] = [];
    
    if (facebook) {
      links.push({ name: 'Facebook', icon: Facebook, href: facebook });
    }
    if (instagram) {
      links.push({ name: 'Instagram', icon: Instagram, href: instagram });
    }
    if (twitter) {
      links.push({ name: 'Twitter', icon: Twitter, href: twitter });
    }
    if (website) {
      links.push({ name: 'Website', icon: Globe, href: website });
    }
    
    return links;
  };

  const socialLinks = createSocialLinks();

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                <Bike className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl text-white" style={{ fontWeight: 700 }}>
                {displayName}
              </span>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              {displayTagline}
            </p>
            
            {/* Social Links */}
            {socialLinks.length > 0 && (
              <div className="flex gap-3">
                {socialLinks.map((social) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={social.name}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 bg-gray-800 hover:bg-green-600 rounded-full flex items-center justify-center transition-colors"
                      aria-label={social.name}
                    >
                      <Icon className="w-5 h-5" />
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-white mb-4" style={{ fontWeight: 600 }}>
              {t('footer.company.title')}
            </h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-sm hover:text-green-600 transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="text-white mb-4" style={{ fontWeight: 600 }}>
              {t('footer.support.title')}
            </h3>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-sm hover:text-green-600 transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white mb-4" style={{ fontWeight: 600 }}>
              {t('footer.contact.title')}
            </h3>
            <ul className="space-y-3">
              {footerLinks.contact.map((link) => {
                const Icon = link.icon;
                return (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="flex items-center gap-2 text-sm hover:text-green-600 transition-colors"
                    >
                      <Icon className="w-4 h-4" />
                      <span className="truncate">{link.name}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} {displayName}. {t('footer.rights')}
            </p>
            <div className="flex gap-6 text-sm">
              <a href="#" className="hover:text-green-600 transition-colors">
                {t('footer.legal.privacy')}
              </a>
              <a href="#" className="hover:text-green-600 transition-colors">
                {t('footer.legal.terms')}
              </a>
              <a href="#" className="hover:text-green-600 transition-colors">
                {t('footer.legal.cookies')}
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}