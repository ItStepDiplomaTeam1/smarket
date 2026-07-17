import { type Product } from '../type';

interface AboutProps {
  product: Product | null;
}

export function About({ product }: AboutProps) {
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
    ]
  ];

  return (
    <section className="w-full pb-[40px] bg-[#F6FAF8] dark:bg-[#111A17] font-inter transition-colors">
      <div className="w-full max-w-[1180px] mx-auto px-[20px]">
        <div>
          {/* Заголовок секції */}
          <h2 className="font-manrope text-[24px] font-bold text-[#173B33] dark:text-[#EAF7F2] mb-[24px] m-0">Про товар</h2>

          {/* Description */}
          <div className="bg-white dark:bg-[#1D2A25] border border-[rgba(38,84,71,0.08)] dark:border-[#265447]/30 rounded-[16px] p-[24px] mb-[16px] shadow-sm transition-colors">
            <h3 className="font-manrope text-[24px] font-[200] leading-[31.2px] text-[#173B33] dark:text-white m-0 mb-[16px]">Опис товару</h3>
            <p className="font-inter text-[16px] text-[#173B33] dark:text-[#EAF7F2] leading-[24px] m-0">
              {generatedDescription}
            </p>
          </div>

          {/* General info */}
          <div className="bg-white dark:bg-[#1D2A25] border border-[rgba(38,84,71,0.08)] dark:border-[#265447]/30 rounded-[16px] p-[24px] mb-[16px] shadow-sm transition-colors">
            <h3 className="font-manrope text-[24px] font-[200] leading-[31.2px] text-[#173B33] dark:text-white m-0 mb-[16px]">Загальна інформація</h3>
            <div className="flex flex-col">
              {infoRows.map((row, ri) => (
                <div key={ri} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-[24px]">
                  {row.map(({ label, val }, ci) => (
                    <div
                      key={ci}
                      className="flex justify-between items-start gap-[12px] py-[16px] border-b border-[rgba(38,84,71,0.08)] dark:border-[#265447]/20"
                    >
                      {label && (
                        <>
                          <span className="font-inter text-[13px] text-[#6D8279] dark:text-[#A9B6B0] font-normal shrink-0">{label}</span>
                          <span className="font-inter text-[13px] font-semibold text-[#265447] dark:text-[#3DAE8B] text-right">{val}</span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

