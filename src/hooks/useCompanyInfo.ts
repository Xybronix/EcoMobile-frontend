import { useState, useEffect } from 'react';
import { companyService } from '../services/api/company.service';

interface CompanyInfo {
  companyName: string;
  description: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  orangeMoneyNumber: string;
  mobileMoneyNumber: string;
  facebook?: string;
  twitter?: string;
  instagram?: string;
  linkedin?: string;
  website?: string;
}

export function useCompanyInfo() {
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchCompanyInfo = async () => {
      try {
        const data = await companyService.getPublicSettings();
        if (isMounted) {
          const normalizedData: CompanyInfo = {
            companyName: data.companyName || 'FreeBike',
            description: data.description || '',
            email: data.email || 'contact@freebike.cm',
            phone: data.phone || '+237 6XX XX XX XX',
            address: data.address || '',
            city: data.city || 'Douala',
            country: data.country || 'Cameroun',
            orangeMoneyNumber: data.orangeMoneyNumber || '',
            mobileMoneyNumber: data.mobileMoneyNumber || '',
            facebook: data.facebook,
            twitter: data.twitter,
            instagram: data.instagram,
            linkedin: data.linkedin,
            website: data.website
          };
          
          setCompanyInfo(normalizedData);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Erreur de chargement');
          setCompanyInfo({
            companyName: 'FreeBike',
            description: '',
            email: 'contact@freebike.cm',
            phone: '+237 6XX XX XX XX',
            address: '',
            city: 'Douala',
            country: 'Cameroun',
            orangeMoneyNumber: '',
            mobileMoneyNumber: ''
          });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchCompanyInfo();

    return () => {
      isMounted = false;
    };
  }, []);

  const refetch = () => {
    setIsLoading(true);
    setError(null);
  };

  return {
    ...companyInfo,
    isLoading,
    error,
    refetch
  };
}