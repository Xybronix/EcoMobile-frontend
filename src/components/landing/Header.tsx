import { useNavigate } from 'react-router-dom';
import { Menu, X, Bike } from 'lucide-react';
import React, { useState } from 'react';
import { useI18n } from '../../lib/i18n';
import { useCompanyInfo } from '../../hooks/useCompanyInfo';
import { Button } from '../ui/button';

export function Header() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t, language, setLanguage } = useI18n();
  const { companyName, isLoading } = useCompanyInfo();

  const handleNavigateToAdmin = () => {
    navigate('/admin');
  };

  const handleNavigateToMobile = () => {
    navigate('/mobile');
  };

  const handleNavigateToReviews = () => {
    window.open('/reviews', '_blank');
  };

  const navigation = [
    { name: t('nav.home'), href: '#home' },
    { name: t('nav.features'), href: '#features' },
    { name: t('nav.howItWorks'), href: '#how-it-works' },
    { name: t('nav.pricing'), href: '#pricing' },
    { name: t('nav.testimonials'), href: '#testimonials' },
    { name: t('nav.download'), href: '#download' },
  ];

  const displayName = isLoading ? 'FreeBike' : (companyName || 'FreeBike');

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm shadow-sm z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
              <Bike className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl text-green-600" style={{ fontWeight: 700 }}>
              {displayName}
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-3 xl:gap-4">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-gray-700 hover:text-green-600 transition-colors text-md xl:text-base whitespace-nowrap"
                onClick={(e) => {
                  e.preventDefault();
                  const element = document.querySelector(item.href);
                  element?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                {item.name}
              </a>
            ))}
          </div>

          {/* Actions */}
          <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
            {/* Language Switcher */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setLanguage('fr')}
                className={`px-2 xl:px-3 py-1 rounded text-sm ${
                  language === 'fr'
                    ? 'bg-white text-green-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                FR
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-2 xl:px-3 py-1 rounded text-sm ${
                  language === 'en'
                    ? 'bg-white text-green-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                EN
              </button>
            </div>
            
            <Button onClick={handleNavigateToReviews} variant="outline" className="text-sm xl:text-base">
              Donner un avis
            </Button>
            
            <Button onClick={handleNavigateToAdmin} variant="outline" className="text-sm xl:text-base">
              {t('nav.admin')}
            </Button>
            
            {
              /*
              <Button 
                onClick={handleNavigateToMobile}
                className="bg-green-600 hover:bg-green-700 text-sm xl:text-base"
              >
                {t('nav.downloadApp')}
              </Button>
              */
            }
          </div>

          {/* Mobile menu button */}
          <button
            className="lg:hidden text-gray-700 flex-shrink-0"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t">
            <div className="flex flex-col gap-4">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-gray-700 hover:text-green-600 transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    setMobileMenuOpen(false);
                    const element = document.querySelector(item.href);
                    element?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  {item.name}
                </a>
              ))}
              
              <div className="flex gap-2 pt-4 border-t">
                <button
                  onClick={() => setLanguage('fr')}
                  className={`flex-1 px-3 py-2 rounded ${
                    language === 'fr'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  Français
                </button>
                <button
                  onClick={() => setLanguage('en')}
                  className={`flex-1 px-3 py-2 rounded ${
                    language === 'en'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  English
                </button>
              </div>
              
              <Button onClick={handleNavigateToReviews} variant="outline" className="w-full">
                Donner un avis
              </Button>
              
              <Button onClick={handleNavigateToAdmin} variant="outline" className="w-full">
                {t('nav.admin')}
              </Button>
              
              <Button 
                onClick={handleNavigateToMobile}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {t('nav.downloadApp')}
              </Button>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}