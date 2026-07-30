import { useNavigate } from 'react-router-dom';
import { useQueries } from '@tanstack/react-query';
import { useFavoritesStore } from '@/shared/context/favoritesStore';
import { useAuthStore } from '@/modules/Auth/store/authStore';

import home1 from '@/shared/assets/home1.svg';
import home2 from '@/shared/assets/home2.svg';
import home3 from '@/shared/assets/home3.svg';
import home4 from '@/shared/assets/home4.svg';
import home5 from '@/shared/assets/home5.svg';

import home1D from '@/shared/assets/home1D.svg';
import home2D from '@/shared/assets/home2D.svg';
import home3D from '@/shared/assets/home3D.svg';
import home4D from '@/shared/assets/home4D.svg';
import home5D from '@/shared/assets/home5D.svg';

const HOME_ICONS = [home1, home2, home3, home4, home5];
const HOME_DARK_ICONS = [home1D, home2D, home3D, home4D, home5D];

const POPULAR_PRODUCTS = [
  { name: 'Молоко 2,5%' },
  { name: 'Кава мелена' },
  { name: 'Підгузки' },
  { name: 'Соняшникова олія' },
  { name: 'Пральний порошок' },
];

export function ProductsSec() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { isFavorite, add: addFavorite, remove: removeFavorite } = useFavoritesStore();
  const productQueries = useQueries({
    queries: POPULAR_PRODUCTS.map((prod) => ({
      queryKey: ['product_stats', prod.name],
      queryFn: async () => {
        const url = new URL(`${import.meta.env.VITE_API_URL || 'https://smarket-api.duckdns.org'}/api/v1/search/search?q=${encodeURIComponent(prod.name)}&limit=50`);
        const res = await fetch(url.toString());
        if (!res.ok) return { minPrice: 0, storesCount: 0, maxDiscount: 0 };
        const data = await res.json();
        
        let minPrice = Infinity;
        let maxDiscountAmount = 0;
        let stores = new Set<string>();

        (data.hits || []).forEach((hit: any) => {
            (hit.offers || []).forEach((offer: any) => {
                if (offer.price < minPrice) minPrice = offer.price;
                if (offer.old_price && offer.old_price > offer.price) {
                    const diff = offer.old_price - offer.price;
                    if (diff > maxDiscountAmount) maxDiscountAmount = diff;
                }
                stores.add(offer.store.retail_chain || offer.store.id); 
            });
        });

        return {
            minPrice: minPrice === Infinity ? 0 : minPrice,
            storesCount: stores.size,
            maxDiscount: maxDiscountAmount
        };
      },
      staleTime: 5 * 60 * 1000,
    }))
  });

  return (
    <section className="w-full py-[60px] sm:py-[96px] bg-white dark:bg-[#0B120F] transition-colors duration-300">
      <div className="w-full max-w-[1228px] mx-auto px-[20px] flex flex-col gap-[32px] sm:gap-[48px]">

        {/* Heading block */}
        <div className="max-w-[600px] mx-auto flex flex-col items-center text-center gap-[12px] sm:gap-[16px]">
          <h2 className="font-manrope text-[28px] sm:text-[40px] font-extrabold text-[#173B33] dark:text-white m-0 leading-tight transition-colors">
            Популярні товари для порівняння
          </h2>
          <p className="font-inter text-[15px] sm:text-[16px] text-[#6D8279] dark:text-[#A4B3AF] leading-[1.5] m-0 transition-colors">
            Швидко перевіряйте ціни на товари, які найчастіше додають у кошик.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-[20px]">
          {POPULAR_PRODUCTS.map(({ name }, index) => {
            const queryData = productQueries[index]?.data;
            const isLoading = productQueries[index]?.isLoading;
            
            let info = 'Завантаження...';
            let discount = '';
            
            if (!isLoading && queryData) {
              if (queryData.storesCount === 0) {
                 info = 'Немає в наявності';
              } else {
                 info = `від ${queryData.minPrice} грн · ${queryData.storesCount} магазин${[2,3,4].includes(queryData.storesCount % 10) && ![12,13,14].includes(queryData.storesCount % 100) ? 'и' : queryData.storesCount % 10 === 1 && queryData.storesCount % 100 !== 11 ? '' : 'ів'}`;
                 if (queryData.maxDiscount > 0) {
                     discount = `Економія до ${Math.round(queryData.maxDiscount)} грн`;
                 }
              }
            }

            return (
            <div
              key={name}
              className="bg-white dark:bg-[#15231D] border border-[#F3F4F6] dark:border-transparent rounded-[16px] px-[20px] py-[24px] flex flex-col items-center text-center transition-all duration-300 hover:shadow-[0_10px_25px_rgba(0,0,0,0.05)] dark:hover:shadow-none hover:-translate-y-1 relative"
            >
              {/* Серце - улюблені */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!isAuthenticated) { navigate('/auth'); return; }
                  // Since these are mock products without real IDs, we generate a hash or use index
                  const mockId = index + 999000; 
                  if (isFavorite(mockId)) {
                    removeFavorite(mockId);
                  } else {
                    addFavorite({
                      product_id: mockId,
                      product_title: name,
                      product_price: parseInt(info.replace(/\D/g,'')) || 0,
                    });
                  }
                }}
                className={`absolute top-4 right-4 p-1 border-none bg-transparent cursor-pointer transition-all hover:scale-110 ${
                  isFavorite(index + 999000)
                    ? 'text-[#E11D48]'
                    : 'text-[#D1D5DB] dark:text-[#2B4236] hover:text-[#E11D48] dark:hover:text-[#F43F5E]'
                }`}
                title="Додати до улюблених"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill={isFavorite(index + 999000) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>
              <img 
                src={HOME_ICONS[index % HOME_ICONS.length]} 
                alt={name} 
                className="w-full max-w-[80px] h-auto mb-[24px] block dark:hidden" 
              />
              <img 
                src={HOME_DARK_ICONS[index % HOME_DARK_ICONS.length]} 
                alt={name} 
                className="w-full max-w-[80px] h-auto mb-[24px] hidden dark:block" 
              />

              <h3 className="font-inter text-[15px] font-bold text-[#173B33] dark:text-white m-0 mb-[8px] leading-[1.4] transition-colors">
                {name}
              </h3>
              
              <p className="font-inter text-[13px] text-[#6D8279] dark:text-[#7A8D85] m-0 mb-[4px] transition-colors">
                {info}
              </p>
              
              <p className="font-inter text-[13px] font-semibold text-[#E29A00] dark:text-[#FFC72C] m-0 mb-[24px] transition-colors">
                {discount}
              </p>

              <button 
                onClick={() => navigate(`/catalog?search=${encodeURIComponent(name)}`)}
                className="w-full p-[10px] rounded-[100px] border border-[#E5E7EB] dark:border-[#2B4236] bg-transparent font-inter text-[14px] font-semibold text-[#265447] dark:text-[#3CD27D] cursor-pointer mt-auto transition-all duration-200 hover:border-[#265447] dark:hover:border-transparent hover:text-[#265447] dark:hover:text-[#0B120F] hover:bg-[#F6FAF8] dark:hover:bg-[#3CD27D]">
                Переглянути
              </button>
            </div>
          )})}
        </div>

      </div>
    </section>
  );
}