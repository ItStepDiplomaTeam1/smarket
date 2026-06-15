// Іконка кошика
const BasketIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M3.75 6H14.25L13.25 14.0001C13.15 14.7667 12.5111 15.3333 11.7389 15.3333H6.26111C5.48889 15.3333 4.85 14.7667 4.75 14.0001L3.75 6Z" 
      stroke="#111827" 
      strokeWidth="1.6" 
      strokeLinejoin="round"
    />
    <path 
      d="M6 6V4.5C6 2.84315 7.34315 1.5 9 1.5C10.6569 1.5 12 2.84315 12 4.5V6" 
      stroke="#111827" 
      strokeWidth="1.6" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <circle cx="9" cy="10" r="1.2" fill="#111827" />
  </svg>
);

export function CtaSection() {
  return (
    <section className="w-full max-w-[1180px] mx-auto w-full bg-white py-[80px] px-[20px]">
      <div className="w-full bg-[#173B33] rounded-[24px] p-[64px_40px] flex flex-col items-center text-center shadow-lg">
        
        {/* Заголовок */}
        <h2 className="font-manrope text-[32px] font-bold text-white tracking-[-0.01em] m-0 mb-[16px]">
          Порівняйте всю корзину одразу
        </h2>

        {/* Підзаголовок */}
        <p className="font-inter text-[18px] text-[#A6C4B9] leading-[1.6] m-0 mb-[36px] max-w-[580px]">
          Додайте знайдені товари у список і Smarket покаже, де вся покупка буде дешевшою.
        </p>

        {/* Кнопки дій */}
        <div className="flex items-center gap-[28px]">
          {/* Основна жовта кнопка */}
          <button className="bg-[#FFD600] text-[#111827] font-inter font-bold text-[15px] p-[14px_28px] rounded-[100px] border-none flex items-center gap-[10px] cursor-pointer hover:bg-[#FACC15] transition-all active:scale-95 shadow-sm">
            <BasketIcon />
            <span>Зібрати кошик</span>
          </button>

          {/* Другорядне посилання */}
          <a 
            href="#promotions" 
            className="font-inter text-white font-semibold text-[15px] flex items-center gap-[8px] no-underline group transition-all"
          >
            <span className="group-hover:mr-[4px] transition-all">Переглянути акції</span>
            <span className="text-[#64D2B1] text-[18px] group-hover:translate-x-[4px] transition-all">→</span>
          </a>
        </div>

      </div>
    </section>
  );
}