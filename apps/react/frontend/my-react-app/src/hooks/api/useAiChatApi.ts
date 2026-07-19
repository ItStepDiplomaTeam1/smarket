import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/apiClient';
import type { ZephyrosResponse } from '@/modules/AiChat/store/useAiChatStore';
import { buildChatRequest } from '@/modules/AiChat/lib/chatContract';

interface ChatMessagePayload {
  role: 'user' | 'assistant';
  content: string | ZephyrosResponse;
}

interface SendMessagePayload {
  message: string;
  history?: ChatMessagePayload[];
  onStatusChange?: (status: string) => void;
}

const STATUS_STEPS = [
  'Перевіряю запит...',
  'Збираю актуальні дані...',
  'Готую корисну відповідь...',
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
      const timer = window.setInterval(nextStatus, 1800);

      try {
        const { data } = await apiClient.post<ZephyrosResponse>(
          '/api/v1/agent/chat',
          buildChatRequest(message, history),
          { timeout: 38000 },
        );
        return data;
      } finally {
        window.clearInterval(timer);
      }
    },
  });
};
