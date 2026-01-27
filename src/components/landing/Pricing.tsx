import React, { useState, useEffect } from 'react';
import { Check, Clock, Tag, Percent } from 'lucide-react';
import { useI18n } from '../../lib/i18n';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { companyService, PricingConfig } from '../../services/api/company.service';

export function Pricing(this: any) {
  const { t } = useI18n();
  const [pricing, setPricing] = useState<PricingConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const loadPricing = async () => {
      try {
        setIsLoading(true);
        const data = await companyService.getPublicPricing(currentTime, currentTime.getHours());
        setPricing(data);
      } catch (error) {
        console.error('Error loading pricing:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPricing();

    // Actualiser les prix à chaque heure pile
    const now = new Date();
    const nextHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1, 0, 0);
    const timeToNextHour = nextHour.getTime() - now.getTime();

    const timeout = setTimeout(() => {
      const updatePricing = () => {
        const newTime = new Date();
        setCurrentTime(newTime);
        loadPricing();
      };

      updatePricing();
      
      // Puis actualiser toutes les heures
      const interval = setInterval(updatePricing, 60 * 60 * 1000);
      
      return () => clearInterval(interval);
    }, timeToNextHour);

    return () => clearTimeout(timeout);
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price);
  };

  const getPlanFeatures = (plan: any) => {
    const features = [
      `Minimum ${plan.minimumHours}h de location`,
      `Déverrouillage inclus (${formatPrice(pricing?.unlockFee || 0)} FCFA)`,
      `Disponibilité 24h/7j`,
      `Support client`,
      `Application mobile`,
    ];

    // Ajouter les promotions comme features
    if (plan.appliedPromotions?.length > 0) {
      plan.appliedPromotions.forEach((promo: any) => {
        features.push(`🎉 ${promo.name}`);
      });
    }

    return features;
  };

  const calculateSavings = (originalPrice: number, currentPrice: number) => {
    if (originalPrice <= currentPrice) return null;
    const savings = originalPrice - currentPrice;
    const percentage = Math.round((savings / originalPrice) * 100);
    return { amount: savings, percentage };
  };

  const getNextHour = () => {
    const now = new Date();
    const nextHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1, 0, 0);
    return nextHour.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  if (isLoading) {
    return (
      <section id="pricing" className="py-20 bg-gradient-to-br from-green-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-300 rounded w-1/2 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-300 rounded w-1/3 mx-auto"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const activePlans = pricing?.plans?.filter(p => p.isActive) || [];

  if (!isLoading && activePlans.length === 0) {
    return (
      <section id="pricing" className="py-20 bg-gradient-to-br from-green-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-4xl md:text-5xl text-gray-900 mb-4" style={{ fontWeight: 700 }}>
              {t('pricing.title')}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Aucun plan de tarification disponible pour le moment
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="pricing" className="py-20 bg-gradient-to-br from-green-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl text-gray-900 mb-4" style={{ fontWeight: 700 }}>
            {t('pricing.title')}
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Tarification par heure - Location minimum 1 heure
          </p>
          
          {/* Indicateur de tarif actuel */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
            {pricing?.appliedRule && (
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-lg">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {pricing.appliedRule.name} (x{pricing.multiplier})
                </span>
              </div>
            )}
            
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-lg">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">
                Prochaine mise à jour : {pricing?.nextUpdate ? new Date(pricing.nextUpdate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : this.getNextHour()}
              </span>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {activePlans.map((plan, index) => {
            const savings = plan.originalHourlyRate ? calculateSavings(plan.originalHourlyRate, plan.hourlyRate) : null;
            const hasPromotions = plan.appliedPromotions && plan.appliedPromotions.length > 0;
            
            return (
              <div
                key={plan.id || index}
                className={`relative bg-white rounded-2xl shadow-lg p-8 ${
                  plan.name.toLowerCase().includes('heure') || plan.name.toLowerCase().includes('hourly') ? 'ring-2 ring-green-600 scale-105' : ''
                } ${hasPromotions ? 'ring-2 ring-orange-400' : ''}`}
              >
                {plan.name.toLowerCase().includes('heure') && !hasPromotions && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-green-600 text-white px-4 py-1 rounded-full text-sm" style={{ fontWeight: 600 }}>
                    {t('pricing.popular') || 'Populaire'}
                  </div>
                )}

                {hasPromotions && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-4 py-1 rounded-full text-sm flex items-center gap-1" style={{ fontWeight: 600 }}>
                    <Tag className="w-3 h-3" />
                    Promotion !
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-2xl text-gray-900 mb-2" style={{ fontWeight: 600 }}>
                    {plan.name}
                  </h3>
                  
                  <div className="flex items-baseline justify-center gap-1">
                    {savings && (
                      <span className="text-2xl text-gray-400 line-through mr-2">
                        {formatPrice(plan.originalHourlyRate!)}
                      </span>
                    )}
                    <span className="text-4xl text-gray-900" style={{ fontWeight: 700 }}>
                      {formatPrice(plan.hourlyRate)}
                    </span>
                    <span className="text-gray-600">FCFA</span>
                  </div>
                  
                  <div className="text-sm text-gray-500 mt-1">par heure (min. {plan.minimumHours}h)</div>
                  
                  {savings && (
                    <div className="mt-2">
                      <Badge variant="destructive" className="bg-orange-100 text-orange-800">
                        <Percent className="w-3 h-3 mr-1" />
                        Économisez {savings.percentage}% ({formatPrice(savings.amount)} FCFA)
                      </Badge>
                    </div>
                  )}
                  
                  {/* Autres tarifs */}
                  <div className="mt-4 space-y-1 text-sm text-gray-600">
                    <div>24h : {formatPrice(plan.dailyRate)} FCFA</div>
                    <div>7 jours : {formatPrice(plan.weeklyRate)} FCFA</div>
                    <div>30 jours : {formatPrice(plan.monthlyRate)} FCFA</div>
                  </div>

                  {/* Promotions actives */}
                  {hasPromotions && (
                    <div className="mt-3 space-y-1">
                      {plan.appliedPromotions!.map((promo: any, promoIndex: number) => (
                        <div key={promoIndex} className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                          {promo.name}: {promo.discountType === 'PERCENTAGE' ? `${promo.discountValue}%` : `${formatPrice(promo.discountValue)} FCFA`} de réduction
                        </div>
                      ))}
                    </div>
                  )}

                  {plan.appliedRule && (
                    <div className="mt-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                      Règle appliquée : {plan.appliedRule}
                    </div>
                  )}
                </div>

                <ul className="space-y-3 mb-8">
                  {getPlanFeatures(plan).map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full ${
                    hasPromotions
                      ? 'bg-orange-500 hover:bg-orange-600 text-white'
                      : plan.name.toLowerCase().includes('heure') || plan.name.toLowerCase().includes('hourly')
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                  }`}
                >
                  {hasPromotions ? 'Profiter de la promotion' : (t('pricing.selectPlan') || 'Choisir ce plan')}
                </Button>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600">
            Tous les prix incluent les frais de déverrouillage. Location minimum 1 heure.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Les tarifs peuvent varier selon l'heure et le jour. Mise à jour automatique toutes les heures.
          </p>
        </div>
      </div>
    </section>
  );
}