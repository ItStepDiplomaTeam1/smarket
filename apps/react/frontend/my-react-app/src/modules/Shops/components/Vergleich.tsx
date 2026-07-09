import React from 'react';
import { useNavigate } from 'react-router-dom';

export const Vergleich: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="w-full bg-[#F8FAF9] dark:bg-[#0B120F] transition-colors duration-300">
      <div className="w-full max-w-[1230px] mx-auto px-[20px] pb-[80px]">
        <div className="w-full bg-[#173B33] dark:bg-[#162521] rounded-[24px] p-[64px_40px] flex flex-col items-center text-center shadow-[0_8px_32px_rgba(22,51,46,0.06)] dark:shadow-none transition-colors">
          
          <h2 className="font-manrope text-[32px] font-bold text-white tracking-[-0.01em] m-0 mb-[16px]">
            Порівняйте кошик між магазинами
          </h2>
          
          <p className="font-inter text-[18px] text-[#A6C4B9] dark:text-[#81998F] leading-[1.6] m-0 mb-[36px] max-w-[580px]">
            Додайте товари у список, а Smarket покаже, де вся покупка буде дешевшою.
          </p>
          
          <div className="flex items-center gap-[28px]">
            <button 
              type="button"
              className="bg-[#FFD600] text-[#111827] font-inter font-bold text-[14px] px-[28px] py-[14px] rounded-[8px] border-none cursor-pointer hover:bg-[#FACC15] transition-all active:scale-95"
              onClick={() => { navigate('/cart'); }}
            >
              Створити кошик
            </button>
            
            <a 
              href="/promotions" 
              className="font-inter text-white font-semibold text-[14px] flex items-center gap-[8px] no-underline group transition-all"
            >
              <span className="group-hover:mr-[4px] transition-all">Переглянути акції</span>
              <span className="text-[#64D2B1] dark:text-[#3CD27D] text-[18px] group-hover:translate-x-[4px] transition-all">→</span>
            </a>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Vergleich;