import { useRef, useEffect } from 'react';
import { type Product } from '../type';

interface AboutProps {
  product: Product | null;
}

export function About({ product }: AboutProps) {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('is-visible'); obs.unobserve(el); } },
      { threshold: 0.05 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  if (!product) return null;

  const categoryName = product.category ? product.category.name : '';
  const generatedDescription = `${product.title} — якісний продукт${categoryName ? ` категорії "${categoryName}"` : ' категорії'}, представлений брендом "${product.brand || 'без ТМ'}". Вага/об'єм становить ${product.weight && product.weight > 0 ? `${product.weight} ${product.unit}` : `1 ${product.unit || 'шт'}`}.`;

  const infoRows = [
    [
      { label: 'Бренд', val: product.brand && product.brand !== 'без тм' ? product.brand : 'Без бренду' },
      { label: 'Артикул товару', val: product.store_product_id },
      { label: 'Штрих-код (EAN)', val: product.ean || 'Не вказано' },
      { label: 'Вага / Одиниця', val: product.weight && product.weight > 0 ? `${product.weight} ${product.unit}` : `1 ${product.unit}` },
    ],
    [
      { label: 'Дата додавання', val: new Date(product.created_at).toLocaleDateString('uk-UA') },
      { label: 'Категорія', val: product.category ? product.category.name : (product.canonical_category_id !== null ? `ID: ${product.canonical_category_id}` : 'Не вказано') },
      { label: 'Країна-виробник', val: 'Україна' },
      { label: 'Статус', val: 'В наявності' },
    ],
  ];

  return (
    <section ref={sectionRef} className="scroll-observe w-full pb-[32px] bg-[#111A17] font-inter">
      <div className="w-full max-w-[1180px] mx-auto px-[20px] sm:px-[24px]">

        {/* Заголовок */}
        <h2 className="font-manrope text-[24px] font-[200] leading-[31.2px] text-white mb-[24px] m-0">Про товар</h2>

        {/* Опис */}
        <div className="bg-[#1C2723] border border-[#265447]/8 rounded-[16px] p-[24px] mb-[16px]">
          <h3 className="font-manrope text-[18px] font-[200] leading-[25.2px] text-white m-0 mb-[16px]">Опис товару</h3>
          <p className="font-inter text-[16px] text-white/80 leading-[24px] m-0">
            {generatedDescription}
          </p>
        </div>

        {/* Загальна інформація */}
        <div className="bg-[#1C2723] border border-[#265447]/8 rounded-[16px] p-[24px] mb-[16px]">
          <h3 className="font-manrope text-[18px] font-[200] leading-[25.2px] text-white m-0 mb-[16px]">Загальна інформація</h3>
          <div className="flex flex-col">
            {infoRows.map((row, ri) => (
              <div key={ri} className="info-grid grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-x-[43px]">
                {row.map(({ label, val }, ci) => (
                  <div
                    key={ci}
                    className={`flex justify-between items-start gap-[8px] py-[14px] sm:py-[16px] ${
                      ri < infoRows.length - 1 ? 'border-b border-[#265447]/20' : ''
                    }`}
                  >
                    {label && (
                      <>
                        <span className="font-inter text-[12px] sm:text-[14px] text-white leading-[21px] font-normal shrink-0">{label}</span>
                        <span className="font-inter text-[12px] sm:text-[14px] font-medium text-[#94A3B8] text-right">{val}</span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
