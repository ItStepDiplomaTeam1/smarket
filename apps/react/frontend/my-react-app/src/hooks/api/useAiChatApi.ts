import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/apiClient';
import type { ZephyrosResponse } from '@/modules/AiChat/store/useAiChatStore';

interface SendMessagePayload {
  message: string;
  provider?: string | null;
  model_name?: string | null;
  onStatusChange?: (status: string) => void;
}

const STATUS_STEPS = [
  'Думаю над запитом...',
  'Шукаю товари...',
  'Генерую відповідь...',
];

export const useSendAiMessage = () => {
  return useMutation<ZephyrosResponse, Error, SendMessagePayload>({
    mutationFn: async ({ message, provider, model_name, onStatusChange }) => {
      let stepIdx = 0;
      const nextStatus = () => {
        if (onStatusChange && stepIdx < STATUS_STEPS.length) {
          onStatusChange(STATUS_STEPS[stepIdx++]);
        }
      };
      nextStatus();

      const { data } = await apiClient.post<ZephyrosResponse>(
        '/api/v1/agent/chat',
        { message, provider, model_name },
        { timeout: 30000 },
      );
      return data;
    },
  });
};
