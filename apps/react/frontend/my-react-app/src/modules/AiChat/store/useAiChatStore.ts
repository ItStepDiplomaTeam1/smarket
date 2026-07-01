import { create } from 'zustand';

export type UIBlock =
  | { type: 'text'; content: string }
  | { type: 'table'; title?: string; columns: string[]; rows: (string | boolean | number | null)[][]; highlight_row?: number }
  | { type: 'product_card'; product_id: number; name: string; store: string; price: string; in_stock: boolean; savings?: string }
  | { type: 'tabs'; items: { label: string; blocks: UIBlock[] }[] }
  | { type: 'clarification'; question: string; options: string[] }
  | { type: 'action_button'; label: string; action: 'add_to_cart'; payload: { product_id: number; quantity: number; store_id: string } }
  | { type: 'badge'; variant: 'savings' | 'best_price' | 'warning' | 'info'; label: string; value: string }
  | { type: 'fallback'; message: string; suggestion?: string }
  | { type: 'divider' };

export interface ZephyrosResponse {
  blocks: UIBlock[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string | ZephyrosResponse;
  timestamp: Date;
}

interface AiChatState {
  isOpen: boolean;
  messages: ChatMessage[];
  open: () => void;
  close: () => void;
  toggle: () => void;
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
}

export const useAiChatStore = create<AiChatState>((set) => ({
  isOpen: false,
  messages: [],
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
  addMessage: (message) => set((s) => ({ messages: [...s.messages, message] })),
  clearMessages: () => set({ messages: [] }),
}));
