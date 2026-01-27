import { Star, Quote } from 'lucide-react';
import { useI18n } from '../../lib/i18n';
import React, { useEffect, useState } from 'react';
import { reviewService, Review } from '../../services/api/review.service';

export function Testimonials() {
  const { t } = useI18n();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadReviews = async () => {
      try {
        const data = await reviewService.getApprovedReviews();
        setReviews(data.slice(0, 6)); // Prendre les 6 premiers avis
      } catch (error) {
        console.error('Erreur lors du chargement des avis:', error);
        // Garder les données statiques par défaut si erreur
        setReviews([
          {
            id: '1',
            firstName: 'Marie',
            lastName: 'Kamga',
            socialStatus: 'Étudiante',
            photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop',
            comment: 'Service excellent et vélos toujours en bon état. Je recommande !',
            rating: 5,
            status: 'APPROVED',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: '2',
            firstName: 'Jean-Paul',
            lastName: 'Essomba',
            socialStatus: 'Ingénieur',
            comment: 'Application intuitive et prix abordables. Parfait pour mes trajets quotidiens.',
            rating: 5,
            status: 'APPROVED',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: '3',
            firstName: 'Aminata',
            lastName: 'Diop',
            socialStatus: 'Médecin',
            photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop',
            comment: 'Solution écologique et économique. Je ne peux plus m\'en passer !',
            rating: 5,
            status: 'APPROVED',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    loadReviews();
  }, []);

  if (isLoading) {
    return (
      <section id="testimonials" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl text-gray-900 mb-4" style={{ fontWeight: 700 }}>
              {t('testimonials.title')}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t('testimonials.subtitle')}
            </p>
          </div>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement des avis...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="testimonials" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl text-gray-900 mb-4" style={{ fontWeight: 700 }}>
            {t('testimonials.title')}
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t('testimonials.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow relative"
            >
              <Quote className="w-10 h-10 text-green-600/20 absolute top-6 right-6" />
              
              <div className="flex items-center gap-4 mb-4">
                {review.photo ? (
                  <img
                    src={review.photo}
                    alt={`${review.firstName} ${review.lastName}`}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-14 h-14 bg-green-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-lg">
                      {review.firstName.charAt(0)}{review.lastName.charAt(0)}
                    </span>
                  </div>
                )}
                <div>
                  <div className="text-gray-900" style={{ fontWeight: 600 }}>
                    {review.firstName} {review.lastName}
                  </div>
                  <div className="text-sm text-gray-500">{review.socialStatus}</div>
                </div>
              </div>

              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: review.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
                {Array.from({ length: 5 - review.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-gray-300" />
                ))}
              </div>

              <p className="text-gray-700 relative z-10">
                "{review.comment}"
              </p>
            </div>
          ))}
        </div>

        {reviews.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">Aucun avis disponible pour le moment.</p>
          </div>
        )}
      </div>
    </section>
  );
}