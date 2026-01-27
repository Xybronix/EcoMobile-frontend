// components/ReviewsPage.tsx
import { useState, useEffect } from 'react';
import { Star, Upload, User } from 'lucide-react';
import { reviewService, ReviewSubmission } from '../services/api/review.service';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { toast } from 'sonner';

interface FormData {
  photo: File | null;
  firstName: string;
  lastName: string;
  socialStatus: string;
  rating: number;
  comment: string;
}

export function ReviewsPage() {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    photo: null,
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    socialStatus: '',
    rating: 5,
    comment: ''
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || ''
      }));
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName.trim() || !formData.lastName.trim() || 
        !formData.socialStatus.trim() || !formData.comment.trim()) {
      toast.error('Tous les champs sont obligatoires');
      return;
    }

    setIsSubmitting(true);
    try {
      const submitData: ReviewSubmission = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        socialStatus: formData.socialStatus,
        rating: formData.rating,
        comment: formData.comment
      };

      // Gérer la photo si présente
      if (formData.photo) {
        const reader = new FileReader();
        const photoBase64 = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(formData.photo!);
        });
        submitData.photo = photoBase64;
      }

      await reviewService.submitReview(submitData);
      setSubmitted(true);
      toast.success('Votre avis a été soumis avec succès ! Il sera examiné avant publication.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la soumission');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB max
        toast.error('L\'image ne doit pas dépasser 5MB');
        return;
      }
      setFormData(prev => ({ ...prev, photo: file }));
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Merci pour votre avis !
          </h2>
          <p className="text-gray-600 mb-6">
            Votre avis a été soumis avec succès. Il sera examiné par notre équipe avant d'être publié.
          </p>
          <Button 
            onClick={() => window.close()}
            className="w-full"
          >
            Fermer
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Partagez votre expérience
          </h1>
          <p className="text-gray-600">
            Votre avis nous aide à améliorer notre service et aide les autres utilisateurs.
          </p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Photo (optionnelle) */}
            <div>
              <Label htmlFor="photo">Photo (optionnelle)</Label>
              <div className="mt-2">
                <div className="flex items-center gap-4">
                  {formData.photo ? (
                    <img
                      src={URL.createObjectURL(formData.photo)}
                      alt="Aperçu"
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center">
                      <User className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <input
                      type="file"
                      id="photo"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('photo')?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Choisir une photo
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Nom et Prénom */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">Prénom *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  disabled={!!user} // Désactivé si connecté
                  className="text-base"
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName">Nom *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  disabled={!!user} // Désactivé si connecté
                  className="text-base"
                  required
                />
              </div>
            </div>

            {/* Statut social */}
            <div>
              <Label htmlFor="socialStatus">Statut social *</Label>
              <Input
                id="socialStatus"
                value={formData.socialStatus}
                onChange={(e) => setFormData(prev => ({ ...prev, socialStatus: e.target.value }))}
                placeholder="Ex: Étudiant, Ingénieur, Médecin, etc."
                className="text-base"
                required
              />
            </div>

            {/* Note */}
            <div>
              <Label>Nombre d'étoiles *</Label>
              <div className="flex gap-2 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Button
                    key={star}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, rating: star }))}
                    className="p-1"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= formData.rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </Button>
                ))}
              </div>
            </div>

            {/* Commentaire */}
            <div>
              <Label htmlFor="comment">Votre avis *</Label>
              <Textarea
                id="comment"
                value={formData.comment}
                onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                placeholder="Partagez votre expérience avec notre service..."
                rows={4}
                className="text-base"
                required
              />
            </div>

            {user && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-700">
                  ✓ Connecté en tant que {user.firstName} {user.lastName}
                </p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Envoi en cours...' : 'Soumettre mon avis'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}