import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Package, Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/shared/api/apiClient';
import { useLocationStore } from '@/shared/store/locationStore';

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
  const sectionRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [animState, setAnimState] = useState<'closed' | 'opening' | 'open' | 'closing'>('closed');
  const animTimerRef = useRef<number>(undefined);
  const touchStartY = useRef(0);
  const touchDeltaY = useRef(0);

  useEffect(() => {
    window.clearTimeout(animTimerRef.current);

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setAnimState('opening');
      const rafId = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimState('open');
        });
      });
      animTimerRef.current = rafId as unknown as number;
      return () => {
        cancelAnimationFrame(rafId);
        document.body.style.overflow = '';
      };
    } else {
      setAnimState((prev) => (prev === 'closed' ? 'closed' : 'closing'));
      const timerId = window.setTimeout(() => {
        setAnimState('closed');
        setQuery('');
        setDebouncedQuery('');
        document.body.style.overflow = '';
      }, 300);
      animTimerRef.current = timerId;
      return () => {
        window.clearTimeout(timerId);
        document.body.style.overflow = '';
      };
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

  const currentCity = useLocationStore((state) => state.currentCity);

  const { data, isFetching } = useQuery<SearchResponse>({
    queryKey: ['header-search', debouncedQuery, currentCity],
    queryFn: async () => {
      const { data: response } = await apiClient.get('/api/v1/search/search', {
        params: { q: debouncedQuery, limit: 7, offset: 0, city: currentCity },
      });
      return response;
    },
    enabled: isOpen && debouncedQuery.length >= 2,
  });

  const openProduct = (productId: number) => {
    onClose();
    navigate(`/product/${productId}`);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchDeltaY.current = 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const delta = e.touches[0].clientY - touchStartY.current;
    if (delta > 0) {
      touchDeltaY.current = delta;
      if (sectionRef.current) {
        sectionRef.current.style.transition = 'none';
        sectionRef.current.style.transform = `translate3d(0, ${delta * 0.45}px, 0)`;
        sectionRef.current.style.opacity = `${Math.max(0.2, 1 - delta / 480)}`;
      }
    }
  };

  const handleTouchEnd = () => {
    if (touchDeltaY.current > 80) {
      if (sectionRef.current) {
        sectionRef.current.style.transition = 'transform 0.25s cubic-bezier(0.32, 0.94, 0.6, 1), opacity 0.25s ease-out';
        sectionRef.current.style.transform = 'translate3d(0, 100%, 0)';
        sectionRef.current.style.opacity = '0';
      }
      onClose();
    } else {
      if (sectionRef.current) {
        // Snap back to zero with spring easing
        sectionRef.current.style.transition = 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease-out';
        sectionRef.current.style.transform = 'translate3d(0, 0, 0)';
        sectionRef.current.style.opacity = '1';
        
        // Let transition finish, then clean up inline styles
        const currentDelta = touchDeltaY.current;
        setTimeout(() => {
          if (sectionRef.current && touchDeltaY.current === 0) {
            sectionRef.current.style.transition = '';
            sectionRef.current.style.transform = '';
            sectionRef.current.style.opacity = '';
          }
        }, 300);
      }
    }
    touchDeltaY.current = 0;
  };

  if (animState === 'closed') return null;

  const isTransitionActive = animState === 'open';

  const products = data?.hits?.slice(0, 7) ?? [];

  return (
    <div
      className={`fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-[#0B1813]/25 px-0 sm:px-4 pt-0 sm:pt-20 backdrop-blur-md dark:bg-black/45 sm:pt-28 transition-all duration-300 ease-out ${isTransitionActive ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      role="presentation"
    >
      <section
        ref={sectionRef}
        aria-label="Швидкий пошук товарів"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`h-[85vh] sm:h-fit w-full sm:max-w-2xl overflow-hidden rounded-t-3xl sm:rounded-3xl border border-white/55 bg-white/70 shadow-[0_-8px_40px_rgba(9,30,21,0.28)] sm:shadow-[0_24px_80px_rgba(9,30,21,0.28)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#14221E]/75 transition-all duration-300 cubic-bezier(0.34, 1.56, 0.64, 1) ${isTransitionActive ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-full sm:translate-y-8 sm:scale-95'}`}
      >
        <div className="flex items-center gap-3 border-b border-[#265447]/10 px-4 py-3 sm:px-5 sm:py-4 dark:border-white/10">
          <div className="hidden sm:flex items-center">
            <Search className="h-5 w-5 shrink-0 text-[#265447] dark:text-[#3CD27D]" />
          </div>
          <div className="sm:hidden w-full flex justify-center pt-1 pb-2">
            <div className="w-10 h-1 rounded-full bg-[#D1D5DB] dark:bg-[#4A5D54]" />
          </div>
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
            className="rounded-lg border border-[#265447]/10 bg-white/45 p-2 text-[#6D8279] transition-colors hover:bg-white hover:text-[#173B33] dark:border-white/10 dark:bg-white/5 dark:text-[#A4B3AF] dark:hover:bg-white/10 dark:hover:text-white sm:p-1.5"
            aria-label="Закрити пошук"
          >
            <X className="h-5 w-5 sm:h-4 sm:w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 sm:max-h-[min(55vh,480px)]">
          {query.trim().length < 2 ? (
            <div className="flex flex-col items-center justify-center py-12 sm:py-10 px-4">
              <Search className="h-10 w-10 text-[#D1D5DB] dark:text-[#2B4236] mb-3 sm:hidden" />
              <p className="text-center text-sm text-[#6D8279] dark:text-[#A4B3AF]">
                Введіть щонайменше 2 символи, щоб знайти товар.
              </p>
            </div>
          ) : isFetching ? (
            <div className="flex flex-col items-center justify-center py-12 sm:py-10 px-4">
              <div className="w-8 h-8 border-2 border-[#265447]/20 border-t-[#265447] dark:border-[#3CD27D]/20 dark:border-t-[#3CD27D] rounded-full animate-spin mb-3" />
              <p className="text-sm text-[#6D8279] dark:text-[#A4B3AF]">Шукаємо товари…</p>
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 sm:py-10 px-4">
              <Package className="h-10 w-10 text-[#D1D5DB] dark:text-[#2B4236] mb-3" />
              <p className="text-center text-sm text-[#6D8279] dark:text-[#A4B3AF]">
                За цим запитом нічого не знайдено.
              </p>
            </div>
          ) : (
            <ul className="space-y-1">
              {products.map((product) => {
                const lowestPrice = getLowestPrice(product.offers);

                return (
                  <li key={product.id}>
                    <button
                      type="button"
                      onClick={() => openProduct(product.id)}
                      className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 sm:py-2.5 text-left transition-colors hover:bg-white/65 dark:hover:bg-white/8 active:bg-white/80 dark:active:bg-white/12"
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
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="border-t border-[#265447]/10 p-2 dark:border-white/10 shrink-0 safe-area-bottom">
          <button
            type="button"
            onClick={openCatalog}
            className="flex w-full items-center justify-between rounded-2xl px-4 py-3.5 sm:py-3 text-sm font-semibold text-[#265447] transition-colors hover:bg-white/65 dark:text-[#3CD27D] dark:hover:bg-white/8 active:bg-white/80 dark:active:bg-white/12"
          >
            <span>Перейти до повного пошуку</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>
    </div>
  );
}
