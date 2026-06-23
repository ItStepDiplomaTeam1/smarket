import { useQuery } from '@tanstack/react-query';

interface StatItem {
  value: string;
  label: string;
}

interface ProductsResponse {
  items: [];
  total: number;
}

// ================= ФУНКЦІЯ ОТРИМАННЯ ДАНИХ =================
const fetchProducts = async (page: number, stores: string[]): Promise<ProductsResponse> => {
    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
    let url = new URL(`${apiBaseUrl}/api/v1/products`);
    const res = await fetch(url.toString());
  
    if (!res.ok) {
        throw new Error('Помилка завантаження товарів');
    }
    
    return res.json();
};

export function Hero() {

  // Синхронізація запиту з реактивними ключами стейтів
  const { data, isLoading } = useQuery<ProductsResponse>({
      queryKey: ['productsList'],
      queryFn: () => fetchProducts(1, []),
  });
  
  const totalProducts = data?.total ?? 0;

  const STATS_DATA: StatItem[] = [
    { value: totalProducts.toString(), label: 'товарів' },
    { value: '5', label: 'магазинів' },
    { value: 'до 30%', label: 'економії' }
  ];

  return (
    <section className="w-full pt-[40px] pb-[60px] bg-[#F4F9F6]">
      <div className="w-full max-w-[1228px] mx-auto px-[20px] flex justify-between items-end gap-[40px] mobile:flex-col mobile:items-start mobile:gap-[30px]">
        
        {/* LEFT — breadcrumbs & text content */}
        <div className="max-w-[600px] flex flex-col gap-[12px]">
          {/* Breadcrumbs */}
          <nav className="font-inter text-[12px] text-[#7A8A82] mb-[4px]">
            <a href="/" className="hover:text-[#111111] transition-colors">Головна</a>
            <span className="mx-[4px]">/</span>
            <a href="/catalog" className="hover:text-[#111111] transition-colors">Каталог</a>
            <span className="mx-[4px]">/</span>
            <span className="font-semibold text-[#111111]">Продукти</span>
          </nav>

          {/* H1 */}
          <h1 className="font-manrope text-[36px] font-bold text-[#0B2F1D] leading-tight m-0">
            Продукти харчування
          </h1>

          {/* Description */}
          <p className="font-inter text-[15px] font-normal text-[#556B5E] leading-[1.5] m-0">
            Порівнюйте ціни на продукти в АТБ, Сільпо, Novus, Metro та інших магазинах — і купуйте вигідніше.
          </p>
        </div>

        {/* RIGHT — stats badge & numbers */}
        <div className="flex flex-col items-end gap-[20px] mobile:items-start mobile:w-full">
          {/* Eyebrow label */}
          <span className="bg-[#E2EDE7] rounded-[4px] px-[8px] py-[4px] text-[10px] font-bold font-inter text-[#3B664C] tracking-[0.05em] uppercase m-0">
            Каталог товарів
          </span>

          {/* Stats block */}
          <div className="flex gap-[32px] mobile:w-full mobile:justify-between mobile:gap-[16px]">
            {STATS_DATA.map((item, index) => (
              <div key={index} className="flex flex-col items-end mobile:items-start">
                <span className="font-manrope text-[28px] font-bold text-[#0B2F1D] leading-[1.1]">
                  {item.value}
                </span>
                <span className="font-inter text-[12px] text-[#7A8A82] mt-[4px]">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}