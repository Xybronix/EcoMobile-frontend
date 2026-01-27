import React from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '../ui/button';
import { useI18n } from '../../lib/i18n';
import { ImageWithFallback } from '../figma/ImageWithFallback';

export function Hero() {
  const { t } = useI18n();

  return (
    <section id="home" className="relative min-h-screen flex items-center pt-16">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <ImageWithFallback
          src="https://media.istockphoto.com/id/1999953241/photo/coworkers-riding-a-bicycle-at-public-park.jpg?s=612x612&w=0&k=20&c=w78vE8_f55FE-hus6rfW58JKI9mS2vNAp3n03f__TII="
          alt="Electric bike in city"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-2xl">
          <h1 className="text-5xl md:text-6xl lg:text-7xl text-white mb-6" style={{ fontWeight: 700, lineHeight: 1.1 }}>
            {t('hero.title')}
          </h1>
          <p className="text-xl md:text-2xl text-gray-200 mb-8">
            {t('hero.subtitle')}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              size="lg"
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg"
              onClick={() => {
                document.querySelector('#download')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              {t('hero.downloadNow')}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-white/10 backdrop-blur-sm text-white border-white hover:bg-white/20 px-8 py-6 text-lg"
              onClick={() => {
                document.querySelector('#how-it-works')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              {t('hero.learnMore')}
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-white/20">
            <div>
              <div className="text-3xl md:text-4xl text-white mb-1" style={{ fontWeight: 700 }}>
                500+
              </div>
              <div className="text-sm text-gray-300">{t('hero.stats.bikes')}</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl text-white mb-1" style={{ fontWeight: 700 }}>
                10K+
              </div>
              <div className="text-sm text-gray-300">{t('hero.stats.users')}</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl text-white mb-1" style={{ fontWeight: 700 }}>
                24/7
              </div>
              <div className="text-sm text-gray-300">{t('hero.stats.available')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
        <ChevronDown className="w-8 h-8 text-white" />
      </div>
    </section>
  );
}