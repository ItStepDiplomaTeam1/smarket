interface BadgeProps {
  text: string;
}

// Окремий компонент для бейджів з правої сторони
const Badge: React.FC<BadgeProps> = ({ text }) => {
  return (
    <div className="bg-white px-4 py-2 rounded-[10px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-[#F3F4F6] flex items-center justify-center whitespace-nowrap transition-shadow duration-200 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
      <span className="text-[#0D3E36] font-bold text-[14px] sm:text-[15px] tracking-tight">
        {text}
      </span>
    </div>
  );
};

export const HeadlineShops: React.FC = () => {
  return (
    <div className="w-full max-w-[1130px] mx-auto font-sans px-4 md:px-0 py-3">
      
      {/* Хлібні крихти (Breadcrumbs) */}
      <nav className="flex items-center space-x-2 text-[14px] mb-4 text-[#70807E]">
        <a href="/" className="hover:text-[#0D3E36] transition-colors duration-200">
          Головна
        </a>
        <span className="text-[#C4CFCF]">/</span>
        <span className="text-[#0D3E36] font-semibold">Магазини</span>
      </nav>

      {/* Основний контейнер (висота за макетом ~91px для контенту) */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-4 min-h-[91.39px]">
        
        {/* Ліва частина: Заголовок та Опис */}
        <div className="flex flex-col justify-between h-full max-w-[760px]">
          <h1 className="text-[#0D3E36] text-[32px] font-bold leading-none tracking-tight mb-2">
            Магазини
          </h1>
          <p className="text-[#70807E] text-[15px] sm:text-[16px] leading-[1.5] font-normal">
            Порівнюйте ціни, акції та наявність товарів у популярних супермаркетах і торгових мережах.
          </p>
        </div>

        {/* Права частина: Група бейджів */}
        <div className="flex flex-wrap items-center gap-[10px] pt-1 self-start md:self-auto">
          <Badge text="340 акцій" />
          <Badge text="12 магазинів" />
          <Badge text="до 30% економії" />
        </div>

      </div>
    </div>
  );
};

export default HeadlineShops;