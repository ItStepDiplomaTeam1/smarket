import { useNavigate } from 'react-router-dom';

const BasketIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3.75 6H14.25L13.25 14.0001C13.15 14.7667 12.5111 15.3333 11.7389 15.3333H6.26111C5.48889 15.3333 4.85 14.7667 4.75 14.0001L3.75 6Z" stroke="#111827" strokeWidth="1.6" strokeLinejoin="round"/>
    <path d="M6 6V4.5C6 2.84315 7.34315 1.5 9 1.5C10.6569 1.5 12 2.84315 12 4.5V6" stroke="#111827" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="9" cy="10" r="1.2" fill="#111827" />
  </svg>
);

export function CtaSection() {
  const navigate = useNavigate();
  return (
    <section className="w-full bg-white dark:bg-[#0B120F] transition-colors duration-300">
      <div className="max-w-[1180px] mx-auto py-[40px] md:py-[80px] px-[16px] md:px-[20px]">
        <div className="w-full bg-[#173B33] dark:bg-[#162521] rounded-[24px] p-[32px_20px] md:p-[64px_40px] flex flex-col items-center text-center shadow-lg dark:shadow-none">
          <h2 className="font-manrope text-[24px] md:text-[32px] font-bold text-white tracking-[-0.01em] m-0 mb-[16px]">
            Порівняйте всю корзину одразу
          </h2>
          <p className="font-inter text-[15px] md:text-[18px] text-[#A6C4B9] dark:text-[#81998F] leading-[1.6] m-0 mb-[24px] md:mb-[36px] max-w-[580px]">
            Додайте знайдені товари у список і Smarket покаже, де вся покупка буде дешевшою.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-[16px] sm:gap-[28px] w-full sm:w-auto">
            <button className="w-full sm:w-auto bg-[#FFD600] text-[#111827] font-inter font-bold text-[15px] p-[14px_28px] rounded-[100px] border-none flex items-center justify-center gap-[10px] cursor-pointer hover:bg-[#FACC15] transition-all" onClick={() => navigate('/cart')}>
              <BasketIcon /><span>Зібрати кошик</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}