import { useState, useEffect } from 'react';

// Типізація відповіді від вашої API
interface StoreApiData {
  total_products: number;
  promo_products: number;
  max_savings: number;
  store_name: string;
  store_description: string;
  store_logo_url: string;
}

// Оновлена типізація елемента для рендерингу (адаптована під нові дані)
interface StoreItem {
  id: string;
  name: string;
  description: string;
  productsCount: number;
  promoCount: number;
  economy: string;
  logoUrl: string;
  badge?: {
    text: string;
    type: 'dark' | 'yellow' | 'mint';
  };
}

export const Mainpart: React.FC = () => {
  // --- СТАН КОМПОНЕНТА ---
  const [activeCategoryTab, setActiveCategoryTab] = useState('popular');
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Список ID магазинів, які потрібно завантажити (можна передавати через props або константу)
  const storeIds = ['1', '2', '3', '4']; 

  // --- ЗАВАНТАЖЕННЯ ДАНИХ З API ---
  useEffect(() => {
    const fetchStoresData = async () => {
      try {
        setLoading(true);
        
        // Виконуємо запити паралельно для всіх ID
        const fetchPromises = storeIds.map(async (id) => {
          const response = await fetch(`/api/v1/stores/${id}/stats`);
          if (!response.ok) {
            throw new Error(`Не вдалося завантажити дані для магазину ID: ${id}`);
          }
          const data: StoreApiData = await response.json();
          
          // Мапимо дані з API у формат нашого компонента
          return {
            id: id,
            name: data.store_name,
            description: data.store_description,
            productsCount: data.total_products,
            promoCount: data.promo_products,
            economy: `до ${data.max_savings}%`,
            logoUrl: data.store_logo_url,
            // Бейджі можна вираховувати динамічно або тимчасово хардкодити, якщо їх немає в API
            badge: id === '1' ? { text: 'Популярний', type: 'dark' as const } : undefined
          };
        });

        const loadedStores = await Promise.all(fetchPromises);
        setStores(loadedStores);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Сталася помилка при завантаженні даних');
      } finally {
        setLoading(false);
      }
    };

    fetchStoresData();
  }, []);

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

        {/* Стан завантаження */}
        {loading && (
          <div className="w-full text-center py-10 text-[#70807E]">
            Завантаження магазинів...
          </div>
        )}

        {/* Стан помилки */}
        {error && (
          <div className="w-full text-center py-10 text-red-500 font-medium">
            Помилка: {error}
          </div>
        )}

        {/* ================= БЛОК 4: СІТКА КАРТОК (Grid 4x3) ================= */}
        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {stores.map((store) => (
              <div 
                key={store.id} 
                className="bg-white rounded-[20px] border border-[#EFF2F1] shadow-[0_8px_24px_rgba(0,0,0,0.02)] p-5 flex flex-col justify-between min-h-[360px] transition-all duration-300 hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)] hover:-translate-y-0.5"
              >
                <div>
                  {/* Логотип + верхній бейдж */}
                  <div className="flex justify-between items-start mb-4 h-12">
                    <div className="w-12 h-12 rounded-[10px] flex items-center justify-center border border-[#EAECEB] bg-white overflow-hidden p-1">
                      {store.logoUrl ? (
                        <img 
                          src={store.logoUrl} 
                          alt={`${store.name} logo`} 
                          className="max-w-full max-h-full object-contain"
                        />
                      ) : (
                        <span className="font-bold text-[14px] text-[#0D3E36]">
                          {store.name.substring(0, 2).toUpperCase()}
                        </span>
                      )}
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
        )}
      </div>
    </div>
  );
};

export default Mainpart;