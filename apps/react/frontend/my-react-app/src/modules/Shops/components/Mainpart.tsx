import React, { useState, useEffect } from 'react';

// ================= ІКОНКИ =================
const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7.33333 12.6667C10.2789 12.6667 12.6667 10.2789 12.6667 7.33333C12.6667 4.38781 10.2789 2 7.33333 2C4.38781 2 2 4.38781 2 7.33333C2 10.2789 4.38781 12.6667 7.33333 12.6667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14 14L11.1 11.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Тимчасові мокові дані для візуалу як на скріншоті
const MOCK_STORES = [
  { id: 'atb', name: 'АТБ', desc: 'Супермаркет щоденних покупок', prod: 420, promo: 86, eco: 'до 24%', badge: { text: 'Популярний', type: 'dark' } },
  { id: 'silpo', name: 'Сільпо', desc: 'Продукти, делікатеси та товари для дому', prod: 380, promo: 72, eco: 'до 22%', badge: { text: '6 акцій', type: 'yellow' } },
  { id: 'novus', name: 'Novus', desc: 'Супермаркет для великих закупівель', prod: 340, promo: 58, eco: 'до 20%', badge: { text: 'Вигідно', type: 'light' } },
  { id: 'metro', name: 'Metro', desc: 'Великі закупівлі та професійні товари', prod: 290, promo: 44, eco: 'до 30%' },
  { id: 'ashan', name: 'Ашан', desc: 'Гіпермаркет продуктів і товарів для дому', prod: 310, promo: 51, eco: 'до 21%' },
  { id: 'varus', name: 'Varus', desc: 'Продукти, напої та товари щоденного попиту', prod: 260, promo: 39, eco: 'до 18%' },
  { id: 'eko', name: 'Еко Маркет', desc: 'Супермаркет для сімейних покупок', prod: 245, promo: 34, eco: 'до 17%' },
  { id: 'fozzy', name: 'Fozzy', desc: 'Великий вибір продуктів і товарів для дому', prod: 225, promo: 31, eco: 'до 19%', badge: { text: 'Вибір тижня', type: 'yellow' } },
  { id: 'fora', name: 'Фора', desc: 'Магазин біля дому для швидких покупок', prod: 190, promo: 28, eco: 'до 15%' },
  { id: 'mega', name: 'МегаМаркет', desc: 'Продукти, кулінарія та побутові товари', prod: 210, promo: 26, eco: 'до 16%' },
  { id: 'tavria', name: 'Таврія В', desc: 'Продукти, напої та акційні пропозиції', prod: 180, promo: 23, eco: 'до 14%' },
  { id: 'kolo', name: 'Коло', desc: 'Магазин швидких щоденних покупок', prod: 155, promo: 19, eco: 'до 12%' },
];

export const Mainpart: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeCategoryTab, setActiveCategoryTab] = useState('popular');
  const [loading, setLoading] = useState(false); // Для імітації можна перемкнути

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className="w-full bg-[#F8FAF9] dark:bg-[#0B120F] transition-colors duration-300 pb-10">
      <div className="w-full max-w-[1230px] mx-auto px-[20px] font-sans">
        
        {/* ================= БЛОК ПОШУКУ ================= */}
        <div className="w-full bg-white dark:bg-[#15231D] rounded-[16px] border border-[#E5E7EB] dark:border-[#1F3227] p-[20px] mb-[40px] transition-colors">
          <form onSubmit={handleSearch} className="flex flex-col gap-[16px]">
            
            {/* Інпут та кнопка */}
            <div className="flex flex-col sm:flex-row items-center gap-[12px] w-full">
              <div className="relative flex-1 w-full">
                <span className="absolute left-[16px] top-1/2 -translate-y-1/2 text-[#9CA3AF] dark:text-[#7A8D85] transition-colors">
                  <SearchIcon />
                </span>
                <input
                  type="text"
                  placeholder="Пошук магазину..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-[48px] bg-[#F9FAFB] dark:bg-[#0D1612] border border-[#E5E7EB] dark:border-[#1F3227] rounded-[8px] pl-[44px] pr-[16px] text-[14px] text-[#111827] dark:text-white placeholder-[#9CA3AF] dark:placeholder-[#7A8D85] outline-none focus:border-[#265447] dark:focus:border-[#3CD27D] transition-colors"
                />
              </div>
              <button
                type="submit"
                className="h-[48px] px-[32px] w-full sm:w-auto bg-[#265447] dark:bg-[#3CD27D] hover:bg-[#1A3E2F] dark:hover:bg-[#34B86D] text-white dark:text-[#0B120F] font-semibold text-[14px] rounded-[8px] transition-colors"
              >
                Знайти
              </button>
            </div>

            {/* Фільтри (Таби під пошуком) */}
            <div className="flex flex-wrap items-center gap-[10px]">
              <button
                type="button"
                onClick={() => setActiveFilter('all')}
                className={`px-[16px] py-[6px] rounded-[100px] text-[13px] font-medium transition-colors ${
                  activeFilter === 'all'
                    ? 'bg-[#265447] dark:bg-[#3CD27D] text-white dark:text-[#0B120F] border border-transparent'
                    : 'bg-white dark:bg-transparent border border-[#E5E7EB] dark:border-[#2B4236] text-[#6D8279] dark:text-[#7A8D85] hover:border-[#D1D5DB] dark:hover:border-[#3CD27D]'
                }`}
              >
                Усі магазини
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('promo')}
                className={`px-[16px] py-[6px] rounded-[100px] text-[13px] font-medium transition-colors ${
                  activeFilter === 'promo'
                    ? 'bg-[#265447] dark:bg-[#3CD27D] text-white dark:text-[#0B120F] border border-transparent'
                    : 'bg-white dark:bg-transparent border border-[#E5E7EB] dark:border-[#2B4236] text-[#6D8279] dark:text-[#7A8D85] hover:border-[#D1D5DB] dark:hover:border-[#3CD27D]'
                }`}
              >
                Магазини з акціями
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('popular')}
                className={`px-[16px] py-[6px] rounded-[100px] text-[13px] font-medium transition-colors ${
                  activeFilter === 'popular'
                    ? 'bg-[#265447] dark:bg-[#3CD27D] text-white dark:text-[#0B120F] border border-transparent'
                    : 'bg-white dark:bg-transparent border border-[#E5E7EB] dark:border-[#2B4236] text-[#6D8279] dark:text-[#7A8D85] hover:border-[#D1D5DB] dark:hover:border-[#3CD27D]'
                }`}
              >
                Популярні магазини
              </button>
            </div>
          </form>
        </div>

        {/* ================= ЗАГОЛОВОК СІТКИ ТА ТАБИ ================= */}
        <div className="mb-[24px]">
          <h2 className="font-manrope text-[24px] font-bold text-[#111827] dark:text-white mb-[8px] transition-colors">
            Усі магазини
          </h2>
          <p className="font-inter text-[14px] text-[#6D8279] dark:text-[#A4B3AF] transition-colors">
            Обирайте магазин, переглядайте актуальні акції та додавайте товари у кошик для порівняння.
          </p>
        </div>

        {/* Таби категорій */}
        <div className="flex flex-wrap items-center gap-[10px] mb-[32px]">
          {[
            { id: 'popular', label: 'Популярні' },
            { id: 'promo', label: 'Більше акцій' },
            { id: 'products', label: 'Більше товарів' },
            { id: 'economy', label: 'Найбільша економія' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveCategoryTab(tab.id)}
              className={`px-[16px] py-[8px] rounded-[100px] text-[13px] font-medium transition-colors ${
                activeCategoryTab === tab.id
                  ? 'bg-[#265447] dark:bg-[#3CD27D] text-white dark:text-[#0B120F]'
                  : 'bg-[#F3F4F6] dark:bg-[#1A2E25] text-[#6D8279] dark:text-[#7A8D85] hover:bg-[#E5E7EB] dark:hover:bg-[#233F32]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ================= СІТКА КАРТОК ================= */}
        {loading ? (
          <div className="w-full text-center py-10 text-[#6D8279] dark:text-[#7A8D85]">Завантаження...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-[20px]">
            {MOCK_STORES.map((store) => (
              <div 
                key={store.id} 
                className="bg-white dark:bg-[#15231D] border border-[#E5E7EB] dark:border-transparent rounded-[16px] p-[20px] flex flex-col hover:shadow-sm dark:hover:shadow-none transition-all group"
              >
                {/* Логотип та Бейдж */}
                <div className="flex justify-between items-start mb-[16px]">
                  <div className="w-[52px] h-[52px] rounded-[12px] border border-[#E5E7EB] dark:border-[#2B4236] bg-white flex items-center justify-center p-[6px] overflow-hidden shrink-0">
                    <span className="font-black text-[#111827] text-[14px] text-center leading-tight">
                      {store.name}
                    </span>
                  </div>
                  
                  {store.badge && (
                    <span className={`px-[8px] py-[4px] rounded-[6px] text-[10px] font-bold uppercase tracking-wider ${
                      store.badge.type === 'dark' ? 'bg-[#265447] text-white' :
                      store.badge.type === 'yellow' ? 'bg-[#FFC72C] text-[#111827]' :
                      'bg-[#EAF7F2] dark:bg-[#1A3026] text-[#265447] dark:text-[#3CD27D]'
                    }`}>
                      {store.badge.text}
                    </span>
                  )}
                </div>

                {/* Текст */}
                <h3 className="font-manrope text-[18px] font-bold text-[#111827] dark:text-white mb-[4px] leading-tight transition-colors">
                  {store.name}
                </h3>
                <p className="text-[13px] text-[#6D8279] dark:text-[#7A8D85] mb-[20px] line-clamp-2 leading-[1.4] h-[36px] transition-colors">
                  {store.desc}
                </p>

                {/* Статистика */}
                <div className="flex flex-col mb-[24px]">
                  <div className="flex justify-between items-center py-[8px] border-b border-[#F3F4F6] dark:border-[#1F3227] transition-colors">
                    <span className="text-[13px] text-[#6D8279] dark:text-[#7A8D85]">Товарів</span>
                    <span className="text-[13px] font-bold text-[#111827] dark:text-white">{store.prod}</span>
                  </div>
                  <div className="flex justify-between items-center py-[8px] border-b border-[#F3F4F6] dark:border-[#1F3227] transition-colors">
                    <span className="text-[13px] text-[#6D8279] dark:text-[#7A8D85]">Акцій</span>
                    <span className="text-[13px] font-bold text-[#111827] dark:text-white">{store.promo}</span>
                  </div>
                  <div className="flex justify-between items-center py-[8px]">
                    <span className="text-[13px] text-[#6D8279] dark:text-[#7A8D85]">Економія</span>
                    <span className="text-[13px] font-bold text-[#F59E0B] dark:text-[#FFB020]">{store.eco}</span>
                  </div>
                </div>

                {/* Кнопка */}
                <button className="w-full mt-auto bg-[#EAF7F2] dark:bg-[#1A3026] text-[#265447] dark:text-[#3CD27D] font-semibold text-[13px] py-[10px] rounded-[8px] hover:bg-[#D1E8DD] dark:hover:bg-[#233F32] transition-colors">
                  Переглянути товари
                </button>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default Mainpart;