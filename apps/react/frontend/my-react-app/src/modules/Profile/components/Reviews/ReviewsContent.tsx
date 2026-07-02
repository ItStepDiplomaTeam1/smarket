import { useState } from 'react';
import { DraftCard } from './DraftCard';
import { ReviewCard } from './ReviewCard';
import { EmptyState } from './EmptyState';

// Імпортуємо ваші вектори (вони працюватимуть і для пагінації, і для шапки)
import leftVector from '@/shared/assets/LeftVector.svg';
import rightVector from '@/shared/assets/RightVector.svg';

export function ReviewsContent() {
  const [activeTab, setActiveTab] = useState<'all' | 'drafts'>('all');
  
  // Тимчасові масиви
  const drafts = [1]; 
  const reviews = [1, 2];

  return (
    <section className="w-full font-inter flex-1 min-w-0 pb-[40px]">
      <div className="w-full">
        
        {/* Хлібні крихти (використовуємо rightVector) */}
        <div className="flex items-center gap-[4px] font-inter text-[13px] text-[#6D8279] mb-[12px]">
          <span className="cursor-pointer hover:text-[#265447] transition-colors">Головна</span>
          <img src={rightVector} alt=">" className="w-[10px] h-[10px] object-contain mx-[2px]" />
          <span className="cursor-pointer hover:text-[#265447] transition-colors">Особистий кабінет</span>
          <img src={rightVector} alt=">" className="w-[10px] h-[10px] object-contain mx-[2px]" />
          <span className="text-[#265447] font-semibold">Відгуки</span>
        </div>

        {/* Заголовок */}
        <h1 className="font-manrope text-[24px] font-[250] leading-[31.2px] text-[#173B33] m-0 mb-[24px]">
          Мої відгуки
        </h1>

        {/* Таби */}
        <div className="flex gap-[32px] border-b border-[#265447]/[0.08] mb-[24px]">
          <button 
            onClick={() => setActiveTab('all')}
            className={`pb-[12px] font-inter text-[14px] leading-[21.45px] transition-colors relative ${
              activeTab === 'all' 
                ? 'font-bold text-[#265447]' 
                : 'font-normal text-[#6D8279] hover:text-[#265447]'
            }`}
          >
            Всі відгуки
            {activeTab === 'all' && (
              <span className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-[#6FE3C2] rounded-t-[2px]"></span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('drafts')}
            className={`pb-[12px] font-inter text-[14px] leading-[21.45px] transition-colors relative ${
              activeTab === 'drafts' 
                ? 'font-bold text-[#265447]' 
                : 'font-normal text-[#6D8279] hover:text-[#265447]'
            }`}
          >
            Чернетки
            {activeTab === 'drafts' && (
              <span className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-[#6FE3C2] rounded-t-[2px]"></span>
            )}
          </button>
        </div>

        {/* Фільтри (використовуємо rightVector + rotate-90) */}
        <div className="flex gap-[16px] mb-[24px]">
          <div className="w-[138px] h-[30px] border border-[#265447]/[0.16] rounded-[6px] px-[12px] flex items-center justify-between cursor-pointer bg-white">
            <span className="font-inter text-[10px] font-normal text-[#6D8279]">Всі категорії</span>
            <img src={rightVector} alt="v" className="w-[10px] h-[10px] object-contain rotate-90" />
          </div>
          <div className="w-[187px] h-[30px] border border-[#265447]/[0.16] rounded-[6px] px-[12px] flex items-center justify-between cursor-pointer bg-white">
            <span className="font-inter text-[10px] font-normal text-[#6D8279]">Сортування: нові спочатку</span>
            <img src={rightVector} alt="v" className="w-[10px] h-[10px] object-contain rotate-90" />
          </div>
        </div>

        {/* --- Динамічний контент (Списки + Пагінація) --- */}
        <div className="flex flex-col">
          
          <div className="flex flex-col gap-[16px]">
            {activeTab === 'all' && (
              reviews.length > 0 ? reviews.map((_, index) => <ReviewCard key={index} />) : <EmptyState />
            )}

            {activeTab === 'drafts' && (
              drafts.length > 0 ? drafts.map((_, index) => <DraftCard key={index} />) : <EmptyState />
            )}
          </div>

          {/* Блок Пагінації */}
          {((activeTab === 'all' && reviews.length > 0) || (activeTab === 'drafts' && drafts.length > 0)) && (
            <div className="flex items-center justify-between mt-[24px]">
              <span className="font-inter font-normal text-[14px] leading-[21.45px] text-[#6D8279]">
                1-6 з 6 відгуків
              </span>
              <div className="flex items-center gap-[13px]">
                <button className="w-[30px] h-[30px] bg-white rounded-[6px] border border-[#265447]/[0.08] flex items-center justify-center hover:bg-[#F6FAF8] transition-colors cursor-pointer">
                  <img src={leftVector} alt="Попередня" />
                </button>
                <button className="w-[30px] h-[30px] bg-[#6FE3C2] rounded-[6px] flex items-center justify-center border-none cursor-default shadow-[0_4px_12px_rgba(23,59,51,0.06)]">
                  <span className="font-manrope font-[800] text-[10px] text-white">1</span>
                </button>
                <button className="w-[30px] h-[30px] bg-white rounded-[6px] border border-[#265447]/[0.08] flex items-center justify-center hover:bg-[#F6FAF8] transition-colors cursor-pointer">
                  <img src={rightVector} alt="Наступна" />
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </section>
  );
}