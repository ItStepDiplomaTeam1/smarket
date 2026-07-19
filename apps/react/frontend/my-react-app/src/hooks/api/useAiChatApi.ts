import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/apiClient';
import type { ZephyrosResponse } from '@/modules/AiChat/store/useAiChatStore';

interface ChatMessagePayload {
  role: 'user' | 'assistant';
  content: string | any;
}

interface SendMessagePayload {
  message: string;
  history?: ChatMessagePayload[];
  onStatusChange?: (status: string) => void;
}

const STATUS_STEPS = [
  'Думаю над запитом...',
  'Шукаю товари...',
  'Генерую відповідь...',
];

export const useSendAiMessage = () => {
  return useMutation<ZephyrosResponse, Error, SendMessagePayload>({
    mutationFn: async ({ message, history, onStatusChange }) => {
      let stepIdx = 0;
      const nextStatus = () => {
        if (onStatusChange && stepIdx < STATUS_STEPS.length) {
          onStatusChange(STATUS_STEPS[stepIdx++]);
        }
      };
      nextStatus();

      const { data } = await apiClient.post<ZephyrosResponse>(
        '/api/v1/agent/chat',
        {
          message,
          history: history ?? null,
        },
        { timeout: 120000 },
      );
      return data;
    },
  });
};
