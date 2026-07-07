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
  Trash2,
  Trophy,
  Settings,
  ArrowDown,
  Copy,
  Check,
} from 'lucide-react';
import { useAuthStore } from '@/modules/Auth/store/authStore';
import { useAiChatStore, type UIBlock, type ZephyrosResponse, type ChatMessage } from '@/modules/AiChat/store/useAiChatStore';
import { useSendAiMessage } from '@/hooks/api/useAiChatApi';

function generateId() {
  return Math.random().toString(36).slice(2);
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent);
const SHORTCUT_HINT = isMac ? '⌘J' : 'Ctrl+J';

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

function serializeBlocksToText(blocks: UIBlock[]): string {
  return blocks
      .map((b) => {
        switch (b.type) {
          case 'text':
            return b.content;
          case 'table':
            return [b.title, b.columns.join(' | '), ...b.rows.map((r) => r.join(' | '))].filter(Boolean).join('\n');
          case 'product_card':
            return `${b.name} — ${b.price} (${b.store}${b.savings ? `, ${b.savings}` : ''})`;
          case 'badge':
            return `${b.label}: ${b.value}`;
          case 'clarification':
            return b.question;
          case 'fallback':
            return b.message;
          default:
            return '';
        }
      })
      .filter(Boolean)
      .join('\n\n');
}

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  ink: '#173B33',
  forest: '#265447',
  forestDark: '#1A3E2F',
  moss: '#6D8279',
  paper: '#FFFFFF',
  canvas: '#FBFCFA',
  tint: '#F6FAF8',
  accent: '#15803D',
  mint: '#8FE3B8',
  clay: '#C2410C',
  clayBg: '#FFF7ED',
  clayBorder: '#FED7AA',
  hairline: 'rgba(23,59,51,0.08)',
  hairlineSoft: 'rgba(23,59,51,0.06)',
  hairlineStrong: 'rgba(23,59,51,0.14)',
};

// ─── Mark ─────────────────────────────────────────────────────────────────────
// A geometric "Z" — Zephyros, the west wind — built from three solid strokes,
// the diagonal picked out in a second flat tone. No mascot, no sparkle.
function ZephyrosMark({ size = 28 }: { size?: number }) {
  return (
      <svg width={size} height={size} viewBox="0 0 28 28" fill="none" aria-hidden className="shrink-0">
        <rect width="28" height="28" rx="8" fill={C.forest} />
        <rect x="7" y="7.3" width="14" height="3" rx="1.5" fill="white" />
        <rect x="7" y="17.7" width="14" height="3" rx="1.5" fill="white" />
        <line x1="18.6" y1="10.6" x2="9.4" y2="17.4" stroke={C.mint} strokeWidth="3" strokeLinecap="round" />
      </svg>
  );
}

// ─── Badge block ──────────────────────────────────────────────────────────────
function BadgeBlockView({ block }: { block: Extract<UIBlock, { type: 'badge' }> }) {
  const styles: Record<string, string> = {
    savings: 'bg-[#FFF8E1] text-[#856404] border-[#FFC72C]',
    best_price: 'bg-[#F0FDF4] text-[#15803D] border-[#86EFAC]',
    warning: `bg-[${C.clayBg}] text-[${C.clay}] border-[${C.clayBorder}]`,
    info: `bg-[${C.tint}] text-[${C.forest}] border-[rgba(38,84,71,0.2)]`,
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
            <div className="px-3 py-2 bg-[#F6FAF8] border-b border-[rgba(38,84,71,0.08)] text-[11px] font-semibold text-[#265447] uppercase tracking-wide font-manrope">
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
                              <span className={`font-medium text-[13px] ${cell ? 'text-[#15803D]' : 'text-[#B45309]'}`}>
                          {cell ? '✓' : '—'}
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
      <div className="flex items-center gap-3 p-3 rounded-xl border border-[rgba(38,84,71,0.1)] bg-white">
        <div className="w-10 h-10 rounded-lg bg-[#F6FAF8] border border-[rgba(38,84,71,0.1)] flex items-center justify-center shrink-0">
          <Package className="w-5 h-5 text-[#265447]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-[#173B33] leading-tight truncate">{block.name}</p>
          <p className="text-[11px] text-[#6D8279] mt-0.5">{block.store}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[17px] font-bold text-[#265447] leading-tight font-manrope">{block.price}</p>
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
        <div className="flex gap-1 border-b border-[rgba(38,84,71,0.10)] mb-3">
          {block.items.map((tab, i) => (
              <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={`px-3 py-1.5 text-[12px] font-semibold transition-colors duration-150 cursor-pointer border-none bg-transparent border-b-2 -mb-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#265447] focus-visible:ring-offset-1 rounded-t ${
                      active === i ? 'text-[#173B33] border-b-[#265447]' : 'text-[#6D8279] border-b-transparent hover:text-[#265447]'
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
                  className="px-3 py-1.5 rounded-full border border-[rgba(38,84,71,0.2)] bg-white text-[12px] text-[#265447] font-medium hover:bg-[#265447] hover:text-white hover:border-[#265447] transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#265447] focus-visible:ring-offset-1"
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
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#265447] hover:bg-[#1A3E2F] text-white text-[13px] font-semibold transition-colors duration-150 cursor-pointer border-none w-full justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#265447] focus-visible:ring-offset-2"
      >
        <ShoppingCart className="w-4 h-4 shrink-0" />
        {block.label}
      </button>
  );
}

// ─── Fallback ─────────────────────────────────────────────────────────────────
function FallbackBlockView({
                             block,
                             onRetry,
                           }: {
  block: Extract<UIBlock, { type: 'fallback' }>;
  onRetry?: () => void;
}) {
  return (
      <div className="flex flex-col gap-2 py-3 px-3.5 rounded-xl bg-[#FFF7ED] border border-[#FED7AA]">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-[#C2410C] shrink-0" />
          <p className="text-[13px] font-semibold text-[#173B33]">{block.message}</p>
        </div>
        {block.suggestion && <p className="text-[12px] text-[#6D8279] leading-relaxed">{block.suggestion}</p>}
        {onRetry && (
            <button
                onClick={onRetry}
                className="mt-1 px-3 py-1.5 rounded-lg bg-[#C2410C] hover:bg-[#9A3412] text-white text-[11px] font-semibold transition-colors duration-150 cursor-pointer border-none self-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C2410C] focus-visible:ring-offset-1"
            >
              Спробувати ще раз
            </button>
        )}
      </div>
  );
}

// ─── Block renderer with stagger animation ────────────────────────────────────
function BlockRenderer({
                         block,
                         onOptionClick,
                         onRetry,
                         index = 0,
                       }: {
  block: UIBlock;
  onOptionClick: (text: string) => void;
  onRetry?: () => void;
  index?: number;
}) {
  const style: React.CSSProperties = {
    animation: `blockSlideIn 0.3s cubic-bezier(0.16,1,0.3,1) both`,
    animationDelay: `${index * 45}ms`,
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
        return <FallbackBlockView block={block} onRetry={onRetry} />;
      case 'divider':
        return <hr className="border-[rgba(38,84,71,0.08)] my-0.5" />;
      default:
        return null;
    }
  })();

  if (!inner) return null;
  return <div style={style}>{inner}</div>;
}

// ─── Copy-to-clipboard ─────────────────────────────────────────────────────────
function CopyButton({ getText }: { getText: () => string }) {
  const [copied, setCopied] = useState(false);
  return (
      <button
          onClick={async () => {
            const text = getText();
            if (!text) return;
            try {
              await navigator.clipboard.writeText(text);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            } catch {
              /* clipboard unavailable — silently ignore */
            }
          }}
          title="Копіювати відповідь"
          aria-label="Копіювати відповідь"
          className="w-6 h-6 rounded-md flex items-center justify-center text-[#A9B6B0] hover:bg-[#F0F4F1] hover:text-[#265447] transition-colors duration-150 cursor-pointer border-none opacity-0 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#265447]"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-[#15803D]" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
  );
}

// ─── Assistant message ─────────────────────────────────────────────────────────
function AssistantMessage({
                            msg,
                            onOptionClick,
                            onRetry,
                          }: {
  msg: ChatMessage;
  onOptionClick: (text: string) => void;
  onRetry?: () => void;
}) {
  const response = msg.content as ZephyrosResponse;
  return (
      <div className="group flex py-1">
        <div className="w-0.5 shrink-0 rounded-full bg-[rgba(38,84,71,0.12)] mr-3" aria-hidden />
        <div className="flex flex-col gap-2.5 min-w-0 flex-1">
          <div className="flex justify-end h-0 -translate-y-1">
            <CopyButton getText={() => serializeBlocksToText(response.blocks ?? [])} />
          </div>
          {response.blocks?.map((block, i) => (
              <BlockRenderer key={i} block={block} onOptionClick={onOptionClick} onRetry={onRetry} index={i} />
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
            style={{ animation: 'blockSlideIn 0.25s cubic-bezier(0.16,1,0.3,1) both' }}
        >
          <p className="text-[13px] text-[#3F4E49] leading-relaxed border-r-2 border-[rgba(38,84,71,0.35)] pr-3">
            {msg.content as string}
          </p>
        </div>
      </div>
  );
}

// ─── Loading state — quiet progress hairline, no bouncing dots ────────────────
function TypingIndicator({ status }: { status: string }) {
  return (
      <div className="flex py-1">
        <div className="w-0.5 shrink-0 rounded-full bg-[rgba(38,84,71,0.12)] mr-3" aria-hidden />
        <div className="flex flex-col gap-2.5 min-w-0 flex-1">
          <div className="flex flex-col gap-1.5">
            <div className="h-2.5 rounded-full bg-[rgba(38,84,71,0.09)] w-[85%]" />
            <div className="h-2.5 rounded-full bg-[rgba(38,84,71,0.06)] w-[60%]" />
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="h-[2px] w-full rounded-full bg-[rgba(38,84,71,0.10)] overflow-hidden">
              <div
                  className="h-full w-1/3 rounded-full bg-[#265447]"
                  style={{ animation: 'sweep 1.1s ease-in-out infinite' }}
              />
            </div>
            <span key={status} className="text-[11px] text-[#6D8279]" style={{ animation: 'statusFade 0.25s ease both' }}>
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
      <div className="flex flex-col gap-4 mt-2 px-1">
        <div>
          <p className="text-[12px] font-bold text-[#173B33] mb-0.5 font-manrope">Що можна запитати</p>
          <p className="text-[11px] text-[#6D8279] leading-relaxed">
            Пошук товарів, порівняння цін між магазинами, дії з кошиком.
          </p>
        </div>

        <div
            className="rounded-xl border border-[rgba(38,84,71,0.10)] overflow-hidden cursor-pointer hover:border-[rgba(38,84,71,0.25)] transition-colors duration-150"
            onClick={() => onSend('Порівняй ціни на молоко')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onSend('Порівняй ціни на молоко')}
        >
          <div className="px-3 py-2 bg-[#F6FAF8] border-b border-[rgba(38,84,71,0.08)]">
            <p className="text-[10px] font-semibold text-[#6D8279] uppercase tracking-wide">Порівняння цін</p>
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
              {([['Novus', '38.90 ₴', '✓', true], ['Auchan', '42.50 ₴', '✓', false], ['Metro', '45.00 ₴', '✓', false]] as const).map(([store, price, avail, best], i) => (
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
            <p className="text-[10px] text-[#6D8279] mt-1.5 px-1">«Порівняй ціни на молоко» →</p>
          </div>
        </div>

        <div
            className="rounded-xl border border-[rgba(38,84,71,0.10)] overflow-hidden cursor-pointer hover:border-[rgba(38,84,71,0.25)] transition-colors duration-150"
            onClick={() => onSend('Знайди найдешевший хліб')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onSend('Знайди найдешевший хліб')}
        >
          <div className="px-3 py-2 bg-[#F6FAF8] border-b border-[rgba(38,84,71,0.08)]">
            <p className="text-[10px] font-semibold text-[#6D8279] uppercase tracking-wide">Найкраща ціна</p>
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
              <p className="text-[15px] font-bold text-[#265447] font-manrope">22.90 ₴</p>
              <p className="text-[10px] text-[#15803D]">−4.10 ₴</p>
            </div>
          </div>
          <p className="text-[10px] text-[#6D8279] pb-2 px-3">«Знайди найдешевший хліб» →</p>
        </div>

        <div>
          <p className="text-[11px] text-[#6D8279] mb-2">Або спробуйте:</p>
          <div className="flex flex-wrap gap-1.5">
            {['Молоко до 50 грн', 'Що у кошику?', 'Ціни на яйця'].map((q) => (
                <button
                    key={q}
                    onClick={() => onSend(q)}
                    className="px-3 py-1.5 rounded-full border border-[rgba(38,84,71,0.15)] bg-[#F6FAF8] text-[11px] text-[#265447] font-medium hover:bg-[#265447] hover:text-white transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#265447] focus-visible:ring-offset-1"
                >
                  {q}
                </button>
            ))}
          </div>
        </div>

        <p className="text-[10px] text-[#A9B6B0] mt-1">
          Стрілка ↑ у порожньому полі — редагувати останнє повідомлення. {SHORTCUT_HINT} — відкрити чат з будь-якого місця.
        </p>
      </div>
  );
}

const PROVIDER_LABELS: Record<string, string> = {
  cerebras: 'Cerebras',
  openrouter: 'OpenRouter',
  gemini: 'Gemini',
  groq: 'Groq',
};

const PROVIDER_MODELS = {
  cerebras: [
    { value: 'gpt-oss-120b', label: 'GPT OSS 120B (рекомендовано)' },
  ],
  openrouter: [
    { value: 'openai/gpt-oss-120b:free', label: 'GPT OSS 120B Free (рекомендовано)' },
    { value: 'google/gemini-2.5-flash:free', label: 'Gemini 2.5 Flash Free' },
    { value: 'meta-llama/llama-3.3-70b-instruct:free', label: 'Llama 3.3 70B Free' },
  ],
  gemini: [
    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (рекомендовано)' },
  ],
  groq: [
    { value: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B (рекомендовано)' },
  ],
};

// ─── Icon button — shared quiet control style ─────────────────────────────────
function IconButton({
                      onClick,
                      title,
                      active,
                      disabled,
                      children,
                    }: {
  onClick: () => void;
  title: string;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
      <button
          onClick={onClick}
          title={title}
          aria-label={title}
          disabled={disabled}
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-150 cursor-pointer border-none disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#265447] focus-visible:ring-offset-1 ${
              active ? 'bg-[#265447] text-white' : 'bg-transparent text-[#6D8279] hover:bg-[#F6FAF8] hover:text-[#173B33]'
          }`}
      >
        {children}
      </button>
  );
}

// ─── Resize handle — free drag + arrow-key + double-click preset ──────────────
const SIZE_LIMITS = { minW: 380, maxW: 760, minH: 480, maxH: 760 };
const DEFAULT_SIZE = { width: 420, height: 600 };
const LARGE_SIZE = { width: 680, height: 700 };

function ResizeHandle({
                        size,
                        onChange,
                      }: {
  size: { width: number; height: number };
  onChange: (updater: (s: { width: number; height: number }) => { width: number; height: number }) => void;
}) {
  const dragRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const dx = d.x - e.clientX;
      const dy = d.y - e.clientY;
      onChange(() => ({
        width: clamp(d.w + dx, SIZE_LIMITS.minW, SIZE_LIMITS.maxW),
        height: clamp(d.h + dy, SIZE_LIMITS.minH, SIZE_LIMITS.maxH),
      }));
    };
    const onUp = () => {
      dragRef.current = null;
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [onChange]);

  const step = 24;
  return (
      <div
          role="slider"
          aria-label="Розмір вікна чату"
          aria-valuemin={SIZE_LIMITS.minW}
          aria-valuemax={SIZE_LIMITS.maxW}
          aria-valuenow={size.width}
          tabIndex={0}
          title="Перетягніть, щоб змінити розмір. Стрілки — точне налаштування. Подвійний клік — між розмірами."
          onMouseDown={(e) => {
            dragRef.current = { x: e.clientX, y: e.clientY, w: size.width, h: size.height };
          }}
          onDoubleClick={() => onChange((s) => (s.width > 500 ? DEFAULT_SIZE : LARGE_SIZE))}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') onChange((s) => ({ ...s, width: clamp(s.width + step, SIZE_LIMITS.minW, SIZE_LIMITS.maxW) }));
            if (e.key === 'ArrowRight') onChange((s) => ({ ...s, width: clamp(s.width - step, SIZE_LIMITS.minW, SIZE_LIMITS.maxW) }));
            if (e.key === 'ArrowUp') onChange((s) => ({ ...s, height: clamp(s.height + step, SIZE_LIMITS.minH, SIZE_LIMITS.maxH) }));
            if (e.key === 'ArrowDown') onChange((s) => ({ ...s, height: clamp(s.height - step, SIZE_LIMITS.minH, SIZE_LIMITS.maxH) }));
          }}
          className="absolute top-0 left-0 w-4 h-4 z-30 flex items-start justify-start p-[3px] cursor-nwse-resize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#265447] rounded-br-md"
      >
        <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden>
          <circle cx="1.5" cy="6.5" r="1" fill="rgba(38,84,71,0.35)" />
          <circle cx="4" cy="4" r="1" fill="rgba(38,84,71,0.35)" />
          <circle cx="6.5" cy="1.5" r="1" fill="rgba(38,84,71,0.35)" />
        </svg>
      </div>
  );
}

// ─── Chat window ──────────────────────────────────────────────────────────────
function ChatWindow() {
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
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [size, setSize] = useState(DEFAULT_SIZE);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isAtBottom) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isPending, isAtBottom]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Keep the textarea sized to its content whether typed or set programmatically.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
  }, [input]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setIsAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 48);
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    setIsAtBottom(true);
  };

  const handleSend = (text?: string) => {
    const messageText = text ?? input.trim();
    if (!messageText || isPending) return;

    const historyPayload = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    addMessage({ id: generateId(), role: 'user', content: messageText, timestamp: new Date() });
    setInput('');
    setIsAtBottom(true);
    setPendingStatus('Думаю над запитом...');

    sendMessage(
        {
          message: messageText,
          history: historyPayload,
          provider,
          model_name: modelName,
          onStatusChange: (s) => setPendingStatus(s),
        },
        {
          onSuccess: (data) => {
            setPendingStatus('Думаю над запитом...');
            setLastFailedMessage(null);
            addMessage({ id: generateId(), role: 'assistant', content: data, timestamp: new Date() });
          },
          onError: (error: any) => {
            setPendingStatus('Думаю над запитом...');
            setLastFailedMessage(messageText);

            console.error('[Zephyros] Chat request failed:', error);

            const errorData = error?.response?.data;
            const errorType = errorData?.error;
            const detail = errorData?.detail;

            let message = 'Не вдалося отримати відповідь. Спробуйте ще раз.';
            let suggestion = 'Перевірте підключення або повторіть запит.';

            if (detail) {
              message = detail;
            }

            if (errorType === 'provider_auth_error') {
              suggestion = 'Зверніться до адміністратора для перевірки ключів провайдера.';
            } else if (errorType === 'provider_rate_limited') {
              suggestion = 'Зачекайте хвилину та спробуйте знову.';
            } else if (errorType === 'provider_http_error') {
              suggestion = 'Спробуйте інший провайдер або зачекайте.';
            } else if (errorType === 'response_parse_error') {
              suggestion = 'Спробуйте переформулювати запит.';
            } else if (errorType === 'no_providers' || errorType === 'all_providers_exhausted') {
              suggestion = 'Сервіс тимчасово недоступний. Спробуйте пізніше.';
            } else if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
              message = 'Запит тривав занадто довго.';
              suggestion = 'Спробуйте спростити запит або зачекайте.';
            } else if (!error?.response) {
              message = 'Перевірте підключення до інтернету.';
              suggestion = 'Сервер може бути тимчасово недоступний.';
            }

            addMessage({
              id: generateId(),
              role: 'assistant',
              content: {
                blocks: [
                  {
                    type: 'fallback',
                    message,
                    suggestion,
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
      return;
    }
    if (e.key === 'Escape') {
      if (showSettings) {
        setShowSettings(false);
      } else if (!input.trim()) {
        close();
      }
      return;
    }
    if (e.key === 'ArrowUp' && !input.trim() && !isPending) {
      const lastUser = [...messages].reverse().find((m) => m.role === 'user');
      if (lastUser) {
        e.preventDefault();
        setInput(lastUser.content as string);
      }
    }
  };

  const modelCaption = provider
      ? `${PROVIDER_LABELS[provider]}${modelName ? ` · ${modelName.split('/').pop()}` : ''}`
      : 'Автовибір провайдера';

  return (
      <div
          className="relative flex flex-col bg-white rounded-[20px] shadow-[0_20px_50px_rgba(23,59,51,0.16)] border border-[rgba(38,84,71,0.08)] border-l-[3px] border-l-[#265447] overflow-hidden"
          style={{ width: size.width, height: size.height }}
      >
        <ResizeHandle size={size} onChange={setSize} />

        {/* ── Header ── */}
        <div className="flex items-center gap-2.5 pl-4 pr-2.5 py-3 bg-white border-b border-[rgba(38,84,71,0.08)] shrink-0">
          <ZephyrosMark size={28} />
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-extrabold text-[#173B33] leading-none font-manrope tracking-tight">Zephyros</p>
            <p className="text-[10.5px] text-[#6D8279] mt-1">12 394 товари в каталозі</p>
          </div>

          <IconButton onClick={() => setShowSettings((v) => !v)} title="Налаштування" active={showSettings}>
            <Settings className="w-3.5 h-3.5" />
          </IconButton>
          <IconButton onClick={clearMessages} title="Очистити історію" disabled={messages.length === 0}>
            <Trash2 className="w-3.5 h-3.5" />
          </IconButton>
          <IconButton onClick={close} title="Закрити (Esc)">
            <X className="w-3.5 h-3.5" />
          </IconButton>
        </div>

        {/* ── Settings panel ── */}
        {showSettings && (
            <div className="absolute inset-0 top-[57px] bg-white z-20 flex flex-col p-4 gap-4 overflow-y-auto" style={{ animation: 'statusFade 0.2s ease both' }}>
              <div className="flex items-center justify-between pb-2 border-b border-[rgba(38,84,71,0.08)]">
                <h3 className="text-[13px] font-bold text-[#173B33] font-manrope">Налаштування</h3>
                <button
                    onClick={() => setShowSettings(false)}
                    className="text-[11px] font-semibold text-[#265447] hover:underline cursor-pointer border-none bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#265447] rounded"
                >
                  Готово
                </button>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="ai-provider-select" className="text-[11px] font-semibold text-[#6D8279] uppercase tracking-wide">Провайдер</label>
                <select
                    id="ai-provider-select"
                    value={provider || 'auto'}
                    onChange={(e) => {
                      const val = e.target.value;
                      setProvider(val === 'auto' ? null : val as 'gemini' | 'groq' | 'cerebras' | 'openrouter');
                    }}
                    className="w-full text-[13px] border border-[rgba(38,84,71,0.15)] rounded-lg px-2.5 py-1.5 bg-white text-[#173B33] focus:border-[#265447] focus:outline-none"
                >
                  <option value="cerebras">Cerebras (за замовчуванням)</option>
                  <option value="auto">Автовибір</option>
                  <option value="openrouter">OpenRouter</option>
                  <option value="gemini">Google Gemini</option>
                  <option value="groq">Groq</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="ai-model-select" className="text-[11px] font-semibold text-[#6D8279] uppercase tracking-wide">Модель</label>
                <select
                    id="ai-model-select"
                    disabled={!provider}
                    value={modelName || 'default'}
                    onChange={(e) => {
                      const val = e.target.value;
                      setModelName(val === 'default' ? null : val);
                    }}
                    className="w-full text-[13px] border border-[rgba(38,84,71,0.15)] rounded-lg px-2.5 py-1.5 bg-white text-[#173B33] disabled:bg-[#FAFAFA] disabled:text-[#A0AEC0] focus:border-[#265447] focus:outline-none"
                >
                  <option value="default">За замовчуванням</option>
                  {provider && PROVIDER_MODELS[provider].map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
                {!provider && (
                    <p className="text-[10px] text-[#6D8279]">Оберіть провайдера, щоб задати конкретну модель.</p>
                )}
              </div>

              <dl className="mt-auto pt-3 border-t border-[rgba(38,84,71,0.08)] flex flex-col gap-2 text-[11px] leading-relaxed">
                <div className="flex gap-2">
                  <dt className="font-semibold text-[#173B33] w-[76px] shrink-0">Cerebras</dt>
                  <dd className="text-[#6D8279]">найшвидші відповіді, використовується за замовчуванням.</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="font-semibold text-[#173B33] w-[76px] shrink-0">OpenRouter</dt>
                  <dd className="text-[#6D8279]">доступ до кількох безкоштовних моделей одразу.</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="font-semibold text-[#173B33] w-[76px] shrink-0">Gemini</dt>
                  <dd className="text-[#6D8279]">великий контекст — підходить для довгих списків товарів.</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="font-semibold text-[#173B33] w-[76px] shrink-0">Groq</dt>
                  <dd className="text-[#6D8279]">мінімальна затримка для коротких запитів.</dd>
                </div>
              </dl>
            </div>
        )}

        {/* ── Messages ── */}
        <div
            ref={scrollRef}
            onScroll={handleScroll}
            aria-live="polite"
            className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-5 scroll-smooth bg-[#FBFCFA]"
        >
          {messages.length === 0 && <EmptyState onSend={handleSend} />}

          {messages.map((msg, idx) =>
              msg.role === 'user' ? (
                  <UserMessage key={msg.id} msg={msg} />
              ) : (
                  <AssistantMessage
                      key={msg.id}
                      msg={msg}
                      onOptionClick={handleSend}
                      onRetry={
                        idx === messages.length - 1 && lastFailedMessage
                            ? () => handleSend(lastFailedMessage)
                            : undefined
                      }
                  />
              )
          )}

          {isPending && <TypingIndicator status={pendingStatus} />}
          <div ref={bottomRef} />
        </div>

        {!isAtBottom && (
            <button
                onClick={scrollToBottom}
                className="absolute right-4 bottom-[88px] w-8 h-8 rounded-full bg-white border border-[rgba(38,84,71,0.15)] shadow-[0_4px_12px_rgba(23,59,51,0.15)] flex items-center justify-center text-[#265447] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#265447]"
                title="До останнього повідомлення"
                aria-label="Прокрутити донизу"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
        )}

        {/* ── Input ── */}
        <div className="px-4 pt-3 pb-2.5 border-t border-[rgba(38,84,71,0.08)] shrink-0 bg-white">
          <div className="flex items-end gap-2 bg-[#F6FAF8] rounded-xl border border-[rgba(38,84,71,0.12)] px-3 py-2.5 focus-within:border-[#265447] transition-colors duration-150">
          <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Запитайте про ціни, товари, кошик..."
              rows={1}
              disabled={isPending}
              className="flex-1 bg-transparent border-none outline-none resize-none text-[13px] text-[#173B33] placeholder-[#A0AEC0] max-h-24 leading-relaxed disabled:opacity-50 font-inter"
              style={{ overflow: 'hidden' }}
          />
            <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isPending}
                aria-label="Надіслати"
                className="w-8 h-8 rounded-lg bg-[#265447] hover:bg-[#1A3E2F] disabled:bg-[rgba(38,84,71,0.15)] flex items-center justify-center shrink-0 transition-colors duration-150 cursor-pointer border-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#265447] focus-visible:ring-offset-1"
            >
              <Send className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
          <p className="text-[10px] text-[#A9B6B0] mt-1.5 px-0.5">{modelCaption}</p>
        </div>
      </div>
  );
}

// ─── Root widget ──────────────────────────────────────────────────────────────
export function AiChatWidget() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isOpen = useAiChatStore((s) => s.isOpen);
  const toggle = useAiChatStore((s) => s.toggle);

  // Ctrl/Cmd+J opens or closes the assistant from anywhere in the app.
  useEffect(() => {
    if (!isAuthenticated) return;
    const handler = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isAuthenticated, toggle]);

  if (!isAuthenticated) return null;

  return (
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {isOpen && (
            <div style={{ animation: 'chatIn 0.22s cubic-bezier(0.16,1,0.3,1) both' }}>
              <ChatWindow />
            </div>
        )}

        {!isOpen && (
            <button
                onClick={toggle}
                aria-label={`Відкрити Zephyros (${SHORTCUT_HINT})`}
                title={`Zephyros (${SHORTCUT_HINT})`}
                className="flex items-center gap-2.5 pl-3 pr-4 py-2.5 rounded-2xl bg-[#265447] hover:bg-[#1A3E2F] shadow-[0_8px_24px_rgba(38,84,71,0.30)] hover:shadow-[0_10px_28px_rgba(38,84,71,0.38)] transition-colors duration-150 cursor-pointer border-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#265447] focus-visible:ring-offset-2"
            >
              <ZephyrosMark size={22} />
              <span className="text-white text-[13px] font-semibold font-manrope whitespace-nowrap">Zephyros</span>
              <span className="text-[10px] text-white/55 border border-white/25 rounded px-1 py-[1px] leading-none">{SHORTCUT_HINT}</span>
            </button>
        )}
      </div>
  );
}