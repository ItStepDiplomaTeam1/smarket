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


function stripActionToken(
  block: UIBlock,
  actionToken?: string,
): UIBlock {
  if (block.type === 'tabs') {
    return {
      ...block,
      items: block.items.map((item) => ({
        ...item,
        blocks: item.blocks.map((child) => stripActionToken(child, actionToken)),
      })),
    };
  }
  if (block.type !== 'action_button' || !isMutationAction(block.action)) {
    return block;
  }
  if (
    actionToken !== undefined &&
    block.payload.action_token !== actionToken
  ) {
    return block;
  }

  const payload = { ...block.payload };
  delete payload.action_token;
  return { ...block, payload };
}


export function stripExecutableActionTokens(
  response: ZephyrosResponse,
  actionToken?: string,
): ZephyrosResponse {
  return {
    ...response,
    blocks: response.blocks.map((block) => stripActionToken(block, actionToken)),
  };
}
