import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

// ================= SVG ІКОНКИ ДЛЯ МАКЕТУ =================
const CheckIcon = () => (
  <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7.33333 12.6667C10.2789 12.6667 12.6667 10.2789 12.6667 7.33333C12.6667 4.38781 10.2789 2 7.33333 2C4.38781 2 2 4.38781 2 7.33333C2 10.2789 4.38781 12.6667 7.33333 12.6667Z" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14 14L11.1 11.1" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const HeartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10.0001 17.0708L8.79173 15.9708C4.50007 12.0875 1.66673 9.52083 1.66673 6.33333C1.66673 3.76667 3.6834 1.75 6.25007 1.75C7.70007 1.75 9.09173 2.425 10.0001 3.49167C10.9084 2.425 12.3001 1.75 13.7501 1.75C16.3167 1.75 18.3334 3.76667 18.3334 6.33333C18.3334 9.52083 15.5001 12.0875 11.2084 15.9792L10.0001 17.0708Z" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const GridIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6.66667 2H2V6.66667H6.66667V2Z" fill="#111827"/>
    <path d="M14 2H9.33333V6.66667H14V2Z" fill="#111827"/>
    <path d="M6.66667 9.33333H2V14H6.66667V9.33333Z" fill="#111827"/>
    <path d="M14 9.33333H9.33333V14H14V9.33333Z" fill="#111827"/>
  </svg>
);

const ListIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 4H5.33333" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14 8H5.33333" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14 12H5.33333" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2.66667 4H2" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2.66667 8H2" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2.66667 12H2" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8.33333 1.66667L1.66667 8.33333M1.66667 1.66667L8.33333 8.33333" stroke="#265447" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ================= ТИПІЗАЦІЯ ДАНИХ З БЕКЕНДУ =================
interface StoreOffer {
  store_id: string;
  price: number;
  old_price: number | null;
  in_stock: boolean;
}

interface Product {
  id: number;
  title: string;
  brand: string | null;
  unit: string;
  weight: number;
  image_url: string | null;
  canonical_category_id: number;
  offers?: StoreOffer[]; 
  latest_price?: {
    price: number;
    old_price: number | null;
  };
}

interface ProductsResponse {
  items: Product[]; // data на items
  total: number;
}


// ================= ФУНКЦІЯ ОТРИМАННЯ ДАНИХ =================
const fetchProducts = async (page: number): Promise<ProductsResponse> => {
    const limit = 12;
    const skip = (page - 1) * limit;
    
    const res = await fetch(
      `http://localhost:8080/api/v1/products?limit=${limit}&skip=${skip}`
    );
  
    if (!res.ok) {
      throw new Error('Помилка завантаження товарів');
    }
  
    return res.json();
};

export function MainContent() {
    const [page, setPage] = useState(1);

    // Змінили дженерик на ProductsResponse
    const { data, isLoading } = useQuery<ProductsResponse>({
        queryKey: ['productsList', page],
        queryFn: () => fetchProducts(page),
    });

    // Тепер беремо items та total прямо з відповіді бекенду
    const products = data?.items ?? [];
    const totalProducts = data?.total ?? 0;

  return (
    <div className="w-full max-w-[1228px] mx-auto px-[20px] py-[40px] flex gap-[40px] items-start mobile:flex-col">
      
      {/* ================= LEFT SIDEBAR ================= */}
      <aside className="w-[280px] bg-white rounded-[16px] border border-[#E5E7EB] p-[24px] flex flex-col font-inter">
      
      {/* ================= КАТЕГОРІЇ ================= */}
      <div className="mb-[32px]">
        <h3 className="font-manrope text-[13px] font-bold text-[#6D8279] tracking-[0.06em] uppercase mb-[12px]">
          Категорії
        </h3>
        <hr className="border-t border-[#F3F4F6] mb-[16px]" />
        
        <ul className="flex flex-col gap-[4px]">
          <li className="flex items-center justify-between p-[8px_12px] bg-[#EAF7F2] rounded-[8px] cursor-pointer">
            <div className="flex items-center gap-[10px] font-semibold text-[#173B33] text-[14px]">
              <span className="text-[16px]">🥦</span>
              <span>Продукти</span>
            </div>
            <span className="bg-[#D1E8DD] text-[#173B33] text-[12px] font-bold px-[8px] py-[2px] rounded-[100px]">
              1 240
            </span>
          </li>

          {[
            { icon: '🥤', name: 'Напої', count: '380' },
            { icon: '🍼', name: 'Дитячі товари', count: '214' },
            { icon: '🧴', name: 'Побутова хімія', count: '176' },
            { icon: '💄', name: 'Краса та догляд', count: '290' },
            { icon: '🪴', name: 'Товари для дому', count: '134' },
            { icon: '🐾', name: 'Зоотовари', count: '98' },
          ].map((cat, idx) => (
            <li key={idx} className="flex items-center justify-between p-[8px_12px] rounded-[8px] cursor-pointer hover:bg-[#F9FAFB] transition-colors">
              <div className="flex items-center gap-[10px] font-semibold text-[#4B6358] text-[14px]">
                <span className="text-[16px] grayscale opacity-70">{cat.icon}</span>
                <span>{cat.name}</span>
              </div>
              <span className="bg-[#F3F4F6] text-[#6D8279] text-[12px] font-semibold px-[8px] py-[2px] rounded-[100px]">
                {cat.count}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* ================= ФІЛЬТРИ ================= */}
      <div>
        <h3 className="font-manrope text-[13px] font-bold text-[#6D8279] tracking-[0.06em] uppercase mb-[12px]">
          Фільтри
        </h3>
        <hr className="border-t border-[#F3F4F6] mb-[20px]" />

        {/* 1. ЦІНА */}
        <div className="mb-[24px]">
          <h4 className="font-manrope text-[12px] font-bold text-[#6D8279] tracking-[0.06em] uppercase mb-[12px]">
            Ціна (ГРН)
          </h4>
          <div className="border border-[#E5E7EB] rounded-[8px] px-[12px] py-[10px] mb-[16px]">
            <input 
              type="text" 
              defaultValue="20" 
              className="w-full border-none outline-none text-[#111827] text-[14px] bg-transparent"
            />
          </div>
          
          <div className="relative h-[4px] bg-[#F3F4F6] rounded-[2px] flex items-center mx-[10px]">
            <div className="absolute left-[5%] right-[25%] h-full bg-[#438870] rounded-[2px]"></div>
            <div className="absolute left-[5%] w-[18px] h-[18px] bg-white border-[2.5px] border-[#173B33] rounded-full transform -translate-x-1/2 flex items-center justify-center cursor-pointer shadow-sm">
              <div className="w-[6px] h-[6px] bg-[#173B33] rounded-full"></div>
            </div>
            <div className="absolute left-[75%] w-[18px] h-[18px] bg-white border-[2.5px] border-[#173B33] rounded-full transform -translate-x-1/2 flex items-center justify-center cursor-pointer shadow-sm">
              <div className="w-[6px] h-[6px] bg-[#173B33] rounded-full"></div>
            </div>
          </div>
        </div>

        {/* 2. МАГАЗИНИ */}
        <div className="mb-[24px]">
          <h4 className="font-manrope text-[12px] font-bold text-[#6D8279] tracking-[0.06em] uppercase mb-[12px]">
            Магазини
          </h4>
          <div className="flex flex-wrap gap-[8px]">
            <button className="border border-[#173B33] bg-[#EAF7F2] text-[#173B33] px-[14px] py-[6px] rounded-[100px] text-[13px] font-semibold cursor-pointer">АТБ</button>
            <button className="border border-[#173B33] bg-[#EAF7F2] text-[#173B33] px-[14px] py-[6px] rounded-[100px] text-[13px] font-semibold cursor-pointer">Сільпо</button>
            <button className="border border-[#E5E7EB] bg-white text-[#6D8279] px-[14px] py-[6px] rounded-[100px] text-[13px] font-medium cursor-pointer hover:border-[#D1D5DB]">Novus</button>
            <button className="border border-[#E5E7EB] bg-white text-[#6D8279] px-[14px] py-[6px] rounded-[100px] text-[13px] font-medium cursor-pointer hover:border-[#D1D5DB]">Metro</button>
            <button className="border border-[#E5E7EB] bg-white text-[#6D8279] px-[14px] py-[6px] rounded-[100px] text-[13px] font-medium cursor-pointer hover:border-[#D1D5DB]">Ашан</button>
          </div>
        </div>

        {/* 3. ПІДКАТЕГОРІЯ */}
        <div className="mb-[24px]">
          <h4 className="font-manrope text-[12px] font-bold text-[#6D8279] tracking-[0.06em] uppercase mb-[12px]">
            Підкатегорія
          </h4>
          <div className="flex flex-col gap-[12px]">
            {[
              { name: 'Молочна продукція', count: '218', active: true },
              { name: "М'ясо та птиця", count: '175', active: true },
              { name: 'Хліб та випічка', count: '140', active: false },
              { name: 'Овочі та фрукти', count: '209', active: false },
              { name: 'Риба та морепродукти', count: '88', active: false },
              { name: 'Крупи та бобові', count: '124', active: false },
              { name: 'Заморожені продукти', count: '96', active: false },
              { name: 'Консерви', count: '112', active: false },
            ].map((item, idx) => (
              <label key={idx} className="flex items-center gap-[10px] cursor-pointer group">
                <div className={`w-[18px] h-[18px] rounded-[4px] flex items-center justify-center shrink-0 transition-colors ${
                  item.active ? 'bg-[#173B33] border-none' : 'border border-[#D1D5DB] bg-white group-hover:border-[#9CA3AF]'
                }`}>
                  {item.active && <CheckIcon />}
                </div>
                <span className="flex-1 text-[13px] font-medium text-[#374151]">{item.name}</span>
                <span className="text-[12px] text-[#9CA3AF]">{item.count}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 4. ПРОПОЗИЦІЇ */}
        <div className="mb-[24px]">
          <h4 className="font-manrope text-[12px] font-bold text-[#6D8279] tracking-[0.06em] uppercase mb-[12px]">
            Пропозиції
          </h4>
          <div className="flex flex-col gap-[12px]">
            {[
              { name: 'Тільки акції', count: '340', active: true },
              { name: 'Нові надходження', count: '58', active: false },
              { name: 'Найбільша економія', count: '120', active: false },
            ].map((item, idx) => (
              <label key={idx} className="flex items-center gap-[10px] cursor-pointer group">
                <div className={`w-[18px] h-[18px] rounded-[4px] flex items-center justify-center shrink-0 transition-colors ${
                  item.active ? 'bg-[#173B33] border-none' : 'border border-[#D1D5DB] bg-white group-hover:border-[#9CA3AF]'
                }`}>
                  {item.active && <CheckIcon />}
                </div>
                <span className="flex-1 text-[13px] font-medium text-[#374151]">{item.name}</span>
                <span className="text-[12px] text-[#9CA3AF]">{item.count}</span>
              </label>
            ))}
          </div>
        </div>

        <button className="w-full border border-[#E5E7EB] bg-white rounded-[8px] py-[10px] font-inter text-[14px] font-semibold text-[#6D8279] transition-colors hover:bg-[#F9FAFB] cursor-pointer">
          Скинути фільтри
        </button>

      </div>
    </aside>

      {/* ================= RIGHT MAIN CONTENT ================= */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* Акційний баннер */}
        <div className="bg-[#265447] rounded-[12px] p-[20px_24px] flex justify-between items-center mb-[24px]">
          <div className="flex flex-col gap-[4px]">
            <h2 className="text-[14px] font-bold text-white tracking-[0.05em] uppercase m-0">
              Акційні ціни тижня
            </h2>
            <p className="text-[13px] text-[#A6C4B9] m-0">
              До п'ятниці: ексклюзивні знижки в АТБ та Сільпо
            </p>
          </div>
          <button className="bg-[#FFD600] text-[#111827] font-bold text-[14px] px-[16px] py-[8px] rounded-[100px] border-none cursor-pointer hover:bg-[#FACC15] transition-colors">
            До -30%
          </button>
        </div>

        {/* Панель сортування та пошуку */}
        <div className="flex justify-between items-center mb-[16px]">
          <div className="flex items-center gap-[10px] border border-[#E5E7EB] rounded-[8px] px-[12px] py-[10px] w-[320px] bg-white focus-within:border-[#265447] transition-colors">
            <SearchIcon />
            <input type="text" placeholder="Пошук товарів..." className="flex-1 border-none outline-none text-[14px] text-[#111827] placeholder:text-[#9CA3AF] bg-transparent" />
          </div>

          <div className="flex items-center gap-[16px]">
            <select 
              className="border border-[#E5E7EB] rounded-[8px] px-[14px] py-[10px] text-[13px] font-medium text-[#374151] outline-none cursor-pointer bg-white appearance-none pr-[30px]" 
              style={{ 
                backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2212%22%20height%3D%228%22%20viewBox%3D%220%200%2012%208%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M1%201.5L6%206.5L11%201.5%22%20stroke%3D%22%236B7280%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E")', 
                backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' 
              }}
            >
              <option>Найкраща ціна</option>
              <option>Спочатку дешевші</option>
              <option>За популярністю</option>
            </select>

            <div className="flex items-center border border-[#E5E7EB] rounded-[8px] overflow-hidden bg-white">
              <button className="p-[10px] bg-[#F3F4F6] border-none cursor-pointer flex items-center justify-center"><GridIcon /></button>
              <div className="w-[1px] h-[20px] bg-[#E5E7EB]"></div>
              <button className="p-[10px] bg-white border-none cursor-pointer flex items-center justify-center hover:bg-[#F9FAFB]"><ListIcon /></button>
            </div>
          </div>
        </div>

        {/* Активні теги та лічильник результатів */}
        <div className="flex items-center flex-wrap gap-[12px] mb-[24px]">
          <p className="text-[13px] text-[#6D8279] m-0">
              Знайдено <span className="font-bold text-[#111827]">{totalProducts} товарів</span>
          </p>
          <div className="flex gap-[8px]">
            {['АТБ', 'Сільпо', 'Тільки акції', 'Молочна продукція'].map((tag, idx) => (
              <span key={idx} className="flex items-center gap-[6px] bg-[#EAF7F2] text-[#265447] px-[10px] py-[4px] rounded-[100px] text-[12px] font-medium cursor-pointer">
                {tag} <CloseIcon />
              </span>
            ))}
          </div>
        </div>

        {/* ================= СІТКА ПРОДУКТІВ (ДИНАМІЧНА) ================= */}
        <div className="grid grid-cols-4 gap-[16px]">
          {isLoading ? (
            <div className="col-span-4 text-center py-10 font-medium text-[#6D8279]">
              Завантаження каталогу...
            </div>
          ) : (
            products.map((product) => {
              // Отримуємо актуальну ціну. Якщо це роут /by-store/, беремо latest_price, інакше першу ціну з offers
              const currentPrice = product.latest_price?.price || product.offers?.[0]?.price || 0;
              const oldPrice = product.latest_price?.old_price || product.offers?.[0]?.old_price || null;
              
              const discountPercent = oldPrice ? Math.round(((oldPrice - currentPrice) / oldPrice) * 100) : 0;
              const discountAmount = oldPrice ? Math.round(oldPrice - currentPrice) : 0;
              
              // Кількість магазинів
              const storesCount = product.offers?.length || 1; 

              return (
                <div key={product.id} className="border border-[#E5E7EB] rounded-[12px] p-[16px] flex flex-col bg-white hover:shadow-sm transition-shadow">
                  {/* Беджі та вподобане */}
                  <div className="flex justify-between items-start mb-[12px] min-h-[24px]">
                    <div className="flex gap-[4px]">
                      {discountPercent > 0 && (
                        <span className="text-[10px] font-bold px-[6px] py-[2px] rounded-[4px] bg-[#FFD600] text-[#111827]">
                          -{discountPercent}%
                        </span>
                      )}
                    </div>
                    <button className="bg-transparent border-none cursor-pointer hover:text-red-500 transition-colors text-[#111827]">
                      <HeartIcon />
                    </button>
                  </div>
                  
                  {/* Фото товару */}
                  <div className="w-full h-[140px] bg-[#F9FAFB] rounded-[8px] flex items-center justify-center mb-[16px] overflow-hidden p-[8px]">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.title} className="max-w-full max-h-full object-contain mix-blend-multiply" />
                    ) : (
                      <div className="w-[40px] h-[40px] bg-[#E5E7EB] rounded-[6px] opacity-40" />
                    )}
                  </div>
                  
                  {/* Інформація */}
                  <div className="flex flex-col flex-1">
                    <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-[0.05em] mb-[4px]">
                      {product.canonical_category_id ? `Категорія ${product.canonical_category_id}` : 'Продукти'}
                    </span>
                    <h3 className="font-manrope text-[14px] font-bold text-[#111827] leading-[1.3] mb-[4px] line-clamp-2 min-h-[36px]">
                      {product.title}
                    </h3>
                    <span className="text-[12px] text-[#6D8279] mb-[12px]">
                      {product.brand || 'Без бренду'} · {product.weight} {product.unit === 'pcs' ? 'шт' : 'г'}
                    </span>
                    
                    {/* Наявність */}
                    <div className="flex items-center gap-[6px] mb-[16px]">
                      <div className="flex gap-[2px]">
                        <span className={`w-[4px] h-[4px] rounded-full ${storesCount >= 1 ? 'bg-[#10B981]' : 'bg-[#D1D5DB]'}`}></span>
                        <span className={`w-[4px] h-[4px] rounded-full ${storesCount >= 2 ? 'bg-[#10B981]' : 'bg-[#D1D5DB]'}`}></span>
                        <span className={`w-[4px] h-[4px] rounded-full ${storesCount >= 3 ? 'bg-[#10B981]' : 'bg-[#D1D5DB]'}`}></span>
                      </div>
                      <span className="text-[12px] text-[#6D8279]">
                        {storesCount} {storesCount === 1 ? 'магазин' : storesCount < 5 ? 'магазини' : 'магазинів'}
                      </span>
                    </div>
                    
                    {/* Ціни та кнопка */}
                    <div className="mt-auto flex flex-col gap-[16px]">
                      <div className="flex justify-between items-end min-h-[36px]">
                        <div className="flex flex-col">
                          <span className="text-[11px] text-[#6D8279] mb-[2px]">від</span>
                          <span className="font-manrope text-[20px] font-extrabold text-[#111827] leading-none">
                            {currentPrice} ₴
                          </span>
                        </div>
                        {oldPrice && (
                          <div className="flex flex-col items-end gap-[4px]">
                            <span className="text-[11px] text-[#9CA3AF] line-through leading-none">
                              {oldPrice} ₴
                            </span>
                            <span className="bg-[#EAF7F2] text-[#265447] text-[10px] font-bold px-[4px] py-[2px] rounded-[4px] leading-none">
                              -{discountAmount} ₴
                            </span>
                          </div>
                        )}
                      </div>
                      <button 
                        className={`w-full py-[8px] rounded-[6px] font-semibold text-[13px] border cursor-pointer transition-colors ${
                          oldPrice 
                            ? 'bg-[#265447] text-white border-[#265447] hover:bg-[#1A3E2F]' 
                            : 'bg-white text-[#265447] border-[#E5E7EB] hover:border-[#265447]'
                        }`}
                      >
                        Порівняти
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Блок пагінації (ДИНАМІЧНИЙ) */}
        <div className="flex justify-center items-center gap-[8px] mt-[32px]">
          
          {/* Кнопка НАЗАД */}
          <button 
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className={`w-[32px] h-[32px] flex items-center justify-center border rounded-[8px] text-[13px] transition-colors ${
              page === 1 
                ? 'border-[#E5E7EB] bg-[#F9FAFB] text-[#9CA3AF] cursor-not-allowed' 
                : 'border-[#E5E7EB] bg-white text-[#374151] cursor-pointer hover:bg-[#F3F4F6]'
            }`}
          >
            ‹
          </button>

          {/* Поточна сторінка */}
          <span className="w-[32px] h-[32px] flex items-center justify-center border-none rounded-[8px] bg-[#265447] text-white font-semibold text-[13px]">
            {page}
          </span>

          {/* Кнопка ВПЕРЕД */}
          <button 
            onClick={() => setPage(p => p + 1)}
            // Блокуємо, якщо поточна сторінка * ліміт >= загальної кількості
            disabled={(page * 12) >= totalProducts} 
            className={`w-[32px] h-[32px] flex items-center justify-center border rounded-[8px] text-[13px] transition-colors ${
              (page * 12) >= totalProducts 
                ? 'border-[#E5E7EB] bg-[#F9FAFB] text-[#9CA3AF] cursor-not-allowed' 
                : 'border-[#E5E7EB] bg-white text-[#374151] cursor-pointer hover:bg-[#F3F4F6]'
            }`}
          >
            ›
          </button>

        </div>

      </main>
    </div>
  );
}