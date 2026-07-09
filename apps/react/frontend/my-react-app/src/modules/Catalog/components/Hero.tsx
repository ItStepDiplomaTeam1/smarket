import { useQuery } from '@tanstack/react-query';

interface StatItem { value: string; label: string; }
interface ProductsResponse { items: []; total: number; }

const fetchProducts = async (page: number, stores: string[]): Promise<ProductsResponse> => {
    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://157.180.74.21:8080';
    let url = new URL(`${apiBaseUrl}/api/v1/products`);
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error('Помилка завантаження товарів');
    return res.json();
};

export function Hero() {
  const { data, isLoading } = useQuery<ProductsResponse>({
      queryKey: ['productsList'],
      queryFn: () => fetchProducts(1, []),
  });
  const totalProducts = data?.total ?? 0;
  const STATS_DATA: StatItem[] = [
    { value: totalProducts.toString(), label: 'товарів' },
    { value: '12', label: 'магазинів' },
    { value: 'до 30%', label: 'економії' }
  ];

  return (
    <section className="w-full pt-[24px] md:pt-[40px] pb-[40px] md:pb-[60px] bg-[#F4F9F6] dark:bg-[#0B120F] dark:bg-gradient-to-br dark:from-[#132A21] dark:to-[#0B120F] transition-colors duration-300">
      <div className="w-full max-w-[1228px] mx-auto px-[16px] md:px-[20px] flex flex-col lg:flex-row justify-between items-start lg:items-end gap-[24px] md:gap-[40px]">
        
        <div className="max-w-full lg:max-w-[600px] flex flex-col gap-[12px]">
          <nav className="font-inter text-[11px] md:text-[12px] text-[#7A8A82] dark:text-[#81998F] mb-[4px] flex items-center flex-wrap gap-1">
            <a href="/" className="hover:text-[#111111] dark:hover:text-white transition-colors">Головна</a>
            <span>/</span>
            <a href="/catalog" className="hover:text-[#111111] dark:hover:text-white transition-colors">Каталог</a>
            <span>/</span>
            <span className="font-semibold text-[#111111] dark:text-white">Продукти</span>
          </nav>
          <h1 className="font-manrope text-[28px] md:text-[36px] font-bold text-[#0B2F1D] dark:text-white leading-tight m-0">
            Продукти харчування
          </h1>
          <p className="font-inter text-[14px] md:text-[15px] font-normal text-[#556B5E] dark:text-[#81998F] leading-[1.5] m-0">
            Порівнюйте ціни на продукти в АТБ, Сільпо, Novus, Metro та інших магазинах — і купуйте вигідніше.
          </p>
        </div>

        <div className="flex flex-col items-start lg:items-end gap-[16px] md:gap-[20px] w-full lg:w-auto">
          <span className="bg-[#E2EDE7] dark:bg-[#1A3127] rounded-[4px] px-[8px] py-[4px] text-[10px] font-bold font-inter text-[#3B664C] dark:text-[#3CD27D] tracking-[0.05em] uppercase m-0">
            Каталог товарів
          </span>
          <div className="flex flex-wrap gap-[16px] md:gap-[32px] w-full lg:w-auto justify-between lg:justify-end">
            {STATS_DATA.map((item, index) => (
              <div key={index} className="flex flex-col items-start lg:items-end">
                <span className="font-manrope text-[24px] md:text-[28px] font-bold text-[#0B2F1D] dark:text-[#3CD27D] leading-[1.1]">
                  {item.value}
                </span>
                <span className="font-inter text-[11px] md:text-[12px] text-[#7A8A82] dark:text-[#81998F] mt-[4px]">
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