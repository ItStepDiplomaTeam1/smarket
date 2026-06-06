import product1 from '../../../shared/assets/div.product-visual.svg';

export function ProductsSec() {
  return (
    <section className="w-full py-[96px] bg-white">
      <div className="w-full max-w-[1228px] mx-auto px-[20px] flex flex-col gap-[48px]">

        {/* Heading block */}
        <div className="max-w-[600px] mx-auto flex flex-col items-center text-center gap-[16px]">
          <h2 className="font-manrope text-[40px] font-extrabold text-[#173B33] m-0 leading-[1.2]">
            Популярні товари для порівняння
          </h2>
          <p className="font-inter text-[16px] text-[#6D8279] leading-[1.5] m-0">
            Швидко перевіряйте ціни на товары, які найчастіше додають у <br /> кошик.
          </p>
        </div>

        {/* 5-column product grid */}
        <div className="grid grid-cols-5 gap-[20px]">
          {[
            { name: 'Молоко 2,5%',       info: 'від 38 грн · 4 магазини',     discount: 'Економія до 17 грн' },
            { name: 'Соняшникова олія',  info: 'від 62 грн · 6 магазинів',    discount: 'Економія до 21 грн' },
            { name: 'Підгузки',          info: 'від 349 грн · 3 магазини',    discount: 'Економія до 86 грн' },
            { name: 'Кава мелена',       info: 'від 129 грн · 5 магазинів',   discount: 'Економія до 42 грн' },
            { name: 'Пральний порошок',  info: 'від 219 грн · 4 магазини',    discount: 'Економія до 62 грн' },
          ].map(({ name, info, discount }) => (
            <div
              key={name}
              className="bg-white border border-[#F3F4F6] rounded-[16px] px-[20px] py-[24px] flex flex-col items-center text-center transition-all duration-200 hover:shadow-[0_10px_25px_rgba(0,0,0,0.05)]"
            >
              {/* Product icon — no extra wrapper background wrappers */}
              <img 
                src={product1} 
                alt={name} 
                className="w-full max-w-[80px] h-auto mb-[24px] block" 
              />

              <h3 className="font-inter text-[15px] font-bold text-[#173B33] m-0 mb-[8px] leading-[1.4]">
                {name}
              </h3>
              
              <p className="font-inter text-[13px] text-[#6D8279] m-0 mb-[4px]">
                {info}
              </p>
              
              <p className="font-inter text-[13px] font-semibold text-[#E29A00] m-0 mb-[24px]">
                {discount}
              </p>

              <button className="w-full p-[10px] rounded-[100px] border border-[#E5E7EB] bg-transparent font-inter text-[14px] font-semibold text-[#265447] cursor-pointer mt-auto transition-all duration-200 hover:border-[#265447] hover:text-[#265447] hover:bg-[#F6FAF8]">
                Порівняти
              </button>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
