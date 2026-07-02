import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import {
  X,
  Send,
  Sparkles,
  ShoppingCart,
  Package,
  TrendingDown,
  Star,
  AlertCircle,
  Info,
  AlertTriangle,
  Loader2,
  Bot,
  MessageCircle,
} from 'lucide-react';
import { useAuthStore } from '@/modules/Auth/store/authStore';
import { useAiChatStore, type UIBlock, type ZephyrosResponse, type ChatMessage } from '@/modules/AiChat/store/useAiChatStore';
import { useSendAiMessage } from '@/hooks/api/useAiChatApi';

function generateId() {
  return Math.random().toString(36).slice(2);
}

function BadgeBlockView({ block }: { block: Extract<UIBlock, { type: 'badge' }> }) {
  const variantStyles: Record<string, string> = {
    savings: 'bg-[#FFF8E1] text-[#856404] border-[#FFC72C]',
    best_price: 'bg-[#F0FDF4] text-[#15803D] border-[#86EFAC]',
    warning: 'bg-[#FFF7ED] text-[#C2410C] border-[#FED7AA]',
    info: 'bg-[#F6FAF8] text-[#265447] border-[rgba(38,84,71,0.2)]',
  };
  const icons: Record<string, React.ReactNode> = {
    savings: <TrendingDown className="w-3.5 h-3.5 shrink-0" />,
    best_price: <Star className="w-3.5 h-3.5 shrink-0" />,
    warning: <AlertTriangle className="w-3.5 h-3.5 shrink-0" />,
    info: <Info className="w-3.5 h-3.5 shrink-0" />,
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[12px] font-semibold ${variantStyles[block.variant]}`}>
      {icons[block.variant]}
      {block.label}: <span className="font-bold">{block.value}</span>
    </span>
  );
}

function TableBlockView({ block }: { block: Extract<UIBlock, { type: 'table' }> }) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-[rgba(38,84,71,0.1)]">
      {block.title && (
        <div className="px-3 py-2 bg-[#F6FAF8] border-b border-[rgba(38,84,71,0.08)] text-[12px] font-semibold text-[#265447]">
          {block.title}
        </div>
      )}
      <table className="w-full text-[11px]">
        <thead>
          <tr className="bg-[#F6FAF8]">
            {block.columns.map((col, i) => (
              <th key={i} className="px-2.5 py-2 text-left font-semibold text-[#6D8279] border-b border-[rgba(38,84,71,0.08)]">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row, ri) => (
            <tr
              key={ri}
              className={`border-b border-[rgba(38,84,71,0.05)] last:border-0 transition-colors ${
                block.highlight_row === ri ? 'bg-[#F0FDF4]' : 'hover:bg-[#FAFAFA]'
              }`}
            >
              {row.map((cell, ci) => (
                <td key={ci} className="px-2.5 py-2 text-[#173B33]">
                  {typeof cell === 'boolean' ? (
                    <span className={`font-medium ${cell ? 'text-[#15803D]' : 'text-[#DC2626]'}`}>
                      {cell ? '✓' : '✗'}
                    </span>
                  ) : (
                    <span className={block.highlight_row === ri && ci === 2 ? 'font-bold text-[#15803D]' : ''}>
                      {cell}
                    </span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProductCardView({ block }: { block: Extract<UIBlock, { type: 'product_card' }> }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-[rgba(38,84,71,0.1)] bg-[#F6FAF8]">
      <div className="w-9 h-9 rounded-lg bg-white border border-[rgba(38,84,71,0.1)] flex items-center justify-center shrink-0">
        <Package className="w-4 h-4 text-[#265447]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-semibold text-[#173B33] truncate">{block.name}</p>
        <p className="text-[11px] text-[#6D8279]">{block.store}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-[13px] font-bold text-[#265447]">{block.price}</p>
        {block.savings && <p className="text-[10px] text-[#15803D]">{block.savings}</p>}
      </div>
    </div>
  );
}

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
              active === i
                ? 'bg-[#265447] text-white shadow-sm'
                : 'text-[#6D8279] hover:text-[#265447] bg-transparent'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-2">
        {block.items[active]?.blocks.map((b, i) => <BlockRenderer key={i} block={b} onOptionClick={() => {}} />)}
      </div>
    </div>
  );
}

function ClarificationBlockView({
  block,
  onOptionClick,
}: {
  block: Extract<UIBlock, { type: 'clarification' }>;
  onOptionClick: (text: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[12px] font-semibold text-[#173B33]">{block.question}</p>
      <div className="flex flex-col gap-1.5">
        {block.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => onOptionClick(opt)}
            className="text-left px-3 py-2 rounded-xl border border-[rgba(38,84,71,0.15)] bg-white text-[12px] text-[#173B33] hover:bg-[#F6FAF8] hover:border-[#265447] hover:text-[#265447] transition-all duration-150 cursor-pointer font-medium"
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function ActionButtonView({
  block,
  onOptionClick,
}: {
  block: Extract<UIBlock, { type: 'action_button' }>;
  onOptionClick: (text: string) => void;
}) {
  return (
    <button
      onClick={() => onOptionClick(`Так, додай до кошика (product_id: ${block.payload.product_id})`)}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#265447] hover:bg-[#1A3E2F] text-white text-[12px] font-semibold transition-colors duration-200 cursor-pointer border-none w-full justify-center"
    >
      <ShoppingCart className="w-3.5 h-3.5 shrink-0" />
      {block.label}
    </button>
  );
}

function FallbackBlockView({ block }: { block: Extract<UIBlock, { type: 'fallback' }> }) {
  return (
    <div className="flex flex-col items-center gap-2 py-4 px-3 rounded-xl bg-[#FFF7F7] border border-[#FECACA] text-center">
      <AlertCircle className="w-5 h-5 text-[#DC2626]" />
      <p className="text-[12px] font-semibold text-[#173B33]">{block.message}</p>
      {block.suggestion && <p className="text-[11px] text-[#6D8279]">{block.suggestion}</p>}
    </div>
  );
}

function BlockRenderer({ block, onOptionClick }: { block: UIBlock; onOptionClick: (text: string) => void }) {
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
      return <hr className="border-[rgba(38,84,71,0.08)] my-1" />;
    default:
      return null;
  }
}

function AssistantMessage({ msg, onOptionClick }: { msg: ChatMessage; onOptionClick: (text: string) => void }) {
  const response = msg.content as ZephyrosResponse;
  return (
    <div className="flex items-start gap-2.5">
      <div className="w-7 h-7 rounded-full bg-[#265447] flex items-center justify-center shrink-0 mt-0.5">
        <Bot className="w-3.5 h-3.5 text-white" />
      </div>
      <div className="flex-1 min-w-0 bg-[#F6FAF8] rounded-2xl rounded-tl-sm px-3.5 py-3 flex flex-col gap-2.5">
        {response.blocks?.map((block, i) => (
          <BlockRenderer key={i} block={block} onOptionClick={onOptionClick} />
        ))}
      </div>
    </div>
  );
}

function UserMessage({ msg }: { msg: ChatMessage }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] bg-[#265447] text-white rounded-2xl rounded-tr-sm px-3.5 py-2.5">
        <p className="text-[13px] leading-relaxed">{msg.content as string}</p>
      </div>
    </div>
  );
}

function TypingIndicator({ status }: { status: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="w-7 h-7 rounded-full bg-[#265447] flex items-center justify-center shrink-0">
        <Bot className="w-3.5 h-3.5 text-white" />
      </div>
      <div className="bg-[#F6FAF8] rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-[#265447] animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
        <span className="text-[11px] text-[#6D8279] font-medium leading-none">{status}</span>
      </div>
    </div>
  );
}

function ChatWindow() {
  const close = useAiChatStore((s) => s.close);
  const messages = useAiChatStore((s) => s.messages);
  const addMessage = useAiChatStore((s) => s.addMessage);
  const { mutate: sendMessage, isPending } = useSendAiMessage();
  const [input, setInput] = useState('');
  const [pendingStatus, setPendingStatus] = useState('Думаю над запитом...');
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

    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };
    addMessage(userMsg);
    setInput('');

    setPendingStatus('Думаю над запитом...');

    sendMessage(
      {
        message: messageText,
        onStatusChange: (status) => setPendingStatus(status),
      },
      {
        onSuccess: (data) => {
          setPendingStatus('Думаю над запитом...');
          const aiMsg: ChatMessage = {
            id: generateId(),
            role: 'assistant',
            content: data,
            timestamp: new Date(),
          };
          addMessage(aiMsg);
        },
        onError: () => {
          setPendingStatus('Думаю над запитом...');
          const errorMsg: ChatMessage = {
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
          };
          addMessage(errorMsg);
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

  return (
    <div className="flex flex-col w-[380px] h-[560px] bg-white rounded-2xl shadow-[0_20px_60px_rgba(23,59,51,0.18)] border border-[rgba(38,84,71,0.08)] overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3.5 bg-[#265447] shrink-0">
        <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-semibold text-white leading-none font-manrope">Zephyros</p>
          <p className="text-[11px] text-white/70 mt-0.5">AI-асистент Smarket</p>
        </div>
        <button
          onClick={close}
          className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors duration-150 cursor-pointer border-none"
        >
          <X className="w-4 h-4 text-white" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3.5 py-4 flex flex-col gap-4 scroll-smooth">
        {messages.length === 0 && (
          <div className="flex flex-col items-center gap-3 mt-6 text-center px-4">
            <div className="w-14 h-14 rounded-2xl bg-[#F6FAF8] border border-[rgba(38,84,71,0.1)] flex items-center justify-center">
              <MessageCircle className="w-7 h-7 text-[#265447]" />
            </div>
            <p className="text-[13px] font-semibold text-[#173B33] font-manrope">Привіт! Я Zephyros</p>
            <p className="text-[12px] text-[#6D8279] leading-relaxed">
              Допоможу знайти найкращі ціни на товари у магазинах. Просто запитайте!
            </p>
            <div className="flex flex-wrap gap-2 justify-center mt-1">
              {['Молоко дешевше 50 грн', 'Порівняй ціни на хліб', 'Що у кошику?'].map((q) => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  className="px-3 py-1.5 rounded-full border border-[rgba(38,84,71,0.15)] bg-[#F6FAF8] text-[11px] text-[#265447] font-medium hover:bg-[#265447] hover:text-white transition-all duration-150 cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

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

      <div className="px-3.5 py-3 border-t border-[rgba(38,84,71,0.08)] shrink-0 bg-white">
        <div className="flex items-end gap-2 bg-[#F6FAF8] rounded-xl border border-[rgba(38,84,71,0.12)] px-3 py-2.5 focus-within:border-[#265447] transition-colors duration-150">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Напишіть запит..."
            rows={1}
            disabled={isPending}
            className="flex-1 bg-transparent border-none outline-none resize-none text-[13px] text-[#173B33] placeholder-[#A0AEC0] max-h-24 leading-relaxed disabled:opacity-50"
            style={{ fontFamily: 'Inter, sans-serif' }}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isPending}
            className="w-8 h-8 rounded-lg bg-[#265447] hover:bg-[#1A3E2F] disabled:bg-[rgba(38,84,71,0.2)] flex items-center justify-center shrink-0 transition-all duration-150 cursor-pointer border-none"
          >
            {isPending ? (
              <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5 text-white" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AiChatWidget() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isOpen = useAiChatStore((s) => s.isOpen);
  const toggle = useAiChatStore((s) => s.toggle);

  if (!isAuthenticated) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {isOpen && (
        <div
          className="transition-all duration-300 origin-bottom-right"
          style={{
            animation: 'chatIn 0.25s cubic-bezier(0.34,1.56,0.64,1)',
          }}
        >
          <ChatWindow />
        </div>
      )}

      <button
        onClick={toggle}
        aria-label="Відкрити AI-асистента"
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-[0_8px_24px_rgba(38,84,71,0.35)] hover:shadow-[0_12px_32px_rgba(38,84,71,0.45)] transition-all duration-300 cursor-pointer border-none ${
          isOpen ? 'bg-[#173B33] rotate-0' : 'bg-[#265447] hover:bg-[#1A3E2F] hover:scale-105'
        }`}
      >
        {isOpen ? (
          <X className="w-5 h-5 text-white" />
        ) : (
          <Sparkles className="w-5 h-5 text-white" />
        )}
      </button>
    </div>
  );
}
