import product1 from '@/shared/assets/div.product-visual.svg';

export function CategoriesSec() {
  return (
    <section className="w-full py-[80px] bg-[#F6FAF8]">
      <div className="w-full max-w-[1228px] mx-auto px-[20px] flex flex-col gap-[48px]">

        {/* Heading */}
        <div className="text-center flex flex-col items-center gap-[16px]">
          <h2 className="font-manrope text-[40px] font-extrabold text-[#173B33] m-0 leading-[1.2]">
            Категорії покупок
          </h2>
          <p className="font-inter text-[16px] text-[#6D8279] m-0 leading-[1.5]">
            Знаходьте вигідні пропозиції за основними категоріями <br /> щоденних покупок.
          </p>
        </div>

        <div className="grid grid-cols-6 gap-[20px]">
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
              className="bg-white rounded-[16px] px-[16px] py-[24px] flex flex-col items-center text-center transition-all duration-200 hover:shadow-[0_10px_25px_rgba(0,0,0,0.05)] hover:-translate-y-[5px] cursor-pointer"
            >
              {/* Photo */}
              <img 
                src={product1} 
                alt={name} 
                className="w-[64px] h-[64px] mb-[16px] block" 
              />

              <h3 className="font-inter text-[15px] font-bold text-[#173B33] m-0 mb-[8px]">
                {name}
              </h3>

              <a
                href="#"
                className="font-inter text-[13px] font-semibold text-[#265447] no-underline transition-colors duration-200 hover:text-[#1A453A] hover:underline"
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
