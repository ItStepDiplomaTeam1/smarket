import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/apiClient';
import type { ZephyrosResponse } from '@/modules/AiChat/store/useAiChatStore';

interface SendMessagePayload {
  message: string;
  provider?: string | null;
  model_name?: string | null;
  onStatusChange?: (status: string) => void;
}

const RETRY_DELAYS = [2000, 4000];

const STATUS_STEPS = [
  'Думаю над запитом...',
  'Шукаю товари...',
  'Генерую відповідь...',
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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

      for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
        try {
          const { data } = await apiClient.post<ZephyrosResponse>(
            '/api/v1/agent/chat',
            { message, provider, model_name },
            { timeout: 90000 },
          );
          return data;
        } catch (err: unknown) {
          const isLast = attempt === RETRY_DELAYS.length;
          if (isLast) throw err;

          onStatusChange?.(`Повторна спроба ${attempt + 1}...`);
          await sleep(RETRY_DELAYS[attempt]);
          nextStatus();
        }
      }

      // TypeScript requires an explicit throw/return at end even though loop always throws
      throw new Error('Unreachable');
    },
  });
};
