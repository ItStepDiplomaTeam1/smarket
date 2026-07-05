import { useNavigate } from 'react-router-dom';

export const Vergleich: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="w-full max-w-[1130px] h-[254px] mx-auto bg-[#16332E] rounded-[24px] flex flex-col items-center justify-center text-center px-6 md:px-16 box-border font-sans shadow-[0_8px_32px_rgba(22,51,46,0.06)]">
      
      {/* Заголовок баннера */}
      <h2 className="text-white text-[28px] font-bold tracking-tight mb-2.5 leading-tight">
        Порівняйте кошик між магазинами
      </h2>
      
      {/* Підзаголовок / Опис */}
      <p className="text-[#A3B8B5] text-[15px] max-w-[500px] font-normal leading-relaxed mb-7">
        Додайте товари у список, а Smarket покаже, де вся покупка буде дешевшою.
      </p>
      
      {/* Блок з кнопками дій */}
      <div className="flex items-center gap-6">
        <button 
          type="button"
          className="h-[46px] px-7 bg-[#FFC72C] hover:bg-[#E5B223] text-[#16332E] font-bold text-[15px] rounded-[12px] transition-colors duration-200 shadow-sm"
          onClick={() => { navigate('/cart'); }}
        >
          Створити кошик
        </button>
        
        <a 
          href="/promotions" 
          className="text-white text-[15px] font-semibold flex items-center gap-1.5 hover:opacity-85 transition-opacity duration-200"
        >
          Переглянути акції
          <span className="text-[16px] font-normal transform translate-y-[0.5px]">→</span>
        </a>
      </div>

    </div>
  );
};

export default Vergleich;