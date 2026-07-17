import React from 'react';
import { useNavigate } from 'react-router-dom';

export const Vergleich: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="w-full bg-[#F8FAF9] dark:bg-[#0B120F] transition-colors duration-300">
      <div className="w-full max-w-[1230px] mx-auto px-[16px] md:px-[20px] pb-[40px] md:pb-[80px]">
        <div className="w-full bg-[#173B33] dark:bg-[#162521] rounded-[24px] p-[32px_20px] md:p-[64px_40px] flex flex-col items-center text-center shadow-[0_8px_32px_rgba(22,51,46,0.06)] dark:shadow-none transition-colors">
          <h2 className="font-manrope text-[24px] md:text-[32px] font-bold text-white tracking-[-0.01em] m-0 mb-[16px] leading-tight">
            Порівняйте кошик між магазинами
          </h2>
          <p className="font-inter text-[15px] md:text-[18px] text-[#A6C4B9] dark:text-[#81998F] leading-[1.6] m-0 mb-[24px] md:mb-[36px] max-w-[580px]">
            Додайте товари у список, а Smarket покаже, де вся покупка буде дешевшою.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-[16px] md:gap-[28px] w-full sm:w-auto">
            <button type="button" className="w-full sm:w-auto bg-[#FFD600] text-[#111827] font-inter font-bold text-[14px] px-[28px] py-[14px] rounded-[8px] border-none cursor-pointer hover:bg-[#FACC15] transition-all" onClick={() => navigate('/cart')}>
              Створити кошик
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Vergleich;