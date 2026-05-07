import { useState, useEffect } from 'react';

export interface FeatureFlags {
  gemini: boolean;
  resend: boolean;
  stripe: boolean;
  mercadopago: boolean;
  googleCalendar: boolean;
}

const defaultFlags: FeatureFlags = {
  gemini: false,
  resend: false,
  stripe: false,
  mercadopago: false,
  googleCalendar: false,
};

export function useFeatures() {
  const [features, setFeatures] = useState<FeatureFlags>(defaultFlags);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFeatures() {
      try {
        const response = await fetch('/api/config/features');
        if (response.ok) {
          const data = await response.json();
          setFeatures(data);
        }
      } catch (error) {
        console.error('Error fetching feature flags:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchFeatures();
  }, []);

  return { features, loading };
}
