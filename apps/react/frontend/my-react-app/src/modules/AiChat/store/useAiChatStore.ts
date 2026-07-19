import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UIBlock =
  | { type: 'text'; content: string }
  | { type: 'table'; title?: string; columns: string[]; rows: (string | boolean | number | null)[][]; highlight_row?: number }
  | { type: 'product_card'; product_id: number; name: string; store: string; price: string; in_stock: boolean; savings?: string; image_url?: string | null }
  | { type: 'tabs'; items: { label: string; blocks: UIBlock[] }[] }
  | { type: 'clarification'; question: string; options: string[] }
  | { type: 'action_button'; label: string; action: 'add_to_cart' | 'remove_from_cart' | 'clear_cart' | 'create_review' | 'navigate' | 'apply_filters'; payload: Record<string, unknown> }
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
  productView: 'compact' | 'visual';
  messages: ChatMessage[];
  open: () => void;
  close: () => void;
  toggle: () => void;
  setProductView: (view: 'compact' | 'visual') => void;
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
}

export const useAiChatStore = create<AiChatState>()(
  persist(
    (set) => ({
      isOpen: false,
      productView: 'compact',
      messages: [],
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((s) => ({ isOpen: !s.isOpen })),
      setProductView: (productView) => set({ productView }),
      addMessage: (message) => set((s) => ({ messages: [...s.messages, message] })),
      clearMessages: () => set({ messages: [] }),
    }),
    {
      name: 'ai-chat-settings-storage',
      partialize: (state) => ({
        isOpen: state.isOpen,
        productView: state.productView,
        messages: state.messages,
      }),
    }
  )
);
