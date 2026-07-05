import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { useIdleTimeout } from '@/hooks/useIdleTimeout';

const parseLogoutTime = (val: string): number | null => {
  switch (val) {
    case '15 хв': return 15;
    case '30 хв': return 30;
    case '1 година': return 60;
    case 'Ніколи': return null;
    default: return 30; // fallback
  }
};

export const IdleTimeoutManager: React.FC = () => {
  const { data: userProfile } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const { data } = await apiClient.get('/auth/me');
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 min cache
  });

  const logoutTimeStr = userProfile?.settings?.logoutTime || '30 хв';
  const timeoutMinutes = parseLogoutTime(logoutTimeStr);

  // Initialize the idle timeout hook
  useIdleTimeout(timeoutMinutes);

  return null; // This component doesn't render anything
};
