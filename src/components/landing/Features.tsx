import React from 'react';
import { MapPin, Smartphone, CreditCard, Shield, Clock, Zap } from 'lucide-react';
import { useI18n } from '../../lib/i18n';

export function Features() {
  const { t } = useI18n();

  const features = [
    {
      icon: MapPin,
      title: t('features.gps.title'),
      description: t('features.gps.description'),
      color: 'bg-blue-500',
    },
    {
      icon: Smartphone,
      title: t('features.mobile.title'),
      description: t('features.mobile.description'),
      color: 'bg-green-500',
    },
    {
      icon: CreditCard,
      title: t('features.payment.title'),
      description: t('features.payment.description'),
      color: 'bg-purple-500',
    },
    {
      icon: Shield,
      title: t('features.security.title'),
      description: t('features.security.description'),
      color: 'bg-red-500',
    },
    {
      icon: Clock,
      title: t('features.availability.title'),
      description: t('features.availability.description'),
      color: 'bg-orange-500',
    },
    {
      icon: Zap,
      title: t('features.electric.title'),
      description: t('features.electric.description'),
      color: 'bg-yellow-500',
    },
  ];

  return (
    <section id="features" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl text-gray-900 mb-4" style={{ fontWeight: 700 }}>
            {t('features.title')}
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t('features.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className={`w-12 h-12 ${feature.color} rounded-lg flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl text-gray-900 mb-2" style={{ fontWeight: 600 }}>
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
