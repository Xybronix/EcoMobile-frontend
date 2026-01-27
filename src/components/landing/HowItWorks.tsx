import React from 'react';
import { Download, QrCode, Bike, CheckCircle } from 'lucide-react';
import { useI18n } from '../../lib/i18n';

export function HowItWorks() {
  const { t } = useI18n();

  const steps = [
    {
      icon: Download,
      number: '01',
      title: t('howItWorks.step1.title'),
      description: t('howItWorks.step1.description'),
    },
    {
      icon: QrCode,
      number: '02',
      title: t('howItWorks.step2.title'),
      description: t('howItWorks.step2.description'),
    },
    {
      icon: Bike,
      number: '03',
      title: t('howItWorks.step3.title'),
      description: t('howItWorks.step3.description'),
    },
    {
      icon: CheckCircle,
      number: '04',
      title: t('howItWorks.step4.title'),
      description: t('howItWorks.step4.description'),
    },
  ];

  return (
    <section id="how-it-works" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl text-gray-900 mb-4" style={{ fontWeight: 700 }}>
            {t('howItWorks.title')}
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t('howItWorks.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="relative text-center">
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-16 left-[60%] w-full h-0.5 bg-gradient-to-r from-green-600 to-green-400" />
                )}

                <div className="relative">
                  {/* Number Badge */}
                  <div className="inline-flex items-center justify-center w-32 h-32 bg-green-50 rounded-full mb-6 relative z-10">
                    <div className="absolute top-2 right-2 w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-sm" style={{ fontWeight: 600 }}>
                      {step.number}
                    </div>
                    <Icon className="w-12 h-12 text-green-600" />
                  </div>

                  <h3 className="text-xl text-gray-900 mb-2" style={{ fontWeight: 600 }}>
                    {step.title}
                  </h3>
                  <p className="text-gray-600">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
