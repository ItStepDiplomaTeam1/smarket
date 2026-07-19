import type { UIBlock, ZephyrosResponse } from '@/modules/AiChat/store/useAiChatStore';


export interface ChatHistoryEntry {
  role: 'user' | 'assistant';
  content: string | ZephyrosResponse;
}

const MAX_HISTORY_ENTRIES = 8;


export function buildChatRequest(message: string, history?: ChatHistoryEntry[]) {
  return {
    message,
    history: history?.slice(-MAX_HISTORY_ENTRIES) ?? null,
  };
}


export function hasFallback(response: ZephyrosResponse): boolean {
  return response.blocks.some((block) => block.type === 'fallback');
}


export function isMutationAction(
  action: Extract<UIBlock, { type: 'action_button' }>['action'],
): boolean {
  return (
    action === 'add_to_cart' ||
    action === 'remove_from_cart' ||
    action === 'clear_cart' ||
    action === 'create_review'
  );
}
