import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Package, Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/shared/api/apiClient';

interface StoreOffer {
  price: number;
  in_stock: boolean;
}

interface SearchProduct {
  id: number;
  title: string;
  brand?: string | null;
  image_url?: string | null;
  offers?: StoreOffer[];
}

interface SearchResponse {
  hits?: SearchProduct[];
}

interface HeaderSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

const getLowestPrice = (offers?: StoreOffer[]) => {
  const availableOffers = offers?.filter((offer) => offer.in_stock) ?? [];
  const prices = (availableOffers.length > 0 ? availableOffers : offers ?? [])
    .map((offer) => offer.price)
    .filter((price) => Number.isFinite(price));

  return prices.length > 0 ? Math.min(...prices) : null;
};

export function HeaderSearch({ isOpen, onClose }: HeaderSearchProps) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [animState, setAnimState] = useState<'closed' | 'opening' | 'open' | 'closing'>('closed');
  const animTimerRef = useRef<number>(undefined);

  useEffect(() => {
    window.clearTimeout(animTimerRef.current);

    if (isOpen) {
      const rafId = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimState('open');
        });
      });
      animTimerRef.current = rafId as unknown as number;
      return () => cancelAnimationFrame(rafId);
    } else {
      const timerId = window.setTimeout(() => {
        setAnimState('closed');
        setQuery('');
        setDebouncedQuery('');
      }, 200);
      animTimerRef.current = timerId;
      return () => window.clearTimeout(timerId);
    }
  }, [isOpen]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [query]);

  const openCatalog = useCallback(() => {
    const search = query.trim();
    onClose();
    navigate(search ? `/catalog?search=${encodeURIComponent(search)}` : '/catalog');
  }, [navigate, onClose, query]);

  useEffect(() => {
    if (!isOpen) return;

    const focusTimeoutId = window.setTimeout(() => inputRef.current?.focus(), 0);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'Enter' && query.trim()) openCatalog();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(focusTimeoutId);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, openCatalog, query]);

  const { data, isFetching } = useQuery<SearchResponse>({
    queryKey: ['header-search', debouncedQuery],
    queryFn: async () => {
      const { data: response } = await apiClient.get('/api/v1/search/search', {
        params: { q: debouncedQuery, limit: 7, offset: 0 },
      });
      return response;
    },
    enabled: isOpen && debouncedQuery.length >= 2,
  });

  const openProduct = (productId: number) => {
    onClose();
    navigate(`/product/${productId}`);
  };

  if (animState === 'closed') return null;

  const isAnimating = animState === 'opening' || animState === 'open';

  const products = data?.hits?.slice(0, 7) ?? [];

  return (
    <div
      className={`fixed inset-0 z-[60] flex justify-center bg-[#0B1813]/25 px-4 pt-20 backdrop-blur-md dark:bg-black/45 sm:pt-28 transition-all duration-200 ease-out ${isAnimating ? 'opacity-100' : 'opacity-0'}`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      role="presentation"
    >
      <section
        aria-label="Швидкий пошук товарів"
        className={`h-fit w-full max-w-2xl overflow-hidden rounded-3xl border border-white/55 bg-white/70 shadow-[0_24px_80px_rgba(9,30,21,0.28)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#14221E]/75 transition-all duration-200 ease-out ${isAnimating ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-4'}`}
      >
        <div className="flex items-center gap-3 border-b border-[#265447]/10 px-5 py-4 dark:border-white/10">
          <Search className="h-5 w-5 shrink-0 text-[#265447] dark:text-[#3CD27D]" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Знайти товари…"
            className="min-w-0 flex-1 bg-transparent text-base font-medium text-[#173B33] outline-none placeholder:text-[#6D8279]/75 dark:text-white dark:placeholder:text-[#A4B3AF]/70"
          />
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#265447]/10 bg-white/45 p-1.5 text-[#6D8279] transition-colors hover:bg-white hover:text-[#173B33] dark:border-white/10 dark:bg-white/5 dark:text-[#A4B3AF] dark:hover:bg-white/10 dark:hover:text-white"
            aria-label="Закрити пошук"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[min(55vh,480px)] overflow-y-auto p-2">
          {query.trim().length < 2 ? (
            <p className="px-4 py-10 text-center text-sm text-[#6D8279] dark:text-[#A4B3AF]">
              Введіть щонайменше 2 символи, щоб знайти товар.
            </p>
          ) : isFetching ? (
            <p className="px-4 py-10 text-center text-sm text-[#6D8279] dark:text-[#A4B3AF]">Шукаємо товари…</p>
          ) : products.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-[#6D8279] dark:text-[#A4B3AF]">
              За цим запитом нічого не знайдено.
            </p>
          ) : (
            products.map((product) => {
              const lowestPrice = getLowestPrice(product.offers);

              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => openProduct(product.id)}
                  className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors hover:bg-white/65 dark:hover:bg-white/8"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/70 dark:bg-black/15">
                    {product.image_url ? (
                      <img src={product.image_url} alt="" className="h-full w-full object-contain p-1 mix-blend-multiply dark:mix-blend-normal" />
                    ) : (
                      <Package className="h-5 w-5 text-[#6D8279] dark:text-[#A4B3AF]" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#173B33] dark:text-white">{product.title}</p>
                    {product.brand && <p className="truncate text-xs text-[#6D8279] dark:text-[#A4B3AF]">{product.brand}</p>}
                  </div>
                  {lowestPrice !== null && (
                    <span className="shrink-0 text-sm font-bold text-[#265447] dark:text-[#3CD27D]">від {lowestPrice.toFixed(2)} ₴</span>
                  )}
                </button>
              );
            })
          )}
        </div>

        <div className="border-t border-[#265447]/10 p-2 dark:border-white/10">
          <button
            type="button"
            onClick={openCatalog}
            className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold text-[#265447] transition-colors hover:bg-white/65 dark:text-[#3CD27D] dark:hover:bg-white/8"
          >
            <span>Перейти до повного пошуку</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>
    </div>
  );
}
