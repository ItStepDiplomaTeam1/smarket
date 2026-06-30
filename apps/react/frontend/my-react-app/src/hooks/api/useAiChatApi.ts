import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/apiClient';
import type { ZephyrosResponse } from '@/modules/AiChat/store/useAiChatStore';

interface SendMessagePayload {
  message: string;
}

export const useSendAiMessage = () => {
  return useMutation<ZephyrosResponse, Error, SendMessagePayload>({
    mutationFn: async ({ message }) => {
      const { data } = await apiClient.post<ZephyrosResponse>(
        '/api/v1/agent/chat',
        { message },
        { timeout: 60000 },
      );
      return data;
    },
  });
};
