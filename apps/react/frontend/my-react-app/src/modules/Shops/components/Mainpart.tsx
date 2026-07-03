import { useState } from 'react';

// Типізація даних прямо в компоненті
interface StoreItem {
  id: string;
  name: string;
  description: string;
  productsCount: number;
  promoCount: number;
  economy: string;
  logoBg: string;
  logoText: string;
  logoTextColor: string;
  badge?: {
    text: string;
    type: 'dark' | 'yellow' | 'mint';
  };
}

export const Mainpart: React.FC = () => {
  // --- СТАН КОМПОНЕНТА ---
  const [activeCategoryTab, setActiveCategoryTab] = useState('popular');

  // --- ДАНІ ДЛЯ СІТКИ МАГАЗИНІВ ---
  const stores: StoreItem[] = [
    { id: '1', name: 'АТБ', description: 'Супермаркет щоденних покупок', productsCount: 420, promoCount: 86, economy: 'до 24%', logoBg: 'bg-[#005BAA]', logoText: 'АТБ', logoTextColor: 'text-white', badge: { text: 'Популярний', type: 'dark' } },
    { id: '2', name: 'Сільпо', description: 'Продукти, делікатеси та товари для дому', productsCount: 380, promoCount: 72, economy: 'до 22%', logoBg: 'bg-[#FF6600]', logoText: 'Сільпо', logoTextColor: 'text-white', badge: { text: 'Є акції', type: 'yellow' } },
    { id: '3', name: 'Novus', description: 'Супермаркет для великих закупівель', productsCount: 340, promoCount: 58, economy: 'до 20%', logoBg: 'bg-white', logoText: 'NOVUS', logoTextColor: 'text-[#48A23F]', badge: { text: 'Вигідно', type: 'mint' } },
    { id: '4', name: 'Metro', description: 'Великі закупівлі та професійні товари', productsCount: 290, promoCount: 44, economy: 'до 30%', logoBg: 'bg-[#002D72]', logoText: 'METRO', logoTextColor: 'text-[#FFC72C]' },
    { id: '5', name: 'Ашан', description: 'Гіпермаркет продуктів і товарів для дому', productsCount: 310, promoCount: 51, economy: 'до 21%', logoBg: 'bg-white', logoText: 'Auchan', logoTextColor: 'text-[#E1001A]' },
    { id: '6', name: 'Varus', description: 'Продукти, напої та товари щоденного попиту', productsCount: 260, promoCount: 39, economy: 'до 18%', logoBg: 'bg-white', logoText: 'VARUS', logoTextColor: 'text-[#FFA500]' },
    { id: '7', name: 'Еко Маркет', description: 'Супермаркет для сімейних покупок', productsCount: 245, promoCount: 34, economy: 'до 17%', logoBg: 'bg-[#E10613]', logoText: 'ЕКО', logoTextColor: 'text-white' },
    { id: '8', name: 'Fozzy', description: 'Великий вибір продуктів і товарів для дому', productsCount: 225, promoCount: 31, economy: 'до 19%', logoBg: 'bg-[#E30613]', logoText: 'FOZZY', logoTextColor: 'text-white', badge: { text: 'Вибір тижня', type: 'yellow' } },
    { id: '9', name: 'Фора', description: 'Магазин біля дому для швидких покупок', productsCount: 190, promoCount: 28, economy: 'до 15%', logoBg: 'bg-[#73B427]', logoText: 'Фора', logoTextColor: 'text-white' },
    { id: '10', name: 'МегаМаркет', description: 'Продукти, кулінарія та побутові товари', productsCount: 210, promoCount: 26, economy: 'до 16%', logoBg: 'bg-white', logoText: 'ММ', logoTextColor: 'text-[#00573F]' },
    { id: '11', name: 'Таврія В', description: 'Продукти, напої та акційні пропозиції', productsCount: 180, promoCount: 23, economy: 'до 14%', logoBg: 'bg-white', logoText: 'ТАВРІЯ', logoTextColor: 'text-[#E30613]' },
    { id: '12', name: 'Коло', description: 'Магазин швидких щоденних покупок', productsCount: 155, promoCount: 19, economy: 'до 12%', logoBg: 'bg-[#7AB800]', logoText: 'КОЛО', logoTextColor: 'text-white' }
  ];

  return (
    <div className="w-full max-w-[1130px] mx-auto font-sans px-4 md:px-0 py-6 flex flex-col gap-6">

      {/* ================= БЛОК 3: ЗАГОЛОВОК СІТКИ ТА ТАБИ КАТЕГОРІЙ ================= */}
      <div className="w-full pt-2">
        <div className="mb-5">
          <h2 className="text-[#0D3E36] text-[24px] font-bold tracking-tight mb-1">
            Усі магазини
          </h2>
          <p className="text-[#70807E] text-[14px] font-normal">
            Обирайте магазин, переглядайте актуальні акції та додавайте товари у кошик для порівняння.
          </p>
        </div>

        {/* Таби сортування/категорій */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {[
            { id: 'popular', label: 'Популярні' },
            { id: 'promo', label: 'Більше акцій' },
            { id: 'products', label: 'Більше товарів' },
            { id: 'economy', label: 'Найбільша економія' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveCategoryTab(tab.id)}
              className={`h-[32px] px-4 rounded-full text-[13px] font-medium tracking-tight transition-all duration-200 ${
                activeCategoryTab === tab.id
                  ? 'bg-[#234A41] text-white'
                  : 'bg-[#F4F6F6] text-[#70807E] hover:bg-[#EAECEB] hover:text-[#0D3E36]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ================= БЛОК 4: СІТКА КАРТОК (Grid 4x3) ================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {stores.map((store) => (
            <div 
              key={store.id} 
              className="bg-white rounded-[20px] border border-[#EFF2F1] shadow-[0_8px_24px_rgba(0,0,0,0.02)] p-5 flex flex-col justify-between min-h-[360px] transition-all duration-300 hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)] hover:-translate-y-0.5"
            >
              <div>
                {/* Логотип + верхній бейдж */}
                <div className="flex justify-between items-start mb-4 h-12">
                  <div className={`w-12 h-12 rounded-[10px] flex items-center justify-center font-bold text-[14px] tracking-tight border border-[#EAECEB] ${store.logoBg} ${store.logoTextColor}`}>
                    {store.logoText}
                  </div>

                  {store.badge && (
                    <span className={`px-2.5 py-1 rounded-[6px] text-[11px] font-bold tracking-tight ${
                      store.badge.type === 'dark' ? 'bg-[#234A41] text-white' :
                      store.badge.type === 'yellow' ? 'bg-[#FFC72C] text-[#0D3E36]' :
                      'bg-[#EAF5F2] text-[#234A41]'
                    }`}>
                      {store.badge.text}
                    </span>
                  )}
                </div>

                {/* Назва та опис магазину */}
                <h3 className="text-[#0D3E36] text-[20px] font-bold mb-1 tracking-tight leading-snug">
                  {store.name}
                </h3>
                <p className="text-[#70807E] text-[13px] font-normal leading-relaxed mb-5 min-h-[38px] line-clamp-2">
                  {store.description}
                </p>

                {/* Специфікація/Метрики */}
                <div className="flex flex-col text-[14px] mb-5">
                  <div className="flex justify-between py-2 border-b border-[#F4F6F6]">
                    <span className="text-[#70807E]">Товарів</span>
                    <span className="text-[#0D3E36] font-semibold">{store.productsCount}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#F4F6F6]">
                    <span className="text-[#70807E]">Акцій</span>
                    <span className="text-[#0D3E36] font-semibold">{store.promoCount}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-[#70807E]">Економія</span>
                    <span className="bg-[#FFF8E7] text-[#C28B00] px-2 py-0.5 rounded-[4px] text-[13px] font-bold">
                      {store.economy}
                    </span>
                  </div>
                </div>
              </div>

              {/* Кнопка дії */}
              <button className="w-full h-[42px] bg-[#EAF2F1] hover:bg-[#DCEAE8] text-[#234A41] font-bold text-[14px] rounded-[10px] transition-colors duration-200">
                Переглянути товари
              </button>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default Mainpart;