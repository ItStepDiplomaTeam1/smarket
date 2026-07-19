import {
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowDown,
  Check,
  CheckCircle2,
  ChevronRight,
  Copy,
  ExternalLink,
  LoaderCircle,
  Package,
  RefreshCw,
  Search,
  Send,
  ShoppingBasket,
  ShoppingCart,
  Sparkles,
  Star,
  Trash2,
  X,
} from 'lucide-react';

import { useSendAiMessage } from '@/hooks/api/useAiChatApi';
import { useAuthStore } from '@/modules/Auth/store/authStore';
import { hasFallback, isMutationAction } from '@/modules/AiChat/lib/chatContract';
import {
  type ChatMessage,
  type UIBlock,
  type ZephyrosResponse,
  useAiChatStore,
} from '@/modules/AiChat/store/useAiChatStore';
import { apiClient } from '@/shared/api/apiClient';


const QUICK_PROMPTS = [
  { icon: Search, label: 'Порівняти ціни на молоко' },
  { icon: ShoppingBasket, label: 'Порівняти мій кошик' },
  { icon: Package, label: 'Знайти найдешевший хліб' },
  { icon: Star, label: 'Показати вигідні пропозиції' },
];

const isMac =
  typeof navigator !== 'undefined' &&
  /Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent);
const SHORTCUT_HINT = isMac ? '⌘J' : 'Ctrl+J';
const ZEPHYROS_MOTION_CSS = `
  @keyframes chatIn {
    from { opacity: 0; transform: scale(.96) translateY(14px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
  }
  @keyframes zephyrosMessageIn {
    from { opacity: 0; transform: translate3d(-8px, 8px, 0); }
    to { opacity: 1; transform: translate3d(0, 0, 0); }
  }
  @keyframes zephyrosUserMessageIn {
    from { opacity: 0; transform: translate3d(8px, 8px, 0); }
    to { opacity: 1; transform: translate3d(0, 0, 0); }
  }
  @keyframes zephyrosFadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes zephyrosDialogIn {
    from { opacity: 0; transform: scale(.96) translateY(8px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
  }
  @keyframes zephyrosProgress {
    0% { transform: translateX(-130%); }
    50% { transform: translateX(130%); }
    100% { transform: translateX(430%); }
  }
  @media (prefers-reduced-motion: reduce) {
    [data-zephyros-motion] * { animation: none !important; scroll-behavior: auto !important; }
  }
`;


function generateId() {
  return globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
}


function ZephyrosMark({ size = 30 }: { size?: number }) {
  return (
    <span
      className="grid shrink-0 place-items-center rounded-xl bg-[#173B33] text-white shadow-[0_5px_15px_rgba(23,59,51,0.18)] dark:bg-[#3DAE8B] dark:text-[#0B110F]"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <Sparkles style={{ width: size * 0.52, height: size * 0.52 }} strokeWidth={2.2} />
    </span>
  );
}


function serializeBlocksToText(blocks: UIBlock[]): string {
  return blocks
    .map((block) => {
      switch (block.type) {
        case 'text':
          return block.content;
        case 'table':
          return [
            block.title,
            block.columns.join(' | '),
            ...block.rows.map((row) => row.join(' | ')),
          ]
            .filter(Boolean)
            .join('\n');
        case 'product_card':
          return `${block.name} — ${block.price} · ${block.store}`;
        case 'clarification':
          return `${block.question}\n${block.options.join(', ')}`;
        case 'badge':
          return `${block.label}: ${block.value}`;
        case 'fallback':
          return [block.message, block.suggestion].filter(Boolean).join(' ');
        case 'tabs':
          return block.items
            .map((tab) => `${tab.label}\n${serializeBlocksToText(tab.blocks)}`)
            .join('\n\n');
        default:
          return '';
      }
    })
    .filter(Boolean)
    .join('\n\n');
}


function IconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="grid h-11 w-11 place-items-center rounded-xl border-0 bg-transparent text-[#6D8279] transition-colors hover:bg-[#EEF5F1] hover:text-[#173B33] disabled:cursor-not-allowed disabled:opacity-30 dark:text-[#A9B6B0] dark:hover:bg-[#1D2A25] dark:hover:text-white md:h-9 md:w-9 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3DAE8B]"
    >
      {children}
    </button>
  );
}


function CopyButton({ blocks }: { blocks: UIBlock[] }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    const text = serializeBlocksToText(blocks);
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-label="Копіювати відповідь"
      title="Копіювати відповідь"
      className="grid h-8 w-8 place-items-center rounded-lg border-0 bg-transparent text-[#8A9B94] opacity-100 transition-colors hover:bg-[#EEF5F1] hover:text-[#265447] dark:hover:bg-[#1D2A25] dark:hover:text-[#3DAE8B] md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3DAE8B]"
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
    </button>
  );
}


function BadgeBlockView({ block }: { block: Extract<UIBlock, { type: 'badge' }> }) {
  const tone = {
    savings: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
    best_price: 'border-teal-200 bg-teal-50 text-teal-800 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-300',
    warning: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
    info: 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300',
  }[block.variant];

  return (
    <div className={`inline-flex max-w-full items-center gap-2 self-start rounded-full border px-3 py-1.5 text-xs font-semibold ${tone}`}>
      <Star className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{block.label}</span>
      <span className="font-extrabold">{block.value}</span>
    </div>
  );
}


function TableBlockView({ block }: { block: Extract<UIBlock, { type: 'table' }> }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#DDE8E3] bg-white dark:border-[#294239] dark:bg-[#15221D]">
      {block.title && (
        <div className="border-b border-[#E5EDE9] bg-[#F5F9F7] px-4 py-3 text-xs font-bold text-[#173B33] dark:border-[#294239] dark:bg-[#1B2B25] dark:text-white">
          {block.title}
        </div>
      )}
      <div className="max-w-full overflow-x-auto">
        <table className="w-full min-w-[460px] border-collapse text-left text-xs">
          <thead>
            <tr className="text-[#71827A] dark:text-[#A9B6B0]">
              {block.columns.map((column) => (
                <th key={column} className="whitespace-nowrap border-b border-[#E5EDE9] px-4 py-2.5 font-semibold dark:border-[#294239]">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, rowIndex) => (
              <tr
                key={`${rowIndex}-${String(row[0])}`}
                className={
                  block.highlight_row === rowIndex
                    ? 'bg-emerald-50/80 dark:bg-emerald-950/30'
                    : 'border-b border-[#EDF2EF] last:border-0 dark:border-[#21372F]'
                }
              >
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className={`px-4 py-3 align-top text-[#31473F] dark:text-[#E6F0EC] ${
                      block.highlight_row === rowIndex && cellIndex === 1 ? 'font-extrabold text-emerald-700 dark:text-emerald-300' : ''
                    }`}
                  >
                    {typeof cell === 'boolean' ? (
                      <span className={cell ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300'}>
                        {cell ? 'Є' : 'Немає'}
                      </span>
                    ) : (
                      String(cell ?? '—')
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


function ProductCardView({ block }: { block: Extract<UIBlock, { type: 'product_card' }> }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[#DDE8E3] bg-white p-3.5 dark:border-[#294239] dark:bg-[#15221D]">
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#EEF5F1] text-[#265447] dark:bg-[#1D3028] dark:text-[#3DAE8B]">
        <Package className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-[#173B33] dark:text-white">{block.name}</p>
        <p className="mt-0.5 truncate text-xs text-[#71827A] dark:text-[#A9B6B0]">{block.store}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-base font-extrabold text-[#173B33] dark:text-[#3DAE8B]">{block.price}</p>
        {block.savings && <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">{block.savings}</p>}
      </div>
    </div>
  );
}


function ClarificationBlockView({
  block,
  onSelect,
}: {
  block: Extract<UIBlock, { type: 'clarification' }>;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-[#DDE8E3] bg-white p-4 dark:border-[#294239] dark:bg-[#15221D]">
      <p className="text-sm font-bold leading-snug text-[#173B33] dark:text-white">{block.question}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {block.options.map((option) => (
          <button
            type="button"
            key={option}
            onClick={() => onSelect(option)}
            className="min-h-11 rounded-xl border border-[#BDD2C8] bg-[#F5F9F7] px-3 py-2 text-xs font-semibold text-[#265447] transition-colors hover:border-[#265447] hover:bg-[#E8F3EE] dark:border-[#315345] dark:bg-[#1B2B25] dark:text-[#75D3B4] dark:hover:border-[#3DAE8B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3DAE8B]"
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}


function ActionButtonView({
  block,
  onFeedback,
}: {
  block: Extract<UIBlock, { type: 'action_button' }>;
  onFeedback: (response: ZephyrosResponse) => void;
}) {
  const navigate = useNavigate();
  const close = useAiChatStore((state) => state.close);
  const [pending, setPending] = useState(false);
  const [completed, setCompleted] = useState(false);
  const isMutation = isMutationAction(block.action);

  const execute = async () => {
    const token = block.payload?.action_token;
    if (!token || pending || completed) return;
    setPending(true);
    try {
      await apiClient.post('/api/v1/agent/actions/execute', { action_token: token });
      setCompleted(true);
      const successMessages: Partial<
        Record<Extract<UIBlock, { type: 'action_button' }>['action'], string>
      > = {
        add_to_cart: 'Готово — товар додано до кошика.',
        remove_from_cart: 'Готово — товар видалено з кошика.',
        clear_cart: 'Готово — кошик очищено.',
        create_review: 'Готово — відгук опубліковано.',
      };
      onFeedback({
        blocks: [
          {
            type: 'text',
            content: successMessages[block.action] ?? 'Готово — дію виконано.',
          },
        ],
      });
    } catch {
      onFeedback({
        blocks: [
          {
            type: 'fallback',
            message: 'Не вдалося виконати дію.',
            suggestion: 'Оновіть пропозицію Zephyros і підтвердьте її ще раз.',
          },
        ],
      });
    } finally {
      setPending(false);
    }
  };

  const handleClick = () => {
    if (isMutation) {
      if (block.payload?.action_token && !completed) {
        execute();
      }
      return;
    }
    if (block.action === 'navigate' && typeof block.payload?.route === 'string') {
      navigate(block.payload.route);
      close();
      return;
    }
    if (block.action === 'apply_filters') {
      window.dispatchEvent(new CustomEvent('smarket:apply-filters', { detail: block.payload }));
      close();
    }
  };

  let icon = null;
  if (!pending) {
    if (completed) {
      icon = <CheckCircle2 className="h-4 w-4" />;
    } else if (block.action === 'add_to_cart') {
      icon = <ShoppingCart className="h-4 w-4" />;
    } else if (block.action === 'remove_from_cart' || block.action === 'clear_cart') {
      icon = <Trash2 className="h-4 w-4" />;
    } else if (block.action === 'create_review') {
      icon = <Star className="h-4 w-4" />;
    } else {
      icon = <ExternalLink className="h-4 w-4" />;
    }
  }

  const unavailable = isMutation && !block.payload?.action_token;
  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={unavailable || pending || completed}
      title={unavailable ? 'Дія застаріла — повторіть запит' : undefined}
      className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border-0 bg-[#265447] px-4 py-2.5 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#1B4438] hover:shadow-md active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-[#A9BAB3] disabled:shadow-none dark:bg-[#3DAE8B] dark:text-[#0B110F] dark:hover:bg-[#55C49F] dark:disabled:bg-[#405D52] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3DAE8B] focus-visible:ring-offset-2 motion-reduce:transform-none"
    >
      {pending && <LoaderCircle className="h-4 w-4 animate-spin" />}
      {icon}
      {pending ? 'Виконується...' : completed ? 'Виконано' : unavailable ? 'Оновіть пропозицію' : block.label}
    </button>
  );
}


function FallbackBlockView({
  block,
  onRetry,
}: {
  block: Extract<UIBlock, { type: 'fallback' }>;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-300" />
        <div className="min-w-0">
          <p className="text-sm font-bold text-amber-950 dark:text-amber-100">{block.message}</p>
          {block.suggestion && <p className="mt-1 text-xs leading-relaxed text-amber-800 dark:text-amber-200">{block.suggestion}</p>}
        </div>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 flex min-h-11 items-center gap-2 rounded-xl border border-amber-300 bg-white px-3 text-xs font-bold text-amber-900 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100 dark:hover:bg-amber-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
        >
          <RefreshCw className="h-4 w-4" />
          Спробувати ще раз
        </button>
      )}
    </div>
  );
}


function TabsBlockView({
  block,
  onSelect,
  onRetry,
  onFeedback,
}: {
  block: Extract<UIBlock, { type: 'tabs' }>;
  onSelect: (value: string) => void;
  onRetry?: () => void;
  onFeedback: (response: ZephyrosResponse) => void;
}) {
  const [active, setActive] = useState(0);
  return (
    <div>
      <div className="mb-3 flex gap-1 overflow-x-auto border-b border-[#DDE8E3] dark:border-[#294239]" role="tablist">
        {block.items.map((item, index) => (
          <button
            type="button"
            role="tab"
            aria-selected={active === index}
            key={`${item.label}-${index}`}
            onClick={() => setActive(index)}
            className={`min-h-11 shrink-0 border-0 border-b-2 bg-transparent px-3 text-xs font-bold ${
              active === index
                ? 'border-[#265447] text-[#173B33] dark:border-[#3DAE8B] dark:text-white'
                : 'border-transparent text-[#71827A] hover:text-[#265447] dark:text-[#A9B6B0]'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-3">
        {block.items[active]?.blocks.map((child, index) => (
          <BlockRenderer
            key={`${child.type}-${index}`}
            block={child}
            onSelect={onSelect}
            onRetry={onRetry}
            onFeedback={onFeedback}
          />
        ))}
      </div>
    </div>
  );
}


function BlockRenderer({
  block,
  onSelect,
  onRetry,
  onFeedback,
}: {
  block: UIBlock;
  onSelect: (value: string) => void;
  onRetry?: () => void;
  onFeedback: (response: ZephyrosResponse) => void;
}) {
  switch (block.type) {
    case 'text':
      return <p className="whitespace-pre-wrap text-sm leading-6 text-[#2C423A] dark:text-[#E4EFEB]">{block.content}</p>;
    case 'table':
      return <TableBlockView block={block} />;
    case 'product_card':
      return <ProductCardView block={block} />;
    case 'tabs':
      return <TabsBlockView block={block} onSelect={onSelect} onRetry={onRetry} onFeedback={onFeedback} />;
    case 'clarification':
      return <ClarificationBlockView block={block} onSelect={onSelect} />;
    case 'action_button':
      return <ActionButtonView block={block} onFeedback={onFeedback} />;
    case 'badge':
      return <BadgeBlockView block={block} />;
    case 'fallback':
      return <FallbackBlockView block={block} onRetry={onRetry} />;
    case 'divider':
      return <hr className="border-0 border-t border-[#DDE8E3] dark:border-[#294239]" />;
    default:
      return null;
  }
}


function AssistantMessage({
  message,
  onSelect,
  onRetry,
  onFeedback,
}: {
  message: ChatMessage;
  onSelect: (value: string) => void;
  onRetry?: () => void;
  onFeedback: (response: ZephyrosResponse) => void;
}) {
  const response = message.content as ZephyrosResponse;
  const blocks = Array.isArray(response?.blocks) ? response.blocks : [];
  return (
    <article
      className="group flex items-start gap-2.5 motion-reduce:animate-none"
      style={{ animation: 'zephyrosMessageIn 300ms cubic-bezier(0.16,1,0.3,1) both' }}
      aria-label="Відповідь Zephyros"
    >
      <ZephyrosMark size={28} />
      <div className="min-w-0 flex-1 rounded-2xl rounded-tl-md border border-[#E2EBE7] bg-white p-3.5 shadow-[0_2px_8px_rgba(23,59,51,0.04)] dark:border-[#294239] dark:bg-[#14211C]">
        <div className="mb-1 flex h-5 items-center justify-between">
          <span className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#82928B] dark:text-[#789087]">Zephyros</span>
          <CopyButton blocks={blocks} />
        </div>
        <div className="flex flex-col gap-3">
          {blocks.map((block, index) => (
            <div
              key={`${block.type}-${index}`}
              className="min-w-0 motion-reduce:animate-none"
              style={{
                animation: 'blockSlideIn 320ms cubic-bezier(0.16,1,0.3,1) both',
                animationDelay: `${Math.min(index * 45, 180)}ms`,
              }}
            >
              <BlockRenderer
                block={block}
                onSelect={onSelect}
                onRetry={onRetry}
                onFeedback={onFeedback}
              />
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}


function UserMessage({ message }: { message: ChatMessage }) {
  return (
    <article
      className="flex justify-end motion-reduce:animate-none"
      style={{ animation: 'zephyrosUserMessageIn 260ms cubic-bezier(0.16,1,0.3,1) both' }}
      aria-label="Ваше повідомлення"
    >
      <div className="max-w-[86%] rounded-2xl rounded-tr-md bg-[#265447] px-4 py-3 text-sm leading-5 text-white shadow-[0_3px_12px_rgba(38,84,71,0.16)] dark:bg-[#2B735E]">
        {String(message.content)}
      </div>
    </article>
  );
}


function WorkingMessage({ status }: { status: string }) {
  return (
    <div
      className="flex items-start gap-2.5 motion-reduce:animate-none"
      style={{ animation: 'statusFade 220ms ease-out both' }}
      role="status"
      aria-live="polite"
    >
      <ZephyrosMark size={28} />
      <div className="flex min-h-12 items-center gap-3 rounded-2xl rounded-tl-md border border-[#E2EBE7] bg-white px-4 py-3 dark:border-[#294239] dark:bg-[#14211C]">
        <LoaderCircle className="h-4 w-4 animate-spin text-[#3A806A] dark:text-[#3DAE8B]" />
        <div className="min-w-0">
          <p className="text-xs font-bold text-[#31473F] dark:text-[#E4EFEB]">{status}</p>
          <p className="mt-0.5 text-[10px] text-[#82928B] dark:text-[#789087]">Перевіряю дані та готую відповідь</p>
          <div className="mt-2 h-1 w-36 overflow-hidden rounded-full bg-[#E3ECE8] dark:bg-[#294239]">
            <span className="block h-full w-1/3 rounded-full bg-[#3DAE8B] motion-reduce:animate-none" style={{ animation: 'zephyrosProgress 1.25s ease-in-out infinite' }} />
          </div>
        </div>
      </div>
    </div>
  );
}


function EmptyState({ onSelect }: { onSelect: (value: string) => void }) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center py-4 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#E9F4EF] text-[#265447] dark:bg-[#1B3027] dark:text-[#3DAE8B]">
        <Sparkles className="h-7 w-7" />
      </div>
      <h2 className="mt-4 text-lg font-extrabold tracking-tight text-[#173B33] dark:text-white">Покупки простіше із Zephyros</h2>
      <p className="mt-1.5 max-w-xs text-sm leading-6 text-[#6D8279] dark:text-[#A9B6B0]">
        Знайду товар, порівняю актуальні ціни або підкажу найвигідніший магазин для вашого кошика.
      </p>
      <div className="mt-5 grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
        {QUICK_PROMPTS.map(({ icon: Icon, label }) => (
          <button
            type="button"
            key={label}
            onClick={() => onSelect(label)}
            className="group flex min-h-14 items-center gap-3 rounded-2xl border border-[#DDE8E3] bg-white p-3 text-left text-xs font-bold leading-4 text-[#31473F] shadow-[0_2px_8px_rgba(23,59,51,0.03)] transition-all hover:-translate-y-0.5 hover:border-[#AFC9BD] hover:shadow-md dark:border-[#294239] dark:bg-[#14211C] dark:text-[#E4EFEB] dark:hover:border-[#3A6756] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3DAE8B]"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#EEF5F1] text-[#265447] dark:bg-[#1D3028] dark:text-[#3DAE8B]">
              <Icon className="h-4 w-4" />
            </span>
            <span className="flex-1">{label}</span>
            <ChevronRight className="h-4 w-4 shrink-0 text-[#A5B4AD] transition-transform group-hover:translate-x-0.5" />
          </button>
        ))}
      </div>
      <p className="mt-5 text-[10px] text-[#93A19B] dark:text-[#71857C]">Маршрутизація працює автоматично · {SHORTCUT_HINT}</p>
    </div>
  );
}


function ChatWindow({ mobile }: { mobile: boolean }) {
  const close = useAiChatStore((state) => state.close);
  const messages = useAiChatStore((state) => state.messages);
  const addMessage = useAiChatStore((state) => state.addMessage);
  const clearMessages = useAiChatStore((state) => state.clearMessages);
  const { mutate: sendMessage, isPending } = useSendAiMessage();

  const [input, setInput] = useState('');
  const [workingStatus, setWorkingStatus] = useState('Готую запит...');
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);
  const [atBottom, setAtBottom] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (atBottom) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isPending, atBottom]);

  useEffect(() => {
    const element = inputRef.current;
    if (!element) return;
    element.style.height = 'auto';
    element.style.height = `${Math.min(element.scrollHeight, 112)}px`;
  }, [input]);

  const appendAssistant = (response: ZephyrosResponse) => {
    addMessage({
      id: generateId(),
      role: 'assistant',
      content: response,
      timestamp: new Date(),
    });
    setAtBottom(true);
  };

  const handleSend = (value?: string) => {
    const messageText = (value ?? input).trim();
    if (!messageText || isPending) return;

    const history = messages.map((message) => ({
      role: message.role,
      content: message.content,
    }));
    addMessage({
      id: generateId(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    });
    setInput('');
    setWorkingStatus('Готую запит...');
    setAtBottom(true);

    sendMessage(
      {
        message: messageText,
        history,
        onStatusChange: setWorkingStatus,
      },
      {
        onSuccess: (response) => {
          const degraded = hasFallback(response);
          setLastFailedMessage(degraded ? messageText : null);
          appendAssistant(response);
        },
        onError: (error) => {
          console.error('[Zephyros] Chat request failed', error);
          setLastFailedMessage(messageText);
          setInput(messageText);
          appendAssistant({
            blocks: [
              {
                type: 'fallback',
                message: 'Zephyros не отримав відповідь від сервера.',
                suggestion: 'Запит повернуто в поле вводу. Перевірте з’єднання та повторіть його.',
              },
            ],
          });
        },
      },
    );
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
      return;
    }
    if (event.key === 'Escape' && !input.trim()) close();
    if (event.key === 'ArrowUp' && !input.trim() && !isPending) {
      const lastUserMessage = [...messages].reverse().find((message) => message.role === 'user');
      if (lastUserMessage) {
        event.preventDefault();
        setInput(String(lastUserMessage.content));
      }
    }
  };

  const onScroll = () => {
    const element = scrollRef.current;
    if (!element) return;
    setAtBottom(element.scrollHeight - element.scrollTop - element.clientHeight < 64);
  };

  return (
    <section
      role="dialog"
      aria-modal={mobile}
      aria-label="Zephyros — помічник для покупок"
      className={`relative flex h-full w-full flex-col overflow-hidden bg-[#F8FBF9] font-inter dark:bg-[#0D1512] ${
        mobile
          ? ''
          : 'rounded-[24px] border border-[#D9E6E0] shadow-[0_24px_70px_rgba(15,45,35,0.22)] dark:border-[#294239]'
      }`}
    >
      <header className="flex shrink-0 items-center gap-3 border-b border-[#E2EBE7] bg-white px-3.5 py-3 dark:border-[#294239] dark:bg-[#111D18]">
        <ZephyrosMark size={36} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="truncate font-manrope text-[15px] font-extrabold tracking-tight text-[#173B33] dark:text-white">Zephyros</h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Автоматично
            </span>
          </div>
          <p className="mt-0.5 truncate text-[11px] text-[#71827A] dark:text-[#A9B6B0]">Помічник для вигідних покупок</p>
        </div>
        <IconButton label="Очистити історію" onClick={clearMessages} disabled={!messages.length || isPending}>
          <Trash2 className="h-4 w-4" />
        </IconButton>
        <IconButton label="Закрити Zephyros" onClick={close}>
          <X className="h-5 w-5" />
        </IconButton>
      </header>

      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3.5 py-4 sm:px-4"
        aria-live="polite"
      >
        <div className="flex flex-col gap-4">
          {!messages.length && <EmptyState onSelect={handleSend} />}
          {messages.map((message, index) =>
            message.role === 'user' ? (
              <UserMessage key={message.id} message={message} />
            ) : (
              <AssistantMessage
                key={message.id}
                message={message}
                onSelect={handleSend}
                onFeedback={appendAssistant}
                onRetry={
                  index === messages.length - 1 && lastFailedMessage
                    ? () => handleSend(lastFailedMessage)
                    : undefined
                }
              />
            ),
          )}
          {isPending && <WorkingMessage status={workingStatus} />}
          <div ref={bottomRef} />
        </div>
      </div>

      {!atBottom && (
        <button
          type="button"
          onClick={() => {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
            setAtBottom(true);
          }}
          aria-label="До останнього повідомлення"
          className="absolute bottom-[96px] right-4 grid h-10 w-10 place-items-center rounded-full border border-[#D3E0DA] bg-white text-[#265447] shadow-lg dark:border-[#315345] dark:bg-[#15221D] dark:text-[#3DAE8B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3DAE8B]"
        >
          <ArrowDown className="h-4 w-4" />
        </button>
      )}

      <footer className="shrink-0 border-t border-[#E2EBE7] bg-white px-3.5 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 dark:border-[#294239] dark:bg-[#111D18] sm:px-4">
        <div className="flex items-end gap-2 rounded-2xl border border-[#CEDDD6] bg-[#F7FAF8] p-2 pl-3 transition-colors focus-within:border-[#3A806A] focus-within:ring-2 focus-within:ring-[#3DAE8B]/15 dark:border-[#315345] dark:bg-[#17251F] dark:focus-within:border-[#3DAE8B]">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            maxLength={2000}
            disabled={isPending}
            placeholder="Що знайти або порівняти?"
            aria-label="Повідомлення для Zephyros"
            className="max-h-28 min-h-10 flex-1 resize-none border-0 bg-transparent py-2 text-[14px] leading-5 text-[#173B33] outline-none placeholder:text-[#91A098] disabled:opacity-60 dark:text-[#EAF3EF] dark:placeholder:text-[#71857C]"
          />
          <button
            type="button"
            onClick={() => handleSend()}
            disabled={!input.trim() || isPending}
            aria-label="Надіслати"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border-0 bg-[#265447] text-white transition-colors hover:bg-[#1B4438] disabled:cursor-not-allowed disabled:bg-[#C1CEC8] dark:bg-[#3DAE8B] dark:text-[#0B110F] dark:hover:bg-[#55C49F] dark:disabled:bg-[#405D52] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3DAE8B] focus-visible:ring-offset-2"
          >
            {isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
        <p className="mt-1.5 text-center text-[10px] text-[#93A19B] dark:text-[#71857C]">Enter — надіслати · Shift+Enter — новий рядок</p>
      </footer>
    </section>
  );
}


export function AiChatWidget() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isOpen = useAiChatStore((state) => state.isOpen);
  const toggle = useAiChatStore((state) => state.toggle);
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(max-width: 767px)');
    const update = () => setMobile(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    const handleShortcut = (event: globalThis.KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'j') {
        event.preventDefault();
        toggle();
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [isAuthenticated, toggle]);

  useEffect(() => {
    if (!mobile || !isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, mobile]);

  if (!isAuthenticated) return null;

  return (
    <div
      data-zephyros-motion
      className={mobile && isOpen ? 'fixed inset-0 z-50' : 'fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6'}
    >
      <style>{ZEPHYROS_MOTION_CSS}</style>
      {isOpen ? (
        <div
          className={
            mobile
              ? 'h-[100dvh] w-screen origin-bottom-right motion-reduce:animate-none'
              : 'h-[min(720px,calc(100vh-80px))] w-[min(460px,calc(100vw-32px))] origin-bottom-right motion-reduce:animate-none'
          }
          style={{ animation: 'chatIn 280ms cubic-bezier(0.16,1,0.3,1) both' }}
        >
          <ChatWindow mobile={mobile} />
        </div>
      ) : (
        <button
          type="button"
          onClick={toggle}
          aria-label="Відкрити Zephyros"
          title={`Zephyros · ${SHORTCUT_HINT}`}
          className="group flex h-14 items-center gap-3 rounded-2xl border border-white/10 bg-[#173B33] px-3.5 text-white shadow-[0_12px_32px_rgba(23,59,51,0.3)] transition-all hover:-translate-y-0.5 hover:bg-[#214E42] hover:shadow-[0_16px_38px_rgba(23,59,51,0.34)] dark:bg-[#3DAE8B] dark:text-[#0B110F] dark:hover:bg-[#55C49F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3DAE8B] focus-visible:ring-offset-2"
        >
          <ZephyrosMark size={34} />
          <span className="hidden text-left sm:block">
            <span className="block font-manrope text-sm font-extrabold leading-none">Zephyros</span>
            <span className="mt-1 block text-[10px] text-white/65 dark:text-[#0B110F]/65">Помічник для покупок</span>
          </span>
        </button>
      )}
    </div>
  );
}
