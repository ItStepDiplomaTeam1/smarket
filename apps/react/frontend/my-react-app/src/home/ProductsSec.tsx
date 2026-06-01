import product1 from '../assets/div.product-visual.svg';

export function ProductsSec() {
  return (
    /* Screenshot: white background, generous vertical padding */
    <section className="w-full py-[80px] bg-white">
      <div className="w-full max-w-[1228px] mx-auto px-6 flex flex-col gap-10">

        {/* Heading block */}
        <div className="flex flex-col items-center text-center gap-3">
          <h2 className="font-manrope text-[36px] font-extrabold text-[#173B33] m-0 leading-[1.2]">
            Популярні товари для порівняння
          </h2>
          <p className="font-inter text-[15px] text-[#6D8279] leading-[1.6] m-0 max-w-[480px]">
            Швидко перевіряйте ціни на товари, які найчастіше додають у кошик.
          </p>
        </div>

        {/* 5-column product grid */}
        <div className="grid grid-cols-5 gap-5">
          {[
            { name: 'Молоко 2,5%',       info: 'від 38 грн · 4 магазини',     discount: 'Економія до 17 грн' },
            { name: 'Соняшникова олія',  info: 'від 62 грн · 6 магазинів',    discount: 'Економія до 21 грн' },
            { name: 'Підгузки',          info: 'від 349 грн · 3 магазини',    discount: 'Економія до 86 грн' },
            { name: 'Кава мелена',       info: 'від 129 грн · 5 магазинів',   discount: 'Економія до 42 грн' },
            { name: 'Пральний порошок',  info: 'від 219 грн · 4 магазини',    discount: 'Економія до 62 грн' },
          ].map(({ name, info, discount }) => (
            <div
              key={name}
              className="bg-white border border-[#F3F4F6] rounded-2xl px-4 py-6 flex flex-col items-center text-center transition-all duration-200 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:-translate-y-0.5"
            >
              {/* Product icon */}
              <div className="w-[72px] h-[72px] bg-[#F6FAF8] rounded-2xl flex items-center justify-center mb-5 shrink-0">
                <img src={product1} alt={name} className="w-10 h-10" />
              </div>

              <h3 className="font-inter text-[14px] font-semibold text-[#173B33] m-0 mb-1 leading-[1.4]">{name}</h3>
              <p className="font-inter text-[12px] text-[#9CA3AF] m-0 mb-1">{info}</p>
              {/* Discount — screenshot shows yellow/amber text */}
              <p className="font-inter text-[12px] font-semibold text-[#D97706] m-0 mb-5">{discount}</p>

              <button className="w-full py-[9px] rounded-full border border-[#E5E7EB] bg-transparent font-inter text-[13px] font-semibold text-[#265447] cursor-pointer mt-auto transition-all duration-200 hover:border-[#265447] hover:bg-[#F6FAF8]">
                Порівняти
              </button>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}