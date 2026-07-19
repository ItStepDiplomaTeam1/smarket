import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UIBlock =
  | { type: 'text'; content: string }
  | { type: 'table'; title?: string; columns: string[]; rows: (string | boolean | number | null)[][]; highlight_row?: number }
  | { type: 'product_card'; product_id: number; name: string; store: string; price: string; in_stock: boolean; savings?: string }
  | { type: 'tabs'; items: { label: string; blocks: UIBlock[] }[] }
  | { type: 'clarification'; question: string; options: string[] }
  | { type: 'action_button'; label: string; action: 'add_to_cart' | 'navigate' | 'apply_filters'; payload: any }
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

export type AiProvider = 'gemini' | 'groq' | 'cerebras' | 'openrouter';

export const PROVIDER_MODELS: Record<AiProvider, { value: string; label: string }[]> = {
  cerebras: [
    { value: 'gpt-oss-120b', label: 'GPT OSS 120B (рекомендовано)' },
  ],
  openrouter: [
    { value: 'openai/gpt-oss-120b:free', label: 'GPT OSS 120B Free (рекомендовано)' },
    { value: 'google/gemini-3.5-flash:free', label: 'Gemini 3.5 Flash Free' },
    { value: 'meta-llama/llama-3.3-70b-instruct:free', label: 'Llama 3.3 70B Free' },
  ],
  gemini: [
    { value: 'gemini-3.5-flash', label: 'Gemini 3.5 Flash (рекомендовано)' },
  ],
  groq: [
    { value: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B (рекомендовано)' },
  ],
};

const DEFAULT_PROVIDER: AiProvider = 'gemini';

function isAiProvider(provider: unknown): provider is AiProvider {
  return typeof provider === 'string' && provider in PROVIDER_MODELS;
}

function defaultModelFor(provider: AiProvider | null): string | null {
  return provider ? PROVIDER_MODELS[provider][0]?.value ?? null : null;
}

function isSupportedModel(provider: AiProvider, modelName: string | null): boolean {
  return modelName !== null && PROVIDER_MODELS[provider].some((model) => model.value === modelName);
}

interface AiChatState {
  isOpen: boolean;
  messages: ChatMessage[];
  provider: AiProvider | null;
  modelName: string | null;
  open: () => void;
  close: () => void;
  toggle: () => void;
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
  setProvider: (p: AiProvider | null) => void;
  setModelName: (m: string | null) => void;
}

export const useAiChatStore = create<AiChatState>()(
  persist(
    (set) => ({
      isOpen: false,
      messages: [],
      provider: DEFAULT_PROVIDER,
      modelName: defaultModelFor(DEFAULT_PROVIDER),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((s) => ({ isOpen: !s.isOpen })),
      addMessage: (message) => set((s) => ({ messages: [...s.messages, message] })),
      clearMessages: () => set({ messages: [] }),
      setProvider: (provider) => set({ provider, modelName: defaultModelFor(provider) }),
      setModelName: (modelName) => set({ modelName }),
    }),
    {
      name: 'ai-chat-settings-storage',
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<AiChatState>;
        const provider = isAiProvider(persisted.provider)
          ? persisted.provider
          : currentState.provider;
        const persistedModelName = typeof persisted.modelName === 'string'
          ? persisted.modelName
          : null;
        const modelName = provider && isSupportedModel(provider, persistedModelName)
          ? persistedModelName
          : defaultModelFor(provider);

        return { ...currentState, ...persisted, provider, modelName };
      },
    }
  )
);
