import product1 from '../assets/div.product-visual.svg';

export function CategoriesSec() {
  return (
    /* Screenshot: full-width #F6FAF8 background */
    <section className="w-full py-[80px] bg-[#F6FAF8]">
      <div className="w-full max-w-[1228px] mx-auto px-6 flex flex-col gap-10">

        {/* Heading */}
        <div className="text-center flex flex-col items-center gap-3">
          <h2 className="font-manrope text-[36px] font-extrabold text-[#173B33] m-0 leading-[1.2]">
            Категорії покупок
          </h2>
          <p className="font-inter text-[15px] text-[#6D8279] m-0 leading-[1.6] max-w-[420px]">
            Знаходьте вигідні пропозиції за основними категоріями щоденних покупок.
          </p>
        </div>

        {/* 6-column category grid */}
        <div className="grid grid-cols-6 gap-4">
          {[
            'Продукти',
            'Напої',
            'Дитячі товари',
            'Побутова хімія',
            'Краса та догляд',
            'Товари для дому',
          ].map((name) => (
            <div
              key={name}
              className="bg-white border border-[rgba(38,84,71,0.06)] rounded-2xl px-3 py-6 flex flex-col items-center text-center gap-3 transition-all duration-200 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:-translate-y-1 cursor-pointer"
            >
              {/* Icon */}
              <div className="w-14 h-14 bg-[#F6FAF8] rounded-xl flex items-center justify-center shrink-0">
                <img src={product1} alt={name} className="w-8 h-8" />
              </div>

              <h3 className="font-inter text-[13px] font-semibold text-[#173B33] m-0 leading-[1.4]">
                {name}
              </h3>

              <a
                href="#"
                className="font-inter text-[12px] font-semibold text-[#265447] no-underline transition-colors duration-200 hover:underline"
              >
                Переглянути акції →
              </a>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}