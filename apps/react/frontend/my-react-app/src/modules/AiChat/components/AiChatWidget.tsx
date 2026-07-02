import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import {
  X,
  Send,
  ShoppingCart,
  Package,
  TrendingDown,
  Star,
  AlertCircle,
  Info,
  AlertTriangle,
  Maximize2,
  Minimize2,
  Trash2,
  Trophy,
  Settings,
} from 'lucide-react';
import { useAuthStore } from '@/modules/Auth/store/authStore';
import { useAiChatStore, type UIBlock, type ZephyrosResponse, type ChatMessage } from '@/modules/AiChat/store/useAiChatStore';
import { useSendAiMessage } from '@/hooks/api/useAiChatApi';

function generateId() {
  return Math.random().toString(36).slice(2);
}

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  brand: '#265447',
  brandDark: '#173B33',
  brandLight: '#F6FAF8',
  accent: '#15803D',
  muted: '#6D8279',
  border: 'rgba(38,84,71,0.10)',
  borderLight: 'rgba(38,84,71,0.06)',
};

// ─── Z Monogram ───────────────────────────────────────────────────────────────
function ZephyrosMonogram({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden>
      <rect width="28" height="28" rx="8" fill="rgba(255,255,255,0.15)" />
      {/* Minimalist wind breeze lines representing Zephyros (the west wind) */}
      <path d="M6 9h11a2.5 2.5 0 0 0 2.5-2.5v0A2.5 2.5 0 0 0 17 4" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <path d="M5 14h18" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <path d="M7 19h10a2.5 2.5 0 0 1 2.5 2.5v0a2.5 2.5 0 0 1-2.5 2.5" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// ─── Badge block ──────────────────────────────────────────────────────────────
function BadgeBlockView({ block }: { block: Extract<UIBlock, { type: 'badge' }> }) {
  const styles: Record<string, string> = {
    savings: 'bg-[#FFF8E1] text-[#856404] border-[#FFC72C]',
    best_price: 'bg-[#F0FDF4] text-[#15803D] border-[#86EFAC]',
    warning: 'bg-[#FFF7ED] text-[#C2410C] border-[#FED7AA]',
    info: 'bg-[#F6FAF8] text-[#265447] border-[rgba(38,84,71,0.2)]',
  };
  const icons: Record<string, React.ReactNode> = {
    savings: <TrendingDown className="w-3 h-3 shrink-0" />,
    best_price: <Star className="w-3 h-3 shrink-0" />,
    warning: <AlertTriangle className="w-3 h-3 shrink-0" />,
    info: <Info className="w-3 h-3 shrink-0" />,
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${styles[block.variant] ?? styles.info}`}>
      {icons[block.variant]}
      {block.label}: <span className="font-bold">{block.value}</span>
    </span>
  );
}

// ─── Table block with price bars ──────────────────────────────────────────────
function TableBlockView({ block }: { block: Extract<UIBlock, { type: 'table' }> }) {
  // Find price column index (column named "Ціна" or 3rd col = index 2)
  const priceColIdx = block.columns.findIndex((c) => /ціна|price/i.test(c));

  const prices = block.rows
    .map((r) => {
      const raw = String(r[priceColIdx] ?? '').replace(/[^\d.]/g, '');
      return parseFloat(raw) || 0;
    })
    .filter(Boolean);

  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  const priceBarWidth = (row: (string | boolean | number | null)[]) => {
    if (priceColIdx < 0 || prices.length < 2) return 0;
    const raw = String(row[priceColIdx] ?? '').replace(/[^\d.]/g, '');
    const p = parseFloat(raw) || 0;
    return Math.round(((p - minPrice) / (maxPrice - minPrice || 1)) * 100);
  };

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-[rgba(38,84,71,0.10)]">
      {block.title && (
        <div className="px-3 py-2 bg-[#F6FAF8] border-b border-[rgba(38,84,71,0.08)] text-[11px] font-semibold text-[#265447] uppercase tracking-wide">
          {block.title}
        </div>
      )}
      <table className="w-full">
        <thead>
          <tr className="bg-[#F6FAF8]">
            {block.columns.map((col, i) => (
              <th key={i} className="px-3 py-2 text-left text-[10px] font-semibold text-[#6D8279] uppercase tracking-wide border-b border-[rgba(38,84,71,0.08)]">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row, ri) => {
            const isHighlight = block.highlight_row === ri;
            const barWidth = priceBarWidth(row);
            return (
              <tr
                key={ri}
                className={`border-b border-[rgba(38,84,71,0.05)] last:border-0 transition-colors ${isHighlight ? 'bg-[#F0FDF4]' : 'hover:bg-[#FAFAFA]'}`}
              >
                {row.map((cell, ci) => {
                  const isPriceCell = ci === priceColIdx && priceColIdx >= 0;
                  return (
                    <td key={ci} className="px-3 py-2.5 align-top">
                      {typeof cell === 'boolean' ? (
                        <span className={`font-medium text-[13px] ${cell ? 'text-[#15803D]' : 'text-[#DC2626]'}`}>
                          {cell ? '✓' : '✗'}
                        </span>
                      ) : isPriceCell ? (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            {isHighlight && <Trophy className="w-3 h-3 text-[#15803D] shrink-0" />}
                            <span className={`font-bold ${isHighlight ? 'text-[16px] text-[#15803D]' : 'text-[14px] text-[#173B33]'}`}>
                              {cell}
                            </span>
                          </div>
                          {prices.length > 1 && (
                            <div className="h-1 w-full rounded-full bg-[#E2E8F0] overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${isHighlight ? 'bg-[#15803D]' : 'bg-[#94A3B8]'}`}
                                style={{ width: `${Math.max(8, 100 - barWidth)}%` }}
                              />
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-[13px] text-[#173B33]">{cell}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Product card ─────────────────────────────────────────────────────────────
function ProductCardView({ block }: { block: Extract<UIBlock, { type: 'product_card' }> }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-[rgba(38,84,71,0.1)] bg-white shadow-sm">
      <div className="w-10 h-10 rounded-lg bg-[#F6FAF8] border border-[rgba(38,84,71,0.1)] flex items-center justify-center shrink-0">
        <Package className="w-5 h-5 text-[#265447]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-[#173B33] leading-tight truncate">{block.name}</p>
        <p className="text-[11px] text-[#6D8279] mt-0.5">{block.store}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-[17px] font-bold text-[#265447] leading-tight">{block.price}</p>
        {block.savings && <p className="text-[10px] text-[#15803D] font-medium">{block.savings}</p>}
      </div>
    </div>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────
function TabsBlockView({ block }: { block: Extract<UIBlock, { type: 'tabs' }> }) {
  const [active, setActive] = useState(0);
  return (
    <div>
      <div className="flex gap-1 p-1 bg-[#F6FAF8] rounded-xl mb-3 border border-[rgba(38,84,71,0.08)]">
        {block.items.map((tab, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`flex-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-200 cursor-pointer border-none ${
              active === i ? 'bg-[#265447] text-white shadow-sm' : 'text-[#6D8279] hover:text-[#265447] bg-transparent'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-2.5">
        {block.items[active]?.blocks.map((b, i) => (
          <BlockRenderer key={i} block={b} onOptionClick={() => {}} index={i} />
        ))}
      </div>
    </div>
  );
}

// ─── Clarification — chips in row ────────────────────────────────────────────
function ClarificationBlockView({
  block,
  onOptionClick,
}: {
  block: Extract<UIBlock, { type: 'clarification' }>;
  onOptionClick: (text: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-[13px] font-semibold text-[#173B33] leading-snug">{block.question}</p>
      <div className="flex flex-wrap gap-1.5">
        {block.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => onOptionClick(opt)}
            className="px-3 py-1.5 rounded-full border border-[rgba(38,84,71,0.2)] bg-white text-[12px] text-[#265447] font-medium hover:bg-[#265447] hover:text-white hover:border-[#265447] transition-all duration-150 cursor-pointer"
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Action button ────────────────────────────────────────────────────────────
function ActionButtonView({
  block,
  onOptionClick,
}: {
  block: Extract<UIBlock, { type: 'action_button' }>;
  onOptionClick: (text: string) => void;
}) {
  return (
    <button
      onClick={() => onOptionClick(`Так, додай до кошика`)}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#265447] hover:bg-[#1A3E2F] active:scale-95 text-white text-[13px] font-semibold transition-all duration-200 cursor-pointer border-none w-full justify-center shadow-sm"
    >
      <ShoppingCart className="w-4 h-4 shrink-0" />
      {block.label}
    </button>
  );
}

// ─── Fallback ─────────────────────────────────────────────────────────────────
function FallbackBlockView({ block }: { block: Extract<UIBlock, { type: 'fallback' }> }) {
  return (
    <div className="flex flex-col gap-2 py-3 px-3.5 rounded-xl bg-[#FFF7F7] border border-[#FECACA]">
      <div className="flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
        <p className="text-[13px] font-semibold text-[#173B33]">{block.message}</p>
      </div>
      {block.suggestion && <p className="text-[12px] text-[#6D8279] leading-relaxed">{block.suggestion}</p>}
    </div>
  );
}

// ─── Block renderer with stagger animation ────────────────────────────────────
function BlockRenderer({
  block,
  onOptionClick,
  index = 0,
}: {
  block: UIBlock;
  onOptionClick: (text: string) => void;
  index?: number;
}) {
  const style: React.CSSProperties = {
    animation: `blockSlideIn 0.35s cubic-bezier(0.22,1,0.36,1) both`,
    animationDelay: `${index * 55}ms`,
  };

  const inner = (() => {
    switch (block.type) {
      case 'text':
        return <p className="text-[13px] text-[#173B33] leading-relaxed">{block.content}</p>;
      case 'table':
        return <TableBlockView block={block} />;
      case 'product_card':
        return <ProductCardView block={block} />;
      case 'tabs':
        return <TabsBlockView block={block} />;
      case 'clarification':
        return <ClarificationBlockView block={block} onOptionClick={onOptionClick} />;
      case 'action_button':
        return <ActionButtonView block={block} onOptionClick={onOptionClick} />;
      case 'badge':
        return <BadgeBlockView block={block} />;
      case 'fallback':
        return <FallbackBlockView block={block} />;
      case 'divider':
        return <hr className="border-[rgba(38,84,71,0.08)] my-0.5" />;
      default:
        return null;
    }
  })();

  if (!inner) return null;
  return <div style={style}>{inner}</div>;
}

// ─── Assistant message — document style ───────────────────────────────────────
function AssistantMessage({ msg, onOptionClick }: { msg: ChatMessage; onOptionClick: (text: string) => void }) {
  const response = msg.content as ZephyrosResponse;
  return (
    <div className="flex flex-col gap-2.5 py-1">
      <span className="text-[10px] font-semibold text-[#6D8279] uppercase tracking-widest">Zephyros</span>
      <div className="flex flex-col gap-2.5">
        {response.blocks?.map((block, i) => (
          <BlockRenderer key={i} block={block} onOptionClick={onOptionClick} index={i} />
        ))}
      </div>
    </div>
  );
}

// ─── User message — quote style ───────────────────────────────────────────────
function UserMessage({ msg }: { msg: ChatMessage }) {
  return (
    <div className="flex justify-end py-0.5">
      <div
        className="max-w-[78%] text-right"
        style={{ animation: 'blockSlideIn 0.28s cubic-bezier(0.22,1,0.36,1) both' }}
      >
        <p className="text-[13px] text-[#4A5568] leading-relaxed border-r-2 border-[rgba(38,84,71,0.35)] pr-3">
          {msg.content as string}
        </p>
      </div>
    </div>
  );
}

// ─── Skeleton / Typing indicator ──────────────────────────────────────────────
function TypingIndicator({ status }: { status: string }) {
  return (
    <div className="flex flex-col gap-2 py-1">
      <span className="text-[10px] font-semibold text-[#6D8279] uppercase tracking-widest">Zephyros</span>
      <div className="flex flex-col gap-2">
        {/* Skeleton lines */}
        <div className="flex flex-col gap-1.5">
          <div className="h-2.5 rounded-full bg-[rgba(38,84,71,0.10)] animate-pulse w-[85%]" />
          <div className="h-2.5 rounded-full bg-[rgba(38,84,71,0.07)] animate-pulse w-[65%]" style={{ animationDelay: '150ms' }} />
          <div className="h-2.5 rounded-full bg-[rgba(38,84,71,0.05)] animate-pulse w-[45%]" style={{ animationDelay: '300ms' }} />
        </div>
        {/* Status text */}
        <div className="flex items-center gap-2 mt-1">
          <div className="flex gap-0.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-1 h-1 rounded-full bg-[#265447] animate-bounce"
                style={{ animationDelay: `${i * 120}ms` }}
              />
            ))}
          </div>
          <span
            key={status}
            className="text-[11px] text-[#6D8279] font-medium"
            style={{ animation: 'statusFade 0.3s ease both' }}
          >
            {status}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Onboarding empty state ────────────────────────────────────────────────────
function EmptyState({ onSend }: { onSend: (text: string) => void }) {
  return (
    <div className="flex flex-col gap-4 mt-4 px-1">
      <div>
        <p className="text-[12px] font-bold text-[#173B33] mb-0.5">Що я вмію:</p>
        <p className="text-[11px] text-[#6D8279] leading-relaxed">
          Шукаю товари, порівнюю ціни в магазинах, додаю до кошика.
        </p>
      </div>

      {/* Preview card 1 — price comparison */}
      <div
        className="rounded-xl border border-[rgba(38,84,71,0.10)] overflow-hidden cursor-pointer hover:shadow-md transition-shadow duration-200"
        onClick={() => onSend('Порівняй ціни на молоко')}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onSend('Порівняй ціни на молоко')}
      >
        <div className="px-3 py-2 bg-[#F6FAF8] border-b border-[rgba(38,84,71,0.08)]">
          <p className="text-[10px] font-semibold text-[#6D8279] uppercase tracking-wide">Приклад — порівняння цін</p>
        </div>
        <div className="p-2.5">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-[#6D8279]">
                <th className="text-left py-1 px-1.5 font-medium">Магазин</th>
                <th className="text-left py-1 px-1.5 font-medium">Ціна</th>
                <th className="text-left py-1 px-1.5 font-medium">Наявність</th>
              </tr>
            </thead>
            <tbody>
              {[['Novus', '38.90 ₴', '✓', true], ['Auchan', '42.50 ₴', '✓', false], ['Metro', '45.00 ₴', '✓', false]].map(([store, price, avail, best], i) => (
                <tr key={i} className={best ? 'bg-[#F0FDF4]' : ''}>
                  <td className="py-1 px-1.5 text-[#173B33]">{store}</td>
                  <td className="py-1 px-1.5">
                    <span className={`font-bold ${best ? 'text-[#15803D]' : 'text-[#173B33]'}`}>{price}</span>
                  </td>
                  <td className="py-1 px-1.5 text-[#15803D]">{avail}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[10px] text-[#6D8279] mt-1.5 px-1">Спитайте: «Порівняй ціни на молоко» →</p>
        </div>
      </div>

      {/* Preview card 2 — cheapest product */}
      <div
        className="rounded-xl border border-[rgba(38,84,71,0.10)] overflow-hidden cursor-pointer hover:shadow-md transition-shadow duration-200"
        onClick={() => onSend('Знайди найдешевший хліб')}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onSend('Знайди найдешевший хліб')}
      >
        <div className="px-3 py-2 bg-[#F6FAF8] border-b border-[rgba(38,84,71,0.08)]">
          <p className="text-[10px] font-semibold text-[#6D8279] uppercase tracking-wide">Приклад — найкраща ціна</p>
        </div>
        <div className="p-2.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#F6FAF8] border border-[rgba(38,84,71,0.1)] flex items-center justify-center shrink-0">
            <Package className="w-4 h-4 text-[#265447]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-[#173B33]">Хліб «Сільський»</p>
            <p className="text-[10px] text-[#6D8279]">ATB · найдешевше</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[15px] font-bold text-[#265447]">22.90 ₴</p>
            <p className="text-[10px] text-[#15803D]">−4.10 ₴</p>
          </div>
        </div>
        <p className="text-[10px] text-[#6D8279] pb-2 px-3">Спитайте: «Знайди найдешевший хліб» →</p>
      </div>

      {/* Quick prompts */}
      <div>
        <p className="text-[11px] text-[#6D8279] mb-2">Або спробуйте:</p>
        <div className="flex flex-wrap gap-1.5">
          {['Молоко до 50 грн', 'Що у кошику?', 'Ціни на яйця'].map((q) => (
            <button
              key={q}
              onClick={() => onSend(q)}
              className="px-3 py-1.5 rounded-full border border-[rgba(38,84,71,0.15)] bg-[#F6FAF8] text-[11px] text-[#265447] font-medium hover:bg-[#265447] hover:text-white transition-all duration-150 cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const PROVIDER_MODELS = {
  gemini: [
    { value: 'gemini-3.5-flash', label: 'Gemini 3.5 Flash (рекомендовано)' },
    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
    { value: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash-Lite' },
    { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (інтелектуальна)' },
  ],
  groq: [
    { value: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B (рекомендовано)' },
    { value: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B' },
    { value: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B (швидкісна)' },
  ],
};

// ─── Chat window ──────────────────────────────────────────────────────────────
function ChatWindow({ expanded, onToggleExpand }: { expanded: boolean; onToggleExpand: () => void }) {
  const close = useAiChatStore((s) => s.close);
  const messages = useAiChatStore((s) => s.messages);
  const addMessage = useAiChatStore((s) => s.addMessage);
  const clearMessages = useAiChatStore((s) => s.clearMessages);
  const provider = useAiChatStore((s) => s.provider);
  const modelName = useAiChatStore((s) => s.modelName);
  const setProvider = useAiChatStore((s) => s.setProvider);
  const setModelName = useAiChatStore((s) => s.setModelName);

  const { mutate: sendMessage, isPending } = useSendAiMessage();
  const [input, setInput] = useState('');
  const [pendingStatus, setPendingStatus] = useState('Думаю над запитом...');
  const [showSettings, setShowSettings] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isPending]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = (text?: string) => {
    const messageText = text ?? input.trim();
    if (!messageText || isPending) return;

    addMessage({ id: generateId(), role: 'user', content: messageText, timestamp: new Date() });
    setInput('');
    setPendingStatus('Думаю над запитом...');

    sendMessage(
      {
        message: messageText,
        provider,
        model_name: modelName,
        onStatusChange: (s) => setPendingStatus(s),
      },
      {
        onSuccess: (data) => {
          setPendingStatus('Думаю над запитом...');
          addMessage({ id: generateId(), role: 'assistant', content: data, timestamp: new Date() });
        },
        onError: () => {
          setPendingStatus('Думаю над запитом...');
          addMessage({
            id: generateId(),
            role: 'assistant',
            content: {
              blocks: [
                {
                  type: 'fallback',
                  message: 'Не вдалося отримати відповідь після кількох спроб.',
                  suggestion: 'Спробуйте переформулювати запит або повторіть пізніше.',
                },
              ],
            },
            timestamp: new Date(),
          });
        },
      }
    );
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const width = expanded ? 'w-[680px]' : 'w-[420px]';
  const height = expanded ? 'h-[80vh] max-h-[700px]' : 'h-[600px]';

  return (
    <div className={`flex flex-col ${width} ${height} bg-white rounded-2xl shadow-[0_24px_64px_rgba(23,59,51,0.18)] border border-[rgba(38,84,71,0.08)] overflow-hidden transition-all duration-300`}>

      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 py-3 bg-[#265447] shrink-0">
        <ZephyrosMonogram />
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-bold text-white leading-none font-manrope">Zephyros</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] animate-pulse" />
            <p className="text-[10px] text-white/60">Онлайн · 12 394 товари</p>
          </div>
        </div>

        {/* Settings toggle */}
        <button
          onClick={() => setShowSettings((v) => !v)}
          title="Налаштування провайдера ШІ"
          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors duration-150 cursor-pointer border-none ${
            showSettings ? 'bg-white/20 text-white' : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
        </button>

        {/* Expand toggle */}
        <button
          onClick={onToggleExpand}
          title={expanded ? 'Compact mode' : 'Expand'}
          className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors duration-150 cursor-pointer border-none"
        >
          {expanded ? <Minimize2 className="w-3.5 h-3.5 text-white" /> : <Maximize2 className="w-3.5 h-3.5 text-white" />}
        </button>

        {/* Clear history */}
        <button
          onClick={clearMessages}
          title="Очистити історію"
          disabled={messages.length === 0}
          className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 flex items-center justify-center transition-colors duration-150 cursor-pointer border-none"
        >
          <Trash2 className="w-3.5 h-3.5 text-white" />
        </button>

        {/* Close */}
        <button
          onClick={close}
          className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors duration-150 cursor-pointer border-none"
        >
          <X className="w-3.5 h-3.5 text-white" />
        </button>
      </div>

      {/* ── Settings Panel Overlay ── */}
      {showSettings && (
        <div className="absolute inset-0 top-[52px] bg-white z-20 flex flex-col p-4 gap-4 animate-[statusFade_0.2s_ease_both]">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-[13px] font-bold text-[#173B33]">Налаштування ШІ-асистента</h3>
            <button
              onClick={() => setShowSettings(false)}
              className="text-[11px] font-semibold text-[#265447] hover:underline cursor-pointer border-none bg-transparent"
            >
              Зберегти та закрити
            </button>
          </div>
          
          {/* Provider Select */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-[#6D8279] uppercase tracking-wide">Провайдер ШІ</label>
            <select
              value={provider || 'auto'}
              onChange={(e) => {
                const val = e.target.value;
                setProvider(val === 'auto' ? null : val as 'gemini' | 'groq');
              }}
              className="w-full text-[13px] border border-[rgba(38,84,71,0.15)] rounded-lg px-2.5 py-1.5 bg-white text-[#173B33] focus:border-[#265447] focus:outline-none"
            >
              <option value="auto">Автовибір (Gemini / Groq)</option>
              <option value="gemini">Google Gemini</option>
              <option value="groq">Groq Inference</option>
            </select>
          </div>

          {/* Model Select */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-[#6D8279] uppercase tracking-wide">Модель</label>
            <select
              disabled={!provider}
              value={modelName || 'default'}
              onChange={(e) => {
                const val = e.target.value;
                setModelName(val === 'default' ? null : val);
              }}
              className="w-full text-[13px] border border-[rgba(38,84,71,0.15)] rounded-lg px-2.5 py-1.5 bg-white text-[#173B33] disabled:bg-[#FAFAFA] disabled:text-[#A0AEC0] focus:border-[#265447] focus:outline-none"
            >
              <option value="default">За замовчуванням для провайдера</option>
              {provider && PROVIDER_MODELS[provider].map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            {!provider && (
              <p className="text-[10px] text-[#6D8279]">Виберіть конкретного провайдера, щоб налаштувати модель.</p>
            )}
          </div>

          <div className="mt-auto border-t pt-3 text-[11px] text-[#6D8279] leading-relaxed">
            <p><strong>Gemini:</strong> ідеальний вибір для складних порівнянь цін та великих списків товарів завдяки величезному контексту.</p>
            <p className="mt-1.5"><strong>Groq:</strong> забезпечує мінімальну затримку (субсекундний відгук) для швидких запитів.</p>
          </div>
        </div>
      )}

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-5 scroll-smooth">
        {messages.length === 0 && <EmptyState onSend={handleSend} />}

        {messages.map((msg) =>
          msg.role === 'user' ? (
            <UserMessage key={msg.id} msg={msg} />
          ) : (
            <AssistantMessage key={msg.id} msg={msg} onOptionClick={handleSend} />
          )
        )}

        {isPending && <TypingIndicator status={pendingStatus} />}
        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <div className="px-4 py-3 border-t border-[rgba(38,84,71,0.08)] shrink-0 bg-white">
        <div className="flex items-end gap-2 bg-[#F6FAF8] rounded-xl border border-[rgba(38,84,71,0.12)] px-3 py-2.5 focus-within:border-[#265447] transition-colors duration-150">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = `${Math.min(e.target.scrollHeight, 96)}px`;
            }}
            onKeyDown={handleKeyDown}
            placeholder="Запитайте про ціни, товари, кошик..."
            rows={1}
            disabled={isPending}
            className="flex-1 bg-transparent border-none outline-none resize-none text-[13px] text-[#173B33] placeholder-[#A0AEC0] max-h-24 leading-relaxed disabled:opacity-50"
            style={{ fontFamily: 'Inter, sans-serif', overflow: 'hidden' }}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isPending}
            className="w-8 h-8 rounded-lg bg-[#265447] hover:bg-[#1A3E2F] active:scale-90 disabled:bg-[rgba(38,84,71,0.15)] flex items-center justify-center shrink-0 transition-all duration-150 cursor-pointer border-none"
          >
            <Send className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Root widget ──────────────────────────────────────────────────────────────
export function AiChatWidget() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isOpen = useAiChatStore((s) => s.isOpen);
  const toggle = useAiChatStore((s) => s.toggle);
  const [expanded, setExpanded] = useState(false);

  if (!isAuthenticated) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {isOpen && (
        <div
          className="transition-all duration-300 origin-bottom-right"
          style={{ animation: 'chatIn 0.25s cubic-bezier(0.34,1.56,0.64,1)' }}
        >
          <ChatWindow expanded={expanded} onToggleExpand={() => setExpanded((v) => !v)} />
        </div>
      )}

      {/* Pill FAB */}
      <button
        onClick={toggle}
        aria-label={isOpen ? 'Закрити Zephyros' : 'Відкрити Zephyros'}
        className={`flex items-center gap-2 rounded-full shadow-[0_8px_24px_rgba(38,84,71,0.35)] hover:shadow-[0_12px_32px_rgba(38,84,71,0.45)] transition-all duration-300 cursor-pointer border-none font-semibold ${
          isOpen
            ? 'w-11 h-11 justify-center bg-[#173B33]'
            : 'px-5 py-3 bg-[#265447] hover:bg-[#1A3E2F] hover:scale-105'
        }`}
      >
        {isOpen ? (
          <X className="w-4 h-4 text-white shrink-0" />
        ) : (
          <>
            <ZephyrosMonogram size={20} />
            <span className="text-white text-[13px] whitespace-nowrap">Zephyros ✦</span>
          </>
        )}
      </button>
    </div>
  );
}
