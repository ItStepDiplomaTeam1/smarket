import { useNavigate } from 'react-router-dom';

export function FinalCTA() {
  const navigate = useNavigate();

  return (
    <section className="w-full bg-white dark:bg-[#0B120F] py-[40px] sm:py-[80px] px-[20px] transition-colors duration-300">
      <div className="max-w-[1180px] mx-auto bg-[#173B33] dark:bg-[#15231D] rounded-[24px] dark:border dark:border-[#1F3227] py-[40px] sm:py-[72px] px-[16px] sm:px-[24px] flex flex-col items-center text-center transition-colors">

        <h2 className="font-manrope text-[28px] sm:text-[40px] font-extrabold text-white m-0 mb-[16px]">
          Готові зібрати вигідний кошик?
        </h2>

        <p className="font-inter text-[15px] sm:text-[16px] text-[#D1D5DB] dark:text-[#A4B3AF] leading-[1.5] m-0 mb-[32px] sm:mb-[40px]">
          Додайте товари у список і дізнайтесь, де вся покупка буде дешевшою.
        </p>

        <div className="flex flex-col items-center gap-[16px] sm:gap-[20px]">
          <button 
            onClick={() => navigate('/cart')}
            className="bg-[#FACC14] dark:bg-[#FFD600] text-[#173B33] dark:text-[#0B120F] font-manrope text-[16px] font-semibold w-[154px] h-[48px] rounded-[10px] flex justify-center items-center transition-all duration-200 hover:bg-[#e9ba2e] dark:hover:bg-[#FACC15] hover:-translate-y-[2px]"
          >
            Створити кошик
          </button>
          
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate('/catalog?offer_type=promo');
            }}
            className="font-inter text-[14px] text-[#6FE3C2] dark:text-[#3CD27D] no-underline transition-all duration-200 hover:text-white hover:underline group"
          >
            Переглянути акції <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
          </a>
        </div>

      </div>
    </section>
  );
}