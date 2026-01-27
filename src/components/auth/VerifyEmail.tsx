import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Loader2, CheckCircle, XCircle, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { authService } from '../../services/api/auth.service';

export function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [message, setMessage] = useState('');

  const token = searchParams.get('token');
  const userId = searchParams.get('userId');

  useEffect(() => {
    if (token && userId) {
      verifyEmail();
    } else {
      setVerificationStatus('error');
      setMessage('Lien de vérification invalide. Veuillez cliquer sur le lien dans votre email.');
      setIsLoading(false);
    }
  }, [token, userId]);

  const verifyEmail = async () => {
    if (!token || !userId) return;

    setIsVerifying(true);
    try {
      await authService.verifyEmail({ userId, token });
      setVerificationStatus('success');
      setMessage('Votre email a été vérifié avec succès ! Vous pouvez maintenant vous connecter.');
      toast.success('Email vérifié avec succès');
    } catch (error: any) {
      setVerificationStatus('error');
      if (error.message === 'email_already_verified') {
        setMessage('Votre email est déjà vérifié. Vous pouvez vous connecter.');
      } else if (error.message === 'verification_token_expired') {
        setMessage('Le lien de vérification a expiré. Veuillez en demander un nouveau.');
      } else if (error.message === 'invalid_verification_token') {
        setMessage('Lien de vérification invalide. Veuillez en demander un nouveau.');
      } else {
        setMessage('Une erreur est survenue lors de la vérification. Veuillez réessayer.');
      }
      toast.error('Erreur lors de la vérification');
    } finally {
      setIsVerifying(false);
      setIsLoading(false);
    }
  };

  const resendVerification = async () => {
    if (!userId) return;

    setIsResending(true);
    try {
      // On pourrait récupérer l'email depuis le localStorage ou demander à l'utilisateur
      // Pour l'exemple, on suppose que l'email est dans l'URL ou stocké localement
      const email = localStorage.getItem('pendingVerificationEmail');
      
      if (!email) {
        toast.error('Email non trouvé. Veuillez vous réinscrire.');
        return;
      }

      await authService.resendVerification(email);
      toast.success('Email de vérification renvoyé !');
      setMessage('Un nouvel email de vérification a été envoyé. Vérifiez votre boîte de réception.');
    } catch (error: any) {
      if (error.message === 'email_already_verified') {
        setMessage('Votre email est déjà vérifié. Vous pouvez vous connecter.');
        setVerificationStatus('success');
      } else {
        toast.error('Erreur lors de l\'envoi de l\'email');
      }
    } finally {
      setIsResending(false);
    }
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const handleRegister = () => {
    navigate('/register');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="p-8 w-full max-w-md text-center">
          <Loader2 className="w-12 h-12 animate-spin text-green-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Vérification en cours...</h2>
          <p className="text-gray-600">Veuillez patienter pendant que nous vérifions votre email.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="p-8 w-full max-w-md">
        <div className="text-center mb-8">
          {verificationStatus === 'success' ? (
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          ) : verificationStatus === 'error' ? (
            <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          ) : (
            <Mail className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          )}
          
          <h1 className="text-2xl font-bold mb-2">
            {verificationStatus === 'success' 
              ? 'Email Vérifié !' 
              : verificationStatus === 'error'
              ? 'Erreur de Vérification'
              : 'Vérification d\'Email'}
          </h1>
          
          <p className="text-gray-600 mb-6">{message}</p>
        </div>

        <div className="space-y-4">
          {verificationStatus === 'success' ? (
            <Button
              onClick={handleLogin}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Se connecter
            </Button>
          ) : verificationStatus === 'error' ? (
            <>
              <Button
                onClick={resendVerification}
                disabled={isResending}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isResending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  'Renvoyer l\'email de vérification'
                )}
              </Button>
              <Button
                onClick={handleRegister}
                variant="outline"
                className="w-full"
              >
                Créer un nouveau compte
              </Button>
            </>
          ) : null}
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            Si vous avez besoin d'aide, contactez{' '}
            <a href="mailto:support@freebike.com" className="text-green-600 hover:underline">
              support@freebike.com
            </a>
          </p>
        </div>
      </Card>
    </div>
  );
}